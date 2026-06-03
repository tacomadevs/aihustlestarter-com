import { verifyToken } from '../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) return Response.redirect(new URL('/upgrade', request.url), 302);

  const payload = await verifyToken(token, env.LESSON_JWT_SECRET);
  if (!payload) return Response.redirect(new URL('/upgrade', request.url), 302);

  const expires = new Date(payload.expiry).toUTCString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/lessons',
      'Set-Cookie': `lesson_access=${encodeURIComponent(token)}; Path=/lessons; HttpOnly; Secure; SameSite=Lax; Expires=${expires}`,
    },
  });
}
