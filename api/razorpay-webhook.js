// POST /api/razorpay-webhook — backup that grants access even if the buyer closes the tab.
// Razorpay Dashboard → Webhooks → URL https://<site>/api/razorpay-webhook, events: payment.captured, order.paid
import { handle, json, sb, env, hmacHex, safeEqual, enroll } from './_lib.js';

export const POST = handle(async (request) => {
  const raw = await request.text();
  const sig = request.headers.get('x-razorpay-signature') || '';
  if (!safeEqual(hmacHex(env('RAZORPAY_WEBHOOK_SECRET'), raw), sig)) return json(400, { error: 'bad signature' });

  const evt = JSON.parse(raw);
  const pay = evt.payload?.payment?.entity;
  const oid = pay?.order_id || evt.payload?.order?.entity?.id;
  if (!oid || !['payment.captured', 'order.paid'].includes(evt.event)) return json(200, { ignored: true });

  const [order] = await sb(`orders?id=eq.${encodeURIComponent(oid)}&select=id,user_id,course_id,amount`);
  if (!order) return json(200, { ignored: 'unknown order' });
  await enroll({ user_id: order.user_id, course_id: order.course_id, payment_id: pay?.id || '', amount: order.amount });
  await sb(`orders?id=eq.${encodeURIComponent(oid)}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'paid', payment_id: pay?.id || '' } });
  return json(200, { ok: true });
});
