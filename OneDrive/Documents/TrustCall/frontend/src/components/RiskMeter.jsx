import React from 'react';

export default function RiskMeter({ score, action, provider, turnCount }) {
  const currentScore = score !== null && score !== undefined ? score : 0;
  
  let riskColor = '#22c55e'; // Green
  let riskBg = 'rgba(22, 101, 52, 0.2)';
  let riskBorder = '#22c55e';
  let riskLabel = 'LOW RISK';

  if (currentScore >= 30 && currentScore <= 70) {
    riskColor = '#eab308'; // Yellow
    riskBg = 'rgba(113, 63, 18, 0.2)';
    riskBorder = '#eab308';
    riskLabel = 'SUSPICIOUS';
  } else if (currentScore > 70) {
    riskColor = '#ef4444'; // Red
    riskBg = 'rgba(153, 27, 27, 0.25)';
    riskBorder = '#ef4444';
    riskLabel = 'HIGH RISK — ACTION REQUIRED';
  }

  return (
    <div 
      className="card"
      style={{ 
        backgroundColor: riskBg, 
        border: `2px solid ${riskBorder}`, 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        marginBottom: '1.5rem',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#f1f5f9', margin: 0 }}>
          🛡️ Real-Time Risk Score Meter
        </h3>
        <span 
          style={{ 
            backgroundColor: riskColor, 
            color: '#000000', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            fontSize: '0.75rem', 
            fontWeight: 900, 
            textTransform: 'uppercase' 
          }}
        >
          {riskLabel}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', margin: '1rem 0' }}>
        {/* Large Visual Score Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '3.75rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: riskColor, lineHeight: 1 }}>
            {currentScore.toFixed(1)}
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#94a3b8' }}>/ 100</span>
        </div>

        {/* Action Status Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Recommended Action
          </span>
          <span 
            style={{ 
              fontSize: '1.25rem', 
              fontWeight: 900, 
              fontFamily: 'JetBrains Mono, monospace', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: action === 'challenge_required' ? '2px solid #f87171' : '2px solid #475569',
              backgroundColor: action === 'challenge_required' ? '#dc2626' : '#0f172a',
              color: '#ffffff'
            }}
          >
            {action ? action.toUpperCase() : 'MONITOR'}
          </span>
        </div>
      </div>

      {/* Dynamic Visual Progress Bar */}
      <div style={{ width: '100%', backgroundColor: '#0f172a', height: '1.5rem', borderRadius: '9999px', overflow: 'hidden', border: '1px solid #334155', padding: '0.125rem', marginBottom: '0.75rem', boxSizing: 'border-box' }}>
        <div 
          style={{ 
            height: '100%', 
            borderRadius: '9999px', 
            transition: 'all 0.5s ease-out',
            width: `${Math.min(100, Math.max(4, currentScore))}%`, 
            backgroundColor: riskColor,
            boxShadow: `0 0 12px ${riskColor}`
          }}
        />
      </div>

      {/* Metadata Footnote */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(51, 65, 85, 0.6)', paddingTop: '0.75rem' }}>
        <span>Engine: <strong style={{ color: '#f1f5f9' }}>{provider || 'Standby'}</strong></span>
        {turnCount && <span>EWMA Running Average: <strong style={{ color: '#f1f5f9' }}>Turn #{turnCount} (60/40 weighted)</strong></span>}
      </div>
    </div>
  );
}
