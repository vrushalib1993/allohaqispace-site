// Preview mode: same interface as api-real.js, sample data in this browser tab only.
const KEY = 'aqs-demo-db';
const uid = () => crypto.randomUUID();
const C1 = 'd0000000-0000-4000-8000-000000000001', C2 = 'd0000000-0000-4000-8000-000000000002';

function seed() {
  return {
    user: null,
    profile: { id: 'demo-user', email: 'you@example.com', full_name: 'Demo Member', phone: '', is_admin: true },
    courses: [
      { id: C1, slug: 'start-here', title: 'Start Here: Foundations of Zhineng Qigong', subtitle: 'A free 3-lesson introduction to the core ideas and your first practice.',
        description: '**Sample course for preview.** In this short course you learn what Zhineng Qigong is, how to prepare your body and mind, and the first movements of the foundational practice.\n\n- Understand Qi and the open system\n- Learn the opening posture\n- Build a 10-minute daily routine',
        cover_url: 'https://images.unsplash.com/photo-1773204989457-57809a3cda73?auto=format&fit=crop&q=70&w=1200&h=750', price: 0, level: 'Beginner', duration_text: '45 minutes', published: true, position: 1 },
      { id: C2, slug: 'neck-spine-care', title: 'Neck & Spine Care Programme', subtitle: 'A 4-week guided programme to release tension and support posture.',
        description: '**Sample course for preview.** Week by week, Rikhil guides you through the six-step neck sequence with clear video demonstrations and daily audio practices.',
        cover_url: 'https://images.unsplash.com/photo-1679076897714-f2b3ccc59399?auto=format&fit=crop&q=70&w=1200&h=750', price: 2499, level: 'All levels', duration_text: '4 weeks', published: true, position: 2 },
    ],
    lessons: [
      { id: uid(), course_id: C1, section: 'Getting started', title: 'Welcome and what to expect', position: 1, is_preview: true, duration_text: '5 min', body: 'Welcome! This sample lesson shows how a lesson with a video and written notes looks.\n\n## Before you begin\n- Wear comfortable clothes\n- Find a quiet space\n- Practise before meals', video_url: 'https://www.youtube.com/watch?v=DCJgmAhAYRA', video_path: '', audio_path: '' },
      { id: uid(), course_id: C1, section: 'Getting started', title: 'Understanding Qi and the open system', position: 2, is_preview: false, duration_text: '10 min', body: 'Zhineng Qigong teaches us to interact with the Qi that exists all around us. In this lesson you learn the idea of an **open system**.', video_url: '', video_path: '', audio_path: '' },
      { id: uid(), course_id: C1, section: 'Your first practice', title: 'The opening posture', position: 3, is_preview: false, duration_text: '15 min', body: 'Stand with feet parallel, knees soft, and let the shoulders relax. Follow the steps slowly.', video_url: '', video_path: '', audio_path: '' },
      { id: uid(), course_id: C2, section: 'Week 1: Release', title: 'Why the neck holds tension', position: 1, is_preview: true, duration_text: '8 min', body: 'A free preview lesson. Learn how posture, screens and stress affect the neck.', video_url: '', video_path: '', audio_path: '' },
      { id: uid(), course_id: C2, section: 'Week 1: Release', title: 'The six-step sequence, slowly', position: 2, is_preview: false, duration_text: '20 min', body: 'Paid lesson content.', video_url: '', video_path: '', audio_path: '' },
      { id: uid(), course_id: C2, section: 'Week 2: Mobility', title: 'Daily 10-minute routine', position: 3, is_preview: false, duration_text: '10 min', body: 'Paid lesson content.', video_url: '', video_path: '', audio_path: '' },
    ],
    enrollments: [], progress: [], members: {},
    events: [{ id: uid(), slug: 'full-moon-healing-circle', title: 'Full Moon Healing Circle', subtitle: 'An evening of group Qi Gong and guided healing practice.', summary: 'Sample event for preview.',
      description: 'Sample event description.', start_at: new Date(Date.now() + 12 * 864e5).toISOString(), end_at: new Date(Date.now() + 12 * 864e5 + 2 * 36e5).toISOString(), mode: 'in-person',
      venue: 'Alloha Qi Space, Kalyani Nagar, Pune', price: 1200, capacity: 20, max_per_booking: 4, cover_url: '', highlights: 'Group Qi Gong\nGuided healing practice', payment_link: '', booking_open: true, published: true }],
    bookings: [],
  };
}

