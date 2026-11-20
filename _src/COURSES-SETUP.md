# Online courses: one-time setup

## 1. Supabase (accounts, course content, protected media)
1. Create a free project at supabase.com (region: Mumbai / ap-south-1).
2. SQL Editor → New query → paste `_src/supabase/schema.sql` → Run.
3. Authentication → URL Configuration: Site URL `https://allohaqispace.com`; add redirect URLs
   `https://allohaqispace.com/**` and `https://allohaqispace-site.vercel.app/**`.
4. Authentication → Emails → SMTP: connect a sender (Brevo / Resend free tier). Supabase's built-in
   email is limited to a few emails per hour and is for testing only.
5. Project Settings → API: copy **Project URL**, **anon public key** and **service_role key**.
6. Put Project URL + anon key in `assets/config.js` (safe to publish).
7. Sign up on the site at /login/, then run in SQL Editor:
   `update public.profiles set is_admin = true where email = 'your@email';`
   Now /admin/ lets you create courses and lessons.

## 2. Razorpay (paid courses)
1. Razorpay Dashboard → Account & Settings → API Keys → generate Live keys (Test keys first to try it).
2. Webhooks → Add: URL `https://allohaqispace.com/api/razorpay-webhook`, events `payment.captured` and
   `order.paid`, set a secret.

## 3. Vercel (server keys, never in the code)
Project → Settings → Environment Variables, then redeploy:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

## Media
- Audio and short videos: upload in /admin/ (Supabase free plan: 50 MB per file, 1 GB total).
- Long videos: upload to Vimeo (privacy: "Hide from Vimeo", domain-restricted embeds) or Bunny Stream
  and paste the link into the lesson. Only enrolled members can see the link.

## Preview
Add `?demo=1` to /courses/ to try everything with sample data. `?demo=0` exits.
