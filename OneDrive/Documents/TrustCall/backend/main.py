import os
import sys
import random
import tempfile
import time
import subprocess
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add sub-packages to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "trust-log")))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from database import (
    init_db, insert_trust_log, get_all_trust_logs,
    get_trust_log_by_index, tamper_trust_log_record, update_call_ewma,
    get_user_consent_db, set_user_consent_db, delete_user_data_db
)
from trust_logger import TrustLogger
from verifier import LogVerifier
from vc_issuer import VerifiableCredentialIssuer

from guard1_audio import analyze_guard1_audio, init_audio_models
from guard2_conversational import analyze_transcript_claude, transcribe_audio_whisper, init_whisper_model
from privacy import cleanup_raw_audio_file

app = FastAPI(
    title="TrustCall SOC API",
    description="Real-Time AI Voice-Cloning Fraud Interception Engine (SIH26104)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

trust_logger = TrustLogger()

import shutil
import glob

def find_ffmpeg_executable() -> str:
    """
    Dynamically and portably locates the FFmpeg binary across Windows, macOS, and Linux:
    1. System PATH lookup via shutil.which("ffmpeg")
    2. imageio_ffmpeg bundled binary fallback
    3. OS-specific common installation paths (WinGet, Chocolatey, Homebrew, Linux /usr/bin)
    4. Raises clear, actionable RuntimeError if not found anywhere.
    """
    # 1. System PATH lookup
    path_bin = shutil.which("ffmpeg")
    if path_bin and os.path.exists(path_bin):
        return os.path.abspath(path_bin)

    # 2. Bundled imageio_ffmpeg lookup
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return os.path.abspath(exe)
    except Exception:
        pass

    # 3. Common OS-specific installation paths
    candidates = []
    
    local_appdata = os.environ.get("LOCALAPPDATA", "")
    user_profile = os.environ.get("USERPROFILE", "")
    program_files = os.environ.get("PROGRAMFILES", "")
    program_data = os.environ.get("PROGRAMDATA", "")

    if local_appdata:
        candidates.append(os.path.join(local_appdata, "Microsoft", "WinGet", "Links", "ffmpeg.exe"))
        winget_pkgs = glob.glob(os.path.join(local_appdata, "Microsoft", "WinGet", "Packages", "*FFmpeg*", "**", "ffmpeg.exe"), recursive=True)
        candidates.extend(winget_pkgs)

    if user_profile:
        winget_pkgs = glob.glob(os.path.join(user_profile, "AppData", "Local", "Microsoft", "WinGet", "Packages", "*FFmpeg*", "**", "ffmpeg.exe"), recursive=True)
        candidates.extend(winget_pkgs)

    if program_data:
        candidates.append(os.path.join(program_data, "chocolatey", "bin", "ffmpeg.exe"))

    if program_files:
        candidates.append(os.path.join(program_files, "ffmpeg", "bin", "ffmpeg.exe"))

    # macOS / Linux standard locations
    candidates.extend([
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ])

    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return os.path.abspath(candidate)

    # 4. Fail gracefully with actionable error message
    raise RuntimeError(
        "❌ [FFmpeg Error]: ffmpeg executable not found on this system. "
        "Please install FFmpeg (e.g., via 'winget install Gyan.FFmpeg' or 'brew install ffmpeg') "
        "and ensure it is accessible on your system PATH."
    )

FFMPEG_PATH = find_ffmpeg_executable()

# Ensure FFMPEG_PATH directory is in system PATH for any subprocess or sub-tools
ffmpeg_dir = os.path.dirname(FFMPEG_PATH)
if ffmpeg_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = ffmpeg_dir + os.path.pathsep + os.environ.get("PATH", "")
    print(f"✓ [Startup] Added FFmpeg directory to system PATH: {ffmpeg_dir}")

print(f"✓ [Startup] Dynamically Resolved FFmpeg Binary: {FFMPEG_PATH}")

def convert_to_pcm_wav(file_path: str) -> str:
    """
    Decodes uploaded audio containers (.wav, .mp3, .m4a, .mp4, .opus, .webm, .ogg) 
    into a clean, standardized 16kHz mono PCM WAV file (capped at 30 seconds max) 
    using a single, unified, robust FFmpeg subprocess command.
    """
    target_wav = file_path + "_std.wav"

    # Single, robust FFmpeg command with deep probing for AAC/M4A/MP4 containers
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-analyzeduration", "100M",
        "-probesize", "100M",
        "-i", file_path,
        "-vn", "-sn", "-dn",
        "-ac", "1",
        "-ar", "16000",
        "-c:a", "pcm_s16le",
        "-t", "30",
        target_wav
    ]

    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=8)
        if res.returncode == 0 and os.path.exists(target_wav) and os.path.getsize(target_wav) > 100:
            from guard1_audio import extract_audio_samples
            samples, sr = extract_audio_samples(target_wav)
            num_samples = len(samples)
            duration_s = num_samples / sr if sr > 0 else 0.0
            print(f"✓ [Audio Converter] Converted {os.path.basename(file_path)} (30s cap) via FFmpeg to 16kHz PCM WAV ({os.path.getsize(target_wav)} bytes).")
            print(f"   📊 Audio Verification Proof: {num_samples} samples, {duration_s:.2f}s duration @ {int(sr)}Hz")
            return target_wav
        else:
            stderr_msg = res.stderr.decode('utf-8', errors='ignore')[:300]
            print(f"❌ [Audio Converter Error] FFmpeg exit code {res.returncode}: {stderr_msg}")
            raise RuntimeError(f"FFmpeg failed to decode audio file {os.path.basename(file_path)}: {stderr_msg}")
    except Exception as e:
        print(f"❌ [Audio Converter Exception]: {e}")
        raise RuntimeError(f"Could not convert audio file {os.path.basename(file_path)}: {e}")

