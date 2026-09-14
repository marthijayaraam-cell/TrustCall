import React from 'react';
import { ShieldCheck, Cpu, Database, Lock, AlertCircle, FileCode } from 'lucide-react';

export default function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Hero Header */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🛡️ TrustCall Architecture & Judge Technical Guide
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Smart India Hackathon 2026 — Problem Statement SIH26104 (Blockchain & Cybersecurity Theme)  
          Concept: A 5-Layer Defense-in-Depth AI Voice Fraud Interception Engine with 14 Integrated Security Tools.
        </p>
      </div>

      {/* Real vs Simulated Grid (Part 5 Rule) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* REAL COMPONENTS CARD */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #10b981', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1f293d', paddingBottom: '0.5rem' }}>
            <ShieldCheck size={22} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase' }}>
              100% REAL (Running AI Models & Code)
            </h3>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <li>
              <strong>Guard 4 Merkle Trust Log:</strong> Pure Python SHA-256 block chain, SQLite persistence, and live hash re-computation verification.
            </li>
            <li>
              <strong>Guard 4.3 W3C Verifiable Credentials:</strong> Signed JSON-LD Verifiable Credential issuer for institutional bank identity.
            </li>
            <li>
              <strong>Guard 2 Conversational AI:</strong> Anthropic Claude API prompt engineering for scam intent scoring + mathematical EWMA running average engine (<code style={{ color: '#06b6d4' }}>0.6 * new + 0.4 * previous</code>).
            </li>
            <li>
              <strong>Guard 1 Audio Spoof & Signal Analyzer:</strong> Pretrained SpeechBrain ECAPA-TDNN speaker verification, AASIST spoof model, and Librosa acoustic zero-crossing spectral analyzer.
            </li>
            <li>
              <strong>Guard 5 Privacy Deletion Engine:</strong> Immediate file cleanup (<code style={{ color: '#f43f5e' }}>os.remove()</code>) enforcing zero raw audio storage, plus SQLite consent tracking.
            </li>
          </ul>
        </div>

        {/* SIMULATED COMPONENTS CARD */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #f59e0b', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #1f293d', paddingBottom: '0.5rem' }}>
            <AlertCircle size={22} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fde047', textTransform: 'uppercase' }}>
              SIMULATED (UI Stand-In for Telephony)
            </h3>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <li>
              <strong>Telephony Call Ingestion (Part 3):</strong> UI text/audio input box standing in for live phone call PSTN/SIP trunk audio tapping.
            </li>
            <li>
              <strong>Out-of-Band Callback Check (Tool 3.3):</strong> A 2-second UI loading state standing in for telco SS7/Diameter cellular signaling pings.
            </li>
            <li>
              <strong>Dual Approver Control (Tool 3.4):</strong> Simulated bank fraud manager portal authorization buttons.
            </li>
          </ul>
        </div>

      </div>

      {/* 5 Guards Architecture Summary */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
          📐 5 Defense-in-Depth Guards Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d' }}>
            <strong style={{ color: '#c084fc', display: 'block', marginBottom: '0.25rem' }}>Guard 1: Audio Guard</strong>
            Speaker Verification, Spoof Detector, Replay Detector, Watermark Check.
          </div>
          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d' }}>
            <strong style={{ color: '#06b6d4', display: 'block', marginBottom: '0.25rem' }}>Guard 2: Conversation Guard</strong>
            Whisper STT, Claude LLM Risk Scoring, EWMA Running Average.
          </div>
          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d' }}>
            <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '0.25rem' }}>Guard 3: Active Verification</strong>
            Warning Banner (&gt;50), Challenge Code (&gt;70), Callback Simulation, Dual Authorization.
          </div>
          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d' }}>
            <strong style={{ color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>Guard 4: Trust Ledger</strong>
            SHA-256 Hashes, Merkle Append-Only Log, W3C Verifiable Credentials.
          </div>
          <div style={{ backgroundColor: '#161f33', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d' }}>
            <strong style={{ color: '#f43f5e', display: 'block', marginBottom: '0.25rem' }}>Guard 5: Privacy Guard</strong>
            Immediate Audio Purge via os.remove(), Privacy Endpoints (/consent, /withdraw, /delete).
          </div>
        </div>
      </div>

    </div>
  );
}
