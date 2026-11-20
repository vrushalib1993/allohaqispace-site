// POST /api/subscribe  { email, name, source, company (honeypot), t (ms since form shown) }
// Saves the subscriber in Supabase and adds them to Resend (segment), then sends a welcome email.
import { handle, json, sb, HttpError } from './_lib.js';

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function resend(path, body) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { skipped: true };
  const r = await fetch('https://api.resend.com/' + path, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, text };
}

export const POST = handle(async (request) => {
  const b = await request.json().catch(() => ({}));
  // Bots: hidden field filled in, or form submitted impossibly fast. Pretend success.
  if (b.company || (Number(b.t) > 0 && Number(b.t) < 1500)) return json(200, { ok: true });
  const email = clean(b.email, 200).toLowerCase(), name = clean(b.name, 80), source = clean(b.source, 40) || 'website';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');

  const existing = await sb(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=id,status`);
  const isNew = !existing.length;
  if (isNew) await sb('newsletter_subscribers', { method: 'POST', prefer: 'return=minimal', body: { email, name, source } });
  else if (existing[0].status !== 'subscribed') await sb(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'subscribed' } });

  // Resend: create/refresh the contact, then add to the newsletter segment.
  let synced = false;
  try {
    const c = await resend('contacts', { email, first_name: name.split(' ')[0] || undefined, unsubscribed: false });
    if (!c.skipped) {
      synced = c.ok || c.status === 409 || /already exists/i.test(c.text);
      if (process.env.RESEND_SEGMENT_ID) {
        const s = await resend(`contacts/${encodeURIComponent(email)}/segments/${process.env.RESEND_SEGMENT_ID}`);
        synced = synced && (s.ok || /already/i.test(s.text));
      }
      if (!c.ok && !synced) console.error('Resend contact error', c.status, c.text);
    }
  } catch (e) { console.error('Resend error', e); }
  if (synced) await sb(`newsletter_subscribers?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', prefer: 'return=minimal', body: { resend_synced: true } });

  // Welcome email (only for new subscribers, only once a sending domain is set up).
  if (isNew && process.env.RESEND_FROM) {
    const hi = name ? `Hi ${esc(name.split(' ')[0])},` : 'Hi,';
    const site = (process.env.SITE_URL || 'https://allohaqispace.com').replace(/\/$/, '');
    const w = await resend('emails', {
      from: process.env.RESEND_FROM, to: [email], reply_to: process.env.RESEND_REPLY_TO || undefined,
      subject: 'Welcome to Alloha Qi Space: your first practice',
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#132739;max-width:560px">
        <p>${hi}</p><p>Thank you for joining. Once or twice a month I’ll send you short Qi Gong practices, seasonal routines and simple ideas for a calmer body and a clearer mind.</p>
        <p><b>Try this today (2 minutes):</b> sit comfortably, let your shoulders soften, and slowly let your awareness expand to fill the room around you. Rest there for three breaths, then gently bring your awareness back inside your body.</p>
        <p>You can also try the guided version on the website: <a href="${site}/#try">${site.replace('https://', '')}/#try</a></p>
        <p>Warmly,<br>Rikhil Bithar<br>Alloha Qi Space, Kalyani Nagar, Pune</p>
        <p style="font-size:13px;color:#5b6b7b">You’re receiving this because you signed up on our website. Every newsletter has an unsubscribe link.</p></div>`,
    });
    if (!w.ok && !w.skipped) console.error('Resend welcome error', w.status, w.text);
  }
  return json(200, { ok: true, already: !isNew });
});
