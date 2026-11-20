/* Alloha Qi Space: shared behaviour for inner pages */
(function(){
const WA="919881192288";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const wa=t=>`https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
window.AQS={wa};

/* nav */
const nav=$("#nav");
const onScroll=()=>{nav&&nav.classList.toggle("solid",scrollY>30);
  const p=$("#progress");if(p){const h=document.documentElement.scrollHeight-innerHeight;p.style.width=(h>0?scrollY/h*100:0)+"%"}};
addEventListener("scroll",onScroll,{passive:true});onScroll();
$("#burger")&&($("#burger").onclick=()=>document.body.classList.toggle("menu-open"));
$$("#links a").forEach(a=>a.addEventListener("click",()=>document.body.classList.remove("menu-open")));

/* reveal */
const io=new IntersectionObserver(es=>es.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add("in"),(i%4)*80);io.unobserve(e.target)}}),{threshold:.1});
$$(".reveal").forEach(el=>io.observe(el));

/* toast */
window.toast=t=>{const el=$("#toast");if(!el)return;el.textContent=t;el.classList.add("on");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("on"),4200)};

/* segmented toggles */
$$(".seg").forEach(s=>s.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{s.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");s.dataset.v=b.dataset.v;})));

/* program booking card */
$$("[data-book]").forEach(btn=>btn.addEventListener("click",e=>{
  e.preventDefault();const seg=btn.closest(".card,form")?.querySelector(".seg");const where=seg?.dataset.v||"at the Pune centre";
  window.open(wa(`Hi Rikhil, I'm interested in "${btn.dataset.book}" ${where}. Could you share the details and next available slots?`),"_blank","noopener");
}));

/* booking form */
const f=$("#book");
if(f){f.addEventListener("submit",e=>{e.preventDefault();
  const sel=$("#fs");const prog=sel.value==="unsure"?"a first session (not sure which practice yet, please advise)":sel.options[sel.selectedIndex].text;const where=f.querySelector(".seg")?.dataset.v||"at the Pune centre";
  const time=f.querySelector(".pills button.on")?.dataset.v;const fp=$("#fp"),fm=$("#fm");
  const msg=`Hi Rikhil, I'm ${$("#fn").value}. I'd like to book ${prog}, ${where}.${time?` Preferred time: ${time}.`:""}${fp&&fp.value?` My phone: ${fp.value}.`:""}${fm&&fm.value?`\n\n${fm.value}`:""}`;
  window.open(wa(msg),"_blank","noopener");toast("Opening WhatsApp. Just tap send.");});
  const q=new URLSearchParams(location.search).get("program");if(q&&$("#fs"))$("#fs").value=q;}

/* single-select pills */
$$(".pills").forEach(g=>g.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{const was=b.classList.contains("on");g.querySelectorAll("button").forEach(x=>x.classList.remove("on"));if(!was)b.classList.add("on")})));

/* mobile sticky booking bar */
const mb=$("#mbar");if(mb){const t=+(mb.dataset.after||500);let inView=false;
  const tgt=(mb.querySelector("a")?.getAttribute("href")||"").startsWith("#")?$(mb.querySelector("a").getAttribute("href")):null;
  const f=()=>mb.classList.toggle("on",scrollY>t&&!inView&&!document.body.classList.contains("menu-open"));
  if(tgt)new IntersectionObserver(es=>{inView=es[0].isIntersecting;f()},{threshold:.15}).observe(tgt);
  addEventListener("scroll",f,{passive:true});f()}

/* TOC highlight */
const tocLinks=$$(".toc a");
if(tocLinks.length){const heads=tocLinks.map(a=>document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  const hio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){tocLinks.forEach(a=>a.classList.toggle("on",a.hash==="#"+e.target.id))}}),{rootMargin:"-90px 0px -70% 0px"});
  heads.forEach(h=>hio.observe(h));}

/* accordion */
$$(".qa").forEach(d=>{const b=d.querySelector("button"),a=d.querySelector(".ans");b.addEventListener("click",()=>{const o=d.classList.toggle("open");a.style.maxHeight=o?a.scrollHeight+"px":0;b.setAttribute("aria-expanded",o)})});
const fq=$("#fq");if(fq)fq.addEventListener("input",()=>{const v=fq.value.toLowerCase();let n=0;$$(".qa").forEach(d=>{const m=d.textContent.toLowerCase().includes(v);d.classList.toggle("hide",!m);n+=m});const nr=$("#nores");nr&&(nr.style.display=n?"none":"block")});

