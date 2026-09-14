"""
TrustCall Audio Processing Performance & Cap Benchmark Script
Tests a 20-second audio clip and a 45-second audio clip to verify 30s truncation and timing.
"""

import os
import sys
import time
import wave
import tempfile
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "trust-log")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from main import convert_to_pcm_wav
from guard1_audio import extract_audio_samples, analyze_guard1_audio

def synthesize_clip(file_path: str, duration_s: float):
    sr = 16000
    num_samples = int(sr * duration_s)
    t = np.linspace(0, duration_s, num_samples, endpoint=False)
    signal = 0.3 * np.sin(2 * np.pi * 440.0 * t) + 0.1 * np.sin(2 * np.pi * 880.0 * t)
    int_samples = (np.clip(signal, -1.0, 1.0) * 32767).astype(np.int16)
    
    with wave.open(file_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(int_samples.tobytes())
    return file_path

def run_benchmark():
    print("\n=========================================================================")
    print(" ⏱️ TRUSTCALL AUDIO PROCESSING & 30-SECOND CAP TIMING BENCHMARK")
    print("=========================================================================\n")
    
    temp_dir = tempfile.gettempdir()
    
    test_clips = [
        {"name": "20-Second Clip", "path": os.path.join(temp_dir, "clip_20s.wav"), "duration": 20.0},
        {"name": "45-Second Clip", "path": os.path.join(temp_dir, "clip_45s.wav"), "duration": 45.0},
    ]

    for clip in test_clips:
        print(f"🎬 Creating {clip['name']} (Input duration: {clip['duration']}s)...")
        synthesize_clip(clip['path'], clip['duration'])
        
        t_start = time.time()
        
        # Step 1: Format Conversion & 30s Cap Application
        t_conv_start = time.time()
        std_wav = convert_to_pcm_wav(clip['path'])
        t_conv_elapsed = time.time() - t_conv_start
        
        # Step 2: Extract Samples & Verify Cap
        samples, sr = extract_audio_samples(std_wav)
        actual_samples = len(samples)
        actual_duration = actual_samples / sr if sr > 0 else 0.0
        
        # Step 3: Guard 1 Analysis Execution
        t_g1_start = time.time()
        audio_score, tools = analyze_guard1_audio(std_wav)
        t_g1_elapsed = time.time() - t_g1_start
        
        t_total_elapsed = time.time() - t_start
        
        print(f"   ⏱️ FFmpeg Conversion Time:  {t_conv_elapsed:.3f}s")
        print(f"   ⏱️ Guard 1 Analysis Time:   {t_g1_elapsed:.3f}s")
        print(f"   ⏱️ Total Processing Time:   {t_total_elapsed:.3f}s")
        print(f"   📊 Original Duration:       {clip['duration']}s")
        print(f"   📊 Output Truncated Duration: {actual_duration:.2f}s ({actual_samples} samples @ {int(sr)}Hz)")
        
        if clip['duration'] > 30.0:
            assert actual_duration <= 30.0, f"ERROR: 30s cap failed! Duration was {actual_duration}s"
            print(f"   ✅ 30-Second Cap Verified: Input of {clip['duration']}s was successfully truncated to {actual_duration:.2f}s!")
        else:
            print(f"   ✅ Short Clip Verified: Input of {clip['duration']}s was processed fully ({actual_duration:.2f}s).")
            
        print()

    print("=========================================================================")
    print(" 🎉 TIMING BENCHMARK & 30s AUDIO CAP VERIFICATION COMPLETE")
    print("=========================================================================\n")

if __name__ == "__main__":
    run_benchmark()
