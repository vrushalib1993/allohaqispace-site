#!/usr/bin/env python3
"""Generate the Alloha Qi Space site pages into the repo folder."""
import json, re, os, math, html
from pathlib import Path
import markdown

SRC = Path(__file__).parent / "content"
OUT = Path(__file__).resolve().parent.parent
DOMAIN = "https://allohaqispace.com"
WA = "919881192288"
TODAY = "2026-11-19"
ADDR = "Unit 1, Kalpataru Regency 2, Lane 10, Kalyani Nagar, Pune 411006"
MAPS = "https://www.google.com/maps/search/?api=1&query=Kalpataru+Regency+2+Lane+10+Kalyani+Nagar+Pune+411006"

def esc(s): return html.escape(s, quote=True)
def wa(t): from urllib.parse import quote; return f"https://wa.me/{WA}?text={quote(t)}"

# ---------- content loading ----------
def load_md(p):
    t = p.read_text()
    meta = {}
    if t.startswith("---"):
        _, fm, body = t.split("---", 2)
        for line in fm.strip().splitlines():
            k, v = line.split(":", 1); meta[k.strip()] = v.strip()
    else:
        body = t
    return meta, body.strip()

def render_md(body):
    md = markdown.Markdown(extensions=["toc", "sane_lists", "attr_list"], extension_configs={"toc": {"permalink": False}})
    out = md.convert(body)
    out = re.sub(r"<p>\{\{video:([\w-]{11})\}\}</p>", lambda m: yt(m.group(1)), out)
    out = out.replace("<p>{{contact}}</p>", contact_block())
    return out, md.toc_tokens

def flat_toc(tokens, depth=0):
    out = []
    for t in tokens:
        out.append((t["level"], t["id"], re.sub("<[^>]+>", "", t["name"])))
        out += flat_toc(t["children"], depth + 1)
    return out

def toc_html(tokens):
    items = [i for i in flat_toc(tokens) if i[0] in (2, 3)]
    if len(items) < 3: return ""
    lis = "".join(f'<li class="l{l}"><a href="#{i}">{html.unescape(n)}</a></li>' for l, i, n in items)
    return f'<div class="card"><div class="eyebrow" style="margin-bottom:1rem">On this page</div><ul class="toc">{lis}</ul></div>'

def yt(vid, title="Watch the video"):
    return f'<div class="yt" data-id="{vid}" data-title="{esc(title)}" role="button" aria-label="Play video"><button aria-label="Play"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg></button><span>▶ {esc(title)}</span></div>'

def contact_block():
    return ('<div class="card" style="margin-top:2.4rem"><h3>Questions?</h3><p>Contact Alloha Qi Space at '
            f'{ADDR}, Maharashtra, India, or message us on WhatsApp at <a href="https://wa.me/{WA}">+91 98811 92288</a>.</p></div>')

def reading_time(body): return max(1, math.ceil(len(body.split()) / 220))

# ---------- data ----------
PROGRAM_ORDER = ["foundational-qigong-practice", "neck-health-care", "eye-recovery", "restructuring-with-zhineng-qi-gong",
                 "qi-core-improvement", "physical-and-mental-restoration", "special-care-for-delicate-situations",
                 "comprehensive-consultations", "online-healing-classes"]
programs = []
for slug in PROGRAM_ORDER:
    meta, body = load_md(SRC / "programs" / f"{slug}.md")
    programs.append(dict(slug=slug, body=body, **meta))

POST_PATHS = {
    "the-transformative-power-of-qigong-ancient-chinese-healing-secrets-for-modern-wellness": "2026/08/30",
    "zhineng-qi-gong-harnessing-the-energy-of-life-through-an-open-system": "2025/01/26",
    "adjusting-the-mind-returning-to-wholeness-and-living-with-clarity": "2025/01/26",
    "efficient-digestion-the-gateway-to-health-stability-and-safety": "2025/01/26",
    "carpe-diem-optimization-a-new-way-to-maximize-life-and-resources": "2025/01/23",
}
posts = []
for slug, d in POST_PATHS.items():
    meta, body = load_md(SRC / "journal" / f"{slug}.md")
    posts.append(dict(slug=slug, path=f"/{d}/{slug}/", body=body, **meta))
posts.sort(key=lambda p: p["date"], reverse=True)
HUES = [("#468FE9", "#DCEBF6"), ("#18334C", "#468FE9"), ("#DCEBF6", "#468FE9"), ("#468FE9", "#F7A253"), ("#18334C", "#DCEBF6")]

def art(i):
    bg, fg = HUES[i % len(HUES)]
    cx = [150, 60, 120, 170, 40][i % 5]; cy = [40, 80, 30, 85, 35][i % 5]
    return (f'<div class="art" style="background:{bg}"><svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice">'
            f'<circle cx="{cx}" cy="{cy}" r="58" fill="{fg}" opacity=".9"/><circle cx="{cx}" cy="{cy}" r="34" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>'
            f'<rect x="16" y="88" width="28" height="4" rx="2" fill="#F7A253"/></svg></div>')

POST_IMG = {
    "the-transformative-power-of-qigong-ancient-chinese-healing-secrets-for-modern-wellness": ("1757138100328-c246b5795aa3", "People practising Qigong together in a park beside a Chinese pavilion"),
    "zhineng-qi-gong-harnessing-the-energy-of-life-through-an-open-system": ("1782272911334-e1be166e7aba", "Person with arms raised towards the sunrise over the hills"),
    "adjusting-the-mind-returning-to-wholeness-and-living-with-clarity": ("1616569925882-18e6a431bba9", "Woman sitting quietly in meditation on a calm beach"),
    "efficient-digestion-the-gateway-to-health-stability-and-safety": ("1497888329096-51c27beff665", "Bright bowls of fresh, simple food on a light table"),
    "carpe-diem-optimization-a-new-way-to-maximize-life-and-resources": ("1711030239027-4ee82270f3f8", "Open planner and pens laid out for the day ahead"),
}
def uimg(pid, w, h=None):
    return f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=70&w={w}" + (f"&h={h}" if h else "")
def post_img(p, cls="art", w=800, ratio=0.5625, eager=False):
    pid, alt = POST_IMG[p["slug"]]
    ss = ", ".join(f"{uimg(pid, x, int(x*ratio))} {x}w" for x in (480, 800, 1200, 1600) if x <= w*2)
    return (f'<div class="{cls}"><img src="{uimg(pid, w, int(w*ratio))}" srcset="{ss}" sizes="(max-width:980px) 100vw, 60vw" '
            f'alt="{esc(alt)}" loading="{"eager" if eager else "lazy"}" decoding="async"></div>')

