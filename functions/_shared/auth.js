const SEP = '|';

async function computeHmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createTokenWithExpiry(email, secret, ttlMs) {
  const expiry = Date.now() + ttlMs;
  const payload = `${email.toLowerCase()}${SEP}${expiry}`;
  const hmac = await computeHmac(secret, payload);
  return btoa(`${payload}${SEP}${hmac}`);
}

// Short-lived token for magic link URLs — 15 minutes
export async function createMagicLinkToken(email, secret) {
  return createTokenWithExpiry(email, secret, 15 * 60 * 1000);
}

// Long-lived token for the session cookie — 1 year
export async function createSessionToken(email, secret) {
  return createTokenWithExpiry(email, secret, 365 * 24 * 60 * 60 * 1000);
}

export async function verifyToken(token, secret) {
  try {
    const decoded = atob(token);
    const parts = decoded.split(SEP);
    if (parts.length !== 3) return null;
    const [email, expiry, hmac] = parts;
    if (Date.now() > parseInt(expiry, 10)) return null;
    const expected = await computeHmac(secret, `${email}${SEP}${expiry}`);
    if (expected !== hmac) return null;
    return { email, expiry: parseInt(expiry, 10) };
  } catch {
    return null;
  }
}

export function getAccessCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)lesson_access=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
