import crypto from 'crypto';

const captchaStore = new Map();

const validatedTokensStore = new Map();

// Clean up expired captchas and tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expiresAt < now) {
      captchaStore.delete(id);
    }
  }
  for (const [token, data] of validatedTokensStore.entries()) {
    if (data.expiresAt < now) {
      validatedTokensStore.delete(token);
    }
  }
}, 60000);

function randomString(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded 0, O, 1, I for clarity
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateCaptcha() {
  const captchaId = `cap_${crypto.randomUUID()}`;
  const text = randomString(5);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  captchaStore.set(captchaId, { text, expiresAt });

  // Generate crisp SVG graphic
  const width = 160;
  const height = 50;
  const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0284c7'];

  let noiseLines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = colors[Math.floor(Math.random() * colors.length)];
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5" opacity="0.4" />`;
  }

  let noiseDots = '';
  for (let i = 0; i < 25; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.floor(Math.random() * 2) + 1;
    const fill = colors[Math.floor(Math.random() * colors.length)];
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.3" />`;
  }

  let textSvg = '';
  const charWidth = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = Math.floor((i + 0.6) * charWidth);
    const y = 34 + Math.floor(Math.random() * 6 - 3);
    const rotate = Math.floor(Math.random() * 30 - 15);
    const color = colors[i % colors.length];
    const fontSize = 24 + Math.floor(Math.random() * 6);
    textSvg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${color}" transform="rotate(${rotate}, ${x}, ${y})">${char}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#f1f5f9" rx="8" />
    <path d="M 0,25 Q 40,5 80,25 T 160,25" fill="none" stroke="#cbd5e1" stroke-width="2" />
    ${noiseLines}
    ${noiseDots}
    ${textSvg}
  </svg>`;

  const captchaImage = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return { captchaId, captchaImage };
}

export function validateCaptcha(captchaId, userInput) {
  if (!captchaId || !userInput) return false;
  const record = captchaStore.get(captchaId);
  if (!record) return false;

  // Single-use challenge: delete immediately upon validation check
  captchaStore.delete(captchaId);

  if (record.expiresAt < Date.now()) return false;
  return record.text.toUpperCase() === userInput.trim().toUpperCase();
}

export function validateCaptchaToken(captchaId, userInput) {
  if (!captchaId || !userInput) {
    return { valid: false, error: 'Please solve the CAPTCHA security challenge' };
  }
  const record = captchaStore.get(captchaId);
  if (!record) {
    return { valid: false, error: 'Invalid or expired CAPTCHA challenge. Please refresh and try again.' };
  }

  // Single-use challenge: delete immediately upon validation check
  captchaStore.delete(captchaId);

  if (record.expiresAt < Date.now()) {
    return { valid: false, error: 'CAPTCHA has expired. Please refresh and try again.' };
  }

  const matches = record.text.toUpperCase() === userInput.trim().toUpperCase();
  if (!matches) {
    return { valid: false, error: 'Invalid CAPTCHA. Please try again.' };
  }

  // Generate single-use validation token valid for 60 seconds
  const captchaToken = `captok_${crypto.randomUUID()}`;
  const expiresAt = Date.now() + 60 * 1000;
  validatedTokensStore.set(captchaToken, { expiresAt });

  return { valid: true, captchaToken };
}

export function consumeCaptchaToken(captchaToken) {
  if (!captchaToken) return false;
  const record = validatedTokensStore.get(captchaToken);
  if (!record) return false;

  // Single-use token: delete immediately
  validatedTokensStore.delete(captchaToken);

  if (record.expiresAt < Date.now()) return false;
  return true;
}