def fmt_date(d):
    y, m, dd = d.split("-")
    return f"{int(dd)} {['January','February','March','April','May','June','July','August','September','October','November','December'][int(m)-1]} {y}"

# ---------- shared chrome ----------
LOGO_IMG = '<img src="/assets/logo.webp" alt="Alloha Qi Space: Unite Body, Mind and Nature" width="302" height="67">'
NAV_ITEMS = [("Practices", "/programs/"), ("Healing Events", "/events/"), ("Listen", "/#listen"), ("About", "/about-us/"), ("Journal", "/inspiration/"), ("FAQ", "/faq/"), ("Contact", "/contact-us/")]

def nav_html(cur=""):
    lis = "".join(f'<li><a href="{h}"{" class=\"cur\"" if cur==h else ""}>{t}</a></li>' for t, h in NAV_ITEMS)
    return (f'<nav class="top" id="nav"><div class="wrap"><a href="/" class="logo" aria-label="Alloha Qi Space home">{LOGO_IMG}</a>'
            f'<ul class="links" id="links">{lis}<li><a href="/contact-us/#book" class="btn btn-cta">Book a session</a></li></ul>'
            '<button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button></div></nav>')

WA_ICON = '<svg viewBox="0 0 32 32"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z"/></svg>'

CALL_SVG = '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
def mbar_html(label="Book a session on WhatsApp", href=None, after=500):
    href = href or wa("Hi Rikhil, I'd like to book a Qigong session. Could you share available times and fees?")
    ext = '' if href.startswith('#') else ' target="_blank" rel="noopener"'
    return (f'<div class="mbar" id="mbar" data-after="{after}"><a class="btn btn-cta" href="{href}"{ext}>{label}</a>'
            f'<a class="btn btn-outline btn-icon" href="tel:+919881192288" aria-label="Call Rikhil">{CALL_SVG}</a></div>')

def footer_html():
    progs = "".join(f'<li><a href="/{p["slug"]}/">{esc(p["title"].split(" – ")[0])}</a></li>' for p in programs)
    return f'''<footer class="site"><div class="wrap">
<div class="fgrid">
 <div><a href="/" class="flogo" aria-label="Alloha Qi Space home">{LOGO_IMG}</a><p>Zhineng Qigong and Hun Yuan Qi therapy in Kalyani Nagar, Pune, and online worldwide.</p>
  <p style="margin-top:1rem"><a href="{MAPS}" target="_blank" rel="noopener">{ADDR}</a></p>
  <p style="margin-top:.6rem"><a href="https://wa.me/{WA}" target="_blank" rel="noopener">WhatsApp +91 98811 92288</a></p></div>
 <div><h4>Programs</h4><ul>{progs}</ul></div>
 <div><h4>Explore</h4><ul><li><a href="/about-us/">About us</a></li><li><a href="/programs/">All programs</a></li><li><a href="/#finder">Practice finder</a></li><li><a href="/#listen">Listen &amp; practise</a></li><li><a href="/inspiration/">Journal</a></li><li><a href="/events/">Healing events</a></li><li><a href="/shop/">Shop</a></li><li><a href="/faq/">FAQ</a></li></ul></div>
 <div><h4>Visit</h4><ul><li><a href="/contact-us/">Contact &amp; booking</a></li><li><a href="{MAPS}" target="_blank" rel="noopener">Open in Google Maps</a></li><li><a href="https://wa.me/{WA}" target="_blank" rel="noopener">Chat on WhatsApp</a></li><li><a href="tel:+919881192288">Call +91 98811 92288</a></li></ul></div>
</div>
<p class="disc">Qigong is a complementary wellness practice and is not a substitute for medical diagnosis or treatment. Please continue any treatment prescribed by your doctor and consult them before starting new practices, especially during pregnancy or after surgery.</p>
<div class="fbot"><span>© <span class="yr">2026</span> Alloha Qi Space · Kalyani Nagar, Pune</span><nav><a href="/terms-of-service/">Terms</a><a href="/privacy-policy-2/">Privacy</a><a href="/refund-policy/">Refunds</a></nav></div>
</div></footer>
<a class="wa-float" href="{wa("Hi Rikhil, I'd like to know more about Qigong sessions.")}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{WA_ICON}</a>
<div class="toast" id="toast"></div>'''

import hashlib
def ver(f): return hashlib.md5((OUT/"assets"/f).read_bytes()).hexdigest()[:8]

ARROW = '<span class="arr" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>'
WA_ICON = '<span class="wai" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8C29 8.7 23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.6-5.7C5.2 10 10 5.3 16 5.3S26.8 10 26.8 15.8 22 26.4 16 26.4zm5.9-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.2 1.4 3.4 2.4 3.6 5.8 5c2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.2-.6-.3z"/></svg></span>'
_btn_re = re.compile(r'(<(a|button)\b[^>]*class="[^"]*\bbtn-cta\b[^"]*"[^>]*>)(.*?)(</\2>)', re.S)
def add_arrows(doc):
    def f(m):
        open_tag, inner = m.group(1), m.group(3)
        if 'data-deco' in open_tag: return m.group(0)
        inner = re.sub(r'\s*→\s*$', '', inner).strip()
        is_wa = 'wa.me' in open_tag or 'type="submit"' in open_tag
        tag = open_tag[:-1] + (' data-deco="wa">' if is_wa else ' data-deco="arr">')
        body = (WA_ICON + f'<span class="lbl">{inner}</span>') if is_wa else (f'<span class="lbl">{inner}</span>' + ARROW)
        return tag + body + m.group(4)
    return _btn_re.sub(f, doc)

