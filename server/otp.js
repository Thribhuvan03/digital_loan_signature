const otpStore = new Map();
const rateLimitStore = new Map();

// Cleanup expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 60000);

export function createOtp(target, type = 'login') {
  const now = Date.now();
  const key = `${type}:${target.toLowerCase().trim()}`;

  // Check Rate Limit (30 seconds between requests)
  const lastSent = rateLimitStore.get(key);
  if (lastSent && now - lastSent < 30000) {
    const secondsLeft = Math.ceil((30000 - (now - lastSent)) / 1000);
    return { error: `Please wait ${secondsLeft} seconds before requesting a new OTP.` };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(key, {
    otp,
    expiresAt,
    attempts: 0
  });

  rateLimitStore.set(key, now);

  return { otp };
}

export function verifyOtp(target, type = 'login', inputCode = '') {
  const key = `${type}:${target.toLowerCase().trim()}`;
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, error: 'No OTP request found or OTP has expired. Please request a new OTP.' };
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(key);
    return { valid: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  record.attempts += 1;

  if (record.attempts > 3) {
    otpStore.delete(key);
    return { valid: false, error: 'Maximum incorrect attempts exceeded. Please request a new OTP.' };
  }

  if (record.otp !== inputCode.trim()) {
    return { valid: false, error: `Invalid OTP. ${3 - record.attempts} attempts remaining.` };
  }

  // Single-use: delete after successful verification
  otpStore.delete(key);
  return { valid: true };
}

export function clearOtp(target, type = 'login') {
  const key = `${type}:${target.toLowerCase().trim()}`;
  otpStore.delete(key);
  rateLimitStore.delete(key);
}
