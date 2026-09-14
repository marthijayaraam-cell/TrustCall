import React from 'react';

export default function AudioWaveform({ isAnalyzing = false, barCount = 18 }) {
  const bars = Array.from({ length: barCount });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '40px', padding: '0 8px' }}>
      {bars.map((_, idx) => {
        const heightPercent = isAnalyzing ? Math.floor(Math.sin(idx) * 35 + 50) : 20;
        const animationDelay = `${(idx % 5) * 0.15}s`;
        
        return (
          <div
            key={idx}
            style={{
              width: '4px',
              backgroundColor: isAnalyzing ? '#06b6d4' : '#334155',
              borderRadius: '2px',
              height: isAnalyzing ? `${heightPercent}%` : '20%',
              transition: 'all 0.3s ease',
              animation: isAnalyzing ? `wave-bar 1.2s ease-in-out infinite ${animationDelay}` : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
