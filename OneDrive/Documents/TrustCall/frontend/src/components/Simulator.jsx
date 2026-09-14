import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MessageSquare, 
  ShieldAlert, 
  Database, 
  Lock, 
  Play, 
  RotateCcw, 
  Upload, 
  FileAudio,
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall,
  UserCheck,
  FileText
} from 'lucide-react';
import RiskGauge from './ui/RiskGauge';
import AudioWaveform from './ui/AudioWaveform';
import StatusPill from './ui/StatusPill';
import BannerAlert from './ui/BannerAlert';
import VerifiableBadge from './ui/VerifiableBadge';
import RiskAnalysisReport from './ui/RiskAnalysisReport';
import Guard3Modal from './ui/Guard3Modal';
import { scoreTranscript, scoreAudio } from '../api';
import { playWarningBeep, playAlarmBeep } from '../utils/alertSounds';
import { requestNotificationPermission, triggerBrowserNotification } from '../utils/browserNotifications';

export default function Simulator({ onRecordCreated }) {
  const [callId, setCallId] = useState(`call_${Date.now().toString().slice(-4)}`);
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [phase1Mock, setPhase1Mock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active Verification (Guard 3) States
  const [verifiedPhone, setVerifiedPhone] = useState('+91 98765-43210');
  const [challengeStep, setChallengeStep] = useState(1);
  const [challengeInput, setChallengeInput] = useState('');
  const [callbackState, setCallbackState] = useState('idle'); // idle, calling, failed
  const [app1Done, setApp1Done] = useState(false);
  const [app2Done, setApp2Done] = useState(false);

  // Guard 3 One-Shot Alert Firing Tracking Per Call
  const [hasFiredWarningAlert, setHasFiredWarningAlert] = useState(false);
  const [hasFiredChallengeAlert, setHasFiredChallengeAlert] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    requestNotificationPermission().then(status => {
      if (status) setNotifPermission(status);
    });
  }, []);

  const handleEnableNotifications = async () => {
    const status = await requestNotificationPermission();
    setNotifPermission(status);
    if (status === 'granted') {
      triggerBrowserNotification("🛡️ TrustCall Alerts Active", "Desktop notifications are enabled for live voice fraud threats!");
    }
  };

  // Score & response states
  const [latestResponse, setLatestResponse] = useState(null);
  const [turnHistory, setTurnHistory] = useState([]);

  // Preset sample scripts for hackathon demo
  const sampleScams = [
    { label: "🚨 Urgent Bank Scam Line 1", text: "Hello, I am Manager Sharma from State Bank of India main branch." },
    { label: "🚨 Urgent Bank Scam Line 2 (Escalation)", text: "Your bank account has been flagged for suspicious fraud and will be blocked in 5 minutes unless you verify." },
    { label: "🚨 Urgent Bank Scam Line 3 (OTP Theft)", text: "Do not hang up or tell anyone. Share your 6-digit OTP code immediately to unblock your money!" },
    { label: "✅ Legitimate Call Sample", text: "Hi Mom, just calling to ask what time we are having dinner tonight?" },
  ];

  const currentScore = latestResponse?.risk_score ?? 0;

  const processAlertTriggers = (score, currentCallId) => {
    if (score > 70.0) {
      if (!hasFiredChallengeAlert) {
        playAlarmBeep();
        triggerBrowserNotification(
          "🚨 TrustCall Threat Interception",
          `HIGH RISK FRAUD DETECTED on call ${currentCallId} (Risk: ${score.toFixed(1)}%). Active Verification Challenge triggered!`
        );
        setHasFiredChallengeAlert(true);
        setHasFiredWarningAlert(true);
      }
    } else if (score > 50.0) {
      if (!hasFiredWarningAlert) {
        playWarningBeep();
        triggerBrowserNotification(
          "TrustCall Warning Alert",
          `Possible AI voice-cloning or scam intent detected on call ${currentCallId} (Risk: ${score.toFixed(1)}%).`
        );
        setHasFiredWarningAlert(true);
      }
    }
  };

  const handleScoreText = async (e) => {
    e?.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await scoreTranscript(transcript, callId, 'user_default', phase1Mock);
      setLatestResponse(res);
      setTurnHistory((prev) => [...prev, res]);
      processAlertTriggers(res.risk_score, callId);
      setTranscript('');
      if (onRecordCreated) onRecordCreated();
    } catch (err) {
      setError(err.message || 'Scoring request failed');
    } finally {
      setLoading(false);
    }
  };

  // Automatic Instant Audio File Processing on File Selection (Zero Manual Clicks Required)
  const handleAutoFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['.wav', '.mp3', '.m4a', '.mp4', '.opus', '.webm', '.ogg'];
    const fileName = selectedFile.name.toLowerCase();
    const isAllowed = allowed.some(ext => fileName.endsWith(ext));
    if (!isAllowed) {
      setError('Please upload a supported audio file (.wav, .mp3, .m4a, .mp4).');
      return;
    }
    setAudioFile(selectedFile);

    setLoading(true);
    setError('');
    try {
      const res = await scoreAudio(selectedFile, callId);
      setLatestResponse(res);
      setTurnHistory((prev) => [...prev, res]);
      processAlertTriggers(res.risk_score, callId);
      if (onRecordCreated) onRecordCreated();
    } catch (err) {
      setError(err.message || 'Audio scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleAudioPreset = async (filename, defaultText) => {
    setLoading(true);
    setError('');
    try {
      const res = await scoreTranscript(defaultText, callId, 'user_default', phase1Mock);
      setLatestResponse(res);
      setTurnHistory((prev) => [...prev, res]);
      processAlertTriggers(res.risk_score, callId);
      if (onRecordCreated) onRecordCreated();
    } catch (err) {
      setError(err.message || 'Sample test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCall = () => {
    setCallId(`call_${Date.now().toString().slice(-4)}`);
    setLatestResponse(null);
    setTurnHistory([]);
    setTranscript('');
    setError('');
    setChallengeStep(1);
    setChallengeInput('');
    setCallbackState('idle');
    setApp1Done(false);
    setApp2Done(false);
    setHasFiredWarningAlert(false);
    setHasFiredChallengeAlert(false);
  };

  const handleCallbackTrigger = () => {
    setCallbackState('calling');
    setTimeout(() => {
      setCallbackState('failed');
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Full-Screen Dedicated Guard 3 Active Verification Lockout Modal (Risk > 70) */}
      {currentScore > 70 && (
        <Guard3Modal
          response={latestResponse}
          callId={callId}
          onNewCall={handleNewCall}
        />
      )}
      
      {/* Simulation Banner Notice */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusPill status="online" text="CALL SIMULATOR (DEMO MODE)" />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Simulates real-time phone call stream ingestion across 5 defense guards.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <VerifiableBadge institution="State Bank of India" verified={true} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Verified Phone:</span>
            <input 
              type="text" 
              value={verifiedPhone}
              onChange={(e) => setVerifiedPhone(e.target.value)}
              placeholder="+91 98XXX-XXXXX"
              style={{ backgroundColor: '#070a13', border: '1px solid #1f293d', borderRadius: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700, width: '135px' }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
            Call ID: <strong style={{ color: '#06b6d4' }}>{callId}</strong>
          </span>
          <button 
            onClick={handleEnableNotifications}
            style={{ 
              backgroundColor: notifPermission === 'granted' ? 'rgba(16, 185, 129, 0.2)' : '#161f33', 
              color: notifPermission === 'granted' ? '#6ee7b7' : '#f1f5f9', 
              border: notifPermission === 'granted' ? '1px solid #10b981' : '1px solid #1f293d', 
              padding: '0.35rem 0.75rem', 
              borderRadius: '0.375rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem' 
            }}
          >
            {notifPermission === 'granted' ? '🔔 Desktop Alerts Active' : '🔔 Enable Desktop Alerts'}
          </button>
          <button 
            onClick={handleNewCall} 
            style={{ backgroundColor: '#161f33', color: '#f1f5f9', border: '1px solid #1f293d', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RotateCcw size={14} /> New Call
          </button>
        </div>
      </div>

      {/* Instant Automatic Audio Upload & Processing Control Bar */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #06b6d4', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 0 20px -5px rgba(6, 182, 212, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileAudio size={22} style={{ color: '#06b6d4' }} /> Automatic Audio File Ingestion & Whisper STT Engine
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
            ⚡ AUTO-ANALYZES ON FILE SELECTION
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* File Selector for User's Own File */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase' }}>
              📁 Upload & Analyze YOUR Audio File (.wav, .mp3, .m4a, .mp4):
            </label>
            <input 
              type="file" 
              accept=".wav,.mp3,.m4a,.mp4,audio/*,video/mp4"
              onChange={(e) => handleAutoFileSelect(e.target.files[0])}
              style={{ fontSize: '0.75rem', color: '#cbd5e1', backgroundColor: '#070a13', border: '1px solid #06b6d4', borderRadius: '0.375rem', padding: '0.5rem' }}
            />
          </div>

          {/* Preset Sample Shortcut Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
              🧪 Quick Audio Demo Shortcuts:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                onClick={() => handleSampleAudioPreset("scam_otp_theft.wav", "URGENT: This is State Bank of India Manager. Share your 6-digit OTP code immediately or your account will be blocked!")}
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.7rem', fontWeight: 800, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', flex: 1 }}
              >
                🚨 Test Scam Line (OTP Theft)
              </button>
              <button
                onClick={() => handleSampleAudioPreset("authentic_family_call.wav", "Hi Mom, just calling to ask what time we are having dinner tonight?")}
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 800, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', flex: 1 }}
              >
                ✅ Test Authentic Line (Family Call)
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', color: '#67e8f9', fontSize: '0.8rem', fontWeight: 700, borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⏳</span>
            <span>Analyzing... this may take up to a minute for longer clips. Please wait while Whisper STT & Claude Guards process the audio stream.</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(153, 27, 27, 0.6)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.75rem', borderRadius: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>
            ⚠️ Processing Notice: {error}
          </div>
        )}
      </div>

      {/* Guard 3.1 Immediate Threat Warning Banner (>50 score) */}
      <BannerAlert score={currentScore} />

      {/* Centerpiece: Risk Gauge & Equalizer Bar */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '1rem', padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1.25rem' }}>
          <AudioWaveform isAnalyzing={loading} />
        </div>

        <RiskGauge score={currentScore} size={210} />
      </div>

      {/* Detailed 5-Guard Risk Analysis & Verdict Report */}
      <RiskAnalysisReport response={latestResponse} />

      {/* 5 Guards Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* GUARD 1 CARD — Audio Guard */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mic size={20} style={{ color: '#a855f7' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Guard 1: Audio Guard
              </h3>
            </div>
            <StatusPill status={latestResponse?.audio_spoof_score > 50 ? 'warning' : 'online'} text={latestResponse?.audio_spoof_score !== undefined ? `Audio Score: ${latestResponse.audio_spoof_score}%` : 'Standby'} />
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
            Evaluates uploaded audio clips for synthetic AI deepfake cloning artifacts using 4 security tools.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div style={{ backgroundColor: '#161f33', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #1f293d' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>1.1 Speaker Verification</span>
              <strong style={{ color: '#c084fc' }}>
                {latestResponse?.audio_tools_breakdown?.tool_1_1_speaker?.score !== undefined ? `${latestResponse.audio_tools_breakdown.tool_1_1_speaker.score}%` : 'ECAPA-TDNN Active'}
              </strong>
            </div>
            <div style={{ backgroundColor: '#161f33', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #1f293d' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>1.2 Spoof Detector</span>
              <strong style={{ color: '#c084fc' }}>
                {latestResponse?.audio_tools_breakdown?.tool_1_2_spoof?.score !== undefined ? `${latestResponse.audio_tools_breakdown.tool_1_2_spoof.score}%` : 'AASIST Model'}
              </strong>
            </div>
            <div style={{ backgroundColor: '#161f33', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #1f293d' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>1.3 Replay Detector</span>
              <strong style={{ color: '#c084fc' }}>
                {latestResponse?.audio_tools_breakdown?.tool_1_3_replay?.score !== undefined ? `${latestResponse.audio_tools_breakdown.tool_1_3_replay.score}%` : 'Librosa Spectral'}
              </strong>
            </div>
            <div style={{ backgroundColor: '#161f33', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #1f293d' }}>
              <span style={{ color: '#94a3b8', display: 'block' }}>1.4 Watermark Check</span>
              <strong style={{ color: '#c084fc' }}>
                {latestResponse?.audio_tools_breakdown?.tool_1_4_watermark?.score !== undefined ? `${latestResponse.audio_tools_breakdown.tool_1_4_watermark.score}%` : 'AudioSeal Scanner'}
              </strong>
            </div>
          </div>
        </div>

        {/* GUARD 2 CARD — Conversation Guard */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={20} style={{ color: '#06b6d4' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Guard 2: Conversation Guard
              </h3>
            </div>
            <StatusPill status={latestResponse?.conversational_score > 50 ? 'warning' : 'online'} text={latestResponse?.conversational_score !== undefined ? `Text Score: ${latestResponse.conversational_score}%` : 'Claude EWMA'} />
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
            Transcribes speech via Whisper, scores scam intent via Claude LLM, and calculates EWMA running average across turns.
          </p>

          {/* Quick Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Quick Preset Text Scripts:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {sampleScams.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => setTranscript(s.text)}
                  style={{ fontSize: '0.7rem', backgroundColor: '#161f33', color: '#e2e8f0', padding: '0.3rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #1f293d', cursor: 'pointer' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Form */}
          <form onSubmit={handleScoreText} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea 
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type or paste call line... e.g. 'Share your 6-digit OTP immediately'"
              style={{ width: '100%', backgroundColor: '#070a13', border: '1px solid #1f293d', borderRadius: '0.375rem', padding: '0.5rem', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', boxSizing: 'border-box' }}
            />
            <button 
              type="submit"
              disabled={loading || !transcript.trim()}
              style={{ backgroundColor: '#06b6d4', color: '#ffffff', fontWeight: 800, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
            >
              <Play size={14} /> Submit Line to EWMA Stream →
            </button>
          </form>
        </div>

        {/* GUARD 3 CARD — Verification Guard */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Guard 3: Verification Guard
              </h3>
            </div>
            <StatusPill status={currentScore > 70 ? 'offline' : (currentScore > 50 ? 'warning' : 'online')} text={currentScore > 70 ? 'CHALLENGE ACTIVE' : (currentScore > 50 ? 'WARNING ACTIVE' : 'STANDBY')} />
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
            Triggers step-up authentication when risk &gt; 50 (Warning Banner) and risk &gt; 70 (Challenge &amp; Callback).
          </p>

          {currentScore > 70 ? (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.875rem', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Tool 3.2 Random Challenge Code */}
              <div>
                <strong style={{ color: '#fca5a5', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Tool 3.2 Step-Up Challenge Code:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#fef08a', backgroundColor: '#070a13', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #eab308' }}>
                    {latestResponse?.challenge_code || '8492'}
                  </span>
                  <input 
                    type="text"
                    value={challengeInput}
                    onChange={(e) => setChallengeInput(e.target.value)}
                    placeholder="Verify code"
                    style={{ flex: 1, backgroundColor: '#070a13', border: '1px solid #475569', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Tool 3.3 Out-of-Band Callback */}
              <div style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)', paddingTop: '0.5rem' }}>
                <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.25rem' }}>Tool 3.3 Out-of-Band Callback:</strong>
                {callbackState === 'idle' && (
                  <button onClick={handleCallbackTrigger} style={{ backgroundColor: '#d97706', color: '#ffffff', fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                    📞 Simulate Cellular Line Check
                  </button>
                )}
                {callbackState === 'calling' && (
                  <span style={{ color: '#fde047', fontWeight: 700 }}>Calling registered line ({verifiedPhone})...</span>
                )}
                {callbackState === 'failed' && (
                  <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ No matching legitimate call found.</span>
                )}
              </div>

              {/* Tool 3.4 Dual Approval */}
              <div style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(239, 68, 68, 0.3)', paddingTop: '0.5rem' }}>
                <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.25rem' }}>Tool 3.4 Dual Authorization:</strong>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                  <button onClick={() => setApp1Done(true)} style={{ backgroundColor: app1Done ? '#15803d' : '#1e293b', color: '#ffffff', fontSize: '0.65rem', padding: '0.3rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #475569', cursor: 'pointer' }}>
                    {app1Done ? '✅ Approver 1' : 'Approve 1'}
                  </button>
                  <button onClick={() => setApp2Done(true)} style={{ backgroundColor: app2Done ? '#15803d' : '#1e293b', color: '#ffffff', fontSize: '0.65rem', padding: '0.3rem 0.5rem', borderRadius: '0.25rem', border: '1px solid #475569', cursor: 'pointer' }}>
                    {app2Done ? '✅ Approver 2' : 'Approve 2'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              Risk score below threshold (&lt;70). Challenge &amp; Dual Auth standby.
            </div>
          )}
        </div>

        {/* GUARD 4 CARD — Trust & Accountability Guard */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} style={{ color: '#10b981' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Guard 4: Trust Ledger
              </h3>
            </div>
            <StatusPill status="online" text="Merkle Active" />
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
            Tool 4.1 SHA-256 Hashing, Tool 4.2 Merkle Append-Only Ledger, Tool 4.3 W3C Verifiable Credentials.
          </p>

          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>LATEST BLOCK HASH (SHA-256):</span>
              <span style={{ color: '#6ee7b7', wordBreak: 'break-all' }}>
                {latestResponse?.record_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>PREVIOUS BLOCK LINK:</span>
              <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>
                {latestResponse?.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
              </span>
            </div>
          </div>
        </div>

        {/* GUARD 5 CARD — Privacy Guard */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f293d', paddingBottom: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} style={{ color: '#f43f5e' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Guard 5: Privacy Guard
              </h3>
            </div>
            <StatusPill status="online" text="Zero-Audio Enforced" />
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
            Tool 5.1 Immediate raw audio file deletion via os.remove(). Tool 5.2 Privacy endpoints (/consent, /withdraw, /delete).
          </p>

          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
            <span style={{ color: '#f43f5e', fontWeight: 800, display: 'block', marginBottom: '0.25rem' }}>🔒 Immediate Audio Purge Guarantee:</span>
            Raw voice recordings are scored in temp memory and immediately deleted. Only numeric scores and block hashes persist in SQLite.
          </div>
        </div>

      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(153, 27, 27, 0.5)', border: '1px solid #ef4444', color: '#feccae', fontSize: '0.75rem', borderRadius: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
