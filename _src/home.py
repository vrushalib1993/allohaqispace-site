#!/usr/bin/env python3
"""Build the homepage following the brand's 'purposeful homepage' structure:
Hero · Our Approach · Practices · Why Qi Gong · Meet the Guide · Stories · Begin."""
import json
import build as B
from build import esc, wa, programs, posts, program_card, post_card, ICONS, _i

ICN = {
 "body": _i('<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6m0 0-4 7m4-7 4 7M5 10h14"/>'),
 "mind": _i('<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/>'),
 "day": _i('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 15h3"/>'),
 "energy": _i('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
 "calm": _i('<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'),
 "balance": _i('<path d="M12 3v18M5 21h14M5 8l-3 6h6zM19 8l-3 6h6zM5 8h14"/>'),
 "home": _i('<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
 "goal": _i('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
 "pin": _i('<path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
 "screen": _i('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
 "seed": _i('<path d="M12 21v-8M12 13c0-4 3-7 8-7 0 5-3 7-8 7zM12 13c0-3-2-5-6-5 0 3 2 5 6 5z"/>'),
 "wave": _i('<path d="M3 12h3l3-7 4 14 3-7h5"/>'),
 "user": _i('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>'),
 "eye": _i('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 "spine": ICONS["qi-core-improvement"].replace('<svg viewBox="0 0 24 24" aria-hidden="true">', "").replace("</svg>", ""),
}
def ico(k): return ICN[k] if k != "spine" else _i(ICN["spine"])

def opt(v, icon, label): return f'<button class="opt" data-v="{v}">{ico(icon)}{label}</button>'

filters = "".join(f'<button class="chip{" on" if f=="all" else ""}" data-f="{f}">{t}</button>' for f, t in [("all", "All practices"), ("body", "Body"), ("mind", "Mind"), ("recovery", "Recovery"), ("online", "Online")])
faqs = [
 ["Do I need any experience?", "No. Most people who come to us are complete beginners. The movements are simple, and Rikhil adapts them to your age, fitness and any physical limits."],
 ["What happens in the first session?", "You talk through what you’d like help with, then learn your first practice step by step. You leave with a short routine you can do at home."],
 ["How much does it cost?", "Fees depend on the practice and whether you choose a group class, a one-to-one session or an online session. Send a message and Rikhil will share the current fees, with no obligation."],
 ["Is it suitable if I have a health condition?", "Qigong is gentle and is practised alongside, never instead of, your doctor’s care. Tell Rikhil about your situation when you book so the session can be adapted."],
 ["Can I join online?", "Yes. Live online classes and one-to-one sessions are available, so you can practise from anywhere in the world."],
 ["Where is the centre?", "Unit 1, Kalpataru Regency 2, Lane 10, Kalyani Nagar, Pune 411006."],
]
qas = "".join(f'<div class="qa"><button aria-expanded="false">{esc(q)}</button><div class="ans">{"".join(f"<p>{esc(x)}</p>" for x in a.split(chr(10)+chr(10)))}</div></div>' for q, a in faqs)
opts_plain = "".join(f'<option value="{p["slug"]}">{esc(p["title"].split(" – ")[0])}</option>' for p in programs)

def img(pid, alt, w=800, ratio=None, cls="ph", eager=False):
    base=f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=70"
    rh=lambda x: f"&h={int(x*ratio)}" if ratio else ""
    src=f"{base}&w={w}{rh(w)}"
    ss=", ".join(f"{base}&w={x}{rh(x)} {x}w" for x in (480,800,1200,1600) if x<=w*2)
    return f'<div class="{cls}"><img src="{src}" srcset="{ss}" sizes="(max-width:980px) 100vw, 50vw" alt="{alt}" loading="{"eager" if eager else "lazy"}" decoding="async"></div>'

QUOTE = '<svg viewBox="0 0 24 24"><path d="M9.5 6C6 7.4 4 10 4 13.6V18h6v-6H7c0-2.3 1.2-3.9 3.3-4.8zM19.5 6C16 7.4 14 10 14 13.6V18h6v-6h-3c0-2.3 1.2-3.9 3.3-4.8z"/></svg>'

body = f'''
<header class="hero" id="top"><div class="hero-bg" aria-hidden="true"><img class="hero-photo" src="https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&q=72&w=1920" srcset="https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&q=72&w=800 800w, https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&q=72&w=1280 1280w, https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&q=72&w=1920 1920w, https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&q=72&w=2560 2560w" sizes="100vw" alt="" fetchpriority="high" decoding="async"><div class="hero-veil"></div><canvas id="qi"></canvas></div><div class="wrap">
 <div>
  <div class="eyebrow">Qi Gong classes · Kalyani Nagar, Pune &amp; online</div>
  <h1>Gentle Qi Gong for <span>less stress</span> and more energy.</h1>
  <p class="lead">Learn Zhineng Qigong in person in Pune or live online with certified teacher Rikhil Bithar. Simple movements anyone can learn, and short routines you can keep doing at home.</p>
  <div class="cta-row"><a class="btn btn-cta btn-lg" href="{wa("Hi Rikhil, I'd like to book my first Qigong session. Could you share available times and fees?")}" target="_blank" rel="noopener">Book your first session →</a></div>
  <ul class="reassure"><li>No experience needed</li><li>In person or online</li><li>Personal reply from Rikhil</li></ul>
  <p class="alt">Not sure which practice suits you? <a href="#finder">Take the 30-second practice finder</a></p>
 </div>
 <div class="hbook reveal">
  <div class="top"><div><b>Book your first session</b><small>Takes under a minute</small></div><span class="dot">Pune &amp; online</span></div>
  <form class="book" id="book">
   <div class="field"><label for="fn">Your name</label><input id="fn" required autocomplete="name" placeholder="e.g. Priya Sharma"></div>
   <div class="field"><label for="fs">What would you like help with?</label><select id="fs"><option value="unsure">Not sure yet, help me choose</option>{opts_plain}</select></div>
   <div class="field"><label>Where</label><div class="seg" data-v="at the Pune centre"><button type="button" class="on" data-v="at the Pune centre">Pune centre</button><button type="button" data-v="online">Online</button></div></div>
   <div class="field"><label>Preferred time</label><div class="pills"><button type="button" data-v="mornings">Morning</button><button type="button" data-v="afternoons">Afternoon</button><button type="button" data-v="evenings">Evening</button><button type="button" data-v="weekends">Weekend</button></div></div>
   <button class="btn btn-cta btn-lg" type="submit">Send booking request →</button>
   <p class="formnote">Opens WhatsApp with your details filled in. No payment needed now.</p>
  </form>
 </div>
</div></header>

<div class="marquee" aria-label="Our practices"><div class="mq-track">{"".join(('<a href="/'+p["slug"]+'/">'+esc(p["title"].split(" – ")[0])+'</a><i></i>') for p in programs*2)}</div></div>

<section class="bg-white meet" id="about"><div class="wrap">
 <div class="meet-grid">
  <div class="meet-media reveal">
   {B.yt("DCJgmAhAYRA","Meet Rikhil and Alloha Qi Space")}
   <div class="meet-badge"><div class="mono">RB</div><div><b>Rikhil Bithar</b><small>Founder &amp; teacher, Alloha Qi Space</small></div></div>
  </div>
  <div class="reveal">
   <div class="eyebrow">Meet your teacher</div>
   <h2>Rikhil Bithar teaches every student personally</h2>
   <p class="lead">Rikhil and his mother, Ravina Bithar, founded Alloha Qi Space after seeing first-hand how Qigong supported healing and recovery in their own family. They felt every family should have access to the same simple, practical tools.</p>
   <p>Today Rikhil teaches at the Kalyani Nagar centre and live online, shaping each session around your body, your goals and your pace. He also teaches the <a class="textlink" href="/qi-core-improvement/">Qi Core Improvement Series</a>, a six-form system for the spine and overall balance created by his teacher, Master Yuantong Liu.</p>
   <ul class="creds">
    <li><span class="ic">{ico("goal")}</span><div><b>Certified Hun Yuan Qi Therapist</b><small>Hands-on Qi therapy sessions</small></div></li>
    <li><span class="ic">{ico("user")}</span><div><b>Zhineng Qigong Level 1 Teacher</b><small>Trained under Master Yuantong Liu</small></div></li>
    <li><span class="ic">{ico("seed")}</span><div><b>Joyful Belly Ayurveda certified</b><small>College of Digestion &amp; Nutrition</small></div></li>
    <li><span class="ic">{ico("pin")}</span><div><b>Kalyani Nagar, Pune</b><small>Plus live online classes worldwide</small></div></li>
   </ul>
   <div class="cta-row"><a href="#book" class="btn btn-cta btn-lg">Book a session with Rikhil →</a><a href="/about-us/" class="btn btn-outline">Read his story</a></div>
  </div>
 </div>
</div></section>

<section class="nl-sec" id="newsletter"><div class="wrap"><div class="nl reveal">
 <div class="nl-copy"><div class="eyebrow">Free tips from Rikhil</div>
  <h2>Simple Qi Gong practices, straight to your inbox</h2>
  <p>Short guided practices, seasonal routines and ideas for a calmer body and a clearer mind. Once or twice a month, never spam.</p>
  <ul class="nl-points"><li>2-minute practices you can do at your desk</li><li>Early notice of healing events and new courses</li><li>Unsubscribe any time in one click</li></ul></div>
 <form class="nl-form" data-newsletter="home" novalidate>
  <div class="field"><label for="nlname">First name <span>(optional)</span></label><input id="nlname" name="name" autocomplete="given-name" placeholder="Priya"></div>
  <div class="field"><label for="nlemail">Email</label><input id="nlemail" name="email" type="email" autocomplete="email" required placeholder="name@example.com"></div>
  <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="nl-msg" aria-live="polite"></div>
  <button class="btn btn-cta btn-lg btn-block" type="submit" data-deco="plain">Send me free tips</button>
  <p class="nl-fine">We’ll only use your email to send Rikhil’s newsletter. See our <a href="/privacy-policy-2/">privacy policy</a>.</p>
 </form></div></div></section>

<section class="bg-cloud" id="approach"><div class="wrap">
 <div class="sec-head center reveal"><div class="eyebrow">Sound familiar?</div><h2>Qi Gong for the things that wear you down</h2><p class="lead">Slow, precise movement and focused attention, taught in plain language. Pick what bothers you most.</p></div>
 <div class="pains">
  <a class="pain reveal" href="/neck-health-care/">{img("1679077314738-55130e07acb7","Woman practising slow Qigong movement outdoors",600,0.62,"pimg")}<div class="ic">{ico("spine")}</div><h3>Stiff neck, shoulders or back</h3><p>Hours at a desk or on the phone add up. Gentle sequences for the neck and spine.</p><span class="textlink">Neck &amp; spine care →</span></a>
  <a class="pain reveal" href="/physical-and-mental-restoration/">{img("1791901191382-ac17c86c6871","Man meditating calmly in a green park",600,0.62,"pimg")}<div class="ic">{ico("calm")}</div><h3>Stress and a busy mind</h3><p>Awareness practice that helps you slow down, settle and think more clearly.</p><span class="textlink">Mental restoration →</span></a>
  <a class="pain reveal" href="/foundational-qigong-practice/">{img("1765418933129-706f2e31c78e","Man with arms open on a misty hillside",600,0.62,"pimg")}<div class="ic">{ico("energy")}</div><h3>Low energy by afternoon</h3><p>A short daily routine to help you feel more awake, without more coffee.</p><span class="textlink">Foundational practice →</span></a>
  <a class="pain reveal" href="/eye-recovery/">{img("1631690712891-cf272d4f89e5","Man sitting with eyes closed in a park",600,0.62,"pimg")}<div class="ic">{ico("eye")}</div><h3>Tired eyes from screens</h3><p>Simple eye and focus practices you can repeat between meetings.</p><span class="textlink">Eye care practice →</span></a>
 </div>
 <div class="center-cta reveal"><a class="btn btn-cta btn-lg" href="#book">Book a session</a><p>or <a class="textlink" style="font-size:.85rem" href="#finder">find the right practice for you →</a></p></div>
</div></section>

<section class="bg-white" id="how"><div class="wrap">
 <div class="sec-head center reveal"><div class="eyebrow">How it works</div><h2>Three simple steps to get started</h2></div>
 <div class="how">
  <div class="hstep reveal">{img("1655970580622-4a547789c850","Man at a table with headphones joining an online session",700,0.6,"himg")}<div class="num">1</div><h3>Send a message</h3><p>Tell Rikhil what you’d like help with, on WhatsApp or using the form. It takes a minute.</p></div>
  <div class="hstep reveal">{img("1792060052578-9dbe661cadbd","Bright, calm practice hall with a bamboo ceiling",700,0.6,"himg")}<div class="num">2</div><h3>Your first session</h3><p>In person in Kalyani Nagar or online. Talk through your goals and learn your first practice step by step.</p></div>
  <div class="hstep reveal">{img("1758798469179-dea5d63257ba","Group practising gentle movement together in a park",700,0.6,"himg")}<div class="num">3</div><h3>Practise and progress</h3><p>Leave with a short routine for home, then continue with classes or one-to-one sessions as you like.</p></div>
 </div>
 <div class="center-cta reveal"><a class="btn btn-cta btn-lg" href="{wa("Hi Rikhil, I'd like to book my first Qigong session. Could you share available times and fees?")}" target="_blank" rel="noopener">Start with step 1 →</a></div>
</div></section>

<section class="bg-cloud" id="practices"><div class="wrap">
 <div class="sec-head reveal"><div class="eyebrow">Practices</div><h2>Nine practices, one teacher who knows you</h2><p class="lead">Every practice is available at the Kalyani Nagar centre, and most can be learned through live online classes.</p></div>
 <div class="filters reveal" data-filter-group=".scard">{filters}</div>
 <div class="grid3">{"".join(program_card(p) for p in programs)}</div>
</div></section>
<div id="home-events"></div>


<section class="bg-cloud" id="stories"><div class="wrap grid2" style="gap:3rem;align-items:center">
 <div class="reveal"><div class="eyebrow">Stories</div><h2 style="margin:.7rem 0 1rem">In their own words</h2><p class="lead">People come to us with stress, fatigue and stiffness, and leave with practices they keep using every day.</p>
  <div class="cta-row"><a class="btn btn-cta" href="#book">Book your first session</a></div></div>
 <div class="story reveal"><div class="mark">{QUOTE}</div><p>After years of struggling with chronic fatigue and stress, these practices restored my energy and brought a sense of peace and clarity.</p>
  <div class="who"><div class="av">RK</div><div><b style="font-family:var(--head);color:var(--navy)">Ria Kapoor</b><br><small>Author</small></div></div></div>
</div></section>

<section class="bg-white" id="try"><div class="wrap why">
 <div class="reveal"><div class="eyebrow">Try it free, right now</div><h2 style="margin:.7rem 0 1rem">Feel the difference in one minute</h2>
  <p class="lead">This short awareness exercise is a taste of how Zhineng Qigong works. Press start and follow the circle with your attention.</p>
  <div class="quote"><p>“The universe and human life are interconnected.”</p><small>Dr. Pang Ming, creator of Zhineng Qigong</small></div>
  <p style="margin-top:1.6rem"><a class="textlink" href="#listen">Or listen to a guided sound practice →</a></p></div>
 <div class="aw reveal" aria-label="Awareness exercise">
  <h3>One-minute awareness exercise</h3><p class="sub">Follow the circle with your attention, not your breath.</p>
  <div class="breath" id="breath" role="button" aria-label="Start or stop the exercise"><div class="wave"></div><div class="wave w2"></div><div class="wave w3"></div><div class="ring"></div><div class="core" id="core"></div><div class="label" id="blabel">Start</div></div>
  <p class="bcap" id="bcap" aria-live="polite">Sit comfortably and relax. Your awareness can travel beyond your body, fill the space around you, and return within.</p>
  <div class="aw-ctrl"><button class="on" data-p="6,5,6">Gentle</button><button data-p="10,8,10">Deep</button><button id="bstart">Start exercise</button></div>
 </div>
</div></section>

<section class="bg-soft" id="finder"><div class="wrap finder">
 <div class="reveal"><div class="eyebrow">Practice finder</div><h2 style="margin:.7rem 0 1rem">Not sure where to start?</h2>
  <p class="lead">Answer three quick questions and we’ll suggest a practice you can book in one tap.</p>
  <ol class="steps"><li><b>1</b><div><h4>Tell us your goal</h4><p>Energy, calm, recovery or a specific area of the body.</p></div></li>
  <li><b>2</b><div><h4>Choose how you practise</h4><p>Visit the Pune centre or join online from anywhere.</p></div></li>
  <li><b>3</b><div><h4>Get a suggestion</h4><p>A recommended practice with a ready-to-send message.</p></div></li></ol></div>
 <div class="quiz reveal" id="quiz">
  <div class="qtop"><span id="qcount">Question 1 of 3</span><span>About 30 seconds</span></div>
  <div class="qprog"><i id="qbar"></i></div>
  <div class="qstep on" data-q="goal"><h3>What would you most like help with?</h3><div class="opts">
   {opt("energy","energy","More energy")}{opt("calm","calm","Stress &amp; calm")}{opt("pain","spine","Neck, back or spine")}{opt("eyes","eye","Eye strain &amp; focus")}{opt("recovery","seed","Recovering after illness or surgery")}{opt("start","goal","Just curious, new to Qigong")}</div></div>
  <div class="qstep" data-q="mode"><h3>How would you like to practise?</h3><div class="opts">{opt("pune","pin","In person, Pune")}{opt("online","screen","Online, from home")}</div></div>
  <div class="qstep" data-q="exp"><h3>Your experience so far?</h3><div class="opts">{opt("new","seed","Complete beginner")}{opt("some","wave","Some yoga or meditation")}{opt("exp","balance","I’ve practised Qigong")}{opt("guided","user","I’d like one-to-one guidance")}</div></div>
  <div class="qstep result" data-q="result" id="result"></div>
 </div>
</div></section>

<section class="bg-cloud" id="listen"><div class="wrap">
 <div class="sec-head reveal"><div class="eyebrow">Listen &amp; practise</div><h2>Guided practices &amp; calming sounds</h2><p class="lead">Press play, close your eyes and let the sound guide your attention. Headphones work best.</p></div>
 {img("1734713117039-7f68f56c5878","Hands holding a brass singing bowl",1400,0.32,"banner reveal")}
 <div id="mytracks"></div>
 <div class="sgroup">Practice tones</div>
 <div class="tracks" id="tones"></div>
</div></section>

<section class="bg-white" id="faq"><div class="wrap grid2" style="gap:4rem;align-items:start">
 <div class="reveal"><div class="eyebrow">Before you book</div><h2 style="margin:.7rem 0 1rem">Your questions, answered</h2><p class="lead">Still unsure? Ask Rikhil directly. He’s happy to talk it through before you commit.</p>
  <div class="cta-row"><a class="btn btn-cta" href="{wa("Hi Rikhil, I have a question before booking a Qigong session.")}" target="_blank" rel="noopener">Ask a question on WhatsApp</a><a class="btn btn-outline" href="/faq/">All FAQs</a></div></div>
 <div class="reveal">{qas}</div>
</div></section>

<section class="bg-cloud" id="begin" style="padding-top:0"><div class="wrap">
 <div class="final reveal" id="contact"><div class="fbg" aria-hidden="true"><img src="https://images.unsplash.com/photo-1773034271721-075311cecd89?auto=format&fit=crop&q=60&w=1400" alt="" loading="lazy"></div>
  <div><div class="eyebrow">Begin</div><h2 style="margin-top:.7rem">Your first session is one message away.</h2>
   <p>Tell Rikhil what you’d like help with and he’ll reply personally with times and fees for Pune or online sessions.</p>
   <ul class="reassure"><li>No experience needed</li><li>No payment to enquire</li><li>Pune centre or online</li></ul></div>
  <div class="acts">
   <a class="btn btn-cta btn-lg" href="{wa("Hi Rikhil, I'd like to book my first Qigong session. Could you share available times and fees?")}" target="_blank" rel="noopener">Book on WhatsApp →</a>
   <a class="btn btn-outline-white btn-lg" href="tel:+919881192288">Call +91 98811 92288</a>
   <small>{B.ADDR}</small>
  </div>
 </div>
</div></section>

<div class="player" id="player" aria-live="polite">
  <button class="pbtn" id="pplay" aria-label="Play or pause"></button>
  <div class="pinfo"><b id="ptitle">—</b><div class="pbar"><span id="pcur">0:00</span><input type="range" id="pseek" min="0" max="1000" value="0" aria-label="Seek"><span id="pdur">0:00</span></div></div>
  <div class="pctl"><button class="picon ptimer" id="ptimer" title="Sleep timer">⏲ Off</button><button class="picon" id="ploop" title="Repeat" aria-label="Repeat">↻</button><button class="picon" id="pclose" title="Close" aria-label="Close player">✕</button></div>
</div>
'''
B.page("/", "Alloha Qi Space: Qi Gong Classes in Kalyani Nagar, Pune & Online",
       "Gentle Qi Gong classes in Kalyani Nagar, Pune, and online with certified teacher Rikhil Bithar. No experience needed. Book your first session on WhatsApp.",
       body, ld=[B.BUSINESS, {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]}], mbar=B.mbar_html("Book your first session", "#book", 700), scripts=f'\n<script src="/assets/home.js?v={B.ver("home.js")}" defer></script>' + B.ev_scripts())
print("homepage built")
