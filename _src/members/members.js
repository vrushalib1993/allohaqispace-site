// Alloha Qi Space — member area (courses, login, account, lesson player, admin).
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { realApi } from './api-real.js';
import { demoApi } from './api-demo.js';

const CFG = window.AQS_CONFIG || {};
const qs = new URLSearchParams(location.search);
if (qs.has('demo')) qs.get('demo') === '0' ? sessionStorage.removeItem('aqs-demo') : sessionStorage.setItem('aqs-demo', '1');
const CONFIGURED = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const DEMO = sessionStorage.getItem('aqs-demo') === '1' || (!CONFIGURED && qs.has('demo'));
const api = DEMO ? demoApi() : CONFIGURED ? realApi(CFG) : null;

const app = document.getElementById('app');
const view = app?.dataset.view;
const WA = 'https://wa.me/919881192288?text=';

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => DOMPurify.sanitize(marked.parse(s || ''), { ADD_ATTR: ['target'] });
const price = (p) => (p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Free');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const toast = (m) => (window.toast ? window.toast(m) : alert(m));
const ICON = {
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
  audio: '<svg viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};
const lessonIcon = (l) => (l.has_video || l.video_url || l.video_path ? ICON.play : l.has_audio || l.audio_path ? ICON.audio : ICON.doc);
const go = (url) => { location.href = url; };
const loginUrl = (next) => `/login/?next=${encodeURIComponent(next || location.pathname + location.search)}`;
function busy(btn, on, label) { if (!btn) return; if (on) { btn.dataset.l = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${label || 'Please wait…'}`; } else { btn.disabled = false; btn.innerHTML = btn.dataset.l || btn.innerHTML; } }
function errBox(el, msg) { el.innerHTML = msg ? `<div class="m-err" role="alert">${esc(msg)}</div>` : ''; }
function embedUrl(u) {
  try {
    const x = new URL(u);
    if (/youtube\.com$|youtu\.be$/.test(x.hostname.replace('www.', ''))) {
      const id = x.hostname.includes('youtu.be') ? x.pathname.slice(1) : x.searchParams.get('v') || x.pathname.split('/').pop();
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }
    if (x.hostname.includes('vimeo.com') && !x.hostname.startsWith('player.')) return `https://player.vimeo.com/video/${x.pathname.split('/').filter(Boolean).pop()}`;
    return u;
  } catch { return ''; }
}
const sections = (list) => list.reduce((acc, l) => { const k = l.section || 'Lessons'; (acc.find(s => s.name === k) || acc[acc.push({ name: k, items: [] }) - 1]).items.push(l); return acc; }, []);

// ---------- not configured ----------
function notReady() {
  app.innerHTML = `<div class="m-wrap"><div class="m-empty"><h2>Online courses are coming soon</h2>
  <p>Rikhil is preparing guided Zhineng Qigong courses you can follow at home. Ask to be told when they open.</p>
  <a class="btn btn-cta" href="${WA}${encodeURIComponent("Hi Rikhil, please tell me when the online courses open.")}" target="_blank" rel="noopener">Notify me on WhatsApp</a></div></div>`;
}

// ---------- header login state (all member pages) ----------
async function headerState() {
  if (!api) return;
  const u = await api.user();
  $$('[data-member-link]').forEach(a => { a.textContent = u ? 'My courses' : 'Log in'; a.href = u ? '/account/' : '/login/'; });
  if (DEMO && !$('.m-demo')) {
    const b = document.createElement('div'); b.className = 'm-demo';
    b.innerHTML = 'Preview mode with sample data. Nothing is saved or charged. <a href="?demo=0">Exit preview</a>';
    document.body.prepend(b);
  }
}

// ---------- catalog ----------
async function viewCourses() {
  const [courses, enr, counts] = await Promise.all([api.courses(), api.enrollments(), api.outlineCounts()]);
  const mine = new Set(enr.map(e => e.course_id));
  if (!courses.length) return notReady();
  const card = (c) => `<a class="ccard reveal in" href="/course/?c=${encodeURIComponent(c.slug)}">
    <div class="ccover">${c.cover_url ? `<img src="${esc(c.cover_url)}" alt="" loading="lazy">` : '<div class="cph"></div>'}
      <span class="cprice ${c.price ? '' : 'free'}">${mine.has(c.id) ? 'Enrolled' : price(c.price)}</span></div>
    <div class="cbody"><div class="cmeta"><span>${esc(c.level || '')}</span>${counts[c.id] ? `<span>${counts[c.id]} lessons</span>` : ''}${c.duration_text ? `<span>${esc(c.duration_text)}</span>` : ''}</div>
      <h3>${esc(c.title)}</h3><p>${esc(c.subtitle || '')}</p>
      <span class="textlink">${mine.has(c.id) ? 'Continue learning' : c.price ? 'View course' : 'Start free'} →</span></div></a>`;
  const free = courses.filter(c => !c.price), paid = courses.filter(c => c.price);
  app.innerHTML = `<div class="m-wrap">
    <div class="filters" role="tablist"><button class="chip on" data-f="all">All courses</button><button class="chip" data-f="free">Free</button><button class="chip" data-f="paid">Paid</button></div>
    <div class="grid3" id="cgrid">${courses.map(card).join('')}</div></div>`;
  $$('.filters .chip', app).forEach(b => b.onclick = () => {
    $$('.filters .chip', app).forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f; $('#cgrid').innerHTML = (f === 'free' ? free : f === 'paid' ? paid : courses).map(card).join('');
  });
}

// ---------- course detail ----------
async function viewCourse() {
  const slug = qs.get('c');
  const course = slug && await api.course(slug);
  if (!course) { app.innerHTML = `<div class="m-wrap"><div class="m-empty"><h2>Course not found</h2><p>It may have moved or is not open yet.</p><a class="btn btn-cta" href="/courses/">See all courses</a></div></div>`; return; }
  document.title = `${course.title} | Alloha Qi Space`;
  const [outline, user, enr, done] = await Promise.all([api.outline(course.id), api.user(), api.enrollments(), api.progress()]);
  const enrolled = enr.some(e => e.course_id === course.id);
  const doneSet = new Set(done);
  const first = outline[0];
  const nextLesson = outline.find(l => !doneSet.has(l.id)) || first;
  const learnUrl = (l) => `/learn/?c=${encodeURIComponent(course.slug)}${l ? `&l=${l.id}` : ''}`;
  const pct = outline.length ? Math.round(outline.filter(l => doneSet.has(l.id)).length / outline.length * 100) : 0;

  let cta;
  if (enrolled) cta = `<a class="btn btn-cta btn-lg btn-block" href="${learnUrl(nextLesson)}">${pct ? 'Continue learning' : 'Start the course'}</a>
      <div class="m-prog"><i style="width:${pct}%"></i></div><p class="m-note">${pct}% complete</p>`;
  else if (!user) cta = `<a class="btn btn-cta btn-lg btn-block" href="${loginUrl(location.pathname + location.search + '&enrol=1')}">${course.price ? `Buy course · ${price(course.price)}` : 'Create free account & start'}</a>
      <p class="m-note">Already a member? <a href="${loginUrl()}">Log in</a></p>`;
  else cta = `<button class="btn btn-cta btn-lg btn-block" id="enrol">${course.price ? `Buy course · ${price(course.price)}` : 'Enrol free & start'}</button>
      ${course.price ? '<p class="m-note m-secure">' + ICON.lock + 'Secure payment by Razorpay · UPI, cards, netbanking</p>' : '<p class="m-note">Free for members. No payment needed.</p>'}`;

  const curriculum = sections(outline).map((s, i) => `<details class="m-sec" ${i < 2 ? 'open' : ''}><summary><b>${esc(s.name)}</b><span>${s.items.length} lesson${s.items.length > 1 ? 's' : ''}</span></summary><ol>
    ${s.items.map(l => {
      const open = enrolled || l.is_preview;
      return `<li class="${doneSet.has(l.id) ? 'done' : ''}">${open ? `<a href="${learnUrl(l)}">` : '<div>'}<span class="li-ic">${doneSet.has(l.id) ? ICON.check : lessonIcon(l)}</span><span class="li-t">${esc(l.title)}</span>
        ${l.is_preview && !enrolled ? '<span class="m-badge">Free preview</span>' : ''}<span class="li-d">${esc(l.duration_text || '')}</span>${open ? '' : `<span class="li-lock">${ICON.lock}</span>`}${open ? '</a>' : '</div>'}</li>`;
    }).join('')}</ol></details>`).join('') || '<p class="m-note">Lessons are being added. Check back soon.</p>';

  app.innerHTML = `
  <header class="phero has-photo m-chero">${course.cover_url ? `<div class="phero-bg"><img class="hero-photo loaded" src="${esc(course.cover_url)}" alt=""><div class="phero-veil"></div></div>` : ''}
   <div class="wrap"><div class="crumbs"><a href="/">Home</a> <span>/</span> <a href="/courses/">Courses</a> <span>/</span> <span>${esc(course.title)}</span></div>
   <div class="tags"><span class="tag">${course.price ? 'Paid course' : 'Free course'}</span>${course.level ? `<span class="tag">${esc(course.level)}</span>` : ''}</div>
   <h1>${esc(course.title)}</h1><p class="lead">${esc(course.subtitle || '')}</p>
   <div class="meta-row"><span>${outline.length} lessons</span>${course.duration_text ? `<span>·</span><span>${esc(course.duration_text)}</span>` : ''}<span>·</span><span>Taught by Rikhil Bithar</span></div></div></header>
  <section><div class="wrap layout m-clayout">
   <article><div class="prose">${md(course.description)}</div>
    <h2 class="m-h2">Course content</h2><div class="m-curr">${curriculum}</div></article>
   <aside class="aside"><div class="m-buy" id="buy"><div class="m-price">${price(course.price)}${course.price ? '<small>one-time payment, lifetime access</small>' : '<small>for members</small>'}</div>
    <div id="buyerr"></div>${cta}
    <ul class="m-inc"><li>${outline.length} guided lessons</li><li>Learn at your own pace</li><li>Watch on phone, tablet or computer</li><li>Questions? <a href="${WA}${encodeURIComponent(`Hi Rikhil, I have a question about the course "${course.title}".`)}" target="_blank" rel="noopener">Ask Rikhil</a></li></ul></div></aside>
  </div></section>`;

  const btn = $('#enrol');
  const doEnrol = async () => {
    errBox($('#buyerr'), '');
    busy(btn, true, course.price ? 'Opening secure checkout…' : 'Enrolling…');
    try {
      if (course.price) { const paid = await api.buy(course, (m) => busy(btn, true, m)); if (!paid) return busy(btn, false); }
      else await api.enrollFree(course.id);
      go(learnUrl(first));
    } catch (e) { busy(btn, false); errBox($('#buyerr'), e.message); }
  };
  if (btn) { btn.onclick = doEnrol; if (qs.get('enrol') === '1' && !course.price) doEnrol(); }
}

// ---------- login ----------
async function viewLogin() {
  const next = qs.get('next') || '/account/';
  if (await api.user()) return go(next);
  const mode = qs.get('mode') === 'signup' || next.includes('enrol=1') ? 'signup' : 'signin';
  app.innerHTML = `<div class="m-auth"><div class="m-card">
    <div class="m-tabs" role="tablist"><button data-m="signin">Log in</button><button data-m="signup">Create account</button></div>
    <form id="f" novalidate>
      <div class="field su"><label for="nm">Your name</label><input id="nm" autocomplete="name" placeholder="Priya Sharma"></div>
      <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="email" required placeholder="name@example.com"></div>
      <div class="field pw"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters"></div>
      <div id="msg"></div>
      <button class="btn btn-cta btn-lg btn-block" id="go" type="submit">Log in</button>
      <div class="m-alt"><button type="button" class="linkbtn" id="magic">Email me a login link instead</button><button type="button" class="linkbtn si" id="forgot">Forgot password?</button></div>
    </form></div>
    <p class="m-note">By creating an account you agree to our <a href="/terms-of-service/">terms</a> and <a href="/privacy-policy-2/">privacy policy</a>.</p></div>`;
  let m = mode;
  const set = (x) => { m = x; $$('.m-tabs button').forEach(b => b.classList.toggle('on', b.dataset.m === x)); $$('.su').forEach(e => e.hidden = x !== 'signup'); $$('.si').forEach(e => e.hidden = x !== 'signin');
    $('#go').textContent = x === 'signup' ? 'Create account' : 'Log in'; $('#pw').autocomplete = x === 'signup' ? 'new-password' : 'current-password'; errBox($('#msg'), ''); };
  $$('.m-tabs button').forEach(b => b.onclick = () => set(b.dataset.m)); set(m);
  const email = () => $('#em').value.trim();
  const valid = (needPw) => {
    if (!/^\S+@\S+\.\S+$/.test(email())) { errBox($('#msg'), 'Enter a valid email address.'); $('#em').focus(); return false; }
    if (needPw && $('#pw').value.length < 8) { errBox($('#msg'), 'Password must be at least 8 characters.'); $('#pw').focus(); return false; }
    if (needPw && m === 'signup' && !$('#nm').value.trim()) { errBox($('#msg'), 'Enter your name.'); $('#nm').focus(); return false; }
    return true;
  };
  const okMsg = (t) => { $('#msg').innerHTML = `<div class="m-ok" role="status">${esc(t)}</div>`; };
  $('#f').onsubmit = async (e) => {
    e.preventDefault(); if (!valid(true)) return;
    const b = $('#go'); busy(b, true);
    try {
      if (m === 'signup') { const r = await api.signUp(email(), $('#pw').value, $('#nm').value.trim()); if (r.needsConfirm) { busy(b, false); return okMsg('Almost done! Check your email and click the link to confirm your account.'); } }
      else await api.signIn(email(), $('#pw').value);
      go(next);
    } catch (err) { busy(b, false); errBox($('#msg'), /invalid login/i.test(err.message) ? 'Email or password is incorrect.' : err.message); }
  };
  $('#magic').onclick = async () => { if (!valid(false)) return; try { await api.magic(email(), next); okMsg('Check your email for a login link.'); } catch (e) { errBox($('#msg'), e.message); } };
  $('#forgot').onclick = async () => { if (!valid(false)) return; try { await api.reset(email()); okMsg('We sent a password reset link to your email.'); } catch (e) { errBox($('#msg'), e.message); } };
}

// ---------- account ----------
async function viewAccount() {
  if (!(await api.user())) return go(loginUrl('/account/'));
  const [p, enr, courses, done] = await Promise.all([api.profile(), api.enrollments(), api.courses(), api.progress()]);
  const doneSet = new Set(done);
  const mine = courses.filter(c => enr.some(e => e.course_id === c.id));
  const outlines = Object.fromEntries(await Promise.all(mine.map(async c => [c.id, await api.outline(c.id)])));
  const reset = qs.get('reset') === '1';
  const row = (c) => { const o = outlines[c.id] || []; const n = o.filter(l => doneSet.has(l.id)).length; const pct = o.length ? Math.round(n / o.length * 100) : 0;
    const nx = o.find(l => !doneSet.has(l.id)) || o[0];
    return `<a class="m-my" href="/learn/?c=${encodeURIComponent(c.slug)}${nx ? '&l=' + nx.id : ''}"><div class="m-mythumb">${c.cover_url ? `<img src="${esc(c.cover_url)}" alt="">` : ''}</div>
      <div class="m-myb"><h3>${esc(c.title)}</h3><div class="m-prog"><i style="width:${pct}%"></i></div><small>${n} of ${o.length} lessons complete</small></div>
      <span class="btn btn-cta btn-sm">${pct ? 'Continue' : 'Start'}</span></a>`; };
  app.innerHTML = `<div class="m-wrap m-acc">
    ${reset ? `<div class="m-card m-resetc"><h3>Set a new password</h3><form id="rp"><div class="field"><label for="np">New password</label><input id="np" type="password" minlength="8" autocomplete="new-password"></div><div id="rpm"></div><button class="btn btn-cta">Save password</button></form></div>` : ''}
    <div class="m-acc-grid"><div>
      <h2>My courses</h2>${mine.length ? mine.map(row).join('') : `<div class="m-empty sm"><h3>No courses yet</h3><p>Start with a free course or explore the full programmes.</p><a class="btn btn-cta" href="/courses/">Browse courses</a></div>`}
      ${mine.length ? '<p style="margin-top:1.4rem"><a class="textlink" href="/courses/">Browse more courses →</a></p>' : ''}</div>
    <aside><div class="m-card"><div class="m-av">${esc((p?.full_name || p?.email || '?').trim()[0].toUpperCase())}</div>
      <form id="pf"><div class="field"><label for="fn2">Name</label><input id="fn2" value="${esc(p?.full_name || '')}"></div>
      <div class="field"><label>Email</label><input value="${esc(p?.email || '')}" disabled></div><div class="field"><label for="ph">Phone (optional)</label><input id="ph" value="${esc(p?.phone || '')}" inputmode="tel"></div>
      <div id="pfm"></div><button class="btn btn-outline btn-block">Save details</button></form>
      ${p?.is_admin ? '<a class="btn btn-outline btn-block" style="margin-top:.7rem" href="/admin/">Manage courses</a>' : ''}
      <button class="linkbtn" id="out" style="margin-top:1rem">Log out</button></div></aside></div></div>`;
  $('#pf').onsubmit = async (e) => { e.preventDefault(); try { await api.saveProfile({ full_name: $('#fn2').value.trim(), phone: $('#ph').value.trim() }); $('#pfm').innerHTML = '<div class="m-ok">Saved.</div>'; } catch (x) { errBox($('#pfm'), x.message); } };
  $('#out').onclick = async () => { await api.signOut(); go('/'); };
  if (reset) $('#rp').onsubmit = async (e) => { e.preventDefault(); const v = $('#np').value; if (v.length < 8) return errBox($('#rpm'), 'Password must be at least 8 characters.');
    try { await api.setPassword(v); $('.m-resetc').innerHTML = '<div class="m-ok">Your password has been updated.</div>'; } catch (x) { errBox($('#rpm'), x.message); } };
}

// ---------- lesson player ----------
async function viewLearn() {
  const slug = qs.get('c');
  const course = slug && await api.course(slug);
  if (!course) return go('/courses/');
  const [outline, lessons, enr, done, user] = await Promise.all([api.outline(course.id), api.lessons(course.id), api.enrollments(), api.progress(), api.user()]);
  const enrolled = enr.some(e => e.course_id === course.id);
  const doneSet = new Set(done);
  const byId = Object.fromEntries(lessons.map(l => [l.id, l]));
  let cur = outline.find(l => l.id === qs.get('l')) || outline[0];
  if (!cur) { app.innerHTML = `<div class="m-wrap"><div class="m-empty"><h2>Lessons coming soon</h2><a class="btn btn-cta" href="/course/?c=${esc(slug)}">Back to course</a></div></div>`; return; }
  document.title = `${cur.title} · ${course.title} | Alloha Qi Space`;

  const total = outline.length;
  const pct = () => Math.round(outline.filter(l => doneSet.has(l.id)).length / total * 100);
  const side = () => sections(outline).map(s => `<div class="p-sec"><h4>${esc(s.name)}</h4>${s.items.map(l => {
      const open = !!byId[l.id];
      return `<a class="p-item ${l.id === cur.id ? 'cur' : ''} ${doneSet.has(l.id) ? 'done' : ''} ${open ? '' : 'locked'}" href="?c=${encodeURIComponent(slug)}&l=${l.id}">
        <span class="li-ic">${doneSet.has(l.id) ? ICON.check : open ? lessonIcon(l) : ICON.lock}</span><span>${esc(l.title)}</span><small>${esc(l.duration_text || '')}</small></a>`; }).join('')}</div>`).join('');

  const idx = outline.indexOf(cur), prev = outline[idx - 1], next = outline[idx + 1];
  const L = byId[cur.id];
  let main;
  if (!L) {
    main = `<div class="p-locked"><div class="p-lockic">${ICON.lock}</div><h2>${esc(cur.title)}</h2>
      <p>${user ? 'This lesson is part of the full course.' : 'Log in or create a free account to continue.'}</p>
      <a class="btn btn-cta btn-lg" href="/course/?c=${encodeURIComponent(slug)}#buy">${course.price ? `Unlock the course · ${price(course.price)}` : 'Enrol free'}</a></div>`;
  } else {
    let media = '';
    if (L.video_url) media = `<div class="p-video"><iframe src="${esc(embedUrl(L.video_url))}" title="${esc(L.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    else if (L.video_path) media = `<div class="p-video"><video id="pv" controls playsinline controlslist="nodownload" preload="metadata"></video></div>`;
    if (L.audio_path) media += `<div class="p-audio"><span class="li-ic">${ICON.audio}</span><audio id="pa" controls controlslist="nodownload" preload="metadata"></audio></div>`;
    const isDone = doneSet.has(L.id);
    main = `${media}<div class="p-head"><small>Lesson ${idx + 1} of ${total}${L.section ? ' · ' + esc(L.section) : ''}</small><h1>${esc(L.title)}</h1></div>
      <div class="prose p-body">${md(L.body)}</div>
      ${!enrolled && L.is_preview ? `<div class="p-upsell"><b>Enjoying this preview?</b><span>Unlock all ${total} lessons.</span><a class="btn btn-cta btn-sm" href="/course/?c=${encodeURIComponent(slug)}#buy">${course.price ? price(course.price) : 'Enrol free'}</a></div>` : ''}
      <div class="p-nav">${prev ? `<a class="btn btn-outline" href="?c=${encodeURIComponent(slug)}&l=${prev.id}">← Previous</a>` : '<span></span>'}
      ${enrolled ? `<button class="btn btn-cta" id="mk">${isDone ? (next ? 'Next lesson' : 'Back to my courses') : next ? 'Mark complete & continue' : 'Mark course complete'}</button>` : next ? `<a class="btn btn-cta" href="?c=${encodeURIComponent(slug)}&l=${next.id}">Next lesson</a>` : ''}</div>`;
  }
  app.innerHTML = `<div class="p-shell"><aside class="p-side" id="pside"><div class="p-top"><a href="/course/?c=${encodeURIComponent(slug)}" class="p-back">← Course page</a><h3>${esc(course.title)}</h3>
      ${enrolled ? `<div class="m-prog"><i style="width:${pct()}%"></i></div><small>${pct()}% complete</small>` : '<small>Preview</small>'}</div>${side()}</aside>
    <main class="p-main"><button class="p-toggle" id="ptog">${ICON.menu}<span>Course lessons</span></button>${main}</main></div>`;
  $('#ptog').onclick = () => $('#pside').classList.toggle('open');
  if (L?.video_path) api.mediaUrl(L.video_path).then(u => { if (u) $('#pv').src = u; }).catch(e => toast(e.message));
  if (L?.audio_path) api.mediaUrl(L.audio_path).then(u => { if (u) $('#pa').src = u; }).catch(e => toast(e.message));
  const mk = $('#mk');
  if (mk) mk.onclick = async () => {
    busy(mk, true);
    try { if (!doneSet.has(L.id)) await api.complete(L.id); go(next ? `?c=${encodeURIComponent(slug)}&l=${next.id}` : '/account/'); }
    catch (e) { busy(mk, false); toast(e.message); }
  };
}

// ---------- admin ----------
async function viewAdmin() {
  if (!(await api.user())) return go(loginUrl('/admin/'));
  const p = await api.profile();
  if (!p?.is_admin) { app.innerHTML = `<div class="m-wrap"><div class="m-empty"><h2>Admins only</h2><p>Your account doesn’t have admin access. See the setup guide to make an account an admin.</p></div></div>`; return; }
  const section = qs.get('s') === 'events' ? 'events' : 'courses';
  app.innerHTML = `<div class="a-switch"><a class="${section === 'courses' ? 'on' : ''}" href="/admin/">Courses</a><a class="${section === 'events' ? 'on' : ''}" href="/admin/?s=events">Healing events</a></div><div id="adm"></div>`;
  const root = $('#adm');
  if (section === 'events') return adminEvents(root);
  let courses = await api.adminCourses();
  let selId = qs.get('id') || courses[0]?.id || null;
  let tab = 'details';
  const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);

  async function render() {
    const c = courses.find(x => x.id === selId);
    root.innerHTML = `<div class="a-shell"><aside class="a-list"><button class="btn btn-cta btn-block" id="newc">+ New course</button>
      ${courses.map(x => `<button class="a-ci ${x.id === selId ? 'on' : ''}" data-id="${x.id}"><b>${esc(x.title)}</b><small>${x.published ? 'Published' : 'Draft'} · ${price(x.price)}</small></button>`).join('') || '<p class="m-note">No courses yet.</p>'}
      </aside><main class="a-main">${c ? `<div class="a-head"><h2>${esc(c.title)}</h2><a class="textlink" href="/course/?c=${encodeURIComponent(c.slug)}" target="_blank">View page →</a></div>
      <div class="m-tabs a-tabs"><button data-t="details">Details</button><button data-t="lessons">Lessons</button><button data-t="members">Members</button></div><div id="pane"></div>` : '<div class="m-empty sm"><h3>Create your first course</h3><p>Click “New course” to begin.</p></div>'}</main></div>`;
    $('#newc').onclick = () => editCourse(null);
    $$('.a-ci').forEach(b => b.onclick = () => { selId = b.dataset.id; tab = 'details'; render(); });
    if (!c) return;
    $$('.a-tabs button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.onclick = () => { tab = b.dataset.t; render(); }; });
    if (tab === 'details') editCourse(c); else if (tab === 'lessons') lessonsPane(c); else membersPane(c);
  }

  function editCourse(c) {
    const isNew = !c; c = c || { title: '', slug: '', subtitle: '', description: '', cover_url: '', price: 0, level: 'Beginner', duration_text: '', published: false, position: courses.length + 1 };
    const target = isNew ? $('.a-main') : $('#pane');
    target.innerHTML = `${isNew ? '<h2>New course</h2>' : ''}<form class="a-form" id="cf">
      <div class="g2"><div class="field"><label>Title</label><input name="title" required value="${esc(c.title)}"></div><div class="field"><label>Web address (slug)</label><input name="slug" required value="${esc(c.slug)}"></div></div>
      <div class="field"><label>Short description</label><input name="subtitle" value="${esc(c.subtitle)}"></div>
      <div class="field"><label>Full description <small>(Markdown: **bold**, - lists, ## headings)</small></label><textarea name="description" rows="8">${esc(c.description)}</textarea></div>
      <div class="g3"><div class="field"><label>Price in ₹ (0 = free)</label><input name="price" type="number" min="0" step="1" value="${c.price}"></div><div class="field"><label>Level</label><input name="level" value="${esc(c.level)}"></div><div class="field"><label>Duration</label><input name="duration_text" value="${esc(c.duration_text)}" placeholder="4 weeks"></div></div>
      <div class="g2"><div class="field"><label>Cover image URL</label><input name="cover_url" value="${esc(c.cover_url)}"></div><div class="field"><label>…or upload cover</label><input type="file" id="cov" accept="image/*"></div></div>
      <div class="g2"><div class="field"><label>Order in catalogue</label><input name="position" type="number" value="${c.position}"></div>
      <label class="a-check"><input type="checkbox" name="published" ${c.published ? 'checked' : ''}> Published (visible to visitors)</label></div>
      <div id="cfm"></div><div class="a-actions"><button class="btn btn-cta" type="submit">${isNew ? 'Create course' : 'Save changes'}</button>${isNew ? '' : '<button class="btn btn-outline" type="button" id="delc">Delete course</button>'}</div></form>`;
    const f = $('#cf');
    f.title.oninput = () => { if (isNew) f.slug.value = slugify(f.title.value); };
    $('#cov').onchange = async (e) => { const file = e.target.files[0]; if (!file) return; $('#cfm').innerHTML = '<div class="m-ok">Uploading cover…</div>'; try { f.cover_url.value = await api.uploadCover(file); $('#cfm').innerHTML = '<div class="m-ok">Cover uploaded. Save to apply.</div>'; } catch (x) { errBox($('#cfm'), x.message); } };
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (!f.title.value.trim()) return errBox($('#cfm'), 'Enter a title.');
      if (!/^[a-z0-9-]+$/.test(f.slug.value)) return errBox($('#cfm'), 'Web address may use lowercase letters, numbers and dashes only.');
      const row = { ...(isNew ? {} : { id: c.id }), title: f.title.value.trim(), slug: f.slug.value, subtitle: f.subtitle.value.trim(), description: f.description.value,
        price: Math.max(0, parseInt(f.price.value || '0', 10)), level: f.level.value.trim(), duration_text: f.duration_text.value.trim(), cover_url: f.cover_url.value.trim(),
        position: parseInt(f.position.value || '0', 10), published: f.published.checked };
      try { const saved = await api.saveCourse(row); courses = await api.adminCourses(); selId = saved.id; tab = isNew ? 'lessons' : 'details'; await render(); toast('Course saved'); }
      catch (x) { errBox($('#cfm'), /duplicate|unique/i.test(x.message) ? 'That web address is already used by another course.' : x.message); }
    };
    if (!isNew) $('#delc').onclick = async () => { if (!confirm(`Delete "${c.title}" and all its lessons? Members will lose access. This cannot be undone.`)) return;
      await api.deleteCourse(c.id); courses = await api.adminCourses(); selId = courses[0]?.id || null; render(); };
  }

  async function lessonsPane(c) {
    const ls = await api.adminLessons(c.id);
    $('#pane').innerHTML = `<div class="a-lessons">${ls.map((l, i) => `<div class="a-li"><div class="a-li-ord"><button data-up="${i}" ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button data-dn="${i}" ${i < ls.length - 1 ? '' : 'disabled'} aria-label="Move down">↓</button></div>
      <div class="a-li-t"><small>${esc(l.section || '')}</small><b>${i + 1}. ${esc(l.title)}</b><span>${[l.video_url || l.video_path ? 'Video' : '', l.audio_path ? 'Audio' : '', l.body ? 'Text' : '', l.is_preview ? 'Free preview' : ''].filter(Boolean).join(' · ') || 'Empty'}</span></div>
      <button class="btn btn-outline btn-sm" data-ed="${l.id}">Edit</button></div>`).join('') || '<p class="m-note">No lessons yet.</p>'}</div>
      <button class="btn btn-cta" id="addl">+ Add lesson</button><div id="led"></div>`;
    const swap = async (i, j) => { const a = ls[i], b = ls[j]; [a.position, b.position] = [b.position, a.position]; if (a.position === b.position) { a.position = i + 2; b.position = i + 1; }
      await api.saveLesson({ id: a.id, course_id: c.id, position: a.position }); await api.saveLesson({ id: b.id, course_id: c.id, position: b.position }); lessonsPane(c); };
    $$('[data-up]').forEach(b => b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1));
    $$('[data-dn]').forEach(b => b.onclick = () => swap(+b.dataset.dn, +b.dataset.dn + 1));
    $$('[data-ed]').forEach(b => b.onclick = () => editLesson(c, ls.find(l => l.id === b.dataset.ed), ls));
    $('#addl').onclick = () => editLesson(c, null, ls);
  }

  function editLesson(c, l, ls) {
    const isNew = !l; l = l || { course_id: c.id, section: ls[ls.length - 1]?.section || '', title: '', position: (ls[ls.length - 1]?.position || 0) + 1, is_preview: false, duration_text: '', body: '', video_url: '', video_path: '', audio_path: '' };
    $('#led').innerHTML = `<form class="a-form a-lform" id="lf"><h3>${isNew ? 'New lesson' : 'Edit lesson'}</h3>
      <div class="g2"><div class="field"><label>Section / module</label><input name="section" value="${esc(l.section)}" placeholder="Week 1: Release"></div><div class="field"><label>Lesson title</label><input name="title" required value="${esc(l.title)}"></div></div>
      <div class="g2"><div class="field"><label>Duration</label><input name="duration_text" value="${esc(l.duration_text)}" placeholder="12 min"></div><label class="a-check"><input type="checkbox" name="is_preview" ${l.is_preview ? 'checked' : ''}> Free preview (anyone can watch)</label></div>
      <div class="field"><label>Lesson notes <small>(Markdown)</small></label><textarea name="body" rows="10">${esc(l.body)}</textarea></div>
      <fieldset class="a-media"><legend>Video</legend>
        <div class="field"><label>Video link (YouTube unlisted, Vimeo or Bunny)</label><input name="video_url" value="${esc(l.video_url)}" placeholder="https://vimeo.com/123456"></div>
        <div class="field"><label>…or upload a video file (up to 50 MB on Supabase’s free plan)</label><input type="file" id="vf" accept="video/*"><small class="a-file">${l.video_path ? 'Current file: ' + esc(l.video_path.split('/').pop()) + ' <button type="button" class="linkbtn" id="rmv">Remove</button>' : ''}</small></div></fieldset>
      <fieldset class="a-media"><legend>Audio</legend><div class="field"><label>Upload a guided audio (mp3 / m4a / wav)</label><input type="file" id="af" accept="audio/*"><small class="a-file">${l.audio_path ? 'Current file: ' + esc(l.audio_path.split('/').pop()) + ' <button type="button" class="linkbtn" id="rma">Remove</button>' : ''}</small></div></fieldset>
      <div id="lfm"></div><div class="a-actions"><button class="btn btn-cta" type="submit">Save lesson</button><button class="btn btn-outline" type="button" id="cancl">Cancel</button>${isNew ? '' : '<button class="btn btn-outline" type="button" id="dell">Delete</button>'}</div></form>`;
    $('#lf').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const f = $('#lf'); let vpath = l.video_path, apath = l.audio_path;
    const up = (inp, set) => inp.onchange = async () => { const file = inp.files[0]; if (!file) return; $('#lfm').innerHTML = `<div class="m-ok"><span class="spin"></span>Uploading ${esc(file.name)}…</div>`;
      try { set(await api.upload(c.id, file)); $('#lfm').innerHTML = '<div class="m-ok">Uploaded. Save the lesson to apply.</div>'; } catch (x) { errBox($('#lfm'), x.message); } };
    up($('#vf'), (p) => vpath = p); up($('#af'), (p) => apath = p);
    $('#rmv')?.addEventListener('click', () => { vpath = ''; $('#rmv').parentElement.textContent = 'Video file will be removed on save.'; });
    $('#rma')?.addEventListener('click', () => { apath = ''; $('#rma').parentElement.textContent = 'Audio file will be removed on save.'; });
    $('#cancl').onclick = () => { $('#led').innerHTML = ''; };
    if (!isNew) $('#dell').onclick = async () => { if (!confirm(`Delete lesson "${l.title}"?`)) return; await api.deleteLesson(l.id); lessonsPane(c); };
    f.onsubmit = async (e) => { e.preventDefault(); if (!f.title.value.trim()) return errBox($('#lfm'), 'Enter a lesson title.');
      try { await api.saveLesson({ ...(isNew ? {} : { id: l.id }), course_id: c.id, position: l.position, section: f.section.value.trim(), title: f.title.value.trim(), duration_text: f.duration_text.value.trim(),
          is_preview: f.is_preview.checked, body: f.body.value, video_url: f.video_url.value.trim(), video_path: vpath, audio_path: apath }); toast('Lesson saved'); lessonsPane(c); }
      catch (x) { errBox($('#lfm'), x.message); } };
  }

  async function membersPane(c) {
    const ms = await api.members(c.id);
    $('#pane').innerHTML = `<form class="a-grant" id="gf"><div class="field"><label>Give access by email</label><input id="ge" type="email" placeholder="member@example.com"></div><button class="btn btn-cta">Grant access</button></form><div id="gfm"></div>
      <p class="m-note">${ms.length} member${ms.length === 1 ? '' : 's'} enrolled. Use this for people who paid offline or as a gift. They must create an account first.</p>
      <div class="a-members">${ms.map(m => `<div class="a-mem"><div><b>${esc(m.full_name || '—')}</b><small>${esc(m.email || '')}</small></div><span class="m-badge">${esc(m.source)}${m.amount ? ' · ' + price(m.amount) : ''}</span><small>${new Date(m.created_at).toLocaleDateString('en-IN')}</small><button class="linkbtn" data-rv="${m.user_id}">Remove</button></div>`).join('')}</div>`;
    $('#gf').onsubmit = async (e) => { e.preventDefault(); try { await api.grant($('#ge').value, c.id); toast('Access granted'); membersPane(c); } catch (x) { errBox($('#gfm'), x.message); } };
    $$('[data-rv]').forEach(b => b.onclick = async () => { if (!confirm('Remove this member’s access to the course?')) return; await api.revoke(b.dataset.rv, c.id); membersPane(c); });
  }
  render();
}


// ---------- admin: healing events ----------
const IST = (iso) => { if (!iso) return ''; const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; };
const fromIST = (v) => new Date(`${v}:00+05:30`).toISOString();
const evDate = (iso) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
const slugify2 = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 70);

async function adminEvents(root) {
  let events = await api.adminEvents();
  let selId = qs.get('id') || events.find(e => new Date(e.end_at) > new Date())?.id || events[0]?.id || null;
  let tab = qs.get('t') === 'bookings' ? 'bookings' : 'details';
  async function render() {
    const e = events.find(x => x.id === selId);
    const now = new Date();
    const item = (x) => `<button class="a-ci ${x.id === selId ? 'on' : ''}" data-id="${x.id}"><b>${esc(x.title)}</b><small>${evDate(x.start_at)} · ${x.published ? (new Date(x.end_at) < now ? 'Past' : 'Published') : 'Draft'} · ${price(x.price)}</small></button>`;
    const up = events.filter(x => new Date(x.end_at) >= now).sort((a, b) => a.start_at.localeCompare(b.start_at)), past = events.filter(x => new Date(x.end_at) < now);
    root.innerHTML = `<div class="a-shell"><aside class="a-list"><button class="btn btn-cta btn-block" id="newe">+ New event</button>
      ${up.length ? '<div class="a-group">Upcoming</div>' + up.map(item).join('') : ''}${past.length ? '<div class="a-group">Past</div>' + past.map(item).join('') : ''}${events.length ? '' : '<p class="m-note">No events yet.</p>'}</aside>
      <main class="a-main">${e ? `<div class="a-head"><h2>${esc(e.title)}</h2><a class="textlink" href="/event/${encodeURIComponent(e.slug)}/" target="_blank">View page →</a></div>
      <div class="m-tabs a-tabs"><button data-t="details">Details</button><button data-t="bookings">Bookings</button></div><div id="pane"></div>` : '<div class="m-empty sm"><h3>Schedule your first event</h3><p>Click “New event” to add a workshop, healing circle or retreat.</p></div>'}</main></div>`;
    $('#newe').onclick = () => editEvent(null);
    root.querySelectorAll('.a-ci').forEach(b => b.onclick = () => { selId = b.dataset.id; tab = 'details'; render(); });
    if (!e) return;
    root.querySelectorAll('.a-tabs button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.onclick = () => { tab = b.dataset.t; render(); }; });
    tab === 'details' ? editEvent(e) : bookingsPane(e);
  }

  function editEvent(e, copy) {
    const isNew = !e || copy;
    const base = e ? { ...e } : { title: '', slug: '', subtitle: '', summary: '', description: '', start_at: '', end_at: '', mode: 'in-person', venue: 'Alloha Qi Space, Kalyani Nagar, Pune',
      price: 0, capacity: 20, max_per_booking: 6, cover_url: '', highlights: '', payment_link: '', booking_open: true, published: false };
    if (copy) { delete base.id; base.title += ' (copy)'; base.slug += '-copy'; base.published = false; }
    const target = isNew ? root.querySelector('.a-main') : $('#pane');
    target.innerHTML = `${isNew ? `<h2>${copy ? 'Duplicate event' : 'New event'}</h2>` : ''}<form class="a-form" id="ef">
      <div class="g2"><div class="field"><label>Event name</label><input name="title" required value="${esc(base.title)}" placeholder="Full Moon Healing Circle"></div><div class="field"><label>Web address</label><input name="slug" value="${esc(base.slug)}" placeholder="full-moon-healing-circle"></div></div>
      <div class="field"><label>Tagline <small>(shown under the title)</small></label><input name="subtitle" value="${esc(base.subtitle)}"></div>
      <div class="field"><label>Card summary <small>(one sentence for event cards)</small></label><input name="summary" value="${esc(base.summary)}"></div>
      <div class="g2"><div class="field"><label>Starts (India time)</label><input name="start" type="datetime-local" required value="${IST(base.start_at)}"></div><div class="field"><label>Ends (India time)</label><input name="end" type="datetime-local" required value="${IST(base.end_at)}"></div></div>
      <div class="g2"><div class="field"><label>Format</label><select name="mode">${[['in-person', 'In person'], ['online', 'Live online'], ['hybrid', 'In person & online']].map(([v, l]) => `<option value="${v}" ${base.mode === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Venue / where</label><input name="venue" value="${esc(base.venue)}" placeholder="Zoom link sent after booking"></div></div>
      <div class="g3"><div class="field"><label>Price per seat in ₹ (0 = free)</label><input name="price" type="number" min="0" step="1" value="${base.price}"></div>
        <div class="field"><label>Total seats (0 = unlimited)</label><input name="capacity" type="number" min="0" step="1" value="${base.capacity}"></div>
        <div class="field"><label>Max seats per booking</label><input name="max_per_booking" type="number" min="1" max="50" step="1" value="${base.max_per_booking}"></div></div>
      <div class="field"><label>Description <small>(Markdown: **bold**, - lists, ## headings)</small></label><textarea name="description" rows="8">${esc(base.description)}</textarea></div>
      <div class="field"><label>What to expect <small>(one point per line)</small></label><textarea name="highlights" rows="4">${esc(base.highlights)}</textarea></div>
      <div class="g2"><div class="field"><label>Cover image URL</label><input name="cover_url" value="${esc(base.cover_url)}"></div><div class="field"><label>…or upload cover</label><input type="file" id="ecov" accept="image/*"></div></div>
      <details class="a-adv"><summary>Advanced</summary><div class="field"><label>External payment link <small>(optional; replaces the built-in booking form)</small></label><input name="payment_link" value="${esc(base.payment_link)}" placeholder="https://rzp.io/l/..."></div></details>
      <div class="g2"><label class="a-check"><input type="checkbox" name="booking_open" ${base.booking_open ? 'checked' : ''}> Bookings open</label><label class="a-check"><input type="checkbox" name="published" ${base.published ? 'checked' : ''}> Published (visible on the website)</label></div>
      <div id="efm"></div><div class="a-actions"><button class="btn btn-cta" type="submit">${isNew ? 'Create event' : 'Save changes'}</button>
      ${isNew ? '' : '<button class="btn btn-outline" type="button" id="dupe">Duplicate</button><button class="btn btn-outline" type="button" id="dele">Delete</button>'}</div></form>`;
    const f = $('#ef');
    f.title.oninput = () => { if (isNew && !copy) f.slug.value = slugify2(f.title.value); };
    $('#ecov').onchange = async (x) => { const file = x.target.files[0]; if (!file) return; $('#efm').innerHTML = '<div class="m-ok"><span class="spin"></span>Uploading cover…</div>';
      try { f.cover_url.value = await api.uploadCover(file); $('#efm').innerHTML = '<div class="m-ok">Cover uploaded. Save to apply.</div>'; } catch (y) { errBox($('#efm'), y.message); } };
    f.onsubmit = async (x) => {
      x.preventDefault();
      const slug = f.slug.value.trim() || slugify2(f.title.value);
      if (!f.title.value.trim()) return errBox($('#efm'), 'Enter the event name.');
      if (!/^[a-z0-9-]+$/.test(slug)) return errBox($('#efm'), 'Web address may use lowercase letters, numbers and dashes only.');
      if (!f.start.value || !f.end.value) return errBox($('#efm'), 'Enter the start and end date and time.');
      if (f.end.value < f.start.value) return errBox($('#efm'), 'The event must end after it starts.');
      const row = { ...(isNew ? {} : { id: e.id }), title: f.title.value.trim(), slug, subtitle: f.subtitle.value.trim(), summary: f.summary.value.trim(), description: f.description.value,
        start_at: fromIST(f.start.value), end_at: fromIST(f.end.value), mode: f.mode.value, venue: f.venue.value.trim(),
        price: Math.max(0, parseInt(f.price.value || '0', 10)), capacity: Math.max(0, parseInt(f.capacity.value || '0', 10)), max_per_booking: Math.min(50, Math.max(1, parseInt(f.max_per_booking.value || '1', 10))),
        cover_url: f.cover_url.value.trim(), highlights: f.highlights.value.trim(), payment_link: f.payment_link.value.trim(), booking_open: f.booking_open.checked, published: f.published.checked };
      try { const saved = await api.saveEvent(row); events = await api.adminEvents(); selId = saved.id; tab = 'details'; await render(); toast(row.published ? 'Event saved and live' : 'Event saved as draft'); }
      catch (y) { errBox($('#efm'), /duplicate|unique/i.test(y.message) ? 'That web address is already used by another event.' : y.message); }
    };
    if (!isNew) {
      $('#dupe').onclick = () => editEvent(e, true);
      $('#dele').onclick = async () => { if (!confirm(`Delete "${e.title}" and all its bookings? This cannot be undone.`)) return; await api.deleteEvent(e.id); events = await api.adminEvents(); selId = events[0]?.id || null; render(); };
    }
  }

  async function bookingsPane(e) {
    const bs = await api.eventBookings(e.id);
    const conf = bs.filter(b => ['paid', 'free', 'manual'].includes(b.status));
    const seats = conf.reduce((a, b) => a + b.seats, 0), revenue = bs.filter(b => b.status === 'paid').reduce((a, b) => a + b.amount, 0);
    const pending = bs.filter(b => b.status === 'pending').length;
    $('#pane').innerHTML = `<div class="a-stats"><div><b>${seats}${e.capacity ? ` / ${e.capacity}` : ''}</b><span>seats confirmed</span></div><div><b>${conf.length}</b><span>bookings</span></div><div><b>${price(revenue)}</b><span>paid online</span></div></div>
      ${pending ? `<p class="m-note" style="text-align:left">${pending} unfinished checkout${pending > 1 ? 's' : ''} (people who opened payment but didn’t pay). These don’t hold seats.</p>` : ''}
      <div class="a-actions" style="margin:1rem 0"><button class="btn btn-outline btn-sm" id="csv">Download attendee list (CSV)</button><button class="btn btn-outline btn-sm" id="addb">+ Add booking</button></div>
      <div id="addf"></div>
      <div class="a-members">${bs.filter(b => b.status !== 'pending').map(b => `<div class="a-mem ${b.status === 'cancelled' ? 'cx' : ''}"><div><b>${esc(b.name)}</b><small>${esc(b.email)}${b.phone ? ' · ' + esc(b.phone) : ''}</small></div>
        <span>${b.seats} seat${b.seats > 1 ? 's' : ''}</span><span class="m-badge">${esc(b.status)}${b.amount ? ' · ' + price(b.amount) : ''}</span><small>${new Date(b.created_at).toLocaleDateString('en-IN')}</small>
        ${b.phone ? `<a class="linkbtn" href="https://wa.me/${b.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
        <button class="linkbtn" data-st="${b.id}" data-to="${b.status === 'cancelled' ? (b.payment_id ? 'paid' : b.amount ? 'manual' : 'free') : 'cancelled'}">${b.status === 'cancelled' ? 'Restore' : 'Cancel'}</button></div>`).join('') || '<p class="m-note">No bookings yet.</p>'}</div>`;
    $$('[data-st]').forEach(b => b.onclick = async () => { if (b.dataset.to === 'cancelled' && !confirm('Cancel this booking? The seat is released. Refunds are done in your Razorpay dashboard.')) return; await api.setBookingStatus(b.dataset.st, b.dataset.to); bookingsPane(e); });
    $('#csv').onclick = () => {
      const rows = [['Name', 'Email', 'Phone', 'Seats', 'Status', 'Amount (INR)', 'Payment ID', 'Booked on', 'Note'], ...bs.filter(b => b.status !== 'pending').map(b => [b.name, b.email, b.phone, b.seats, b.status, b.amount, b.payment_id || '', new Date(b.created_at).toLocaleString('en-IN'), b.note || ''])];
      const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `${e.slug}-attendees.csv`; a.click();
    };
    $('#addb').onclick = () => {
      $('#addf').innerHTML = `<form class="a-form a-lform" id="bf"><h3>Add a booking</h3><p class="m-note" style="text-align:left">For people who paid in cash or by UPI, or guests you invite.</p>
        <div class="g2"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Email</label><input name="email" type="email"></div></div>
        <div class="g3"><div class="field"><label>Phone</label><input name="phone"></div><div class="field"><label>Seats</label><input name="seats" type="number" min="1" value="1"></div><div class="field"><label>Amount received (₹)</label><input name="amount" type="number" min="0" value="${e.price}"></div></div>
        <div class="field"><label>Note</label><input name="note" placeholder="Paid by UPI on 12 Dec"></div><div id="bfm"></div>
        <div class="a-actions"><button class="btn btn-cta">Add booking</button><button class="btn btn-outline" type="button" id="bfc">Cancel</button></div></form>`;
      const bf = $('#bf'); $('#bfc').onclick = () => { $('#addf').innerHTML = ''; };
      bf.onsubmit = async (x) => { x.preventDefault(); if (!bf.name.value.trim()) return errBox($('#bfm'), 'Enter a name.');
        try { await api.addBooking({ event_id: e.id, name: bf.name.value.trim(), email: bf.email.value.trim() || '-', phone: bf.phone.value.trim(), seats: Math.max(1, +bf.seats.value || 1), amount: Math.max(0, +bf.amount.value || 0), note: bf.note.value.trim() });
          toast('Booking added'); bookingsPane(e); } catch (y) { errBox($('#bfm'), y.message); } };
    };
  }
  render();
}

// ---------- boot ----------
(async () => {
  if (!app) { if (api) headerState(); return; }
  if (!api) { if (['admin', 'login', 'account', 'learn', 'course', 'courses'].includes(view)) notReady(); return; }
  try {
    await headerState();
    await ({ courses: viewCourses, course: viewCourse, login: viewLogin, account: viewAccount, learn: viewLearn, admin: viewAdmin }[view])();
    api.onAuth((evt) => { if (evt === 'SIGNED_OUT' && ['account', 'admin'].includes(view)) go('/'); headerState(); });
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="m-wrap"><div class="m-empty"><h2>Something went wrong</h2><p>${esc(e.message)}</p><button class="btn btn-cta" onclick="location.reload()">Try again</button></div></div>`;
  }
})();