def page(path, title, desc, body, cur="", ld=None, progress=False, og_type="website", scripts="", mbar=None, og_image=None):
    canon = DOMAIN + path
    lds = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in (ld or []))
    full_title = title if "Alloha" in title else f"{title} | Alloha Qi Space"
    doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="{og_type}">{f'<meta property="og:image" content="{og_image}"><meta name="twitter:card" content="summary_large_image">' if og_image else ""}
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:site_name" content="Alloha Qi Space">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#18334C">
<link rel="icon" href="/assets/icon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v={ver("site.css")}">
{lds}
</head>
<body>
<div class="progress" id="progress"></div>
{nav_html(cur)}
{body}
{footer_html()}
{mbar if mbar is not None else mbar_html()}
<script src="/assets/site.js?v={ver("site.js")}" defer></script>{scripts}
</body>
</html>
'''
    doc = add_arrows(doc)
    dest = OUT / path.strip("/") / "index.html" if path != "/404" else OUT / "404.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(doc)
    return path

HERO_DEFAULT = "1552152370-fb05b25ff17d"
PROGRAM_IMG = {
    "foundational-qigong-practice": ("1773204989457-57809a3cda73", "Man practising slow Qigong movement among tall trees"),
    "neck-health-care": ("1679076897714-f2b3ccc59399", "Woman gently stretching her neck and upper back outdoors"),
    "eye-recovery": ("1554244933-d876deb6b2ff", "Woman resting with her eyes closed"),
    "restructuring-with-zhineng-qi-gong": ("1795059405665-850723b951a5", "Two people practising Qigong on a tree-lined park path"),
    "qi-core-improvement": ("1679077225037-c7e701e2d2e5", "Woman holding a Qigong posture in a grassy field"),
    "physical-and-mental-restoration": ("1767611120077-3697335ec748", "Person sitting quietly on a mat in a bright, calm room"),
    "special-care-for-delicate-situations": ("1593164842264-854604db2260", "Woman in a gentle seated pose in a light-filled room"),
    "comprehensive-consultations": ("1667061481921-b31e615ae740", "Calm, bright practice room with soft lighting"),
    "online-healing-classes": ("1679076875671-a30b4dbc6016", "Woman sitting comfortably, ready to practise"),
}
def hero_photo(pid, focus="center 60%"):
    u = f"https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=72"
    return (f'<div class="phero-bg" aria-hidden="true"><img class="hero-photo" src="{u}&w=1600" srcset="{u}&w=800 800w, {u}&w=1280 1280w, {u}&w=1920 1920w" '
            f'sizes="100vw" alt="" fetchpriority="high" decoding="async" style="object-position:{focus}"><div class="phero-veil"></div></div>')

def hero(eyebrow, h1, lead="", crumbs=None, extra="", tags=None, img=None, focus="center 60%"):
    cr = ""
    if crumbs:
        cr = '<div class="crumbs">' + " <span>/</span> ".join(f'<a href="{h}">{esc(t)}</a>' if h else f"<span>{esc(t)}</span>" for t, h in crumbs) + "</div>"
    tg = ('<div class="tags">' + "".join(f'<span class="tag">{esc(t)}</span>' for t in tags) + "</div>") if tags else ""
    return (f'<header class="phero has-photo">{hero_photo(img or HERO_DEFAULT, focus)}<div class="wrap">{cr}{tg}'
            f'{f"<div class=eyebrow>{eyebrow}</div>" if eyebrow else ""}<h1>{h1}</h1>'
            f'{f"<p class=lead>{lead}</p>" if lead else ""}{extra}</div></header>')

def cta_band(title="Begin your path to wellness", text="Visit the centre in Kalyani Nagar, Pune, or join a class online. Message Rikhil and he'll reply personally.", msg="Hi Rikhil, I'd like to know more about Qigong sessions."):
    return (f'<section style="padding-top:0"><div class="wrap"><div class="cta-band reveal"><div><h2>{title}</h2><p>{text}</p></div>'
            f'<div class="row"><a class="btn btn-cta" href="{wa(msg)}" target="_blank" rel="noopener">Message on WhatsApp</a>'
            f'<a class="btn btn-outline-white" href="/#finder">Find your practice</a></div></div></div></section>')

BUSINESS = {
    "@context": "https://schema.org", "@type": "HealthAndBeautyBusiness", "name": "Alloha Qi Space",
    "url": DOMAIN + "/", "telephone": "+91-98811-92288",
    "description": "Zhineng Qigong classes, Hun Yuan Qi therapy and holistic wellness consultations in Kalyani Nagar, Pune, and online.",
    "address": {"@type": "PostalAddress", "streetAddress": "Unit 1, Kalpataru Regency 2, Lane 10, Kalyani Nagar", "addressLocality": "Pune", "addressRegion": "Maharashtra", "postalCode": "411006", "addressCountry": "IN"},
    "founder": {"@type": "Person", "name": "Rikhil Bithar"}, "areaServed": ["Pune", "Online"],
}

def breadcrumb_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": DOMAIN + h} for i, (n, h) in enumerate(items)]}


def _i(d): return f'<svg viewBox="0 0 24 24" aria-hidden="true">{d}</svg>'
ICONS = {
 "foundational-qigong-practice": _i('<path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"/>'),
 "neck-health-care": _i('<circle cx="12" cy="6" r="3.2"/><path d="M10 9.5v3.5M14 9.5v3.5M6 21c0-4.4 2.7-8 6-8s6 3.6 6 8"/>'),
 "eye-recovery": _i('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 "restructuring-with-zhineng-qi-gong": _i('<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5"/>'),
 "qi-core-improvement": _i('<path d="M12 2v20"/><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="10" r="1.6"/><circle cx="12" cy="15" r="1.6"/><circle cx="12" cy="20" r="1.2"/><path d="M8 7.5h8M8 12.5h8M8 17.5h8"/>'),
 "physical-and-mental-restoration": _i('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
 "special-care-for-delicate-situations": _i('<path d="M12 20s-7.5-4.6-9.5-9A5 5 0 0 1 12 6.3 5 5 0 0 1 21.5 11c-2 4.4-9.5 9-9.5 9z"/>'),
 "comprehensive-consultations": _i('<path d="M21 12a8 8 0 0 1-11.6 7.2L4 20.5l1.3-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4.5"/>'),
 "online-healing-classes": _i('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
}

pages = []

# ---------- program pages ----------
def program_card(p, i=0):
    tags = p["tags"].replace(",", " ")
    pid, alt = PROGRAM_IMG[p["slug"]]
    return (f'<a class="scard reveal" href="/{p["slug"]}/" data-tags="{tags}"><div class="sthumb"><img src="https://images.unsplash.com/photo-{pid}?auto=format&fit=crop&q=70&w=640&h=400" alt="{esc(alt)}" loading="lazy" decoding="async"></div><div class="ico">{ICONS.get(p["slug"],"")}</div>'
            f'<h3>{esc(p["title"].split(" – ")[0])}</h3><p>{esc(p["summary"])}</p><span class="textlink">Discover →</span></a>')

for i, p in enumerate(programs):
    content, toks = render_md(p["body"])
    others = [programs[(i + k) % len(programs)] for k in (1, 2, 3)]
    name = p["title"]
    book = f'''<div class="card navy"><div class="eyebrow" style="color:#8fbaf2;margin-bottom:.6rem">Book this program</div>
