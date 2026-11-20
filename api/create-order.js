// POST /api/create-order  { course_id }  (Authorization: Bearer <member access token>)
import { handle, json, getUser, sb, razorpay, env, HttpError } from './_lib.js';

export const POST = handle(async (request) => {
  const user = await getUser(request);
  const { course_id } = await request.json().catch(() => ({}));
  if (!course_id || !/^[0-9a-f-]{36}$/i.test(course_id)) throw new HttpError(400, 'Unknown course.');

  const [course] = await sb(`courses?id=eq.${course_id}&select=id,title,price,published`);
  if (!course || !course.published) throw new HttpError(404, 'This course is not available.');
  if (!course.price) throw new HttpError(400, 'This course is free. Use "Enrol free" instead.');

  const existing = await sb(`enrollments?user_id=eq.${user.id}&course_id=eq.${course_id}&select=course_id`);
  if (existing.length) return json(200, { already_enrolled: true });

  const amount = course.price * 100; // paise, always taken from the database
  const order = await razorpay('orders', {
    amount, currency: 'INR',
    receipt: `c_${course_id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
    notes: { user_id: user.id, course_id, email: user.email || '' },
  });
  await sb('orders', { method: 'POST', prefer: 'return=minimal',
    body: { id: order.id, user_id: user.id, course_id, amount: course.price, status: 'created' } });

  return json(200, { order_id: order.id, amount, currency: 'INR', key_id: env('RAZORPAY_KEY_ID'),
    course_title: course.title, email: user.email || '', name: user.user_metadata?.full_name || '' });
});
