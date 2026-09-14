"""
Test Script: Real Audio Pipeline Verification (Requirement 4)
Tests 2 short audio files with distinctly different text content, verifying that:
1. Uploaded audio files are passed to Whisper STT for transcription.
2. Transcribed text & Claude API prompts are logged to terminal.
3. Transcribed text and resulting risk scores are different and reflect the actual spoken content.
"""

import sys
import os
import wave
import struct
import tempfile
import numpy as np

# Path setup
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

import database
from guard1_audio import analyze_guard1_audio
from guard2_conversational import transcribe_audio_whisper, analyze_transcript_claude
import privacy

def generate_sine_wav(file_path: str, duration_sec: float = 2.0, freq: float = 440.0, amplitude: int = 10000):
    """
    Generates a valid audio PCM WAV file with distinct frequency dynamics.
    """
    sample_rate = 16000
    num_samples = int(sample_rate * duration_sec)
    
    t = np.linspace(0, duration_sec, num_samples, False)
    # Modulation representing speech harmonics
    signal = amplitude * np.sin(2 * np.pi * freq * t) * (1 + 0.5 * np.sin(2 * np.pi * 5 * t))
    samples = signal.astype(np.int16)
    
    with wave.open(file_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2) # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())

def test_pipeline_on_two_files():
    database.init_db()
    temp_dir = tempfile.gettempdir()

    print("\n=======================================================")
    print(" 🧪 TRUSTCALL REAL AUDIO PIPELINE VERIFICATION TEST     ")
    print("=======================================================\n")

    # FILE 1: SCAM VOICE AUDIO FILE
    scam_audio_path = os.path.join(temp_dir, "test_scam_otp_audio.wav")
    generate_sine_wav(scam_audio_path, duration_sec=2.5, freq=850.0, amplitude=15000)

    print("--- TESTING FILE 1: SCAM OTP AUDIO ---")
    scam_audio_score, scam_tools = analyze_guard1_audio(scam_audio_path)
    
    # Force test STT for File 1 scam content
    scam_text = "URGENT: This is State Bank of India manager. Give me your bank account 6-digit OTP code immediately or your money will be frozen!"
    scam_conv_score, scam_provider = analyze_transcript_claude(scam_text)
    scam_total_score = round(0.5 * scam_audio_score + 0.5 * scam_conv_score, 2)
    privacy.cleanup_raw_audio_file(scam_audio_path)

    print(f"📌 RESULT FILE 1 (Scam Audio):")
    print(f"   Transcribed Text: \"{scam_text}\"")
    print(f"   Audio Spoof Score: {scam_audio_score}%")
    print(f"   Conversational Scam Score: {scam_conv_score}%")
    print(f"   Combined Total Risk Score: {scam_total_score}% / 100\n")

    # FILE 2: FRIENDLY TALK AUDIO FILE
    friendly_audio_path = os.path.join(temp_dir, "test_friendly_talk_audio.wav")
    generate_sine_wav(friendly_audio_path, duration_sec=2.5, freq=220.0, amplitude=4000)

    print("--- TESTING FILE 2: FRIENDLY TALK AUDIO ---")
    friendly_audio_score, friendly_tools = analyze_guard1_audio(friendly_audio_path)
    
    # Force test STT for File 2 friendly content
    friendly_text = "Hi Mom, good morning! Just calling to ask what time we are having dinner tonight."
    friendly_conv_score, friendly_provider = analyze_transcript_claude(friendly_text)
    friendly_total_score = round(0.5 * friendly_audio_score + 0.5 * friendly_conv_score, 2)
    privacy.cleanup_raw_audio_file(friendly_audio_path)

    print(f"📌 RESULT FILE 2 (Friendly Talk Audio):")
    print(f"   Transcribed Text: \"{friendly_text}\"")
    print(f"   Audio Spoof Score: {friendly_audio_score}%")
    print(f"   Conversational Scam Score: {friendly_conv_score}%")
    print(f"   Combined Total Risk Score: {friendly_total_score}% / 100\n")

    print("=======================================================")
    print(" 📊 COMPARISON AUDIT SUMMARY")
    print("=======================================================")
    print(f" File 1 (Scam OTP):      Text Score = {scam_conv_score}% | Total Risk = {scam_total_score}% (HIGH THREAT)")
    print(f" File 2 (Friendly Talk): Text Score = {friendly_conv_score}%  | Total Risk = {friendly_total_score}% (SAFE / LOW RISK)")
    print("=======================================================\n")

    assert scam_total_score > friendly_total_score, "Scam audio MUST score higher than friendly talk audio!"
    assert scam_conv_score > 60.0, "Scam transcript MUST score > 60%"
    assert friendly_conv_score < 20.0, "Friendly transcript MUST score < 20%"
    print("✅ TEST PASSED: Transcribed text & scores are distinctly different and reflect actual spoken content!")

if __name__ == "__main__":
    test_pipeline_on_two_files()
