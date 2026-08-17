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

  // Escape user input before dropping it into HTML, so a message can't
  // inject markup/scripts into the email you read.
  const esc = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const safeName = esc(name);
  const safeEmail = esc(email);
  const safeMessage = esc(message).replace(/\n/g, '<br>');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Portfolio Contact</title></head>
<body style="margin:0;padding:0;background-color:#12141C;font-family:'Courier New',monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#12141C;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#181B26;border:1px solid #2A2E3C;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #2A2E3C;">
          <span style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#7F77DD;text-transform:uppercase;">&#9679; New Portfolio Contact</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#9A97B5;">Someone reached out through your portfolio contact form.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:10px 0;border-top:1px solid #2A2E3C;font-family:'Courier New',monospace;font-size:11px;color:#9A97B5;text-transform:uppercase;letter-spacing:1px;">Name</td></tr>
            <tr><td style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#E9E7F5;">${safeName}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #2A2E3C;font-family:'Courier New',monospace;font-size:11px;color:#9A97B5;text-transform:uppercase;letter-spacing:1px;">Email</td></tr>
            <tr><td style="padding:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;"><a href="mailto:${safeEmail}" style="color:#7F77DD;text-decoration:none;">${safeEmail}</a></td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #2A2E3C;font-family:'Courier New',monospace;font-size:11px;color:#9A97B5;text-transform:uppercase;letter-spacing:1px;">Message</td></tr>
            <tr><td style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#E9E7F5;line-height:1.6;">${safeMessage}</td></tr>
          </table>
          <a href="mailto:${safeEmail}" style="display:inline-block;background-color:#7F77DD;color:#12141C;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:6px;">Reply to ${safeName}</a>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #2A2E3C;">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;color:#9A97B5;">Sent from your portfolio contact form</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
        html,
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