<h3 >{esc(name)}</h3><p>Choose where you'd like to practise. Rikhil will reply on WhatsApp with timings and fees.</p>
<div class="seg" data-v="at the Pune centre"><button class="on" data-v="at the Pune centre">Pune centre</button><button data-v="online">Online</button></div>
<a class="btn btn-cta btn-block" href="{wa(f'Hi Rikhil, I am interested in "{name}".')}" data-book="{esc(name)}">Book this practice →</a>
<a class="btn btn-block" style="color:#fff;min-height:auto;padding:.6rem 0 0;text-decoration:underline;text-underline-offset:3px;font-weight:500" href="/contact-us/?program={p["slug"]}#book">or use the booking form</a></div>'''
    finder = '<div class="card"><h3>Not sure this is right for you?</h3><p>Answer three quick questions and we’ll suggest the best program for you.</p><a class="btn btn-outline" href="/#finder">Take the practice finder</a></div>'
    body = hero("", esc(p.get("h1", name)), esc(p["summary"]), img=PROGRAM_IMG[p["slug"]][0], focus="center 45%", crumbs=[("Home", "/"), ("Programs", "/programs/"), (name, None)],
                tags=[t.strip() for t in p["tags"].split(",")],
                extra=f'<div class="cta-row"><a class="btn btn-cta btn-lg" href="{wa(f"Hi Rikhil, I would like to book the {name} practice. Could you share available times and fees?")}" target="_blank" rel="noopener">Book this practice →</a><a class="btn btn-outline btn-lg" href="#content">How it works</a></div><ul class="reassure"><li>No experience needed</li><li>In person or online</li><li>Personal reply from Rikhil</li></ul>')
    body += f'''<section id="content"><div class="wrap layout"><article class="prose reveal">{content}</article>
<aside class="aside">{book}{toc_html(toks)}{finder}</aside></div></section>
<section class="bg-white"><div class="wrap"><div class="sec-head reveal"><div class="eyebrow">Keep exploring</div><h2>Other programs</h2></div>
<div class="grid3">{"".join(program_card(o) for o in others)}</div>
<p style="margin-top:2rem"><a class="btn btn-outline" href="/programs/">See all 9 programs →</a></p></div></section>
<section>{cta_band().replace('<section style="padding-top:0">','').replace('</section>','')}</section>'''
    ld = [breadcrumb_ld([("Home", "/"), ("Programs", "/programs/"), (name, f"/{p['slug']}/")]),
          {"@context": "https://schema.org", "@type": "Service", "name": name, "description": p["summary"], "provider": {"@type": "HealthAndBeautyBusiness", "name": "Alloha Qi Space", "url": DOMAIN + "/"}, "areaServed": ["Pune", "Online"], "url": f"{DOMAIN}/{p['slug']}/"}]
    pages.append(page(f"/{p['slug']}/", name, p["summary"], body, cur="/programs/", ld=ld, progress=True,
                      mbar=mbar_html("Book this practice", wa(f"Hi Rikhil, I would like to book the {name} practice. Could you share available times and fees?"), 400)))

# ---------- programs index ----------
filters = "".join(f'<button class="chip{" on" if f=="all" else ""}" data-f="{f}">{t}</button>' for f, t in [("all", "All"), ("body", "Body"), ("mind", "Mind"), ("recovery", "Recovery"), ("online", "Online")])
body = hero("Programs", "Support for every step of your <span class=hl>healing &amp; awakening</span>",
            "Together you will have an intelligent blueprint that raises the quality and function of your life. Rotating these practices takes care of different parts of the body through the days and months, so the body works well as a whole.",
            crumbs=[("Home", "/"), ("Programs", None)],
            extra=f'<div class="cta-row"><a class="btn btn-primary" href="/#finder">Find your practice</a><a class="btn btn-outline" href="/contact-us/#book">Book a session</a></div>')
body += f'''<section class="bg-white"><div class="wrap"><div class="filters reveal" data-filter-group=".scard">{filters}</div>
<div class="grid3">{"".join(program_card(p) for p in programs)}</div></div></section>
<section><div class="wrap grid2" style="align-items:center;gap:3rem">
<div class="reveal"><div class="eyebrow">In person &amp; online</div><h2 style="font-size:clamp(1.9rem,3.6vw,2.8rem);margin:.6rem 0 1rem">Practise in Pune or from anywhere</h2>
<p style="color:var(--muted);font-size:1.05rem">Every program is available at the Kalyani Nagar centre, and most can be learned through live online classes and Hun Yuan Qi healing sessions. Not sure where to begin? The Foundational Qigong Practice is the best first step.</p>
<p style="margin-top:1.6rem;display:flex;gap:.8rem;flex-wrap:wrap"><a class="btn btn-primary" href="/foundational-qigong-practice/">Start with the foundation</a><a class="btn btn-outline" href="/online-healing-classes/">About online classes</a></p></div>
<div class="reveal">{yt("NhQU8aqjVoE", "Dr. Pang Ming, creator of Zhineng Qigong")}</div></div></section>
{cta_band()}'''
pages.append(page("/programs/", "Qigong Programs in Pune & Online", "Nine Zhineng Qigong programs for the body, mind and recovery: foundational practice, neck and eye care, spine, restoration, consultations and online healing.", body, cur="/programs/",
                  ld=[breadcrumb_ld([("Home", "/"), ("Programs", "/programs/")])]))

# ---------- journal posts ----------
def post_card(p, i, feature=False):
    cat = p["category"]
    return (f'<a class="post reveal{" feature" if feature else ""}" href="{p["path"]}" data-tags="{cat.lower()}">{post_img(p)}<div class="body">'
            f'<small>{esc(cat)} · {fmt_date(p["date"])}</small><h3>{esc(p["title"])}</h3><p>{esc(p["excerpt"])}</p><span class="textlink">Read article →</span></div></a>')

for i, p in enumerate(posts):
    content, toks = render_md(p["body"])
    rt = reading_time(p["body"])
    related = [q for q in posts if q is not p][:3]
    share = f'''<div class="card"><div class="eyebrow" style="margin-bottom:.8rem">Share</div><div style="display:flex;gap:.6rem;flex-wrap:wrap">
