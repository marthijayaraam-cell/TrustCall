import React, { useState } from 'react';
import { setConsent, deleteUserData } from '../api';

export default function PrivacyPanel({ userId, onUserChange }) {
  const [consented, setConsented] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggleConsent = async (newConsent) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await setConsent(userId, newConsent);
      setConsented(newConsent);
      setStatusMsg(res.message);
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm(`Are you sure you want to purge all historical data for user '${userId}'?`)) return;
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await deleteUserData(userId);
      setStatusMsg(res.message);
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔒 Guard 5: Privacy & Consent Governance
        </h2>
        <span style={{ fontSize: '0.75rem', backgroundColor: '#1e3a8a', color: '#bfdbfe', border: '1px solid #3b82f6', fontFamily: 'JetBrains Mono, monospace', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 700 }}>
          Zero-Audio Storage Enforced
        </span>
      </div>

      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
          Active User Identifier:
        </label>
        <input 
          type="text"
          value={userId}
          onChange={(e) => onUserChange(e.target.value)}
          style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.375rem', padding: '0.5rem', color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', boxSizing: 'border-box' }}
          placeholder="e.g. user_default"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>Real-Time Call Scoring Consent</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Opt-in to allow Guard 1-4 risk analysis during phone calls.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => handleToggleConsent(true)}
              disabled={loading || consented}
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', backgroundColor: consented ? '#16a34a' : '#334155', color: consented ? '#ffffff' : '#94a3b8' }}
            >
              POST /consent
            </button>
            <button 
              onClick={() => handleToggleConsent(false)}
              disabled={loading || !consented}
              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', backgroundColor: !consented ? '#dc2626' : '#334155', color: !consented ? '#ffffff' : '#94a3b8' }}
            >
              POST /withdraw
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155', gap: '1rem' }}>
          <div>
            <h4 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>Purge All User Historical Data</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Deletes EWMA call sessions & Merkle records associated with user ID.</p>
          </div>

          <button 
            onClick={handleDeleteData}
            disabled={loading}
            style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            🗑️ POST /delete
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: '1rem', backgroundColor: '#0f172a', border: '1px solid #3b82f6', color: '#bfdbfe', borderRadius: '0.5rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
          {statusMsg}
        </div>
      )}

      <div style={{ backgroundColor: '#020617', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b', fontSize: '0.75rem', color: '#94a3b8' }}>
        <h5 style={{ fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>🛡️ Guard 5 Raw Audio Deletion Guarantee:</h5>
        <p style={{ margin: 0 }}>
          When audio files are uploaded to <code style={{ color: '#60a5fa' }}>POST /score-audio</code>, the system extracts acoustic spectral parameters and immediately executes <code style={{ color: '#60a5fa' }}>os.remove()</code> on the file buffer. Only the numeric risk score and SHA-256 block hash persist in the database.
        </p>
      </div>
    </div>
  );
}
