# Deploying

1. **Regenerate your Resend API key first.** The one you pasted in chat should
   be treated as exposed — go to resend.com/api-keys, delete it, create a new
   one.

2. Push this folder to GitHub (or drag-and-drop deploy on vercel.com), then
   import it as a new Vercel project.

3. In Vercel: **Project → Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = your new Resend key
   (Apply to Production, Preview, and Development as needed.)

4. Redeploy. The form at `/#contact` posts to `/api/contact`, which sends the
   email server-side — the key never reaches the browser.

5. **Verify a sending domain** in Resend (resend.com/domains) if you want to
   send from your own address instead of the shared `onboarding@resend.dev`
   sandbox address — update the `from` field in `api/contact.js` once you do.
