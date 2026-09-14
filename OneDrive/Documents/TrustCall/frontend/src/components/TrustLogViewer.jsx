import React, { useState, useEffect } from 'react';
import { getTrustLogRecords, verifyRecord, tamperRecord } from '../api';

export default function TrustLogViewer() {
  const [records, setRecords] = useState([]);
  const [verificationResults, setVerificationResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTrustLogRecords();
      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || 'Failed to load trust log records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleVerify = async (index) => {
    try {
      const res = await verifyRecord(index);
      setVerificationResults((prev) => ({
        ...prev,
        [index]: res,
      }));
    } catch (err) {
      alert(`Verification check error: ${err.message}`);
    }
  };

  const handleTamperDemo = async (index) => {
    try {
      // Intentionally alter record in database
      await tamperRecord(index, 'TAMPERED: Unauthorized account drain', 0.0);
      // Immediately run verify to show red tamper alert
      const res = await verifyRecord(index);
      setVerificationResults((prev) => ({
        ...prev,
        [index]: res,
      }));
      // Refresh list
      fetchRecords();
    } catch (err) {
      alert(`Tamper action failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔗 Guard 4: Tamper-Evident Merkle Trust Ledger
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
            Every call score generates a cryptographic SHA-256 block hash linked to the previous block's hash.
          </p>
        </div>
        <button 
          onClick={fetchRecords} 
          style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase' }}
        >
          🔄 Refresh Ledger
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(153, 27, 27, 0.5)', border: '1px solid #ef4444', color: '#feccae', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
          Loading Merkle trust log records...
        </div>
      ) : records.length === 0 ? (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          No records logged yet. Process a call in the Live Simulator tab to append records to the ledger!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((rec) => {
            const vRes = verificationResults[rec.index];

            return (
              <div 
                key={rec.index} 
                style={{
                  backgroundColor: rec.tampered || (vRes && !vRes.valid) ? 'rgba(69, 10, 10, 0.8)' : '#1e293b',
                  border: rec.tampered || (vRes && !vRes.valid) ? '2px solid #ef4444' : '1px solid #334155',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: rec.tampered || (vRes && !vRes.valid) ? '0 10px 25px -5px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: '1.1rem', color: '#60a5fa', backgroundColor: '#0f172a', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #334155' }}>
                      BLOCK #{rec.index}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                      Call ID: <strong style={{ color: '#f1f5f9' }}>{rec.call_id}</strong>
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    fontWeight: 900,
                    borderRadius: '0.25rem',
                    textTransform: 'uppercase',
                    backgroundColor: rec.action === 'challenge_required' ? '#dc2626' : '#334155',
                    color: '#ffffff'
                  }}>
                    {rec.action} (Score: {rec.risk_score})
                  </span>
                </div>

                <div style={{ backgroundColor: '#0f172a', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>TRANSCRIPT PAYLOAD:</span>
                  <p style={{ fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace', color: '#f1f5f9', margin: 0 }}>{rec.transcript}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', backgroundColor: 'rgba(2, 6, 23, 0.7)', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>PREVIOUS BLOCK HASH:</span>
                    <span style={{ color: '#cbd5e1', wordBreak: 'break-all' }}>{rec.previous_hash}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>STORED BLOCK HASH (SHA-256):</span>
                    <span style={{ color: '#cbd5e1', wordBreak: 'break-all' }}>{rec.record_hash}</span>
                  </div>
                </div>

                {/* Verification Result Banner */}
                {vRes && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: vRes.valid ? '1px solid #22c55e' : '2px solid #ef4444',
                    backgroundColor: vRes.valid ? 'rgba(20, 83, 45, 0.8)' : 'rgba(127, 29, 29, 0.95)',
                    color: vRes.valid ? '#bbf7d0' : '#fee2e2',
                    margin: '0.75rem 0',
                    fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {vRes.valid ? '✅ VERIFICATION PASSED' : '🚨 TAMPER DETECTED! SHA-256 HASH MISMATCH'}
                    </div>
                    <div>Stored Hash: <span style={{ textDecoration: 'underline' }}>{vRes.stored_hash}</span></div>
                    <div>Calculated Hash: <span style={{ textDecoration: 'underline' }}>{vRes.calculated_hash}</span></div>
                    <div style={{ marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>{vRes.details}</div>
                  </div>
                )}

                {/* Admin Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '0.75rem' }}>
                  <button 
                    onClick={() => handleVerify(rec.index)} 
                    style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.75rem', padding: '0.5rem 0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 700 }}
                  >
                    🔍 Verify Block #{rec.index} Hash
                  </button>

                  <button 
                    onClick={() => handleTamperDemo(rec.index)} 
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.75rem', padding: '0.5rem 0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    ⚠️ Tamper with this Record (Judge Demo)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
