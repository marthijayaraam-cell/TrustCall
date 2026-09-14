import os
import re
from typing import Tuple, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Scam pattern scanner (Rule-based natural language threat parser)
SCAM_INDICATORS = [
    (r"\b(otp|one\s*time\s*password|verification\s*code|pin)\b", 45),
    (r"\b(bank|rbi|police|cbi|income\s*tax|customs|manager|officer|cyber\s*cell)\b", 35),
    (r"\b(block|freeze|suspended|arrest|warrant|legal\s*action|urgent|immediately|fast|now)\b", 30),
    (r"\b(transfer|send\s*money|send|money|upi|account|gpay|phonepe|cash|dollars|rupees)\b", 35),
    (r"\b(don't\s*tell|dont\s*tell|keep\s*secret|do\s*not\s*hang\s*up|confidential|secret|anyone|nobody)\b", 35),
    (r"\b(lottery|prize|refund|claim|congratulations)\b", 30),
]

_WHISPER_PIPELINE = None

def init_whisper_model():
    """
    Tool 2.1: Pretrained OpenAI Whisper Speech-to-Text Model Initialization.
    """
    global _WHISPER_PIPELINE
    try:
        from transformers import pipeline
        _WHISPER_PIPELINE = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
        print("✓ [Guard 2.1 Whisper] Pretrained Whisper STT Model loaded and ready.")
    except Exception as e:
        _WHISPER_PIPELINE = None
        print(f"⚠️ [Guard 2.1 Whisper] Transformers pipeline load notice: {e}")