@app.on_event("startup")
def startup_event():
    init_db()
    init_audio_models()
    init_whisper_model()
    
    # Synchronize Merkle chain from SQLite DB
    records = get_all_trust_logs()
    for rec in records:
        trust_logger.append_record(
            call_id=rec["call_id"],
            transcript=rec["transcript"],
            risk_score=rec["risk_score"],
            action=rec["action"],
            timestamp=rec["timestamp"]
        )
        
    # Run 4-Format Audio Converter Verification Suite
    try:
        from test_audio_conversion import run_audio_conversion_tests
        run_audio_conversion_tests()
    except Exception as err:
        print(f"⚠️ [Startup Self-Test Notice]: {err}")

# --- Request Models ---
class ScoreRequest(BaseModel):
    transcript: str
    call_id: Optional[str] = None
    user_id: Optional[str] = "user_default"
    phase1_mock: Optional[bool] = False

class TamperRequest(BaseModel):
    index: int
    new_transcript: Optional[str] = "TAMPERED: Unauthorized money transfer"
    new_score: Optional[float] = 0.0

class PrivacyRequest(BaseModel):
    user_id: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TrustCall SOC Engine",
        "version": "2.0.0"
    }

@app.post("/score")
def score_call(req: ScoreRequest):
    call_id = req.call_id or f"call_{int(time.time())}_{random.randint(1000, 9999)}"
    
    if not get_user_consent_db(req.user_id):
        raise HTTPException(status_code=403, detail="User consent withdrawn.")

    if req.phase1_mock:
        raw_score = 42.0
        provider = "Phase 1 Plumbing Mock"
        running_score = 42.0
        turn_count = 1
    else:
        # Guard 2 Tool 2.2 Claude LLM Risk Scoring
        raw_score, provider = analyze_transcript_claude(req.transcript)
        # Guard 2 Tool 2.3 EWMA Running Score
        running_score, turn_count = update_call_ewma(call_id, raw_score)

    # Guard 3 Threshold Logic
    warning_triggered = running_score > 50.0 # Tool 3.1
    challenge_required = running_score > 70.0 # Tool 3.2
    action = "challenge_required" if challenge_required else ("warning" if warning_triggered else "monitor")
    challenge_code = random.randint(1000, 9999) if challenge_required else None

    # Guard 4 Tool 4.3 W3C Verifiable Credential
    vc_credential = VerifiableCredentialIssuer.issue_credential("State Bank of India", call_id)

    # Guard 4 Tool 4.1 & 4.2 Merkle Append-Only Log
    record = trust_logger.append_record(
        call_id=call_id,
        transcript=req.transcript,
        risk_score=running_score,
        action=action
    )
    insert_trust_log(record.to_dict())

    return {
        "call_id": call_id,
        "transcript": req.transcript,
        "raw_score": round(raw_score, 2),
        "conversational_score": round(raw_score, 2),
        "risk_score": round(running_score, 2),
        "action": action,
        "warning_banner": warning_triggered,
        "challenge_code": challenge_code,
        "turn_count": turn_count,
        "scoring_provider": provider,
        "verifiable_credential": vc_credential,
        "trust_log_index": record.index,
        "record_hash": record.record_hash,
        "previous_hash": record.previous_hash,
        "timestamp": record.timestamp
    }

