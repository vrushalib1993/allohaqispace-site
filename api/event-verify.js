// POST /api/event-verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
import { handle, json, sb, env, hmacHex, safeEqual, HttpError } from './_lib.js';

export async function markEventPaid(oid, pid) {
  const rows = await sb(`event_bookings?razorpay_order_id=eq.${encodeURIComponent(oid)}&status=eq.pending`, {
    method: 'PATCH', prefer: 'return=representation', body: { status: 'paid', payment_id: pid } });
  if (rows.length) return rows[0];
  const [existing] = await sb(`event_bookings?razorpay_order_id=eq.${encodeURIComponent(oid)}&select=id,status`);
  return existing || null;
}

export const POST = handle(async (request) => {
  const b = await request.json().catch(() => ({}));
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = b;
  if (!oid || !pid || !sig) throw new HttpError(400, 'Missing payment details.');
  if (!safeEqual(hmacHex(env('RAZORPAY_KEY_SECRET'), `${oid}|${pid}`), sig)) throw new HttpError(400, 'Payment could not be verified.');
  const row = await markEventPaid(oid, pid);
  if (!row) throw new HttpError(404, 'Booking not found.');
  return json(200, { ok: true, booking_id: row.id });
});
