import { createClerkClient } from '@clerk/backend';

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-Webhook-Secret') !== env.GHL_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let email, contactId, firstName;
  try {
    const body = await request.json();
    email = body.email?.toLowerCase().trim();
    contactId = body.id;
    firstName = body.firstName || body.first_name || '';
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
  try {

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
  const escHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const greeting = firstName ? `Hi ${escHtml(firstName)}` : 'Hi there';

  // Send access email directly via GHL conversations API
  if (contactId && env.GHL_API_KEY) {
    const emailHtml = `
      <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;background:#0f0a1e;color:#ffffff;padding:40px 32px;border-radius:8px;">
        <div style="margin-bottom:24px;">
          <span style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:900;letter-spacing:.08em;color:#ffffff;">AI HUSTLE</span>
          <span style="background:#f5a623;color:#2d0f5e;font-size:10px;font-weight:700;letter-spacing:.12em;padding:2px 8px;border-radius:4px;margin-left:6px;vertical-align:middle;">STARTER PACK</span>
        </div>
        <h1 style="font-size:24px;font-weight:700;margin:0 0 16px;">Your lessons are ready 🎉</h1>
        <p style="color:#ccc;margin:0 0 24px;">${greeting}, your AI HustleStarter access is live. Click below to get in — the link signs you in automatically.</p>
        <a href="${accessUrl}" style="display:inline-block;background:#f5a623;color:#2d0f5e;font-weight:700;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:16px;">Access My Lessons →</a>
        <p style="color:#888;font-size:13px;margin:32px 0 0;">Link expires in 24 hours. After that, sign in at <a href="https://aihustlestarter.com/sign-in" style="color:#f5a623;">aihustlestarter.com/sign-in</a> with this email address.</p>
      </div>
    `;

    const emailRes = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'Email',
        contactId,
        locationId: 'k5gAHEPJ0s1fTINnarq1',
        subject: 'Your AI HustleStarter lessons are ready',
        html: emailHtml,
        emailFrom: 'hello@mg.aihustlestarter.com',
        emailTo: email,
      }),
    });
    const emailResult = await emailRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ accessUrl, emailStatus: emailRes.status, emailResult }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ accessUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
