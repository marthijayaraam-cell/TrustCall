import React, { useState } from 'react';
import { ShieldCheck, PhoneCall, Database, Info } from 'lucide-react';
import Simulator from './components/Simulator';
import TrustLog from './components/TrustLog';
import About from './components/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator'); // simulator, trustlog, about
  const [logRefreshTrigger, setLogRefreshTrigger] = useState(0);

  return (
    <div style={{ backgroundColor: '#070a13', color: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Product-Style Enterprise SOC Header (Part 1 Requirement) */}
      <header style={{ backgroundColor: '#0b0f19', borderBottom: '1px solid #1f293d', padding: '1rem 1.5rem', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.5)', sticky: 'top' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          {/* Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '0.625rem', backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px -3px rgba(6, 182, 212, 0.4)' }}>
              <ShieldCheck size={26} style={{ color: '#06b6d4' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                TrustCall <span style={{ color: '#06b6d4', fontSize: '1rem', fontWeight: 800 }}>SOC</span>
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, margin: 0 }}>
                Verify the Voice. Verify the Human. Stop the Fraud. | SIH26104
              </p>
            </div>
          </div>

          {/* Persistent Top Nav Bar (Part 1 Requirement) */}
          <nav style={{ display: 'flex', gap: '0.375rem', backgroundColor: '#111827', padding: '0.375rem', borderRadius: '0.75rem', border: '1px solid #1f293d' }}>
            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'simulator' ? '#06b6d4' : 'transparent',
                color: activeTab === 'simulator' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'simulator' ? '0 4px 12px -2px rgba(6, 182, 212, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <PhoneCall size={15} /> Live Call Simulator
            </button>
            
            <button
              onClick={() => setActiveTab('trustlog')}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'trustlog' ? '#06b6d4' : 'transparent',
                color: activeTab === 'trustlog' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'trustlog' ? '0 4px 12px -2px rgba(6, 182, 212, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Database size={15} /> Trust Log & Tamper Demo
            </button>
            
            <button
              onClick={() => setActiveTab('about')}
              style={{
                padding: '0.5rem 1.125rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: activeTab === 'about' ? '#06b6d4' : 'transparent',
                color: activeTab === 'about' ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === 'about' ? '0 4px 12px -2px rgba(6, 182, 212, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Info size={15} /> About & Guard Specs
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main style={{ flex: 1, maxWidth: '1380px', width: '100%', margin: '0 auto', padding: '1.5rem', boxSizing: 'border-box' }}>
        {activeTab === 'simulator' && (
          <Simulator onRecordCreated={() => setLogRefreshTrigger((prev) => prev + 1)} />
        )}

        {activeTab === 'trustlog' && (
          <TrustLog key={logRefreshTrigger} />
        )}

        {activeTab === 'about' && (
          <About />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer style={{ backgroundColor: '#0b0f19', borderTop: '1px solid #1f293d', padding: '0.875rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        TrustCall SOC Platform — Smart India Hackathon 2026 (Problem Statement SIH26104, Theme: Blockchain & Cybersecurity)
      </footer>
    </div>
  );
}