<a class="btn btn-wa" style="padding:.7em 1.1em;font-size:.85rem" href="https://wa.me/?text={esc(p["title"])}%20{DOMAIN}{p["path"]}" target="_blank" rel="noopener">WhatsApp</a>
<button class="btn btn-outline" style="padding:.7em 1.1em;font-size:.85rem" data-copy>Copy link</button></div></div>'''
    learn = '<div class="card navy"><h3 >Learn this in person</h3><p>Practise Zhineng Qigong with Rikhil at the Kalyani Nagar centre or online.</p><a class="btn btn-white" href="/programs/">Explore programs</a></div>'
    body = hero("", esc(p["title"]), crumbs=[("Home", "/"), ("Journal", "/inspiration/"), (p["category"], None)],
                extra=f'<div class="meta-row"><span>{esc(p["category"])}</span><span>·</span><span>{fmt_date(p["date"])}</span><span>·</span><span>{rt} min read</span><span>·</span><span>By Alloha Qi Space</span></div>')
    body += f'''<section class="cover-sec"><div class="wrap">{post_img(p, "cover", 1400, 0.42, eager=True)}</div></section>
<section><div class="wrap layout"><article class="prose reveal">{content}</article>
<aside class="aside">{toc_html(toks)}{share}{learn}</aside></div></section>
<section style="padding-top:0"><div class="wrap"><div class="sec-head reveal"><div class="eyebrow">Keep reading</div><h2>More from the journal</h2></div>
<div class="grid3">{"".join(post_card(q, posts.index(q)) for q in related)}</div></div></section>{cta_band()}'''
    ld = [breadcrumb_ld([("Home", "/"), ("Journal", "/inspiration/"), (p["title"], p["path"])]),
          {"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"], "description": p["excerpt"], "datePublished": p["date"], "dateModified": p["date"],
           "author": {"@type": "Organization", "name": "Alloha Qi Space"}, "publisher": {"@type": "Organization", "name": "Alloha Qi Space"}, "mainEntityOfPage": DOMAIN + p["path"]}]
    pages.append(page(p["path"], p["title"], p["excerpt"], body, cur="/inspiration/", ld=ld, progress=True, og_type="article", og_image=uimg(POST_IMG[p["slug"]][0], 1200, 630)))

# ---------- journal index ----------
cats = sorted({p["category"] for p in posts})
jf = '<button class="chip on" data-f="all">All</button>' + "".join(f'<button class="chip" data-f="{c.lower()}">{c}</button>' for c in cats)
search = '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="ps" type="search" placeholder="Search articles…" aria-label="Search articles"></div>'
body = hero("Journal", "Inspiration for <span class=hl>body, mind &amp; Qi</span>", "Articles on Zhineng Qigong, Hun Yuan Qi, Ayurvedic digestion and living with clarity.", crumbs=[("Home", "/"), ("Journal", None)])
body += f'''<section><div class="wrap"><div class="filters reveal" data-filter-group=".post">{jf}{search}</div>
<div class="grid3">{"".join(post_card(p, i, feature=(i==0)) for i, p in enumerate(posts))}</div></div></section>{cta_band()}'''
pages.append(page("/inspiration/", "Journal", "Articles from Alloha Qi Space on Zhineng Qigong, Hun Yuan Qi, digestion, the mind and daily practice.", body, cur="/inspiration/"))

# ---------- about ----------
meta, about_md = load_md(SRC / "pages" / "about-us.md")
content, toks = render_md(about_md)
icons = {
 "qi": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/></svg>',
 "teach": '<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5"/></svg>',
 "master": '<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/></svg>',
 "leaf": '<svg viewBox="0 0 24 24"><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/></svg>'}
badges = "".join(f'<div class="cred reveal"><div class="ic">{icons[k]}</div><b>{t}</b><span>{s}</span></div>' for k, t, s in [
    ("qi", "Certified Hun Yuan Qi Therapist", "Rikhil Bithar"), ("teach", "Zhineng Qigong Level 1 Teacher", "Rikhil Bithar"),
    ("master", "Trained under Master Yuantong Liu", "Science-based Qi cultivation"), ("leaf", "Joyful Belly Ayurveda certified", "College of Digestion & Nutrition")])
body = hero("About us", "A family’s healing, <span class=hl>shared with every family</span>", "Founded by Rikhil Bithar and his mother, Ravina Bithar, Alloha Qi Space brings Zhineng Qigong and Hun Yuan Qi therapy to Pune and the world.", crumbs=[("Home", "/"), ("About", None)])
body += f'''<div class="wrap"><div class="creds">{badges}</div></div>
<section><div class="wrap layout"><article class="prose reveal">{content}</article>
<aside class="aside">{toc_html(toks)}<div class="card navy"><h3 >Meet Rikhil</h3><p>Visit the centre in Kalyani Nagar or book an online session.</p><a class="btn btn-white" href="/contact-us/#book">Book a session</a></div></aside></div></section>{cta_band()}'''
pages.append(page("/about-us/", "About Rikhil & Ravina Bithar", "Alloha Qi Space was founded by Rikhil Bithar, a certified Hun Yuan Qi Therapist and Zhineng Qigong teacher, and his mother Ravina Bithar.", body, cur="/about-us/",
                  ld=[BUSINESS, {"@context": "https://schema.org", "@type": "Person", "name": "Rikhil Bithar", "jobTitle": "Hun Yuan Qi Therapist and Zhineng Qigong Teacher", "worksFor": {"@type": "Organization", "name": "Alloha Qi Space"}}]))

# ---------- faq ----------
faqs = json.loads((SRC / "pages" / "faq.json").read_text())
qas = "".join(f'<div class="qa"><button aria-expanded="false">{esc(q)}</button><div class="ans">{"".join(f"<p>{esc(x)}</p>" for x in a.split(chr(10)+chr(10)))}</div></div>' for q, a in faqs)
body = hero("FAQ", "Questions, <span class=hl>answered</span>", "Everything you need to know before your first Zhineng Qigong session.", crumbs=[("Home", "/"), ("FAQ", None)])
body += f'''<section><div class="wrap layout"><div class="reveal"><div class="search" style="max-width:none;margin:0 0 1.4rem"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="fq" type="search" placeholder="Search questions…" aria-label="Search questions"></div>
{qas}<p id="nores" style="display:none;color:var(--muted);padding:1rem 0">No matches. Ask us directly on WhatsApp.</p></div>
<aside class="aside"><div class="card navy"><h3 >Still have a question?</h3><p>Rikhil answers personally on WhatsApp.</p><a class="btn btn-white" href="{wa("Hi Rikhil, I have a question about Qigong.")}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>
<div class="card"><h3>New to Qigong?</h3><p>The foundational practice is the best place to start.</p><a class="btn btn-outline" href="/foundational-qigong-practice/">Start here</a></div></aside></div></section>{cta_band()}'''
pages.append(page("/faq/", "Zhineng Qigong FAQ", "Answers to common questions about Zhineng Qigong: what it is, who it suits, how it works, how often to practise and what you need.", body, cur="/faq/",
                  ld=[{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}]))

# ---------- contact ----------
opts = "".join(f'<option value="{p["slug"]}">{esc(p["title"])}</option>' for p in programs) + '<option value="unsure">Not sure yet, please advise</option>'
body = hero("Contact", "Begin your path to <span class=hl>wellness</span>", "Visit the centre in Kalyani Nagar, Pune, or connect with us online. Rikhil replies personally.", crumbs=[("Home", "/"), ("Contact", None)])
body += f'''<section><div class="wrap grid2" style="gap:3rem;align-items:start">
<div class="reveal"><h2 style="font-size:2rem;margin-bottom:1.4rem">We would love to help</h2><div class="info">
<a href="https://wa.me/{WA}" target="_blank" rel="noopener"><span class="ic"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-13.4 7.9L3 21l1.2-4.4A9 9 0 1 1 21 12z"/></svg></span><span><small>WhatsApp · fastest reply</small><b>+91 98811 92288</b></span></a>
<a href="tel:+919881192288"><span class="ic"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></span><span><small>Call · Rikhil B.</small><b>+91 98811 92288</b></span></a>
<a href="{MAPS}" target="_blank" rel="noopener"><span class="ic"><svg viewBox="0 0 24 24"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span><small>Centre · open in Maps</small><b>{ADDR}</b></span></a>
<div class="i"><span class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></span><span><small>Online</small><b>Classes, consultations &amp; Hun Yuan Qi healing worldwide</b></span></div>
</div></div>
<form class="book reveal" id="book"><h3>Request a session</h3>
<div class="two"><div class="field"><label for="fn">Your name</label><input id="fn" required></div><div class="field"><label for="fp">Phone (optional)</label><input id="fp" type="tel"></div></div>
<div class="field"><label for="fs">Program</label><select id="fs">{opts}</select></div>
<div class="field"><label>Where</label><div class="seg" data-v="at the Pune centre"><button type="button" class="on" data-v="at the Pune centre">Pune centre</button><button type="button" data-v="online">Online</button></div></div>
<div class="field"><label for="fm">Anything we should know?</label><textarea id="fm" rows="3" placeholder="Your goals, health considerations, preferred times…"></textarea></div>
<button class="btn btn-primary" type="submit">Send via WhatsApp →</button><p class="formnote">Opens WhatsApp with your message ready to send to Rikhil.</p></form>
</div></section>
<section style="padding-top:0"><div class="wrap"><div class="map reveal"><iframe title="Map to Alloha Qi Space" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Kalpataru+Regency+2,+Lane+10,+Kalyani+Nagar,+Pune+411006&output=embed"></iframe></div></div></section>'''
pages.append(page("/contact-us/", "Contact & Book a Session", "Book Zhineng Qigong classes or Hun Yuan Qi healing at Alloha Qi Space, Kalyani Nagar, Pune. WhatsApp +91 98811 92288.", body, cur="/contact-us/", ld=[BUSINESS]))

