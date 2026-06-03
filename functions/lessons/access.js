import { verifyToken, createSessionToken } from '../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) return Response.redirect(new URL('/upgrade', request.url), 302);

  // Validate the short-lived magic link token
  const payload = await verifyToken(token, env.LESSON_JWT_SECRET);
  if (!payload) return Response.redirect(new URL('/upgrade', request.url), 302);

  // Issue a fresh long-lived session cookie (1 year)
  const sessionToken = await createSessionToken(payload.email, env.LESSON_JWT_SECRET);
  const sessionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/lessons',
      'Set-Cookie': `lesson_access=${encodeURIComponent(sessionToken)}; Path=/lessons; HttpOnly; Secure; SameSite=Lax; Expires=${sessionExpiry}`,
      'Referrer-Policy': 'no-referrer',
    },
  });
}
