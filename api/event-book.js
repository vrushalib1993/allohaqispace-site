// POST /api/event-book  { event_id, name, email, phone, seats }  (no login needed)
// Free events: confirms immediately. Paid events: creates a Razorpay order; /api/event-verify confirms it.
import { handle, json, sb, razorpay, env, HttpError } from './_lib.js';

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export const POST = handle(async (request) => {
  const b = await request.json().catch(() => ({}));
  const event_id = String(b.event_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(event_id)) throw new HttpError(400, 'Unknown event.');
  const name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), phone = clean(b.phone, 30);
  const seats = Math.floor(Number(b.seats) || 0);
  if (!name) throw new HttpError(400, 'Enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) throw new HttpError(400, 'Enter a valid phone number.');

  const [ev] = await sb(`events?id=eq.${event_id}&select=id,title,price,capacity,max_per_booking,published,booking_open,end_at,payment_link`);
  if (!ev || !ev.published) throw new HttpError(404, 'This event is not available.');
  if (!ev.booking_open || new Date(ev.end_at) < new Date()) throw new HttpError(400, 'Bookings for this event are closed.');
  if (ev.payment_link) throw new HttpError(400, 'Please use the payment link on the event page.');
  if (seats < 1 || seats > ev.max_per_booking) throw new HttpError(400, `You can book 1 to ${ev.max_per_booking} seats at a time.`);
  if (ev.capacity) {
    const [s] = await sb(`event_seats?event_id=eq.${event_id}&select=booked`);
    const left = ev.capacity - (s?.booked || 0);
    if (left <= 0) throw new HttpError(409, 'Sorry, this event is sold out.');
    if (seats > left) throw new HttpError(409, `Only ${left} seat${left === 1 ? '' : 's'} left.`);
  }

  if (!ev.price) {
    const [row] = await sb('event_bookings', { method: 'POST', prefer: 'return=representation',
      body: { event_id, name, email, phone, seats, amount: 0, status: 'free' } });
    return json(200, { ok: true, free: true, booking_id: row.id });
  }

  const amount = ev.price * seats;
  const order = await razorpay('orders', { amount: amount * 100, currency: 'INR',
    receipt: `e_${event_id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
    notes: { kind: 'event', event_id, email, seats: String(seats) } });
  await sb('event_bookings', { method: 'POST', prefer: 'return=minimal',
    body: { event_id, name, email, phone, seats, amount, status: 'pending', razorpay_order_id: order.id } });
  return json(200, { order_id: order.id, amount: amount * 100, currency: 'INR', key_id: env('RAZORPAY_KEY_ID'), title: ev.title, name, email, phone });
});