# ---------- events ----------
import datetime as _dt
from urllib.parse import quote as _q
EVENTS = json.loads((SRC / "events.json").read_text())
_now = _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=5, minutes=30))).replace(tzinfo=None)
for ev in EVENTS:
    ev["s"] = _dt.datetime.fromisoformat(ev["start"]); ev["e"] = _dt.datetime.fromisoformat(ev["end"])
    ev["past"] = ev["e"] < _now
UPCOMING = sorted([e for e in EVENTS if not e["past"]], key=lambda e: e["s"])
PAST = sorted([e for e in EVENTS if e["past"]], key=lambda e: e["s"], reverse=True)

def _t(d): return d.strftime("%I:%M %p").lstrip("0").lower().replace(":00 ", " ")
def ev_when(ev):
    s, e = ev["s"], ev["e"]
    if s.date() == e.date():
        return f'{s.strftime("%A")}, {s.day} {s.strftime("%B %Y")}', f'{_t(s)} – {_t(e)}'
    return f'{s.day} {s.strftime("%b")} – {e.day} {e.strftime("%b %Y")}', f'{_t(s)} – {_t(e)} daily'
def ev_price(ev): return "Free" if not ev["price"] else f'₹{ev["price"]:,}'
MODE = {"in-person": "In person, Pune", "online": "Live online", "hybrid": "In person & online"}
def ev_img(ev, w=800, h=500): return f'https://images.unsplash.com/photo-{ev["image"]}?auto=format&fit=crop&q=70&w={w}&h={h}'
def gcal(ev):
    f = "%Y%m%dT%H%M%S"
    return ("https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + _q(ev["title"]) +
            f'&dates={ev["s"].strftime(f)}/{ev["e"].strftime(f)}&ctz=Asia/Kolkata&details=' + _q(ev["summary"] + " " + DOMAIN + f'/event/{ev["slug"]}/') +
            "&location=" + _q(ev["venue"]))
def write_ics(ev):
    f = "%Y%m%dT%H%M%S"
    ics = "\r\n".join(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Alloha Qi Space//Events//EN", "BEGIN:VEVENT",
        f'UID:{ev["slug"]}@allohaqispace.com', f'DTSTAMP:{_now.strftime(f)}', f'DTSTART;TZID=Asia/Kolkata:{ev["s"].strftime(f)}',
        f'DTEND;TZID=Asia/Kolkata:{ev["e"].strftime(f)}', f'SUMMARY:{ev["title"]}', f'LOCATION:{ev["venue"]}',
        f'DESCRIPTION:{ev["summary"]} {DOMAIN}/event/{ev["slug"]}/', "END:VEVENT", "END:VCALENDAR", ""])
    d = OUT / "event" / ev["slug"]; d.mkdir(parents=True, exist_ok=True); (d / "event.ics").write_text(ics)

def event_card(ev):
    day, tm = ev_when(ev)
    badge = "Past event" if ev["past"] else MODE.get(ev["mode"], "")
    cta = '<span class="textlink">See highlights →</span>' if ev["past"] else f'<span class="btn btn-cta btn-sm">Book now</span>'
    return (f'<a class="evcard reveal{" past" if ev["past"] else ""}" href="/event/{ev["slug"]}/"><div class="evimg"><img src="{ev_img(ev)}" alt="" loading="lazy" decoding="async">'
            f'<div class="evdate"><b>{ev["s"].day}</b><span>{ev["s"].strftime("%b")}</span></div></div>'
            f'<div class="evbody"><div class="evmeta"><span class="tag">{badge}</span>{"" if ev["past"] else f"<span class=evprice>{ev_price(ev)}</span>"}</div>'
            f'<h3>{esc(ev["title"])}</h3><p>{esc(ev["summary"])}</p><small>{day} · {tm}</small>{cta}</div></a>')

