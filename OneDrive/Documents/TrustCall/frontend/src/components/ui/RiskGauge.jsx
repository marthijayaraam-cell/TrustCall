import React, { useEffect, useState } from 'react';

export default function RiskGauge({ score = 0, size = 220 }) {
  const [displayScore, setDisplayScore] = useState(0);

  // Smooth count-up animation for score changes
  useEffect(() => {
    let start = displayScore;
    const end = Math.min(100, Math.max(0, score));
    if (start === end) return;

    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easedProgress;
      
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Color logic
  let strokeColor = '#10b981'; // Emerald Green (<30)
  let glowClass = 'glow-green';
  let riskLabel = 'LOW RISK';
  let riskSubtext = 'System Safe • Monitoring Active';

  if (displayScore >= 30 && displayScore <= 70) {
    strokeColor = '#f59e0b'; // Amber Gold (30-70)
    glowClass = 'glow-amber';
    riskLabel = 'SUSPICIOUS';
    riskSubtext = 'Elevated Risk • Threat Flags Present';
  } else if (displayScore > 70) {
    strokeColor = '#ef4444'; // Crimson Red (>70)
    glowClass = 'glow-red';
    riskLabel = 'HIGH THREAT';
    riskSubtext = 'Voice Clone Attack Detected';
  }

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className={glowClass}
        style={{ 
          position: 'relative', 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#0b0f19',
          border: '1px solid #1f293d'
        }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#161f33"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground Risk Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="gauge-ring"
          />
        </svg>

        {/* Center Content Display */}
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: strokeColor, lineHeight: 1 }}>
            {displayScore.toFixed(0)}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginTop: '0.25rem' }}>
            Risk Score
          </div>
        </div>
      </div>

      {/* Label Badge below Gauge */}
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <span 
          style={{ 
            backgroundColor: strokeColor, 
            color: '#000000', 
            fontWeight: 900, 
            fontSize: '0.75rem', 
            letterSpacing: '0.08em', 
            padding: '0.25rem 0.875rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase',
            display: 'inline-block'
          }}
        >
          {riskLabel}
        </span>
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.375rem 0 0 0', fontWeight: 600 }}>
          {riskSubtext}
        </p>
      </div>
    </div>
  );
}
