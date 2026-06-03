import { createClerkClient } from '@clerk/backend';

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

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  // Find or create Clerk user
  let userId;
  const existing = await clerk.users.getUserList({ emailAddress: [email] });
  const users = existing?.data ?? existing;
  if (Array.isArray(users) && users.length > 0) {
    userId = users[0].id;
  } else {
    const user = await clerk.users.createUser({ emailAddress: [email] });
    userId = user.id;
  }

  // Create a 24-hour sign-in token
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 86400,
  });

  const accessUrl = `https://aihustlestarter.com/lessons/access?token=${signInToken.token}`;

  // Write access URL directly to GHL contact field
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
