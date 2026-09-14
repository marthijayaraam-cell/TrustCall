import React, { useState } from 'react';
import { scoreTranscript, scoreAudio } from '../api';
import RiskMeter from './RiskMeter';
import ActiveVerification from './ActiveVerification';

export default function CallSimulator({ userId, onRecordCreated }) {
  const [callId, setCallId] = useState(`call_${Date.now().toString().slice(-4)}`);
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [phase1Mock, setPhase1Mock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Response states
  const [latestResponse, setLatestResponse] = useState(null);
  const [turnHistory, setTurnHistory] = useState([]);

  // Preset sample scripts for hackathon demo
  const sampleScams = [
    { label: "🚨 Urgent Bank Scam Line 1", text: "Hello, I am Manager Sharma from State Bank of India main branch." },
    { label: "🚨 Urgent Bank Scam Line 2 (Escalation)", text: "Your bank account has been flagged for suspicious fraud and will be blocked in 5 minutes unless you verify." },
    { label: "🚨 Urgent Bank Scam Line 3 (OTP Theft)", text: "Do not hang up or tell anyone. Share your 6-digit OTP code immediately to unblock your money!" },
    { label: "✅ Legitimate Call Sample", text: "Hi Mom, just calling to ask what time we are having dinner tonight?" },
  ];

  const handleScoreText = async (e) => {
    e?.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await scoreTranscript(transcript, callId, userId, phase1Mock);
      setLatestResponse(res);
      setTurnHistory((prev) => [...prev, res]);
      setTranscript(''); // Clear input for next line submission
      if (onRecordCreated) onRecordCreated();
    } catch (err) {
      setError(err.message || 'Scoring request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreAudio = async (e) => {
    e?.preventDefault();
    if (!audioFile) return;

    setLoading(true);
    setError('');
    try {
      const res = await scoreAudio(audioFile, callId, transcript || "Uploaded voice recording audio snippet.", userId);
      setLatestResponse(res);
      setTurnHistory((prev) => [...prev, res]);
      setAudioFile(null);
      if (onRecordCreated) onRecordCreated();
    } catch (err) {
      setError(err.message || 'Audio scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCall = () => {
    const newId = `call_${Date.now().toString().slice(-4)}`;
    setCallId(newId);
    setLatestResponse(null);
    setTurnHistory([]);
    setTranscript('');
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Risk Meter Header Display */}
      <RiskMeter 
        score={latestResponse?.risk_score ?? 0}
        action={latestResponse?.action ?? 'monitor'}
        provider={latestResponse?.scoring_provider || latestResponse?.audio_model || (phase1Mock ? 'Phase 1 Hardcoded Mock' : 'Standby')}
        turnCount={latestResponse?.turn_count}
      />

      {/* Trigger Guard 3 Active Verification Interception if risk > 70 */}
      {latestResponse?.action === 'challenge_required' && (
        <ActiveVerification 
          challengeCode={latestResponse?.challenge_code}
          onReset={handleNewCall}
        />
      )}

      {/* Simulator Control Card */}
      <div className="card" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1rem', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎙️ Live Call Simulator & Real-Time Risk Evolution
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
              Submit transcript lines sequentially to simulate how risk score evolves via EWMA (60/40 weighted average).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
              Call ID: <strong style={{ color: '#60a5fa' }}>{callId}</strong>
            </span>
            <button 
              onClick={handleNewCall} 
              style={{ backgroundColor: '#334155', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              + New Call
            </button>
          </div>
        </div>

        {/* Phase 1 Plumbing Toggle */}
        <div style={{ marginBottom: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
            🧪 Phase 1 Plumbing Test Mode (Returns hardcoded score 42 & action 'monitor')
          </span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={phase1Mock} 
              onChange={(e) => setPhase1Mock(e.target.checked)} 
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 800, color: phase1Mock ? '#fbbf24' : '#94a3b8' }}>
              {phase1Mock ? "Phase 1 ON" : "Real AI Scoring ON"}
            </span>
          </label>
        </div>

        {/* Preset Hackathon Demo Buttons */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Quick Presets (Click to Auto-Fill):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {sampleScams.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => setTranscript(s.text)}
                style={{ fontSize: '0.75rem', backgroundColor: '#334155', color: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #475569', cursor: 'pointer' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Form */}
        <form onSubmit={handleScoreText} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>
            Submit Live Transcript Line:
          </label>
          <textarea 
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or paste call line here... e.g. 'I am calling from State Bank of India, share your OTP immediately'"
            style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.75rem', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', boxSizing: 'border-box' }}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Press "Check Call" to evaluate line & update EWMA running score.
            </span>
            <button 
              type="submit" 
              disabled={loading || !transcript.trim()}
              className="btn-primary"
              style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
            >
              {loading ? "Analyzing..." : "Check Call →"}
            </button>
          </div>
        </form>

        {/* Audio Upload Form (Guard 1 / Phase 5) */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>
            🎵 Guard 1 Audio Deepfake Upload (POST /score-audio)
          </h4>
          
          <form onSubmit={handleScoreAudio} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            <input 
              type="file" 
              accept="audio/*,video/*,.mp4,.m4a,.opus,.ogg,.wav,.mp3,.aac,.flac"
              onChange={(e) => setAudioFile(e.target.files[0])}
              style={{ fontSize: '0.75rem', color: '#cbd5e1', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem', padding: '0.5rem', flex: 1 }}
            />
            <button 
              type="submit" 
              disabled={loading || !audioFile}
              style={{ backgroundColor: '#9333ea', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
            >
              Score Audio Clip →
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', marginBottom: 0 }}>
            Accepts .wav audio recordings. Evaluates acoustic synthetic voice signatures and combines 50/50 with Guard 2. Raw audio deleted immediately after scoring.
          </p>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(153, 27, 27, 0.6)', border: '1px solid #ef4444', color: '#feccae', fontSize: '0.75rem', borderRadius: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* Live Turn-by-Turn EWMA Evolution Log */}
      {turnHistory.length > 0 && (
        <div className="card" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            📊 EWMA Real-Time Risk Progression Log (Call #{callId})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {turnHistory.map((t, idx) => (
              <div key={idx} style={{ backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #334155', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ backgroundColor: '#1e293b', color: '#60a5fa', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #334155' }}>
                    Turn #{t.turn_count || idx + 1}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>"{t.transcript}"</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {t.raw_score !== undefined && (
                    <span style={{ color: '#94a3b8' }}>Line Score: <strong style={{ color: '#f1f5f9' }}>{t.raw_score}</strong></span>
                  )}
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: 800, backgroundColor: t.risk_score > 70 ? '#7f1d1d' : '#14532d', color: t.risk_score > 70 ? '#feccae' : '#bbf7d0', border: t.risk_score > 70 ? '1px solid #ef4444' : '1px solid #22c55e' }}>
                    Running EWMA: {t.risk_score} / 100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
