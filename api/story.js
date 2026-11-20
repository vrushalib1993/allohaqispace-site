// POST /api/story — a student shares their healing story. Saved as "pending" for Rikhil to review in /admin/.
import { handle, json, sb, HttpError } from './_lib.js';

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f<>]/g, ' ').trim().slice(0, n);
const AREAS = ['Neck & back', 'Stress & sleep', 'Energy & fatigue', 'Eyes', 'Recovery support', 'Emotional balance', 'Other'];

export const POST = handle(async (request) => {
  const b = await request.json().catch(() => ({}));
  if (b.company || (Number(b.t) > 0 && Number(b.t) < 3000)) return json(200, { ok: true });
  const row = {
    age_range: clean(b.age_range, 20), gender: clean(b.gender, 20), location: clean(b.location, 60),
    area: AREAS.includes(b.area) ? b.area : 'Other', practice: clean(b.practice, 200), duration: clean(b.duration, 60),
    before_text: clean(b.before_text, 2000), after_text: clean(b.after_text, 3000), doctor_care: !!b.doctor_care,
    consent: b.consent === true, contact: clean(b.contact, 120), status: 'pending',
  };
  if (!row.consent) throw new HttpError(400, 'Please tick the consent box so we can share your story.');
  if (row.after_text.length < 30) throw new HttpError(400, 'Please tell us a little more about what changed for you.');
  await sb('healing_stories', { method: 'POST', prefer: 'return=minimal', body: row });
  return json(200, { ok: true });
});