ev_msg = wa("Hi Rikhil, please let me know about upcoming healing events at Alloha Qi Space.")
body = hero("Healing events", "Healing events, workshops &amp; <span class=hl>retreats</span>",
            "Practise together. Group Qi Gong sessions, healing circles and workshops in Pune and live online. Book your seat online in a minute.",
            crumbs=[("Home", "/"), ("Healing events", None)])
if UPCOMING:
    up = f'<div class="sec-head reveal"><div class="eyebrow">Upcoming</div><h2>Book your seat</h2></div><div class="grid3">{"".join(event_card(e) for e in UPCOMING)}</div>'
else:
    up = (f'<div class="empty reveal"><h3>New healing events are being planned</h3><p>Workshops, healing circles and practice days are announced on WhatsApp first. '
          f'Ask to be added and you’ll hear before seats open.</p><p style="margin-top:1.4rem"><a class="btn btn-cta" href="{ev_msg}" target="_blank" rel="noopener">Notify me about the next event</a></p></div>')
pastsec = (f'<div class="sec-head reveal" style="margin-top:4.5rem"><div class="eyebrow">Past events</div><h2>From our community</h2></div>'
           f'<div class="grid3">{"".join(event_card(e) for e in PAST)}</div>') if PAST else ""
body += f'<section><div class="wrap">{up}{pastsec}</div></section>{cta_band()}'
pages.append(page("/events/", "Healing Events", "Book healing events, Qi Gong workshops and practice days at Alloha Qi Space in Kalyani Nagar, Pune and online.", body, cur="/events/"))

for ev in EVENTS:
    day, tm = ev_when(ev)
    content, _ = render_md(ev["body"])
    hl = "".join(f"<li>{esc(h)}</li>" for h in ev.get("highlights", []))
    if ev["past"]:
        panel = (f'<div class="evbook past"><div class="eyebrow">This event has passed</div><h3>Join the next one</h3>'
                 f'<p>New healing events are announced on WhatsApp first.</p><a class="btn btn-cta btn-block" href="{ev_msg}" target="_blank" rel="noopener">Notify me on WhatsApp</a></div>')
    else:
        resmsg = wa(f'Hi Rikhil, I\'d like to book a seat for {ev["title"]} on {day}.')
        if ev.get("razorpay_button_id"):
            pay = (f'<div class="rzp"><form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="{esc(ev["razorpay_button_id"])}" async></script></form></div>'
                   '<p class="secure"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Secure payment by Razorpay · UPI, cards, netbanking</p>')
        elif ev.get("razorpay_link"):
            pay = (f'<a class="btn btn-cta btn-lg btn-block" href="{esc(ev["razorpay_link"])}" target="_blank" rel="noopener">Book &amp; pay {ev_price(ev)}</a>'
                   '<p class="secure"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Secure payment by Razorpay · UPI, cards, netbanking</p>')
        else:
            pay = (f'<a class="btn btn-cta btn-lg btn-block" href="{resmsg}" target="_blank" rel="noopener">Reserve on WhatsApp</a>'
                   '<p class="secure">Rikhil will confirm your seat and share payment details.</p>')
        seats = f'<li><b>Seats</b><span>Limited to {ev["seats"]}</span></li>' if ev.get("seats") else ""
        panel = (f'<div class="evbook" id="book"><div class="evprice-big">{ev_price(ev)}<small>{"per person" if ev["price"] else "registration required"}</small></div>'
                 f'<div class="countdown" data-start="{ev["s"].isoformat()}+05:30"></div>'
                 f'<ul class="evfacts"><li><b>Date</b><span>{day}</span></li><li><b>Time</b><span>{tm}</span></li><li><b>Where</b><span>{esc(ev["venue"])}</span></li>{seats}</ul>'
                 f'{pay}<div class="evcal"><a href="{gcal(ev)}" target="_blank" rel="noopener">+ Google Calendar</a><a href="/event/{ev["slug"]}/event.ics" download>+ Apple / Outlook</a></div>'
                 f'<p class="evq">Questions? <a href="{resmsg}" target="_blank" rel="noopener">Ask Rikhil on WhatsApp</a></p></div>')
    write_ics(ev)
    body = hero("Past event" if ev["past"] else "Healing event", esc(ev["title"]), esc(ev.get("subtitle", "")), img=ev["image"],
                crumbs=[("Home", "/"), ("Healing events", "/events/"), (ev["title"], None)],
                extra=f'<div class="meta-row"><span>{day}</span><span>·</span><span>{tm}</span><span>·</span><span>{MODE.get(ev["mode"], "")}</span></div>'
                      + ("" if ev["past"] else '<div class="cta-row"><a class="btn btn-cta btn-lg" href="#book">Book your seat</a></div>'))
    body += (f'<section><div class="wrap layout evlayout"><article class="prose reveal">{content}'
             f'{f"<h2>What to expect</h2><ul>{hl}</ul>" if hl else ""}</article><aside class="aside">{panel}</aside></div></section>{cta_band()}')
    ld = {"@context": "https://schema.org", "@type": "Event", "name": ev["title"], "description": ev["summary"],
          "startDate": ev["s"].isoformat() + "+05:30", "endDate": ev["e"].isoformat() + "+05:30", "image": ev_img(ev, 1200, 630),
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": {"online": "https://schema.org/OnlineEventAttendanceMode", "hybrid": "https://schema.org/MixedEventAttendanceMode"}.get(ev["mode"], "https://schema.org/OfflineEventAttendanceMode"),
          "location": {"@type": "Place", "name": "Alloha Qi Space", "address": BUSINESS["address"]} if ev["mode"] != "online" else {"@type": "VirtualLocation", "url": DOMAIN + f'/event/{ev["slug"]}/'},
          "organizer": {"@type": "Organization", "name": "Alloha Qi Space", "url": DOMAIN},
          "offers": {"@type": "Offer", "price": ev["price"], "priceCurrency": "INR", "url": DOMAIN + f'/event/{ev["slug"]}/', "availability": "https://schema.org/InStock"}}
    pages.append(page(f'/event/{ev["slug"]}/', ev["title"], ev["summary"], body, cur="/events/", ld=[ld], og_image=ev_img(ev, 1200, 630),
                      mbar=None if ev["past"] else mbar_html("Book your seat", "#book", 500)))