/* filters (programs + journal) */
$$("[data-filter-group]").forEach(g=>{const target=g.dataset.filterGroup;
  g.querySelectorAll("[data-f]").forEach(c=>c.addEventListener("click",()=>{g.querySelectorAll("[data-f]").forEach(x=>x.classList.remove("on"));c.classList.add("on");
    $$(target).forEach(p=>p.classList.toggle("hide",c.dataset.f!=="all"&&!(p.dataset.tags||"").includes(c.dataset.f)))}))});
const ps=$("#ps");if(ps)ps.addEventListener("input",()=>{const v=ps.value.toLowerCase();$$(".post").forEach(p=>p.classList.toggle("hide",!p.textContent.toLowerCase().includes(v)))});

/* spotlight on dark cards */
$$(".pcard").forEach(b=>b.addEventListener("mousemove",e=>{const r=b.getBoundingClientRect();b.style.setProperty("--mx",e.clientX-r.left+"px");b.style.setProperty("--my",e.clientY-r.top+"px")}));

/* lite YouTube */
$$(".yt").forEach(y=>{y.style.backgroundImage=`url(https://i.ytimg.com/vi/${y.dataset.id}/hqdefault.jpg)`;
  y.addEventListener("click",()=>{if(y.querySelector("iframe"))return;const i=document.createElement("iframe");i.src=`https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1&rel=0`;i.allow="autoplay; encrypted-media; picture-in-picture";i.allowFullscreen=true;i.title=y.dataset.title||"Video";y.appendChild(i)})});

/* share */
$$("[data-copy]").forEach(b=>b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);toast("Link copied")}catch(e){toast(location.href)}}));
})();

/* ===== Rich interactions ===== */
(function(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
 /* hero photo fade-in (inner pages) */
 document.querySelectorAll('.phero .hero-photo').forEach(i=>{const on=()=>i.classList.add('loaded');i.complete&&i.naturalWidth?on():i.addEventListener('load',on);setTimeout(on,2500)});
 /* staggered reveals within grids */
 const groups=new Map();
 document.querySelectorAll('.reveal').forEach(el=>{const p=el.parentElement;if(!groups.has(p))groups.set(p,[]);groups.get(p).push(el)});
 groups.forEach(list=>{if(list.length>1)list.forEach((el,i)=>el.style.transitionDelay=Math.min(i*90,450)+'ms')});
 /* heading rule: mark sec-heads when visible */
 const hio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');hio.unobserve(e.target)}}),{threshold:.4});
 document.querySelectorAll('.sec-head').forEach(h=>hio.observe(h));
 if(reduce) return;
 /* card tilt + spotlight */
 if(fine){
  document.querySelectorAll('.scard,.pain,.post,.hstep,.creds li').forEach(c=>{
   const max=5;c.classList.add('tilt');
   c.addEventListener('pointerenter',()=>{c.style.transitionDelay='0ms'});
   c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    c.style.setProperty('--mx',x*100+'%');c.style.setProperty('--my',y*100+'%');
    c.style.transform=`perspective(900px) rotateX(${(.5-y)*max}deg) rotateY(${(x-.5)*max}deg) translateY(-4px)`});
   c.addEventListener('pointerleave',()=>{c.style.transform=''});
  });
  /* magnetic CTA buttons */
  document.querySelectorAll('.btn-cta').forEach(b=>{
   b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();const dx=(e.clientX-r.left-r.width/2)/r.width,dy=(e.clientY-r.top-r.height/2)/r.height;b.style.transform=`translate(${dx*8}px,${dy*6-2}px)`});
   b.addEventListener('pointerleave',()=>{b.style.transform=''});
  });
 }
 /* image parallax */
 const par=[...document.querySelectorAll('.himg img,.banner img,.cover img')];
 let tick=false;
 const upd=()=>{tick=false;const vh=innerHeight;par.forEach(img=>{const r=img.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;const p=(r.top+r.height/2-vh/2)/vh;img.style.setProperty('--py',(p*-28).toFixed(1)+'px')})};
 addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});upd();
 /* back to top */
 const t=document.createElement('button');t.className='totop';t.setAttribute('aria-label','Back to top');t.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';document.body.appendChild(t);
 t.onclick=()=>scrollTo({top:0,behavior:'smooth'});
 addEventListener('scroll',()=>t.classList.toggle('on',scrollY>900),{passive:true});
})();

/* event countdown */
document.querySelectorAll('.countdown[data-start]').forEach(el=>{
 const t=new Date(el.dataset.start).getTime();
 const tick=()=>{let d=t-Date.now();if(d<=0){el.innerHTML='';return}
  const D=Math.floor(d/864e5),H=Math.floor(d/36e5)%24,M=Math.floor(d/6e4)%60;
  el.innerHTML=`<div><b>${D}</b><span>days</span></div><div><b>${H}</b><span>hours</span></div><div><b>${M}</b><span>mins</span></div>`};
 tick();setInterval(tick,30000);
});
