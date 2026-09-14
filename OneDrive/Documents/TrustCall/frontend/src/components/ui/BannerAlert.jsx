import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function BannerAlert({ score = 0, message = 'Warning: this call shows signs of AI voice cloning' }) {
  if (score < 50) return null;

  const isCritical = score > 70;

  return (
    <div 
      style={{
        backgroundColor: isCritical ? 'rgba(153, 27, 27, 0.4)' : 'rgba(180, 83, 9, 0.3)',
        border: isCritical ? '2px solid #ef4444' : '2px solid #f59e0b',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '1rem',
        boxShadow: isCritical ? '0 10px 25px -5px rgba(239, 68, 68, 0.4)' : '0 10px 20px -5px rgba(245, 158, 11, 0.3)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isCritical ? (
          <ShieldAlert size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={26} style={{ color: '#f59e0b', flexShrink: 0 }} />
        )}

        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: isCritical ? '#fca5a5' : '#fef08a' }}>
            Guard 3.1 Immediate Threat Warning
          </h4>
          <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>
            {message}
          </p>
        </div>
      </div>

      <span style={{ 
        backgroundColor: isCritical ? '#dc2626' : '#d97706', 
        color: '#ffffff', 
        fontSize: '0.7rem', 
        fontWeight: 900, 
        padding: '0.25rem 0.625rem', 
        borderRadius: '0.25rem', 
        fontFamily: 'JetBrains Mono, monospace',
        textTransform: 'uppercase',
        flexShrink: 0
      }}>
        Score: {score.toFixed(1)} / 100
      </span>
    </div>
  );
}
