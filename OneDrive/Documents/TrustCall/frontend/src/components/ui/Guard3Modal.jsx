import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, CheckCircle2, XCircle, Lock, UserCheck, RotateCcw, MessageSquare, Mic, FileText, AlertTriangle } from 'lucide-react';
import RiskGauge from './RiskGauge';
import VerifiableBadge from './VerifiableBadge';

const MOCK_VERIFIED_DIRECTORY = {
  default: "+91 98765-43210",
  bank: "+91 1800-11-2211",
  family: "+91 98765-43210"
};

export default function Guard3Modal({ response, callId, onClose, onNewCall }) {
  const riskScore = response?.risk_score ?? 85.0;
  const audioScore = response?.audio_spoof_score ?? 15.0;
  const convScore = response?.conversational_score ?? 100.0;
  const challengeCode = response?.challenge_code ?? 8492;
  const transcriptSnippet = response?.transcript ?? '';

  // Role-Separated Automatic State Pipeline
  const [callerResponse, setCallerResponse] = useState('');
  const [challengeState, setChallengeState] = useState('pending'); // 'pending' | 'passed' | 'failed'
  const [callbackState, setCallbackState] = useState('idle'); // 'idle' | 'calling' | 'connected'
  const [dualAuthUnlocked, setDualAuthUnlocked] = useState(false);
  
  const [app1Done, setApp1Done] = useState(false);
  const [app2Done, setApp2Done] = useState(false);

  // Expected contact number
  const lowerSnippet = transcriptSnippet.toLowerCase();
  const verifiedNumber = (lowerSnippet.includes("bank") || lowerSnippet.includes("state bank"))
    ? MOCK_VERIFIED_DIRECTORY.bank
    : MOCK_VERIFIED_DIRECTORY.default;

  // AUTOMATIC CODE CHECK & CASCADE ON MISMATCH
  const handleCallerResponseChange = (val) => {
    setCallerResponse(val);
    const cleanInput = val.trim();
    const expected = challengeCode.toString();

    if (!cleanInput) {
      setChallengeState('pending');
      setCallbackState('idle');
      setDualAuthUnlocked(false);
      return;
    }

    if (cleanInput === expected) {
      // BRANCH B: CORRECT Code -> Challenge Passed! Lower Risk Outcome.
      setChallengeState('passed');
      setCallbackState('idle');
      setDualAuthUnlocked(false);
    } else {
      // BRANCH A: MISMATCH / WRONG Code -> AUTOMATIC CASCADE (No Manual Clicks Needed!)
      setChallengeState('failed');
      setCallbackState('calling');
      
      // Automatically advance to callback connected after 1.2s delay
      setTimeout(() => {
        setCallbackState('connected');
        // Automatically unlock Dual Authorization step
        setDualAuthUnlocked(true);
      }, 1200);
    }
  };

  const isFullyApproved = app1Done && app2Done;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(7, 10, 19, 0.95)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '2px solid #ef4444',
        borderRadius: '1.25rem',
        width: '100%',
        maxWidth: '1200px',
        padding: '2rem',
        boxShadow: '0 0 60px -10px rgba(239, 68, 68, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        color: '#f8fafc'
      }}>
        
        {/* Full-Screen Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #ef4444' }}>
              <ShieldAlert size={28} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.025em' }}>
                GUARD 3: AUTOMATIC ACTIVE VERIFICATION
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                HIGH RISK THREAT DETECTED ({riskScore.toFixed(0)}%) — AUTOMATIC INTERCEPTION CASCADE ACTIVE
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <VerifiableBadge institution="State Bank of India" verified={true} />
            <button
              onClick={onNewCall}
              style={{ backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '0.4rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} /> Exit Lockout
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Left = Automatic Lockout Steps, Right = Live Risk Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Automatic Verification Sequence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* STEP 1: Role-Separated Challenge Code */}
            <div style={{
              backgroundColor: '#161f33',
              border: challengeState === 'passed' ? '1px solid #10b981' : (challengeState === 'failed' ? '1px solid #ef4444' : '1px solid #334155'),
              borderRadius: '0.75rem',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: challengeState === 'passed' ? '#6ee7b7' : (challengeState === 'failed' ? '#fca5a5' : '#94a3b8'), textTransform: 'uppercase' }}>
                  STEP 1: Challenge Issued to Caller (System Controlled)
                </span>
                {challengeState === 'passed' && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>✅ Challenge Passed</span>}
                {challengeState === 'failed' && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 800 }}>❌ Code Mismatch</span>}
              </div>

              {/* System Challenge Frame */}
              <div style={{ backgroundColor: '#070a13', border: '1px solid #eab308', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 700 }}>
                  System has issued this challenge to the caller:
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#fef08a', backgroundColor: '#1e293b', padding: '0.2rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #f59e0b' }}>
                  {challengeCode}
                </span>
              </div>

              {/* Simulated Caller Response Input (Automatic Code Check on Input Change) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>
                  Caller's Spoken Response (simulated demo input):
                </label>
                <input
                  type="text"
                  value={callerResponse}
                  onChange={(e) => handleCallerResponseChange(e.target.value)}
                  placeholder="Type caller's spoken code (e.g. 8492 or wrong code 1111)"
                  style={{
                    backgroundColor: '#070a13',
                    border: challengeState === 'failed' ? '1px solid #ef4444' : (challengeState === 'passed' ? '1px solid #10b981' : '1px solid #475569'),
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                />
              </div>

              {/* Status Feedback Banner */}
              {challengeState === 'passed' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Challenge Passed — Caller responded with correct 4-digit code ({challengeCode}). Emergency callback skipped.</span>
                </div>
              )}

              {challengeState === 'failed' && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span>Challenge Failed — Response '{callerResponse}' does not match expected '{challengeCode}'. Automatically cascading to cellular verification...</span>
                </div>
              )}
            </div>

            {/* STEP 2: Automatic Out-of-Band Cellular Verification (Cascade Triggered Automatically) */}
            {challengeState === 'failed' && (
              <div style={{
                backgroundColor: '#161f33',
                border: callbackState === 'connected' ? '1px solid #10b981' : '1px solid #d97706',
                borderRadius: '0.75rem',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                animation: 'fadeIn 0.4s ease-in'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: callbackState === 'connected' ? '#6ee7b7' : '#fde047', textTransform: 'uppercase' }}>
                  STEP 2: Automatic Out-of-Band Cellular Line Check
                </span>

                {callbackState === 'calling' && (
                  <div style={{ fontSize: '0.8rem', color: '#fde047', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PhoneCall size={18} style={{ animation: 'pulse 1s infinite' }} />
                    <span>Automatically calling verified number on file ({verifiedNumber})...</span>
                  </div>
                )}

                {callbackState === 'connected' && (
                  <div style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                    <span>Call connected to verified line {verifiedNumber}. Cellular line check complete. Advancing to Dual Authorization.</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Dual Authorization Sign-Off (ONLY MANUAL ACTION IN ENTIRE FLOW) */}
            {dualAuthUnlocked && (
              <div style={{
                backgroundColor: '#161f33',
                border: isFullyApproved ? '1px solid #10b981' : '1px solid #ef4444',
                borderRadius: '0.75rem',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'fadeIn 0.4s ease-in'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isFullyApproved ? '#6ee7b7' : '#fca5a5', textTransform: 'uppercase' }}>
                    STEP 3: Dual Authorization Sign-Off (Manual Action Required)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 800 }}>👆 MANUAL HUMAN APPROVAL</span>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                  Requires manual authorization from two independent human security approvers before releasing transaction funds.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setApp1Done(true)}
                    style={{ flex: 1, backgroundColor: app1Done ? '#15803d' : '#1e293b', color: '#ffffff', border: app1Done ? '1px solid #22c55e' : '1px solid #475569', padding: '0.65rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {app1Done ? '✅ Approver 1 Signed' : 'Click to Sign Approver 1'}
                  </button>
                  <button
                    onClick={() => setApp2Done(true)}
                    style={{ flex: 1, backgroundColor: app2Done ? '#15803d' : '#1e293b', color: '#ffffff', border: app2Done ? '1px solid #22c55e' : '1px solid #475569', padding: '0.65rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {app2Done ? '✅ Approver 2 Signed' : 'Click to Sign Approver 2'}
                  </button>
                </div>

                {isFullyApproved && (
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', marginTop: '0.5rem' }}>
                    🎉 TRANSACTION FULLY AUTHORIZED &amp; SECURED BY TRUSTCALL SOC ENGINE!
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Live Threat Score Panel */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.875rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              📊 LIVE FRAUD RISK SCORE PANEL
            </span>

            {/* Risk Gauge Dial */}
            <RiskGauge score={riskScore} size={210} />

            {/* Individual Guards Breakdown */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #1f293d', paddingTop: '1rem' }}>
              
              <div style={{ backgroundColor: '#161f33', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #1f293d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mic size={18} style={{ color: '#a855f7' }} />
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Guard 1: Audio Signal</span>
                </div>
                <strong style={{ color: audioScore > 50 ? '#ef4444' : '#a855f7', fontSize: '0.9rem' }}>
                  {audioScore.toFixed(1)}%
                </strong>
              </div>

              <div style={{ backgroundColor: '#161f33', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #1f293d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} style={{ color: '#06b6d4' }} />
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Guard 2: Intent Text</span>
                </div>
                <strong style={{ color: convScore > 50 ? '#ef4444' : '#06b6d4', fontSize: '0.9rem' }}>
                  {convScore.toFixed(1)}%
                </strong>
              </div>

            </div>

            {/* Flagged Transcript Snippet Box */}
            {transcriptSnippet && (
              <div style={{ width: '100%', backgroundColor: '#070a13', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <FileText size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase' }}>
                    Flagged Call Transcript:
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{transcriptSnippet}"
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