export function demoApi() {
  let db; try { db = JSON.parse(sessionStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
  if (!db.events) { db.events = seed().events; db.bookings = []; }
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(db));
  const wait = (ms = 150) => new Promise(r => setTimeout(r, ms));
  const pub = (id) => db.courses.find(c => c.id === id)?.published;
  const enrolled = (cid) => db.user && db.enrollments.some(e => e.course_id === cid);
  const cbs = [];
  const fire = (evt) => cbs.forEach(cb => cb(evt, db.user ? { user: db.user } : null));

  const api = {
    demo: true,
    async session() { return db.user ? { user: db.user, access_token: 'demo' } : null; },
    async user() { return db.user; },
    onAuth(cb) { cbs.push(cb); },
    async profile() { return db.user ? db.profile : null; },
    async saveProfile(p) { Object.assign(db.profile, p); save(); },
    async signIn(email) { await wait(); db.user = { id: 'demo-user', email }; db.profile.email = email; save(); fire('SIGNED_IN'); },
    async signUp(email, pw, full_name) { await api.signIn(email); db.profile.full_name = full_name; save(); return { needsConfirm: false }; },
    async magic() { await wait(); },
    async reset() { await wait(); },
    async setPassword() { await wait(); },
    async signOut() { db.user = null; save(); fire('SIGNED_OUT'); },
    async courses() { await wait(); return db.courses.filter(c => c.published).sort((a, b) => a.position - b.position); },
    async course(slug) { await wait(); return db.courses.find(c => c.slug === slug && (c.published || db.user)) || null; },
    async outline(cid) { return db.lessons.filter(l => l.course_id === cid && pub(cid)).sort((a, b) => a.position - b.position)
      .map(({ body, video_path, video_url, audio_path, ...l }) => ({ ...l, has_video: !!(video_path || video_url), has_audio: !!audio_path })); },
    async outlineCounts() { return db.lessons.reduce((m, l) => (m[l.course_id] = (m[l.course_id] || 0) + 1, m), {}); },
    async lessons(cid) { return db.lessons.filter(l => l.course_id === cid && (l.is_preview || enrolled(cid) || db.user)).filter(l => l.is_preview || enrolled(cid)).sort((a, b) => a.position - b.position); },
    async enrollments() { return db.user ? db.enrollments : []; },
    async enrollFree(cid) { await wait(); if (!db.enrollments.some(e => e.course_id === cid)) db.enrollments.push({ course_id: cid, created_at: new Date().toISOString(), source: 'free' }); save(); },
    async progress() { return db.user ? db.progress : []; },
    async complete(id, done = true) { db.progress = db.progress.filter(x => x !== id); if (done) db.progress.push(id); save(); },
    async mediaUrl() { return ''; },
    async buy(course, onStatus) {
      if (!confirm(`Preview mode: simulate paying ₹${course.price.toLocaleString('en-IN')} for "${course.title}"?\n\nIn the live site this opens Razorpay checkout (UPI, cards, netbanking).`)) return false;
      onStatus?.('Confirming your payment…'); await wait(700);
      db.enrollments.push({ course_id: course.id, created_at: new Date().toISOString(), source: 'razorpay' }); save(); return true;
    },
    async adminCourses() { return [...db.courses].sort((a, b) => a.position - b.position); },
    async saveCourse(c) { await wait(); if (!c.id) c.id = uid(); const i = db.courses.findIndex(x => x.id === c.id); i < 0 ? db.courses.push({ ...c }) : (db.courses[i] = { ...db.courses[i], ...c }); save(); return db.courses.find(x => x.id === c.id); },
    async deleteCourse(id) { db.courses = db.courses.filter(c => c.id !== id); db.lessons = db.lessons.filter(l => l.course_id !== id); save(); },
    async adminLessons(cid) { return db.lessons.filter(l => l.course_id === cid).sort((a, b) => a.position - b.position); },
    async saveLesson(l) { await wait(); if (!l.id) l.id = uid(); const i = db.lessons.findIndex(x => x.id === l.id); i < 0 ? db.lessons.push({ ...l }) : (db.lessons[i] = { ...db.lessons[i], ...l }); save(); return db.lessons.find(x => x.id === l.id); },
    async deleteLesson(id) { db.lessons = db.lessons.filter(l => l.id !== id); save(); },
    async upload(cid, file) { await wait(400); return `${cid}/${file.name}`; },
    async uploadCover() { await wait(400); return db.courses[0].cover_url; },
    async members(cid) { return db.enrollments.filter(e => e.course_id === cid).map(e => ({ ...e, user_id: 'demo-user', email: db.profile.email, full_name: db.profile.full_name })); },
    async grant(email, cid) { await wait(); if (!db.enrollments.some(e => e.course_id === cid)) db.enrollments.push({ course_id: cid, created_at: new Date().toISOString(), source: 'admin' }); save(); },
    async revoke(u, cid) { db.enrollments = db.enrollments.filter(e => e.course_id !== cid); save(); },
    async adminEvents() { return [...db.events].sort((a, b) => b.start_at.localeCompare(a.start_at)); },
    async saveEvent(e) { await wait(); if (!e.id) e.id = uid(); const i = db.events.findIndex(x => x.id === e.id); i < 0 ? db.events.push({ ...e }) : (db.events[i] = { ...db.events[i], ...e }); save(); return db.events.find(x => x.id === e.id); },
    async deleteEvent(id) { db.events = db.events.filter(e => e.id !== id); save(); },
    async eventBookings(id) { return db.bookings.filter(b => b.event_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addBooking(b) { db.bookings.push({ id: uid(), created_at: new Date().toISOString(), ...b, status: 'manual' }); save(); },
    async setBookingStatus(id, status) { const b = db.bookings.find(x => x.id === id); if (b) b.status = status; save(); },
    async subscribers() { return db.subs || (db.subs = [{ id: uid(), email: 'priya@example.com', name: 'Priya', source: 'home', status: 'subscribed', resend_synced: true, created_at: new Date().toISOString() }, { id: uid(), email: 'ravi@example.com', name: '', source: 'home', status: 'subscribed', resend_synced: true, created_at: new Date(Date.now() - 864e5 * 9).toISOString() }]); },
    async setSubscriberStatus(id, status) { const x = (db.subs || []).find(s => s.id === id); if (x) x.status = status; save(); },
    async stories() { return db.stories || (db.stories = [{ id: uid(), age_range: '50s', gender: 'Woman', location: 'Pune', area: 'Neck & back', practice: 'Sample story for preview', duration: '3 months', before_text: 'Sample text.', after_text: 'Sample story shown in preview mode only. Real stories come from students through the share form.', quote: '', doctor_care: true, consent: true, contact: '', status: 'pending', position: 0, created_at: new Date().toISOString() }]); },
    async saveStory(x) { const s = (db.stories || []).find(y => y.id === x.id); Object.assign(s, x); save(); },
    async addStory(x) { (db.stories = db.stories || []).push({ id: uid(), created_at: new Date().toISOString(), ...x }); save(); },
    async deleteStory(id) { db.stories = (db.stories || []).filter(y => y.id !== id); save(); },
    resetDemo() { sessionStorage.removeItem(KEY); },
  };
  return api;
}
