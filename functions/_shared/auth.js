const SEP = '|';

async function computeHmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createToken(email, secret) {
  const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const payload = `${email.toLowerCase()}${SEP}${expiry}`;
  const hmac = await computeHmac(secret, payload);
  return btoa(`${payload}${SEP}${hmac}`);
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
