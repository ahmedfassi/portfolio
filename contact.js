// Vercel Serverless Function — /api/contact
// Sends the portfolio contact form via Resend, using a server-side API key.
// The key is NEVER exposed to the browser: it's read from an environment
// variable that you set in the Vercel dashboard (Project → Settings →
// Environment Variables → RESEND_API_KEY).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic email sanity check
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set in environment variables');
    return res.status(500).json({ error: 'Server is not configured to send email' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // "from" must be an address on a domain you've verified in Resend,
        // OR the sandbox address "onboarding@resend.dev" for testing.
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: ['ahmedfassi006@gmail.com'],
        reply_to: email,
        subject: `Portfolio contact from ${name}`,
        text: `${message}\n\n— ${name} (${email})`,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend API error:', errText);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
