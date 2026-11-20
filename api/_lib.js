// Shared helpers for the payment functions (no dependencies).
import crypto from 'node:crypto';

export const env = (k) => {
  const v = process.env[k];
  if (!v) throw new HttpError(500, `Server not configured: missing ${k}`);
  return v;
};

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const json = (status, data) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export function handle(fn) {
  return async (request) => {
    try { return await fn(request); }
    catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return json(status, { error: e instanceof HttpError ? e.message : 'Something went wrong. Please try again.' });
    }
  };
}

// ----- Supabase (service role, bypasses RLS) -----
export async function sb(path, { method = 'GET', body, prefer } = {}) {
  const url = env('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + path;
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(url, {
    method,
    // New-style secret keys (sb_secret_…) go in the apikey header only; legacy service_role JWTs also as Bearer.
    headers: { apikey: key, ...(key.startsWith('sb_') ? {} : { authorization: `Bearer ${key}` }), 'content-type': 'application/json', ...(prefer ? { prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// Validate the member's session token and return the user.
export async function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new HttpError(401, 'Please log in first.');
  const res = await fetch(env('SUPABASE_URL').replace(/\/$/, '') + '/auth/v1/user', {
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new HttpError(401, 'Your session has expired. Please log in again.');
  return res.json();
}

// ----- Razorpay -----
export async function razorpay(path, body) {
  const auth = Buffer.from(`${env('RAZORPAY_KEY_ID')}:${env('RAZORPAY_KEY_SECRET')}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Razorpay ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
}

export function hmacHex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Grant access (idempotent).
export async function enroll({ user_id, course_id, payment_id, amount }) {
  await sb('enrollments?on_conflict=user_id,course_id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=minimal',
    body: { user_id, course_id, source: 'razorpay', payment_id, amount },
  });
}
