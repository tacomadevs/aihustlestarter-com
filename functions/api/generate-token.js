import { createMagicLinkToken } from '../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-Webhook-Secret') !== env.GHL_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let email, contactId;
  try {
    const body = await request.json();
    email = body.email?.toLowerCase().trim();
    contactId = body.id;
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

  const token = await createMagicLinkToken(email, env.LESSON_JWT_SECRET);
  const accessUrl = `https://aihustlestarter.com/lessons/access?token=${encodeURIComponent(token)}`;

  // Write magic link directly to GHL contact so email can use {{contact.lesson_access_url}}
  if (contactId && env.GHL_API_KEY) {
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customFields: [{ id: '5mff8UprF49uJHpZ8edN', field_value: accessUrl }],
      }),
    });
  }

  return new Response(JSON.stringify({ accessUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
