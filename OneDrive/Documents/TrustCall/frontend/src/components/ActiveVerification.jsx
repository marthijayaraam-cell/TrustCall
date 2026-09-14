import React, { useState, useEffect } from 'react';

export default function ActiveVerification({ challengeCode, onReset }) {
  const [step, setStep] = useState(1); // 1: Challenge, 2: Callback, 3: Dual Approval, 4: Complete
  const [userChallengeInput, setUserChallengeInput] = useState('');
  const [callbackStatus, setCallbackStatus] = useState('initiating'); // initiating, failed
  const [app1Done, setApp1Done] = useState(false);
  const [app2Done, setApp2Done] = useState(false);

  // Trigger callback simulation when moving to Step 2
  useEffect(() => {
    if (step === 2) {
      setCallbackStatus('initiating');
      const timer = setTimeout(() => {
        setCallbackStatus('failed');
      }, 2000); // 2 second out-of-band callback simulation
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleChallengeSubmit = (e) => {
    e.preventDefault();
    if (userChallengeInput.trim()) {
      setStep(2); // Proceed to Out-of-band Callback simulation
    }
  };

  return (
    <div style={{ backgroundColor: 'rgba(69, 10, 10, 0.5)', border: '2px solid #ef4444', padding: '1.5rem', margin: '1.5rem 0', color: '#f8fafc', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(153, 27, 27, 0.6)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2rem' }}>🚨</span>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Guard 3 Active Verification Interception
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600, margin: 0 }}>
              Risk score exceeds threshold (&gt;70). High-risk voice cloning workflow activated.
            </p>
          </div>
        </div>
        <span style={{ backgroundColor: '#7f1d1d', color: '#fecaca', border: '1px solid #ef4444', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 700 }}>
          STEP {step} OF 3
        </span>
      </div>

      {/* STEP 1: Spoken Challenge Code Prompt */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Interactive Challenge Code Required:
            </label>
            <div style={{ textAlign: 'center', margin: '0.75rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Instruct caller to repeat this 4-digit code:</span>
              <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.25em', color: '#facc15', backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(234, 179, 8, 0.5)', display: 'inline-block' }}>
                {challengeCode || '7492'}
              </span>
            </div>
            
            <form onSubmit={handleChallengeSubmit} style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                Type what the caller said:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={userChallengeInput}
                  onChange={(e) => setUserChallengeInput(e.target.value)}
                  placeholder="e.g. 7492"
                  style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.375rem', padding: '0.5rem 0.75rem', fontSize: '1.25rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#ffffff' }}
                  required
                />
                <button type="submit" style={{ backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                  Verify Spoken Code &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Out-of-band Callback Simulation */}
      {step === 2 && (
        <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', margin: 0 }}>
            Simulating Out-of-Band Callback Verification...
          </h4>

          {callbackStatus === 'initiating' ? (
            <div style={{ margin: '1.5rem 0' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fde047' }}>
                📞 Calling registered phone number on file (+91 98765-XXXXX)...
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Verifying secondary cellular signaling channel</p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(127, 29, 29, 0.6)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>❌</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fecaca', margin: '0.5rem 0' }}>
                No matching legitimate call found.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#fca5a5', margin: '0 0 1rem 0' }}>
                Out-of-band cellular check failed to authenticate the active line. High probability of spoofing.
              </p>
              <button 
                onClick={() => setStep(3)} 
                style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0.6rem 1.25rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem' }}
              >
                Proceed to Dual-Approver Override &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Dual Approver Authorization */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', padding: '1rem', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f1f5f9', textTransform: 'uppercase', margin: 0 }}>
              Dual-Approval Security Control (Guard 3 Final Stage)
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 1rem 0' }}>
              Because risk score exceeded 70 and callback verification failed, two independent authorizations are mandatory to unlock transaction execution.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
              {/* Approver 1 */}
              <div style={{ padding: '1rem', borderRadius: '0.5rem', border: app1Done ? '2px solid #22c55e' : '1px solid #475569', backgroundColor: app1Done ? 'rgba(20, 83, 45, 0.5)' : '#1e293b', textAlign: 'center' }}>
                <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>Approver 1 (Risk Officer)</h5>
                {app1Done ? (
                  <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.1rem' }}>✅ Approved</span>
                ) : (
                  <button onClick={() => setApp1Done(true)} style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                    Approve (Approver 1)
                  </button>
                )}
              </div>

              {/* Approver 2 */}
              <div style={{ padding: '1rem', borderRadius: '0.5rem', border: app2Done ? '2px solid #22c55e' : '1px solid #475569', backgroundColor: app2Done ? 'rgba(20, 83, 45, 0.5)' : '#1e293b', textAlign: 'center' }}>
                <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>Approver 2 (Fraud Lead)</h5>
                {app2Done ? (
                  <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '1.1rem' }}>✅ Approved</span>
                ) : (
                  <button onClick={() => setApp2Done(true)} style={{ backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}>
                    Approve (Approver 2)
                  </button>
                )}
              </div>
            </div>

            {/* Decision Status */}
            {app1Done && app2Done ? (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(20, 83, 45, 0.6)', border: '1px solid #22c55e', borderRadius: '0.375rem', textAlign: 'center' }}>
                <span style={{ color: '#bbf7d0', fontWeight: 700, fontSize: '0.875rem' }}>
                  🎉 Dual Approval Granted. Transaction Override Authorized.
                </span>
                <button onClick={onReset} style={{ display: 'block', margin: '0.5rem auto 0 auto', fontSize: '0.75rem', color: '#cbd5e1', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Reset Verification State
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(127, 29, 29, 0.4)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '0.375rem', textAlign: 'center' }}>
                <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700 }}>
                  ⛔ Transaction Execution Blocked until both Approver 1 and Approver 2 confirm.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
