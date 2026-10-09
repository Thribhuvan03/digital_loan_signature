/**
 * Utility helper to mask email address for UI privacy display
 * Example: lasyadev@gmail.com -> l*****g@gmail.com
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'm*****@gmail.com';
  }
  const [username, domain] = email.trim().split('@');
  if (username.length <= 2) {
    return `${username.charAt(0)}*****@${domain}`;
  }
  return `${username.charAt(0)}*****${username.charAt(username.length - 1)}@${domain}`;
}
