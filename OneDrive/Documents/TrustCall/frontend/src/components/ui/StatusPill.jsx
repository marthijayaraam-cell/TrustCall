import React from 'react';

export default function StatusPill({ status = 'online', text = 'System Active' }) {
  let dotColor = '#10b981'; // Green
  let pillBg = 'rgba(16, 185, 129, 0.1)';
  let pillBorder = 'rgba(16, 185, 129, 0.3)';
  let textColor = '#6ee7b7';

  if (status === 'warning' || status === 'elevated') {
    dotColor = '#f59e0b';
    pillBg = 'rgba(245, 158, 11, 0.1)';
    pillBorder = 'rgba(245, 158, 11, 0.3)';
    textColor = '#fde047';
  } else if (status === 'critical' || status === 'threat' || status === 'tampered') {
    dotColor = '#ef4444';
    pillBg = 'rgba(239, 68, 68, 0.15)';
    pillBorder = 'rgba(239, 68, 68, 0.4)';
    textColor = '#fca5a5';
  }

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.375rem', 
        backgroundColor: pillBg, 
        border: `1px solid ${pillBorder}`, 
        padding: '0.25rem 0.625rem', 
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: textColor,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <span 
        className="pulse-dot"
        style={{ 
          width: '6px', 
          height: '6px', 
          borderRadius: '50%', 
          backgroundColor: dotColor,
          display: 'inline-block' 
        }} 
      />
      <span>{text}</span>
    </div>
  );
}
