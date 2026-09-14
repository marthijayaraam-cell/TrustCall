import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function VerifiableBadge({ institution = 'State Bank of India', verified = true }) {
  if (!verified) return null;

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid #10b981',
        color: '#6ee7b7',
        fontSize: '0.75rem',
        fontWeight: 800,
        padding: '0.375rem 0.75rem',
        borderRadius: '0.5rem',
        boxShadow: '0 0 15px -3px rgba(16, 185, 129, 0.3)'
      }}
    >
      <ShieldCheck size={18} style={{ color: '#10b981' }} />
      <span>W3C Verifiable Credential: <strong>{institution} Verified</strong></span>
    </div>
  );
}
