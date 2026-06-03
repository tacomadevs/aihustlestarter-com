import { verifyToken, getAccessCookie } from '../_shared/auth.js';

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);

  // Let the token exchange endpoint through ungated
  if (url.pathname.startsWith('/lessons/access')) {
    return next();
  }

  const cookie = getAccessCookie(request.headers.get('Cookie'));
  if (cookie && await verifyToken(cookie, env.LESSON_JWT_SECRET)) {
    return next();
  }

  return Response.redirect(new URL('/upgrade', request.url), 302);
}
