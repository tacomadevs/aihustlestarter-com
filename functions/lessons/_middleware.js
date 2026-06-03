import { createClerkClient } from '@clerk/backend';

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);

  // Let the sign-in handler through unauthenticated
  if (url.pathname === '/lessons/access') return next();

  const clerk = createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  });

  try {
    const requestState = await clerk.authenticateRequest(request, {
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });
    if (requestState.isSignedIn) return next();
  } catch {}

  return Response.redirect(new URL('/sign-in', request.url), 302);
}
