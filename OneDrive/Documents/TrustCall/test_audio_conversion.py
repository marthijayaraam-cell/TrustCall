"""
TrustCall Audio Format Converter Self-Test Suite
Tests real conversion across 4 audio container formats: .wav, .mp3, .m4a, .mp4
"""

import os
import sys
import tempfile
import wave
import struct
import subprocess
import numpy as np

# Add sub-packages to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from main import convert_to_pcm_wav, FFMPEG_PATH
from guard1_audio import extract_audio_samples

def generate_test_audio_files(temp_dir):
    """
    Synthesizes 4 real audio container files: .wav, .mp3, .m4a, .mp4
    """
    ffmpeg_exe = FFMPEG_PATH
    print(f"🔎 Using FFmpeg Binary: {ffmpeg_exe}")
    
    # 1. Base PCM WAV file (16kHz, mono, 3 seconds of a 440Hz sine wave)
    wav_base = os.path.join(temp_dir, "sample_base.wav")
    sr = 16000
    duration_s = 3.0
    num_samples = int(sr * duration_s)
    t = np.linspace(0, duration_s, num_samples, endpoint=False)
    sine_wave = (0.5 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    
    with wave.open(wav_base, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(sine_wave.tobytes())

    files = {"wav": wav_base}
    
    # 2. Convert base WAV to .mp3 using ffmpeg
    mp3_path = os.path.join(temp_dir, "sample_test.mp3")
    cmd_mp3 = [ffmpeg_exe, "-y", "-i", wav_base, "-c:a", "libmp3lame", "-b:a", "128k", mp3_path]
    subprocess.run(cmd_mp3, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    files["mp3"] = mp3_path
    
    # 3. Convert base WAV to .m4a (AAC in M4A container, matching Windows Voice Recorder)
    m4a_path = os.path.join(temp_dir, "sample_test.m4a")
    cmd_m4a = [ffmpeg_exe, "-y", "-i", wav_base, "-c:a", "aac", "-b:a", "128k", m4a_path]
    subprocess.run(cmd_m4a, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    files["m4a"] = m4a_path

    # 4. Convert base WAV to .mp4 (H.264 video + AAC audio in MP4 container, matching WhatsApp Video)
    mp4_path = os.path.join(temp_dir, "sample_test.mp4")
    cmd_mp4 = [
        ffmpeg_exe, "-y",
        "-f", "lavfi", "-i", "color=c=black:s=320x240:r=10",
        "-i", wav_base,
        "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        mp4_path
    ]
    subprocess.run(cmd_mp4, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    files["mp4"] = mp4_path

    return files

def run_audio_conversion_tests():
    print("\n=========================================================================")
    print(" 🧪 TRUSTCALL AUDIO FORMAT CONVERSION TEST SUITE (4 FORMATS)")
    print("=========================================================================\n")
    
    temp_dir = tempfile.gettempdir()
    test_files = generate_test_audio_files(temp_dir)
    
    results = {}
    for fmt, file_path in test_files.items():
        file_size = os.path.getsize(file_path)
        print(f"📁 Testing Format: .{fmt.upper()}")
        print(f"   Original File: {os.path.basename(file_path)} ({file_size} bytes)")
        
        # Run convert_to_pcm_wav
        converted_wav = convert_to_pcm_wav(file_path)
        converted_size = os.path.getsize(converted_wav)
        
        # Verify output PCM WAV samples
        samples, sr = extract_audio_samples(converted_wav)
        num_samples = len(samples)
        duration_s = num_samples / sr if sr > 0 else 0.0
        std_dev = np.std(samples) if num_samples > 0 else 0.0
        
        print(f"   Converted PCM WAV: {os.path.basename(converted_wav)} ({converted_size} bytes)")
        print(f"   📊 Sample Count: {num_samples} samples")
        print(f"   ⏱️ Duration:     {duration_s:.2f} seconds (Sample Rate: {int(sr)}Hz)")
        print(f"   🔊 Signal StdDev: {std_dev:.4f}")
        
        assert num_samples > 1000, f"FAILED: Converted .{fmt} file produced insufficient audio samples ({num_samples})"
        assert std_dev > 10.0, f"FAILED: Converted .{fmt} file produced silent or corrupted audio (StdDev: {std_dev})"
        
        print(f"   ✅ PASSED: .{fmt.upper()} converted successfully into valid PCM WAV!\n")
        results[fmt] = {
            "file_size": file_size,
            "converted_size": converted_size,
            "samples": num_samples,
            "duration": duration_s,
            "std_dev": std_dev
        }
        
    print("=========================================================================")
    print(" 🎉 ALL 4 AUDIO FORMAT CONVERSION TESTS PASSED PERFECTLY!")
    print("=========================================================================\n")
    return results

if __name__ == "__main__":
    run_audio_conversion_tests()
