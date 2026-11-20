// Alloha Qi Space — public healing events (list, event page with booking, homepage strip).
// Reads published events straight from Supabase (public data); bookings go through /api.
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const CFG = window.AQS_CONFIG || {};
const WA = 'https://wa.me/919881192288?text=';
const TZ = 'Asia/Kolkata';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = (s) => DOMPurify.sanitize(marked.parse(s || ''));
const price = (p) => (p ? `₹${Number(p).toLocaleString('en-IN')}` : 'Free');
const MODE = { 'in-person': 'In person, Pune', online: 'Live online', hybrid: 'In person & online' };
const fmt = (d, o) => new Intl.DateTimeFormat('en-IN', { timeZone: TZ, ...o }).format(new Date(d));
const day = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const tm = (d) => fmt(d, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').replace(' ', ' ').toLowerCase();
const sameDay = (a, b) => fmt(a, { dateStyle: 'short' }) === fmt(b, { dateStyle: 'short' });
const when = (e) => sameDay(e.start_at, e.end_at)
  ? [day(e.start_at), `${tm(e.start_at)} – ${tm(e.end_at)}`]
  : [`${fmt(e.start_at, { day: 'numeric', month: 'short' })} – ${fmt(e.end_at, { day: 'numeric', month: 'short', year: 'numeric' })}`, `${tm(e.start_at)} – ${tm(e.end_at)} daily`];
const isPast = (e) => new Date(e.end_at) < new Date();
const $ = (s, r = document) => r.querySelector(s);

async function rest(path) {
  const r = await fetch(`${CFG.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, { headers: { apikey: CFG.supabaseAnonKey } });
  if (!r.ok) throw new Error('Could not load events. Please refresh the page.');
  return r.json();
}
const FIELDS = 'id,slug,title,subtitle,summary,description,start_at,end_at,mode,venue,price,capacity,max_per_booking,cover_url,highlights,payment_link,booking_open';
async function loadEvents(filter = '') {
  const [evs, seats] = await Promise.all([rest(`events?select=${FIELDS}&published=eq.true${filter}&order=start_at.asc`), rest('event_seats?select=event_id,booked')]);
  const s = Object.fromEntries(seats.map(x => [x.event_id, x.booked]));
  return evs.map(e => ({ ...e, booked: s[e.id] || 0, left: e.capacity ? Math.max(0, e.capacity - (s[e.id] || 0)) : Infinity }));
}

function card(e) {
  const past = isPast(e), [d, t] = when(e);
  const soldOut = !past && e.left === 0;
  const badge = past ? 'Past event' : soldOut ? 'Sold out' : MODE[e.mode] || '';
  return `<a class="evcard reveal in${past ? ' past' : ''}" href="/event/${encodeURIComponent(e.slug)}/">
    <div class="evimg">${e.cover_url ? `<img src="${esc(e.cover_url)}" alt="" loading="lazy">` : ''}<div class="evdate"><b>${fmt(e.start_at, { day: 'numeric' })}</b><span>${fmt(e.start_at, { month: 'short' })}</span></div></div>
    <div class="evbody"><div class="evmeta"><span class="tag">${badge}</span>${past ? '' : `<span class="evprice">${price(e.price)}</span>`}</div>
    <h3>${esc(e.title)}</h3><p>${esc(e.summary || e.subtitle || '')}</p><small>${d} · ${t}</small>
    ${past ? '<span class="textlink">See highlights →</span>' : `<span class="btn btn-cta btn-sm">${soldOut ? 'View event' : 'Book now'}</span>`}</div></a>`;
}

// ---------- list ----------
async function viewList(app) {
  const all = await loadEvents();
  const up = all.filter(e => !isPast(e)), past = all.filter(isPast).reverse();
  const notify = `${WA}${encodeURIComponent('Hi Rikhil, please let me know about upcoming healing events at Alloha Qi Space.')}`;
  app.innerHTML = `<div class="wrap">
   ${up.length ? `<div class="sec-head"><div class="eyebrow">Upcoming</div><h2>Book your seat</h2></div><div class="grid3">${up.map(card).join('')}</div>`
    : `<div class="empty"><h3>New healing events are being planned</h3><p>Workshops, healing circles and practice days are announced on WhatsApp first. Ask to be added and you’ll hear before seats open.</p><p style="margin-top:1.4rem"><a class="btn btn-cta" href="${notify}" target="_blank" rel="noopener">Notify me about the next event</a></p></div>`}
   ${past.length ? `<div class="sec-head" style="margin-top:4.5rem"><div class="eyebrow">Past events</div><h2>From our community</h2></div><div class="grid3">${past.map(card).join('')}</div>` : ''}</div>`;
}

// ---------- homepage strip ----------
async function viewHome(el) {
  const up = (await loadEvents(`&end_at=gte.${encodeURIComponent(new Date().toISOString())}`)).slice(0, 3);
  if (!up.length) return;
  el.innerHTML = `<section class="bg-white" id="events"><div class="wrap"><div class="sec-head"><div class="eyebrow">Healing events</div><h2>Upcoming healing events</h2>
    <p class="lead">Group sessions, healing circles and workshops. Seats are limited, book online in a minute.</p></div>
    <div class="grid3">${up.map(card).join('')}</div><div class="center-cta"><a class="btn btn-outline" href="/events/">See all events</a></div></div></section>`;
}

// ---------- event page ----------
function icsHref(e) {
  const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const url = `${location.origin}/event/${e.slug}/`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alloha Qi Space//Events//EN', 'BEGIN:VEVENT', `UID:${e.id}@allohaqispace.com`, `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(e.start_at)}`, `DTEND:${f(e.end_at)}`, `SUMMARY:${e.title}`, `LOCATION:${e.venue || ''}`, `DESCRIPTION:${(e.summary || '').replace(/\n/g, ' ')} ${url}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
const gcal = (e) => {
  const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${f(e.start_at)}/${f(e.end_at)}&details=${encodeURIComponent(`${e.summary || ''} ${location.origin}/event/${e.slug}/`)}&location=${encodeURIComponent(e.venue || '')}`;
};

function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load the payment window. Check your connection.')); document.head.appendChild(s); }); }
async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const err = new Error(d.error || 'Booking is unavailable right now.'); err.status = r.status; throw err; }
  return d;
}

async function viewEvent(app) {
  const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '') || new URLSearchParams(location.search).get('e');
  const [e] = slug ? await loadEvents(`&slug=eq.${encodeURIComponent(slug)}`) : [];
  if (!e) { app.innerHTML = `<div class="wrap" style="padding:160px 0 80px"><div class="empty"><h3>Event not found</h3><p>It may have been moved or is no longer listed.</p><p style="margin-top:1.2rem"><a class="btn btn-cta" href="/events/">See all events</a></p></div></div>`; return; }
  const past = isPast(e), [d, t] = when(e), soldOut = !past && e.left === 0;
  document.title = `${e.title} | Alloha Qi Space`;
  const desc = document.querySelector('meta[name=description]'); if (desc) desc.content = e.summary || e.subtitle || '';
  const ld = document.createElement('script'); ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: e.title, description: e.summary, startDate: e.start_at, endDate: e.end_at, image: e.cover_url || undefined,
    eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: { online: 'https://schema.org/OnlineEventAttendanceMode', hybrid: 'https://schema.org/MixedEventAttendanceMode' }[e.mode] || 'https://schema.org/OfflineEventAttendanceMode',
    location: e.mode === 'online' ? { '@type': 'VirtualLocation', url: location.href } : { '@type': 'Place', name: 'Alloha Qi Space', address: e.venue },
    organizer: { '@type': 'Organization', name: 'Alloha Qi Space', url: location.origin },
    offers: { '@type': 'Offer', price: e.price, priceCurrency: 'INR', url: location.href, availability: soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } });
  document.head.appendChild(ld);
  const ask = `${WA}${encodeURIComponent(`Hi Rikhil, I have a question about ${e.title} on ${d}.`)}`;
  const hl = (e.highlights || '').split('\n').map(s => s.trim()).filter(Boolean);
  let panel;
  if (past) panel = `<div class="evbook past"><div class="eyebrow">This event has passed</div><h3>Join the next one</h3><p>New healing events are announced on WhatsApp first.</p>
      <a class="btn btn-cta btn-block" href="${WA}${encodeURIComponent('Hi Rikhil, please let me know about upcoming healing events.')}" target="_blank" rel="noopener">Notify me on WhatsApp</a></div>`;
  else {
    const seatsLine = e.capacity ? `<li><b>Seats</b><span>${soldOut ? 'Sold out' : e.left <= 5 ? `Only ${e.left} left` : `${e.left} of ${e.capacity} left`}</span></li>` : '';
    const max = Math.min(e.max_per_booking || 6, e.left === Infinity ? 50 : e.left);
    let action;
    if (soldOut) action = `<a class="btn btn-outline btn-block" href="${WA}${encodeURIComponent(`Hi Rikhil, ${e.title} is sold out. Please add me to the waiting list.`)}" target="_blank" rel="noopener">Join the waiting list</a>`;
    else if (!e.booking_open) action = `<p class="m-note">Online booking is closed. <a href="${ask}" target="_blank" rel="noopener">Ask Rikhil</a></p>`;
    else if (e.payment_link) action = `<a class="btn btn-cta btn-lg btn-block" href="${esc(e.payment_link)}" target="_blank" rel="noopener">Book &amp; pay ${price(e.price)}</a>`;
    else action = `<form class="evform" id="evf" novalidate>
        <div class="field"><label for="bn">Your name</label><input id="bn" autocomplete="name" required></div>
        <div class="field"><label for="be">Email</label><input id="be" type="email" autocomplete="email" required></div>
        <div class="field"><label for="bp">WhatsApp number</label><input id="bp" type="tel" autocomplete="tel" inputmode="tel" placeholder="+91"></div>
        <div class="field"><label for="bs">Seats</label><div class="seatpick"><button type="button" data-d="-1" aria-label="Fewer seats">−</button><input id="bs" type="number" min="1" max="${max}" value="1" inputmode="numeric"><button type="button" data-d="1" aria-label="More seats">+</button></div></div>
        <div class="evtotal"><span>Total</span><b id="btot">${price(e.price)}</b></div>
        <div id="bmsg"></div>
        <button class="btn btn-cta btn-lg btn-block" id="bgo" type="submit">${e.price ? 'Book & pay' : 'Reserve my free seat'}</button>
        <p class="secure">${e.price ? '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Secure payment by Razorpay · UPI, cards, netbanking' : 'Free event. Your seat is confirmed instantly.'}</p></form>`;
    panel = `<div class="evbook" id="book"><div class="evprice-big">${price(e.price)}<small>${e.price ? 'per person' : 'registration required'}</small></div>
      <div class="countdown" data-start="${esc(e.start_at)}"></div>
      <ul class="evfacts"><li><b>Date</b><span>${d}</span></li><li><b>Time</b><span>${t}</span></li><li><b>Where</b><span>${esc(e.venue || MODE[e.mode])}</span></li>${seatsLine}</ul>
      ${action}<div class="evcal"><a href="${gcal(e)}" target="_blank" rel="noopener">+ Google Calendar</a><a href="${icsHref(e)}" download="${esc(e.slug)}.ics">+ Apple / Outlook</a></div>
      <p class="evq">Questions? <a href="${ask}" target="_blank" rel="noopener">Ask Rikhil on WhatsApp</a></p></div>`;
  }
  app.innerHTML = `<header class="phero has-photo">${e.cover_url ? `<div class="phero-bg"><img class="hero-photo loaded" src="${esc(e.cover_url)}" alt=""><div class="phero-veil"></div></div>` : ''}<div class="wrap">
    <div class="crumbs"><a href="/">Home</a> <span>/</span> <a href="/events/">Healing events</a> <span>/</span> <span>${esc(e.title)}</span></div>
    <div class="eyebrow">${past ? 'Past event' : 'Healing event'}</div><h1>${esc(e.title)}</h1>${e.subtitle ? `<p class="lead">${esc(e.subtitle)}</p>` : ''}
    <div class="meta-row"><span>${d}</span><span>·</span><span>${t}</span><span>·</span><span>${MODE[e.mode] || ''}</span></div>
    ${past || soldOut ? '' : '<div class="cta-row"><a class="btn btn-cta btn-lg" href="#book">Book your seat</a></div>'}</div></header>
    <section><div class="wrap layout evlayout"><article class="prose">${md(e.description)}${hl.length ? `<h2>What to expect</h2><ul>${hl.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}</article>
    <aside class="aside">${panel}</aside></div></section>`;

  // countdown
  const cd = $('.countdown', app);
  if (cd) { const t0 = new Date(e.start_at).getTime(); const tick = () => { const ms = t0 - Date.now(); if (ms <= 0) { cd.innerHTML = ''; return; }
    cd.innerHTML = `<div><b>${Math.floor(ms / 864e5)}</b><span>days</span></div><div><b>${Math.floor(ms / 36e5) % 24}</b><span>hours</span></div><div><b>${Math.floor(ms / 6e4) % 60}</b><span>mins</span></div>`; }; tick(); setInterval(tick, 30000); }

  const f = $('#evf', app); if (!f) return;
  const seatsIn = $('#bs'), max = +seatsIn.max;
  const upd = () => { let v = Math.max(1, Math.min(max, parseInt(seatsIn.value || '1', 10))); seatsIn.value = v; $('#btot').textContent = price(e.price * v); };
  f.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { seatsIn.value = (+seatsIn.value || 1) + (+b.dataset.d); upd(); });
  seatsIn.oninput = upd;
  const msg = (h, ok) => { $('#bmsg').innerHTML = h ? `<div class="${ok ? 'm-ok' : 'm-err'}" role="${ok ? 'status' : 'alert'}">${h}</div>` : ''; };
  f.querySelectorAll('input').forEach(i => i.addEventListener('input', () => msg('')));
  const btn = $('#bgo');
  const busy = (on, label) => { btn.disabled = on; btn.innerHTML = on ? `<span class="spin"></span>${label}` : (e.price ? 'Book &amp; pay' : 'Reserve my free seat'); };
  const done = (seats) => {
    $('#book').innerHTML = `<div class="evdone"><div class="evtick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>You’re booked!</h3>
      <p>${seats} seat${seats > 1 ? 's' : ''} for <b>${esc(e.title)}</b> on ${d}, ${t}.</p><p>${e.price ? 'Razorpay has emailed your receipt. ' : ''}Rikhil will message you on WhatsApp with the details before the event.</p>
      <div class="evcal"><a href="${gcal(e)}" target="_blank" rel="noopener">+ Google Calendar</a><a href="${icsHref(e)}" download="${esc(e.slug)}.ics">+ Apple / Outlook</a></div></div>`;
    $('#book').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  f.onsubmit = async (ev) => {
    ev.preventDefault(); upd();
    const name = $('#bn').value.trim(), email = $('#be').value.trim(), phone = $('#bp').value.trim(), seats = +seatsIn.value;
    if (!name) { msg('Enter your name.'); return $('#bn').focus(); }
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg('Enter a valid email address.'); return $('#be').focus(); }
    if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) { msg('Enter a valid WhatsApp number.'); return $('#bp').focus(); }
    busy(true, e.price ? 'Opening secure checkout…' : 'Reserving…');
    try {
      const r = await post('/api/event-book', { event_id: e.id, name, email, phone, seats });
      if (r.free) return done(seats);
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const paid = await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({ key: r.key_id, order_id: r.order_id, amount: r.amount, currency: r.currency, name: 'Alloha Qi Space', description: `${e.title} · ${seats} seat${seats > 1 ? 's' : ''}`,
          image: location.origin + '/assets/icon-192.png', prefill: { name, email, contact: phone }, theme: { color: '#18334C' },
          handler: async (resp) => { try { busy(true, 'Confirming your payment…'); await post('/api/event-verify', resp); resolve(true); } catch (x) { reject(x); } },
          modal: { ondismiss: () => resolve(false) } });
        rzp.on('payment.failed', (x) => reject(new Error(x.error?.description || 'Payment failed. No money was taken.')));
        rzp.open();
      });
      if (paid) done(seats); else busy(false);
    } catch (x) {
      busy(false);
      if (x.status === 500 || /not configured/i.test(x.message)) msg(`Online booking isn’t available right now. <a href="${WA}${encodeURIComponent(`Hi Rikhil, I'd like to book ${seats} seat(s) for ${e.title} on ${d}. Name: ${name}`)}" target="_blank" rel="noopener">Book on WhatsApp instead</a>`);
      else msg(esc(x.message));
    }
  };
}

(async () => {
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return;
  const app = document.getElementById('ev-app'), home = document.getElementById('home-events');
  try {
    if (home) await viewHome(home);
    if (app) await (app.dataset.view === 'event' ? viewEvent(app) : viewList(app));
  } catch (x) {
    console.error(x);
    if (app) app.innerHTML = `<div class="wrap"><div class="empty"><h3>Events couldn’t load</h3><p>${esc(x.message)}</p><p style="margin-top:1.2rem"><button class="btn btn-cta" onclick="location.reload()">Try again</button></p></div></div>`;
  }
})();
