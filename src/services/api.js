const API_BASE = '/api';

export async function getCaptcha() {
  const res = await fetch(`${API_BASE}/auth/captcha`);
  if (!res.ok) throw new Error('Failed to load CAPTCHA security challenge');
  return res.json();
}

export async function validateCaptchaApi(captchaId, captchaInput) {
  const res = await fetch(`${API_BASE}/auth/validate-captcha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ captchaId, captchaInput })
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unable to connect to server (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Invalid CAPTCHA code');
  }
  return data;
}

export async function sendLoginOtp(email, password, captchaIdOrToken, captchaInput) {
  const payload = { email, password };
  if (typeof captchaIdOrToken === 'string' && captchaIdOrToken.startsWith('captok_')) {
    payload.captchaToken = captchaIdOrToken;
  } else {
    payload.captchaId = captchaIdOrToken;
    payload.captchaInput = captchaInput;
  }

  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unable to connect to server or invalid server response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
  return data;
}

export async function verifyLoginOtp(email, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unable to connect to server or invalid server response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Invalid OTP verification code');
  }
  return data;
}

export async function loginOfficer(email, password, captchaIdOrToken, captchaInput) {
  const payload = { email, password };
  if (typeof captchaIdOrToken === 'string' && captchaIdOrToken.startsWith('captok_')) {
    payload.captchaToken = captchaIdOrToken;
  } else {
    payload.captchaId = captchaIdOrToken;
    payload.captchaInput = captchaInput;
  }

  const res = await fetch(`${API_BASE}/auth/login-officer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unable to connect to server or invalid server response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Officer login failed');
  }
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Unable to connect to server or invalid server response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function getActiveLoan(userId) {
  const res = await fetch(`${API_BASE}/loans/active?userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch active loan');
  return res.json();
}

export async function getAllLoans() {
  const res = await fetch(`${API_BASE}/loans/all`);
  if (!res.ok) throw new Error('Failed to fetch all loans');
  return res.json();
}

export async function submitLoanApplication(data) {
  const res = await fetch(`${API_BASE}/loans/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit loan application');
  return res.json();
}

export async function sendEkycOtp(appId) {
  const res = await fetch(`${API_BASE}/ekyc/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}

export async function verifyEkycOtp(appId, otp) {
  const res = await fetch(`${API_BASE}/ekyc/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, otp })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'eKYC verification failed');
  }
  return res.json();
}

export async function fetchDigilockerDocs(appId) {
  const res = await fetch(`${API_BASE}/documents/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}
export const fetchDocuments = fetchDigilockerDocs;

export async function evaluateUnderwriting(appId) {
  const res = await fetch(`${API_BASE}/underwriting/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}

export async function reviewLoanOfficer(appId, decision, notes, officerEmail) {
  const res = await fetch(`${API_BASE}/officer/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, decision, notes, officerEmail })
  });
  return res.json();
}

export async function generateAgreement(appId) {
  const res = await fetch(`${API_BASE}/agreement/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}

export async function generateEStamp(appId) {
  const res = await fetch(`${API_BASE}/estamp/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}
export const generateEstamp = generateEStamp;

export async function sendEsignOtp(appId) {
  const res = await fetch(`${API_BASE}/esign/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}

export async function verifyEsignOtp(appId, otp) {
  const res = await fetch(`${API_BASE}/esign/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, otp })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'eSign OTP verification failed');
  }
  return res.json();
}

export async function processDisbursement(appId) {
  const res = await fetch(`${API_BASE}/disbursement/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId })
  });
  return res.json();
}

export async function getPaperlessRecords(appId) {
  const res = await fetch(`${API_BASE}/paperless/${appId}`);
  return res.json();
}
export const getPaperlessAudit = getPaperlessRecords;

export async function resetDemoSystem() {
  const res = await fetch(`${API_BASE}/system/reset`, { method: 'POST' });
  return res.json();
}

export async function loadDemoSystem() {
  const res = await fetch(`${API_BASE}/system/load-demo`, { method: 'POST' });
  return res.json();
}

export async function getNotifications(userId) {
  const res = await fetch(`${API_BASE}/notifications/${userId || 1}`);
  return res.json();
}