def load_wav_audio_array(file_path: str):
    import numpy as np

    # 1. Try soundfile
    try:
        import soundfile as sf
        data, sr = sf.read(file_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        return data.astype(np.float32), sr
    except Exception:
        pass

    # 2. Try librosa
    try:
        import librosa
        y, sr = librosa.load(file_path, sr=16000, mono=True)
        return y.astype(np.float32), sr
    except Exception:
        pass

    # 3. Try scipy.io.wavfile
    try:
        from scipy.io import wavfile
        sr, data = wavfile.read(file_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        data = data.astype(np.float32)
        if np.max(np.abs(data)) > 1.0:
            data = data / 32768.0
        return data, sr
    except Exception:
        pass

    # 4. Try standard wave module
    try:
        import wave
        with wave.open(file_path, 'rb') as wf:
            sr = wf.getframerate()
            nframes = wf.getnframes()
            frames = wf.readframes(nframes)
            swidth = wf.getsampwidth()
            if swidth == 2:
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            elif swidth == 4:
                samples = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                samples = np.frombuffer(frames, dtype=np.int8).astype(np.float32) / 128.0
            return samples, sr
    except Exception:
        pass

    return None, None

def transcribe_audio_whisper(file_path: str) -> str:
    """
    Tool 2.1: Transcribes uploaded audio file to text using Whisper STT.
    Logs exact output to terminal. Throws explicit RuntimeError if transcription fails.
    """
    global _WHISPER_PIPELINE
    
    print("\n==================================================")
    print(f"🎙️ [WHISPER STT] Processing Audio File: {os.path.basename(file_path)}")
    print("==================================================")

    # Inspect audio signal
    samples, sr = load_wav_audio_array(file_path)
    if samples is not None and len(samples) > 0:
        import numpy as np
        print(f"📊 [Audio Signal Stats] Samples: {len(samples)}, SR: {sr}Hz, Amplitude StdDev: {np.std(samples):.4f}")

    # 1. Fast Cloud SpeechRecognition STT (Google Speech API - ~1s response time)
    try:
        import speech_recognition as sr_lib
        r = sr_lib.Recognizer()
        r.operation_timeout = 5
        with sr_lib.AudioFile(file_path) as source:
            audio_data = r.record(source)
            for lang in ["en-US", "hi-IN", "te-IN", "ta-IN"]:
                try:
                    transcribed_text = r.recognize_google(audio_data, language=lang)
                    if transcribed_text and transcribed_text.strip():
                        print(f"✅ [FAST SPEECH RECOGNITION STT ({lang}) TEXT]: \"{transcribed_text}\"")
                        print("==================================================\n")
                        return transcribed_text.strip()
                except Exception:
                    pass
    except Exception as err:
        print(f"⚠️ [Fast SpeechRecognition Notice]: {err}")

    # 2. Fallback to HuggingFace Whisper Pipeline
    if _WHISPER_PIPELINE is None:
        try:
            from transformers import pipeline
            _WHISPER_PIPELINE = pipeline("automatic-speech-recognition", model="openai/whisper-tiny")
            print("✓ [Guard 2.1 Whisper] HuggingFace Whisper Model loaded on demand.")
        except Exception as e:
            _WHISPER_PIPELINE = None
            print(f"⚠️ [Whisper STT] Pipeline lazy-load notice: {e}")

    if _WHISPER_PIPELINE is not None:
        # A. Try passing file path directly (Whisper auto-detects language)
        try:
            res = _WHISPER_PIPELINE(file_path)
            print(f"🔍 [Whisper Auto-Language Inference Result]: {res}")
            if res and isinstance(res, dict) and "text" in res and res["text"].strip():
                transcribed_text = res["text"].strip()
                print(f"✅ [WHISPER STT TRANSCRIBED TEXT]: \"{transcribed_text}\"")
                print("==================================================\n")
                return transcribed_text
        except Exception as e:
            print(f"⚠️ [Whisper STT File Path Notice]: {e}")

        # B. Try passing raw decoded PCM array directly (capped at 30s max)
        if samples is not None and len(samples) > 0:
            try:
                capped_samples = samples[:16000 * 30]
                res = _WHISPER_PIPELINE({"raw": capped_samples, "sampling_rate": int(sr)})
                print(f"🔍 [Whisper Raw Array Inference Result]: {res}")
                if res and isinstance(res, dict) and "text" in res and res["text"].strip():
                    transcribed_text = res["text"].strip()
                    print(f"✅ [WHISPER STT TRANSCRIBED TEXT (RAW PCM)]: \"{transcribed_text}\"")
                    print("==================================================\n")
                    return transcribed_text
            except Exception as e:
                print(f"⚠️ [Whisper STT Raw Array Notice]: {e}")

    # 3. Try openai-whisper library if installed
    try:
        import whisper
        model = whisper.load_model("tiny")
        res = model.transcribe(file_path)
        print(f"🔍 [openai-whisper Result]: {res}")
        if res and isinstance(res, dict) and "text" in res and res["text"].strip():
            transcribed_text = res["text"].strip()
            print(f"✅ [OPENAI WHISPER STT TRANSCRIBED TEXT]: \"{transcribed_text}\"")
            print("==================================================\n")
            return transcribed_text
    except Exception as e:
        print(f"⚠️ [openai-whisper Notice]: {e}")

    # Strict No-Placeholder Guarantee: If speech recognition cannot extract clear spoken text, raise explicit error
    print("❌ [WHISPER STT NOTICE]: Could not detect clear speech in this audio file.")
    print("==================================================\n")
    raise RuntimeError("Could not detect clear speech in this audio — please upload a clearer recording.")

def analyze_transcript_heuristic(transcript: str) -> float:
    """
    Rule-based Threat Analyzer scoring transcript 0-100 based on scam indicator patterns.
    """
    text_lower = transcript.lower()
    score = 5.0 # baseline safe risk
    
    for pattern, weight in SCAM_INDICATORS:
        if re.search(pattern, text_lower):
            score += weight
            
    return min(100.0, score)

def analyze_transcript_claude(transcript: str) -> Tuple[float, str]:
    """
    Tool 2.2: Evaluates scam risk score (0-100) using Anthropic Claude API or OpenAI fallback.
    Logs exact prompt and resulting score to terminal for verification.
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    prompt = f"""You are an expert AI scam call detection system for phone audio fraud.
Analyze the following live phone call transcript snippet and evaluate how much it resembles an active voice cloning or phone scam attack.

Look specifically for:
1. Urgency / Panic creation ("do it now", "account will be blocked in 5 minutes")
2. Secrecy ("don't tell anyone", "do not hang up")
3. Impersonation of authority (Bank Officer, Police, Cyber Cell, Government Official)
4. Requests for money, bank transfers, OTPs, or passwords.

Transcript snippet:
"{transcript}"

Respond with ONLY a single integer score between 0 and 100 representing the risk level. Do not include any reasoning, markdown formatting, or extra characters. Just the number."""

    print("\n==================================================")
    print("🤖 [CLAUDE LLM SCORING PROMPT SENT TO API]:")
    print(f"Text Payload: \"{transcript}\"")
    print("--------------------------------------------------")

    # 1. Try Anthropic Claude API
    if anthropic_key and not anthropic_key.startswith("your_"):
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key, timeout=5.0)
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}]
            )
            raw_text = message.content[0].text.strip()
            match = re.search(r'\d+', raw_text)
            if match:
                score = float(match.group(0))
                print(f"✅ [CLAUDE API SCORING RESPONSE SCORE]: {score:.1f} / 100")
                print("==================================================\n")
                return min(100.0, max(0.0, score)), "Anthropic Claude API"
        except Exception as e:
            print(f"⚠️ [Claude API Error]: {e}")

    # 2. Try OpenAI API
    if openai_key and not openai_key.startswith("your_"):
        try:
            import openai
            client = openai.OpenAI(api_key=openai_key, timeout=5.0)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.0
            )
            raw_text = response.choices[0].message.content.strip()
            match = re.search(r'\d+', raw_text)
            if match:
                score = float(match.group(0))
                print(f"✅ [OPENAI API SCORING RESPONSE SCORE]: {score:.1f} / 100")
                print("==================================================\n")
                return min(100.0, max(0.0, score)), "OpenAI GPT API"
        except Exception as e:
            print(f"⚠️ [OpenAI API Error]: {e}")

    # 3. Rule-based Heuristic Scam Analyzer
    heuristic_score = analyze_transcript_heuristic(transcript)
    print(f"📊 [SCAM HEURISTIC SCORER RESPONSE SCORE]: {heuristic_score:.1f} / 100")
    print("==================================================\n")
    return heuristic_score, "Rule-Based Scam Intent Analyzer"
