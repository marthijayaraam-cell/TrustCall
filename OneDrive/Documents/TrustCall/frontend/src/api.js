const hostname = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : '127.0.0.1';
const defaultLocalUrl = `http://${hostname}:8000`;
let rawBaseUrl = (import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : defaultLocalUrl;
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
const API_BASE_URL = rawBaseUrl;

export async function scoreTranscript(transcript, callId = null, userId = 'user_default', phase1Mock = false) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        call_id: callId,
        user_id: userId,
        phase1_mock: phase1Mock,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Network response error' }));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("Scoring request timed out after 15 seconds. Please check backend terminal.");
    }
    if (err.message && !err.message.startsWith("Scoring request") && !err.message.startsWith("Server error")) {
      throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
    }
    throw err;
  }
}

export async function scoreAudio(audioFile, callId = null, transcript = '', userId = 'user_default') {
  const formData = new FormData();
  formData.append('file', audioFile);
  if (callId) formData.append('call_id', callId);
  if (transcript) formData.append('transcript', transcript);
  formData.append('user_id', userId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${API_BASE_URL}/score-audio`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Audio upload error' }));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("Audio processing request timed out after 120 seconds. Please check backend logs.");
    }
    if (err.message && !err.message.startsWith("Audio processing") && !err.message.startsWith("Could not") && !err.message.startsWith("Server error")) {
      throw new Error(err.message || "Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
    }
    throw err;
  }
}

export async function getTrustLogRecords() {
  const response = await fetch(`${API_BASE_URL}/trust-log/records`).catch(() => {
    throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
  });
  if (!response.ok) throw new Error('Failed to fetch trust log records');
  return response.json();
}

export async function verifyRecord(index) {
  const response = await fetch(`${API_BASE_URL}/verify/${index}`).catch(() => {
    throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
  });
  if (!response.ok) throw new Error(`Failed to verify record ${index}`);
  return response.json();
}

export async function tamperRecord(index, newTranscript = 'TAMPERED: Unauthorized money transfer', newScore = 0.0) {
  const response = await fetch(`${API_BASE_URL}/trust-log/tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      index,
      new_transcript: newTranscript,
      new_score: newScore,
    }),
  }).catch(() => {
    throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
  });
  if (!response.ok) throw new Error('Failed to tamper record');
  return response.json();
}

export async function setConsent(userId, grant = true) {
  const endpoint = grant ? '/consent' : '/withdraw';
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  }).catch(() => {
    throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
  });
  return response.json();
}

export async function deleteUserData(userId) {
  const response = await fetch(`${API_BASE_URL}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  }).catch(() => {
    throw new Error("Failed to connect to TrustCall backend engine. Please ensure 'python start.py' is running in Terminal 1.");
  });
  return response.json();
}
