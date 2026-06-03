import { createToken } from '../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-Webhook-Secret') !== env.GHL_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let email;
  try {
    const body = await request.json();
    email = body.email?.toLowerCase().trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!email) {
    return new Response(JSON.stringify({ error: 'email required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await createToken(email, env.LESSON_JWT_SECRET);
  const accessUrl = `https://aihustlestarter.com/lessons/access?token=${encodeURIComponent(token)}`;

  return new Response(JSON.stringify({ accessUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
