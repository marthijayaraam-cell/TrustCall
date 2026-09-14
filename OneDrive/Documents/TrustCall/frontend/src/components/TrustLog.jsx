import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, ShieldAlert, AlertOctagon, RefreshCw } from 'lucide-react';
import StatusPill from './ui/StatusPill';
import VerifiableBadge from './ui/VerifiableBadge';
import { getTrustLogRecords, verifyRecord, tamperRecord } from '../api';

export default function TrustLog() {
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
      // Intentionally alter database record
      await tamperRecord(index, 'TAMPERED: Unauthorized money transfer', 0.0);
      // Immediately run verification to show red tamper alert
      const res = await verifyRecord(index);
      setVerificationResults((prev) => ({
        ...prev,
        [index]: res,
      }));
      fetchRecords();
    } catch (err) {
      alert(`Tamper action failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database style={{ color: '#10b981' }} /> Guard 4: Tamper-Evident Merkle Trust Ledger & W3C Verifiable Credentials
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
            Tool 4.1 SHA-256 Hashing • Tool 4.2 Merkle Append-Only Log • Tool 4.3 W3C Signed Institution Credentials
          </p>
        </div>

        <button 
          onClick={fetchRecords} 
          style={{ backgroundColor: '#06b6d4', color: '#ffffff', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <RefreshCw size={14} /> Refresh Ledger
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(153, 27, 27, 0.5)', border: '1px solid #ef4444', color: '#feccae', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
          Loading SHA-256 Merkle chain blocks...
        </div>
      ) : records.length === 0 ? (
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f293d', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          No records logged in SQLite database yet. Process a call in the Live Simulator tab to append blocks!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((rec) => {
            const vRes = verificationResults[rec.index];
            const isTampered = rec.tampered || (vRes && !vRes.valid);

            return (
              <div 
                key={rec.index} 
                style={{
                  backgroundColor: isTampered ? 'rgba(69, 10, 10, 0.8)' : '#111827',
                  border: isTampered ? '2px solid #ef4444' : '1px solid #1f293d',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: isTampered ? '0 10px 25px -5px rgba(239, 68, 68, 0.4)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Block Info Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: '1rem', color: '#60a5fa', backgroundColor: '#070a13', padding: '0.2rem 0.6rem', borderRadius: '0.25rem', border: '1px solid #1f293d' }}>
                      BLOCK #{rec.index}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                      Call ID: <strong style={{ color: '#f1f5f9' }}>{rec.call_id}</strong>
                    </span>
                    <VerifiableBadge institution="State Bank of India" verified={!isTampered} />
                  </div>

                  <StatusPill 
                    status={isTampered ? 'tampered' : 'online'} 
                    text={isTampered ? '🚨 TAMPER DETECTED' : '✓ VERIFIED INTACT'} 
                  />
                </div>

                {/* Payload */}
                <div style={{ backgroundColor: '#070a13', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #1f293d', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>TRANSCRIPT & VERDICT PAYLOAD:</span>
                  <p style={{ fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', color: '#f1f5f9', margin: 0 }}>{rec.transcript}</p>
                </div>

                {/* Hashes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', backgroundColor: '#161f33', padding: '0.625rem', borderRadius: '0.375rem', marginBottom: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>PREVIOUS BLOCK HASH (CHAIN LINK):</span>
                    <span style={{ color: '#cbd5e1', wordBreak: 'break-all' }}>{rec.previous_hash}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>STORED BLOCK HASH (SHA-256):</span>
                    <span style={{ color: '#6ee7b7', wordBreak: 'break-all' }}>{rec.record_hash}</span>
                  </div>
                </div>

                {/* Verification Result Alert Banner */}
                {vRes && (
                  <div style={{
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    border: vRes.valid ? '1px solid #10b981' : '2px solid #ef4444',
                    backgroundColor: vRes.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(127, 29, 29, 0.95)',
                    color: vRes.valid ? '#6ee7b7' : '#fee2e2',
                    marginBottom: '0.875rem',
                    fontSize: '0.75rem',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {vRes.valid ? <ShieldCheck size={18} style={{ color: '#10b981' }} /> : <AlertOctagon size={18} style={{ color: '#ef4444' }} />}
                      {vRes.valid ? 'VERIFICATION PASSED — SHA-256 INTEGRITY INTACT' : '🚨 TAMPER DETECTED! SHA-256 HASH MISMATCH'}
                    </div>
                    <div>Stored Hash: <span style={{ textDecoration: 'underline' }}>{vRes.stored_hash}</span></div>
                    <div>Calculated Hash: <span style={{ textDecoration: 'underline' }}>{vRes.calculated_hash}</span></div>
                    <div style={{ marginTop: '0.25rem', fontFamily: 'Inter, sans-serif' }}>{vRes.details}</div>
                  </div>
                )}

                {/* Admin Action Buttons (Part 2 & 4 Requirement) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #1f293d', paddingTop: '0.75rem' }}>
                  <button 
                    onClick={() => handleVerify(rec.index)} 
                    style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.75rem', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <ShieldCheck size={14} /> Verify Block #{rec.index} Hash (GET /verify/{rec.index})
                  </button>

                  <button 
                    onClick={() => handleTamperDemo(rec.index)} 
                    style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.75rem', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    ⚠️ Tamper with this Record (Demo Scene)
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
