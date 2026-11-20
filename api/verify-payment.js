// POST /api/verify-payment  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
import { handle, json, getUser, sb, env, hmacHex, safeEqual, enroll, HttpError } from './_lib.js';

export const POST = handle(async (request) => {
  const user = await getUser(request);
  const b = await request.json().catch(() => ({}));
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = b;
  if (!oid || !pid || !sig) throw new HttpError(400, 'Missing payment details.');

  const expected = hmacHex(env('RAZORPAY_KEY_SECRET'), `${oid}|${pid}`);
  if (!safeEqual(expected, sig)) throw new HttpError(400, 'Payment could not be verified.');

  const [order] = await sb(`orders?id=eq.${encodeURIComponent(oid)}&select=id,user_id,course_id,amount`);
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.user_id !== user.id) throw new HttpError(403, 'This payment belongs to another account.');

  await enroll({ user_id: order.user_id, course_id: order.course_id, payment_id: pid, amount: order.amount });
  await sb(`orders?id=eq.${encodeURIComponent(oid)}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'paid', payment_id: pid } });
  return json(200, { ok: true, course_id: order.course_id });
});
