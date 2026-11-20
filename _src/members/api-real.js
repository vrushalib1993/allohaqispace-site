// Live data layer: Supabase + Razorpay. Same interface as api-demo.js.
import { createClient } from '@supabase/supabase-js';

export function realApi(cfg) {
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const media = sb.storage.from('course-media');
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  let profileCache = null;

  const api = {
    demo: false,
    async session() { return (await sb.auth.getSession()).data.session; },
    async user() { return (await api.session())?.user || null; },
    onAuth(cb) { sb.auth.onAuthStateChange((evt, s) => cb(evt, s)); },
    async profile() {
      const u = await api.user(); if (!u) return null;
      if (profileCache?.id === u.id) return profileCache;
      profileCache = ok(await sb.from('profiles').select('*').eq('id', u.id).maybeSingle()) || { id: u.id, email: u.email, full_name: '' };
      return profileCache;
    },
    async saveProfile(p) { const u = await api.user(); profileCache = null; ok(await sb.from('profiles').update({ full_name: p.full_name, phone: p.phone || '' }).eq('id', u.id)); },
    async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
    async signUp(email, password, full_name) {
      const d = ok(await sb.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: location.origin + '/account/' } }));
      return { needsConfirm: !d.session };
    },
    async magic(email, next) { ok(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + (next || '/account/') } })); },
    async reset(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/account/?reset=1' })); },
    async setPassword(password) { ok(await sb.auth.updateUser({ password })); },
    async signOut() { profileCache = null; await sb.auth.signOut(); },

    async courses() { return ok(await sb.from('courses').select('id,slug,title,subtitle,cover_url,price,level,duration_text,position,published').eq('published', true).order('position')); },
    async course(slug) { return ok(await sb.from('courses').select('*').eq('slug', slug).maybeSingle()); },
    async outline(courseId) { return ok(await sb.from('lesson_outline').select('*').eq('course_id', courseId).order('position')); },
    async outlineCounts() { const rows = ok(await sb.from('lesson_outline').select('course_id')); return rows.reduce((m, r) => (m[r.course_id] = (m[r.course_id] || 0) + 1, m), {}); },
    async lessons(courseId) { return ok(await sb.from('lessons').select('*').eq('course_id', courseId).order('position')); },
    async enrollments() { const u = await api.user(); if (!u) return []; return ok(await sb.from('enrollments').select('course_id,created_at,source').eq('user_id', u.id)); },
    async enrollFree(courseId) { const u = await api.user(); ok(await sb.from('enrollments').insert({ user_id: u.id, course_id: courseId, source: 'free' })); },
    async progress() { const u = await api.user(); if (!u) return []; return ok(await sb.from('progress').select('lesson_id').eq('user_id', u.id)).map(r => r.lesson_id); },
    async complete(lessonId, done = true) {
      const u = await api.user();
      if (done) ok(await sb.from('progress').upsert({ user_id: u.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }));
      else ok(await sb.from('progress').delete().eq('user_id', u.id).eq('lesson_id', lessonId));
    },
    async mediaUrl(path) { return ok(await media.createSignedUrl(path, 60 * 60 * 3)).signedUrl; },

    async buy(course, onStatus) {
      const s = await api.session();
      const call = async (url, body) => {
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${s.access_token}` }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Payment service is unavailable. Please try again.'); return d;
      };
      const order = await call('/api/create-order', { course_id: course.id });
      if (order.already_enrolled) return true;
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
          name: 'Alloha Qi Space', description: order.course_title, image: location.origin + '/assets/icon-192.png',
          prefill: { email: order.email, name: order.name }, theme: { color: '#18334C' },
          handler: async (resp) => { try { onStatus?.('Confirming your payment…'); await call('/api/verify-payment', resp); resolve(true); } catch (e) { reject(e); } },
          modal: { ondismiss: () => resolve(false) },
        });
        rzp.on('payment.failed', (r) => reject(new Error(r.error?.description || 'Payment failed. No money was taken.')));
        rzp.open();
      });
    },

    // ---- admin ----
    async adminLessons(courseId) { return api.lessons(courseId); },
    async adminCourses() { return ok(await sb.from('courses').select('*').order('position')); },
    async saveCourse(c) { const row = { ...c }; if (!row.id) delete row.id; return ok(await sb.from('courses').upsert(row).select().single()); },
    async deleteCourse(id) { ok(await sb.from('courses').delete().eq('id', id)); },
    async saveLesson(l) { const row = { ...l }; if (!row.id) delete row.id; return ok(await sb.from('lessons').upsert(row).select().single()); },
    async deleteLesson(id) { ok(await sb.from('lessons').delete().eq('id', id)); },
    async upload(courseId, file) {
      const path = `${courseId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '-')}`;
      ok(await media.upload(path, file, { upsert: false, contentType: file.type })); return path;
    },
    async uploadCover(file) {
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, '-')}`;
      const b = sb.storage.from('course-covers'); ok(await b.upload(path, file, { contentType: file.type }));
      return b.getPublicUrl(path).data.publicUrl;
    },
    async members(courseId) {
      const en = ok(await sb.from('enrollments').select('user_id,source,created_at,amount').eq('course_id', courseId).order('created_at', { ascending: false }));
      if (!en.length) return [];
      const ps = ok(await sb.from('profiles').select('id,email,full_name').in('id', en.map(e => e.user_id)));
      return en.map(e => ({ ...e, ...(ps.find(p => p.id === e.user_id) || {}) }));
    },
    async grant(email, courseId) {
      const p = ok(await sb.from('profiles').select('id').ilike('email', email.trim()).maybeSingle());
      if (!p) throw new Error('No member with that email yet. Ask them to create an account first.');
      ok(await sb.from('enrollments').upsert({ user_id: p.id, course_id: courseId, source: 'admin' }, { onConflict: 'user_id,course_id', ignoreDuplicates: true }));
    },
    // ---- events (admin) ----
    async adminEvents() { return ok(await sb.from('events').select('*').order('start_at', { ascending: false })); },
    async saveEvent(e) { const row = { ...e }; if (!row.id) delete row.id; return ok(await sb.from('events').upsert(row).select().single()); },
    async deleteEvent(id) { ok(await sb.from('events').delete().eq('id', id)); },
    async eventBookings(eventId) { return ok(await sb.from('event_bookings').select('*').eq('event_id', eventId).order('created_at', { ascending: false })); },
    async addBooking(b) { ok(await sb.from('event_bookings').insert({ ...b, status: 'manual' })); },
    async setBookingStatus(id, status) { ok(await sb.from('event_bookings').update({ status }).eq('id', id)); },
    async revoke(userId, courseId) { ok(await sb.from('enrollments').delete().eq('user_id', userId).eq('course_id', courseId)); },
  };
  return api;
}

export function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load the payment window. Check your connection.'));
    document.head.appendChild(s);
  });
}