def get_audio_file_duration(file_path: str) -> float:
    """Uses ffprobe or wave / librosa / soundfile to determine exact input audio file duration in seconds."""
    ffprobe_exe = FFMPEG_PATH.replace("ffmpeg.exe", "ffprobe.exe")
    if not os.path.exists(ffprobe_exe):
        ffprobe_exe = FFMPEG_PATH
    try:
        cmd = [ffprobe_exe, "-i", file_path]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
        output = res.stderr.decode('utf-8', errors='ignore') + res.stdout.decode('utf-8', errors='ignore')
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+|\d+)", output)
        if m:
            hours = float(m.group(1))
            minutes = float(m.group(2))
            seconds = float(m.group(3))
            return round(hours * 3600 + minutes * 60 + seconds, 2)
    except Exception:
        pass

    try:
        from guard1_audio import extract_audio_samples
        samples, sr = extract_audio_samples(file_path)
        if len(samples) > 0 and sr > 0:
            return round(len(samples) / sr, 2)
    except Exception:
        pass

    return 0.0

@app.post("/score-audio")
def score_audio(
    file: UploadFile = File(...),
    call_id: Optional[str] = Form(None),
    transcript: Optional[str] = Form(None),
    user_id: Optional[str] = Form("user_default")
):
    ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".mp4", ".opus", ".webm", ".ogg"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        print(f"❌ [Score Audio Rejected]: Unsupported audio file '{file.filename}'.")
        raise HTTPException(status_code=400, detail="Supported audio formats: .wav, .mp3, .m4a, .mp4")

    t_req_start = time.time()
    def get_ts():
        return time.strftime("%H:%M:%S") + f".{int((time.time() % 1) * 1000):03d}"

    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"trustcall_{int(time.time())}_{file.filename}")
    
    with open(temp_path, "wb") as f:
        file.file.seek(0)
        content = file.file.read()
        f.write(content)

    file_size_bytes = os.path.getsize(temp_path)
    raw_input_duration = get_audio_file_duration(temp_path)

    print("\n==================================================================")
    print(f" 🔎 [{get_ts()}] STEP 1: UPLOADED AUDIO FILE RECEIVED")
    print(f"    Filename:           {file.filename}")
    print(f"    Raw File Size:      {file_size_bytes} bytes")
    print(f"    Raw Audio Duration: {raw_input_duration:.2f} seconds (from container metadata)")
    print(f"    Call ID:            {call_id}")
    print("==================================================================")

    # 1. Step 2: FFmpeg PCM WAV Conversion & 30s Cap
    t_conv_start = time.time()
    print(f" ⏱️ [{get_ts()}] START STEP 2: FFmpeg PCM WAV Conversion & 30s Cap...")
    proc_path = convert_to_pcm_wav(temp_path)
    t_conv_elapsed = time.time() - t_conv_start
    proc_duration = get_audio_file_duration(proc_path)
    print(f" ✓ [{get_ts()}] FINISHED STEP 2: Conversion completed in {t_conv_elapsed:.3f}s. Truncated Duration = {proc_duration:.2f}s")

    try:
        # 2. Step 3: Guard 1 Audio Signal Analysis
        t_g1_start = time.time()
        print(f" ⏱️ [{get_ts()}] START STEP 3: Guard 1 Audio Signal Security Analysis...")
        audio_score, audio_tools = analyze_guard1_audio(proc_path)
        t_g1_elapsed = time.time() - t_g1_start
        print(f" 📊 [{get_ts()}] FINISHED STEP 3: Guard 1 Audio Risk Score = {audio_score:.1f}% (Time: {t_g1_elapsed:.3f}s)")

        # 3. Step 4: Guard 2 Tool 2.1 Whisper Speech-to-Text
        t_stt_start = time.time()
        print(f" ⏱️ [{get_ts()}] START STEP 4: Whisper Speech-to-Text Transcription...")
        stt_text = transcribe_audio_whisper(proc_path)
        t_stt_elapsed = time.time() - t_stt_start
        print(f" 🎙️ [{get_ts()}] FINISHED STEP 4: Whisper STT completed in {t_stt_elapsed:.3f}s")
        print(f"    VERBATIM TRANSCRIBED TEXT: \"{stt_text}\"")

        # 4. Step 5: Guard 2 Tool 2.2 Claude LLM Risk Scoring
        t_llm_start = time.time()
        print(f" ⏱️ [{get_ts()}] START STEP 5: Guard 2 Scam Risk Scoring...")
        conv_score, conv_provider = analyze_transcript_claude(stt_text)
        t_llm_elapsed = time.time() - t_llm_start
        print(f" 🤖 [{get_ts()}] FINISHED STEP 5: Guard 2 Raw Text Score = {conv_score:.1f}% via {conv_provider} (Time: {t_llm_elapsed:.3f}s)")

        # 5. Combined Score & Safety Shielding
        t_total_elapsed = time.time() - t_req_start
        # Max of combined vs individual threat guards to prevent high text risk from being diluted by clean acoustic audio
        combined_score = max((0.5 * audio_score) + (0.5 * conv_score), conv_score * 0.85, audio_score * 0.85)

        print("\n==================================================================")
        print(f" 🎯 [{get_ts()}] COMPLETE PIPELINE TIMELINE RECAP:")
        print(f"    1. Raw Input Audio Duration: {raw_input_duration:.2f}s")
        print(f"    2. Truncated Audio Duration: {proc_duration:.2f}s (30s cap status: {'APPLIED' if raw_input_duration > 30.0 else 'FULL CLIP'})")
        print(f"    3. FFmpeg Conversion:        {t_conv_elapsed:.3f}s")
        print(f"    4. Guard 1 Audio Analysis:   {t_g1_elapsed:.3f}s")
        print(f"    5. Whisper STT:              {t_stt_elapsed:.3f}s")
        print(f"    6. LLM/Claude Scoring:       {t_llm_elapsed:.3f}s")
        print(f"    🎯 Guard 1 (Audio) Score:    {audio_score:.1f}%")
        print(f"    🎯 Guard 2 (Text) Score:     {conv_score:.1f}% (Provider: {conv_provider})")
        print(f"    🎯 Final Combined Score:     {combined_score:.2f}%")
        print(f"    ⏱️ TOTAL END-TO-END TIME:    {t_total_elapsed:.3f}s")
        print("==================================================================\n")

        running_score, turn_count = update_call_ewma(call_id, combined_score)

        # 6. Guard 3 Thresholds
        warning_triggered = running_score > 50.0
        challenge_required = running_score > 70.0
        action = "challenge_required" if challenge_required else ("warning" if warning_triggered else "monitor")
        challenge_code = random.randint(1000, 9999) if challenge_required else None

        # 7. Guard 4 Trust Ledger Append
        record = trust_logger.append_record(
            call_id=call_id,
            transcript=f"[AUDIO: {audio_score:.1f}% | TEXT: {conv_score:.1f}%] {stt_text}",
            risk_score=running_score,
            action=action
        )
        insert_trust_log(record.to_dict())

        return {
            "call_id": call_id,
            "transcript": stt_text,
            "audio_spoof_score": round(audio_score, 2),
            "conversational_score": round(conv_score, 2),
            "risk_score": round(running_score, 2),
            "action": action,
            "warning_banner": warning_triggered,
            "challenge_code": challenge_code,
            "audio_tools_breakdown": audio_tools,
            "scoring_provider": conv_provider,
            "turn_count": turn_count,
            "trust_log_index": record.index,
            "record_hash": record.record_hash,
            "raw_audio_deleted": True
        }
    except Exception as e:
        print(f"❌ [Score Audio Exception]: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Guard 5 Tool 5.1 Immediate Raw Audio Deletion Guarantee
        cleanup_raw_audio_file(temp_path)
        if proc_path != temp_path:
            cleanup_raw_audio_file(proc_path)

# --- Guard 4 Endpoints ---

@app.get("/trust-log/records")
def get_trust_log_records():
    return {"records": get_all_trust_logs()}

@app.get("/verify/{index}")
def verify_record(index: int):
    rec = get_trust_log_by_index(index)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Index {index} not found.")

    is_valid, stored_hash, calc_hash = LogVerifier.verify_single_record(rec)
    return {
        "index": index,
        "valid": is_valid,
        "tampered_flag": rec["tampered"],
        "stored_hash": stored_hash,
        "calculated_hash": calc_hash,
        "call_id": rec["call_id"],
        "transcript": rec["transcript"],
        "risk_score": rec["risk_score"],
        "action": rec["action"],
        "details": "Integrity intact" if is_valid else "TAMPER DETECTED! SHA-256 hash mismatch."
    }

@app.post("/trust-log/tamper")
def tamper_record(req: TamperRequest):
    rec = get_trust_log_by_index(req.index)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Index {req.index} not found")
        
    tampered_rec = tamper_trust_log_record(req.index, req.new_transcript, req.new_score)
    return {
        "status": "tampered",
        "index": req.index,
        "record": tampered_rec
    }

# --- Guard 5 Privacy Endpoints ---

@app.post("/consent")
def api_grant_consent(req: PrivacyRequest):
    set_user_consent_db(req.user_id, True)
    return {"status": "success", "user_id": req.user_id, "consent": True}

@app.post("/withdraw")
def api_withdraw_consent(req: PrivacyRequest):
    set_user_consent_db(req.user_id, False)
    return {"status": "success", "user_id": req.user_id, "consent": False}

@app.post("/delete")
def api_delete_user_data(req: PrivacyRequest):
    deleted = delete_user_data_db(req.user_id)
    return {"status": "success", "user_id": req.user_id, "records_deleted": deleted}