# booking confirmation (Razorpay redirect target)
body = hero("Booking received", "Thank you, your seat is <span class=hl>booked</span>",
            "Your payment was received. Razorpay has emailed your receipt, and Rikhil will message you on WhatsApp with the details before the event.",
            crumbs=[("Home", "/"), ("Healing events", "/events/"), ("Booking received", None)],
            extra=f'<div class="cta-row"><a class="btn btn-cta" href="{wa("Hi Rikhil, I just booked a seat for an event and paid online.")}" target="_blank" rel="noopener">Send Rikhil a quick hello</a><a class="btn btn-outline" href="/events/">Back to events</a></div>')
pages.append(page("/event-booked/", "Booking received", "Your Alloha Qi Space event booking was received.", body, cur="/events/"))

# ---------- shop / ohana ----------
ohana_msg = wa("Hi Rikhil, I'd like to buy the Ohana wellness guide (₹800). How can I pay?")
body = hero("Shop", "Ohana", "A wellness guide for individuals and families.", crumbs=[("Home", "/"), ("Shop", "/shop/"), ("Ohana", None)])
body += f'''<section><div class="wrap product">
<div class="bookcover reveal"><div class="cover"><span>Alloha Qi Space · eBook</span><div><b>Ohana</b><i></i><span style="text-transform:none;letter-spacing:0;font-weight:500">A wellness guide for families</span></div></div></div>
<div class="reveal"><span class="tag">eBook · PDF</span><h2 style="font-size:clamp(2rem,4vw,3rem);margin:.8rem 0 .2rem">Ohana</h2>
<div class="price"><b>₹800</b><s>₹2,400</s><i>Save 67%</i></div>
<div class="prose"><p>Ohana is a unique wellness guide created to help individuals and families improve health, healing, and overall well-being. This visually engaging PDF combines mindfulness practices, breathing exercises, energy awareness, and positive mental habits designed to support a healthier lifestyle.</p>
<p>Inside, you’ll discover practical techniques for relaxation, inner balance, stress relief, and personal growth—all presented in an inspiring and easy-to-follow format.</p>
<p>Whether you’re looking to feel more energized, develop a stronger mindset, or explore holistic wellness methods, Ohana offers powerful insights that can positively impact everyday life.</p>
<p>A meaningful resource for anyone seeking better health, peace, and personal transformation.</p></div>
<p style="margin-top:1.8rem;display:flex;gap:.8rem;flex-wrap:wrap"><a class="btn btn-primary" href="{ohana_msg}" target="_blank" rel="noopener">Buy on WhatsApp</a><a class="btn btn-outline" href="/refund-policy/">Refund policy</a></p>
<p style="color:var(--muted);font-size:.85rem;margin-top:1rem">Pay by UPI or bank transfer; the PDF is sent to you on WhatsApp or email. Digital products are non-refundable.</p></div>
</div></section>{cta_band()}'''
pages.append(page("/product/ohana/", "Ohana: A Wellness Guide (eBook)", "Ohana is a wellness guide PDF with mindfulness, breathing and energy-awareness practices for individuals and families. ₹800.", body,
                  ld=[{"@context": "https://schema.org", "@type": "Product", "name": "Ohana", "description": "A wellness guide PDF for individuals and families.", "category": "eBook",
                       "offers": {"@type": "Offer", "price": "800", "priceCurrency": "INR", "availability": "https://schema.org/InStock"}}]))
body = hero("Shop", "Guides &amp; <span class=hl>resources</span>", "Take the practice home with you.", crumbs=[("Home", "/"), ("Shop", None)])
body += f'''<section><div class="wrap"><div class="grid3"><a class="post reveal" href="/product/ohana/"><div class="art" style="background:var(--blue);display:grid;place-items:center"><span style="font-family:var(--head);font-size:2.6rem;font-weight:700;color:#fff;position:relative">Ohana</span></div>
<div class="body"><small>eBook · PDF</small><h3>Ohana: a wellness guide</h3><p>Mindfulness, breathing and energy-awareness practices for individuals and families.</p><span class="textlink">₹800 <s style="color:var(--muted);font-weight:400">₹2,400</s> →</span></div></a></div></div></section>{cta_band()}'''
pages.append(page("/shop/", "Shop", "Wellness guides and resources from Alloha Qi Space.", body))

# ---------- policies ----------
for slug, title, src in [("terms-of-service", "Terms of Service", "terms-of-service"), ("privacy-policy-2", "Privacy Policy", "privacy-policy"), ("refund-policy", "Refund Policy", "refund-policy")]:
    _, md_ = load_md(SRC / "pages" / f"{src}.md")
    content, _ = render_md(md_)
    body = hero("Legal", title, f"Last updated: {fmt_date(TODAY)}", crumbs=[("Home", "/"), (title, None)])
    body += f'<section><div class="wrap layout narrow"><article class="prose reveal">{content}</article></div></section>'
    pages.append(page(f"/{slug}/", title, f"{title} for Alloha Qi Space, Kalyani Nagar, Pune.", body))

# ---------- 404 ----------
body = hero("Page not found", "This page has <span class=hl>moved on</span>", "The page you were looking for isn’t here. Try one of these instead.",
            extra='<div class="cta-row"><a class="btn btn-primary" href="/">Go to the homepage</a><a class="btn btn-outline" href="/programs/">See programs</a><a class="btn btn-outline" href="/inspiration/">Read the journal</a></div>')
page("/404", "Page not found", "This page could not be found.", body)

# ---------- sitemap & robots ----------
urls = ["/"] + [p for p in pages if p not in ("/event-booked/", "/404")]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    pr = "1.0" if u == "/" else ("0.9" if u in ["/programs/"] + [f"/{p['slug']}/" for p in programs] else "0.7")
    sm.append(f"  <url><loc>{DOMAIN}{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>")
sm.append("</urlset>")
(OUT / "sitemap.xml").write_text("\n".join(sm) + "\n")
(OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")

# export data for homepage patching
(Path(__file__).parent / "site_data.json").write_text(json.dumps({"programs": [{k: p[k] for k in ("slug", "title", "summary", "tags")} for p in programs],
    "posts": [{k: p[k] for k in ("path", "title", "date", "category", "excerpt")} for p in posts]}, ensure_ascii=False, indent=1))
print(f"Built {len(pages)+1} pages")
for p in pages: print(" ", p)
