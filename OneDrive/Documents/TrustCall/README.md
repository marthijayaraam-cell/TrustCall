# 🛡️ TrustCall SOC: Enterprise AI Voice Fraud Prevention Platform

**Smart India Hackathon 2026 — Problem Statement SIH26104**  
**Theme:** Blockchain & Cybersecurity  
**Concept:** Enterprise-Grade Security Operations Center (SOC) Platform featuring 5 Layered Security Guards & 14 Integrated Security Tools to detect and prevent real-time AI voice-cloning fraud.

---

## 🎨 Enterprise SOC Design System
- **Visual Tone:** High-trust dark space navy (`#070a13`), charcoal card surfaces (`#111827`), cool electric cyan accents (`#06b6d4`), emerald safe status (`#10b981`), amber warnings (`#f59e0b`), and crimson threat alerts (`#ef4444`).
- **Typography:** `Inter` for bold UI controls + `JetBrains Mono` for SHA-256 block hashes and metric readouts.
- **Centerpiece Risk Gauge:** Animated circular SVG gauge displaying central risk score (0 to 100) with dynamic color rings and glowing risk indicators.
- **Audio Equalizer Waveform:** Dynamic equalizer animation displaying live signal processing during clip analysis or playback.
- **W3C Verifiable Credentials Badge:** Signed JSON-LD credential badge (`✅ Verified Bank / Identity Authenticated`).

---

## ⚡ Quick Start Guide (Run in 2 Terminal Windows)

### 1. Start the FastAPI Backend (Terminal 1)
```bash
pip install -r requirements.txt
python start.py
```
*Backend runs at:* `http://localhost:8000`  
*Swagger API Docs:* `http://localhost:8000/docs`

---

### 2. Start the React SOC Dashboard (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Frontend Dashboard opens at:* `http://localhost:5173`

---

### 🧪 Automated 5-Guard Test Suite
Run end-to-end verification of all 14 tools across Guards 1–5:
```bash
python test_all_guards.py
```

---

## 🛡️ Summary of All 5 Guards & 14 Security Tools

### GUARD 1 — Audio Guard (4 Security Tools)
- **Tool 1.1 Speaker Verification:** Pretrained SpeechBrain ECAPA-TDNN comparing clip against reference voice.
- **Tool 1.2 Spoof Detector:** Pretrained AASIST neural deepfake classifier.
- **Tool 1.3 Replay Detector:** Librosa acoustic zero-crossing rate and spectral flatness analyzer.
- **Tool 1.4 Watermark Detector:** AudioSeal / PerTh watermark scanner checking for embedded AI generator watermarks.

### GUARD 2 — Conversation Guard (3 Security Tools)
- **Tool 2.1 Speech-to-Text:** OpenAI Whisper STT model converting uploaded audio to text.
- **Tool 2.2 LLM Risk Scorer:** Anthropic Claude API prompt scoring 0–100 for urgency, secrecy, authority claims, and money/OTP requests.
- **Tool 2.3 EWMA Running Average:** Formula `new = 0.6 * latest + 0.4 * previous` evaluating risk escalation across turns.

### GUARD 3 — Active Verification Guard (4 Security Tools)
- **Tool 3.1 Immediate Warning Banner:** Threat alert banner displayed when risk score > 50 ("⚠️ Warning: this call shows signs of AI voice cloning").
- **Tool 3.2 Spoken/Typed Challenge Code:** 4-digit randomized challenge code when risk > 70.
- **Tool 3.3 Out-of-Band Callback Simulation:** Timed 2-second loading animation (`📞 Calling verified phone line...`) followed by `❌ No matching legitimate call found`.
- **Tool 3.4 Dual Authorization:** Two mandatory approval buttons (**Approver 1** & **Approver 2**) required before transaction execution.

### GUARD 4 — Trust & Accountability Guard (3 Security Tools)
- **Tool 4.1 SHA-256 Hashing:** Cryptographic payload hash calculated on every call analysis record.
- **Tool 4.2 Merkle Append-Only Log:** Block hash chain linking block `i` to block `i-1`. Includes `GET /verify/{index}` endpoint.
- **Tool 4.3 W3C Verifiable Credentials:** Signed JSON-LD credential badge (`✅ Verified Bank / Identity Authenticated`).
- **Trust Log Page:** Dedicated audit ledger table with live verification and the **"Tamper with this record"** button demonstrating instant red `🚨 TAMPER DETECTED` verification failure.

### GUARD 5 — Privacy Guard (2 Security Tools)
- **Tool 5.1 Immediate Audio Purge:** `os.remove()` executed immediately after Guard 1 scoring finishes. Zero raw audio stored permanently.
- **Tool 5.2 Privacy Endpoints:** `POST /consent`, `POST /withdraw`, `POST /delete` managing user privacy settings.

---

## 📋 Honest Summary for Hackathon Judges (Real vs Simulated)

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Guard 4 Merkle Trust Log** | **100% REAL** | Pure Python SHA-256 block chain, SQLite persistence, and live hash recomputation verification. |
| **Guard 4.3 W3C Verifiable Credentials** | **100% REAL** | Cryptographically signed JSON-LD Verifiable Credential issuer and signature verifier. |
| **Guard 2 Conversational AI** | **100% REAL** | Anthropic Claude API prompt scoring + mathematical EWMA running average formula (`0.6 * new + 0.4 * previous`). |
| **Guard 1 Audio Spoof & Signal Analyzer** | **100% REAL** | Pretrained SpeechBrain ECAPA-TDNN, AASIST neural model, and Librosa acoustic zero-crossing analyzer. |
| **Guard 5 Privacy Deletion** | **100% REAL** | Immediate file cleanup (`os.remove()`) enforcing zero raw audio storage policy. |
| **Telephony Line Tap** | **SIMULATED** | UI text/audio input box standing in for live phone call PSTN/SIP trunk audio tapping. |
| **Out-of-Band Callback Check** | **SIMULATED** | 2-second loading animation standing in for telco SS7 network cellular signaling check. |
| **Dual Approver Buttons** | **SIMULATED** | Representing bank risk manager portal authorization controls. |
