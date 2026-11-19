/* Alloha Qi Space: homepage interactions (practice finder, awareness exercise, sound library) */
(function(){
const WA="919881192288";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const wa=t=>`https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const toast=t=>window.toast&&window.toast(t);
const programs=[
 {id:"foundation",slug:"foundational-qigong-practice",t:"Foundational Qigong Practice",d:"The best place to start. You learn the foundational “Hold Qi Up, Pour Qi Down” method, a gentle routine you can keep practising at home.",pts:["Ideal for complete beginners","A daily routine you can continue at home","Builds energy, calm and body awareness"]},
 {id:"neck",slug:"neck-health-care",t:"Neck Health Care",d:"A precise six-step sequence for stiff necks and shoulders, helpful after long hours at a desk, travel or sport.",pts:["Eases neck and shoulder tension","Works on mobility and posture","Taught step by step by a teacher"]},
 {id:"eyes",slug:"eye-recovery",t:"Eye Recovery & Brain Cells",d:"Gentle practices for tired eyes and a busy mind, especially useful if you spend long hours on screens.",pts:["Relaxes eye strain from screens","Calming focus practice","Short routines you can repeat daily"]},
 {id:"restructure",slug:"restructuring-with-zhineng-qi-gong",t:"Restructuring with Zhineng Qi Gong",d:"A deeper program that combines Zhineng movements with focused intention to work on the whole body.",pts:["Whole-body practice","Movement plus focused intention","Suited to regular practitioners"]},
 {id:"core",slug:"qi-core-improvement",t:"Qi Core Improvement",d:"Six forms developed by Master Yuantong Liu using Dr. Pang Ming’s methods, focused on the spine and core.",pts:["Six progressive forms","Focus on spine flexibility and strength","In person or online"]},
 {id:"restore",slug:"physical-and-mental-restoration",t:"Physical & Mental Restoration",d:"For stress and low energy: movement, breath and awareness practice to help you feel calmer and clearer.",pts:["Works on stress and mental fatigue","Builds steadier attention","Practice for long-term balance"]},
 {id:"special",slug:"special-care-for-delicate-situations",t:"Special Care for Delicate Situations",d:"Gentle, adapted sessions for sensitive times such as pregnancy or recovery, always alongside your doctor’s care.",pts:["Carefully adapted movements","Paced to how you feel","Practised alongside medical care"]},
 {id:"consult",slug:"comprehensive-consultations",t:"Comprehensive Consultations",d:"A one-to-one conversation about your food, routine and environment, ending with a clear personal practice plan.",pts:["One-to-one with Rikhil","A personal daily practice plan","In person or online"]},
 {id:"online",slug:"online-healing-classes",t:"Online Healing & Classes",d:"Live online classes and sessions, so you can practise with us from anywhere in the world.",pts:["Live online classes","One-to-one sessions","Practise from home"]}
];

/* Practice finder */
const ans={};const order=["goal","mode","exp","result"];let qi=0;
const goalMap={energy:"foundation",calm:"restore",pain:"core",eyes:"eyes",recovery:"special",start:"foundation"};
const show=()=>{$$(".qstep").forEach(s=>s.classList.toggle("on",s.dataset.q===order[qi]));$("#qbar").style.width=(qi/3*100)+"%";$("#qcount").textContent=qi<3?`Question ${qi+1} of 3`:"Your match"};
$$(".qstep .opt").forEach(o=>o.addEventListener("click",()=>{ans[o.closest(".qstep").dataset.q]=o.dataset.v;qi++;if(order[qi]==="result")showResult();show()}));
function showResult(){
  let id=goalMap[ans.goal];
  if(ans.exp==="guided")id="consult";
  if(ans.mode==="online"&&id!=="consult")id=ans.goal==="calm"||ans.goal==="start"?"online":id;
  const p=programs.find(x=>x.id===id);
  const where=ans.mode==="online"?"online":"at the Pune centre";
  const msg=`Hi Rikhil, the practice finder on your website suggested "${p.t}". I'd like to start ${where}. Could you share the next available slots?`;
  $("#result").innerHTML=`<span class="match">Suggested for you · ${where==="online"?"Online":"Pune centre"}</span><h3>${p.t}</h3><p>${p.d}</p><ul class="ticks">${p.pts.map(x=>`<li>${x}</li>`).join("")}</ul>
  <div class="row"><a class="btn btn-cta" target="_blank" rel="noopener" href="${wa(msg)}">Book this practice →</a><a class="btn btn-outline" href="/${p.slug}/">About this practice</a></div>
  <p style="margin:1.2rem 0 0"><button class="textlink" id="redo">↺ Start again</button></p>`;
  $("#redo").onclick=()=>{qi=0;show()};
}

/* Awareness exercise */
let pattern=[6,5,6],running=false,bt;
const capIdle="Sit comfortably and relax. Your awareness can travel beyond your body, fill the space around you, and return within.";
const core=$("#core"),bl=$("#blabel"),bw=$("#breath"),bc=$("#bcap");
$$(".aw-ctrl [data-p]").forEach(c=>c.addEventListener("click",()=>{$$(".aw-ctrl [data-p]").forEach(x=>x.classList.remove("on"));c.classList.add("on");pattern=c.dataset.p.split(",").map(Number);if(running){stopB();startB()}}));
function phase(i){if(!running)return;const [a,b,c]=pattern;
  const steps=[["Expand",a,1.75,"radiate","Move your inner awareness outward. Let it pass beyond your skin and gently fill the whole room."],
               ["Rest",b,1.75,"","Rest in the space. Your awareness is everywhere in the room: the walls, the ceiling, the floor."],
               ["Return",c,1,"gather","Slowly bring your awareness back inside. Let it gather into your body and settle within."]];
  const [l,s,sc,cls,cap]=steps[i];
  bw.classList.remove("gather","radiate");if(cls)bw.classList.add(cls);bc.textContent=cap;
  core.style.transitionDuration=s+"s";core.style.transform=`scale(${sc})`;let n=s;bl.textContent=`${l} · ${n}`;
  const iv=setInterval(()=>{n--;if(n>0&&running)bl.textContent=`${l} · ${n}`},1000);
  bt=setTimeout(()=>{clearInterval(iv);phase((i+1)%3)},s*1000);bt.iv=iv}
function startB(){running=true;$("#bstart").textContent="Stop";$("#bstart").classList.add("on");phase(0)}
function stopB(){running=false;clearTimeout(bt);bt&&clearInterval(bt.iv);bw.classList.remove("gather","radiate");bc.textContent=capIdle;core.style.transitionDuration="1s";core.style.transform="scale(1)";bl.textContent="Start";$("#bstart").textContent="Start exercise";$("#bstart").classList.remove("on")}
$("#bstart").addEventListener("click",()=>running?stopB():startB());
core.parentElement.addEventListener("click",()=>running?stopB():startB());

/* ===== Sounds ===== */
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>';
const fmt=s=>!isFinite(s)?"∞":`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
let AC=null;const ac=()=>AC||(AC=new (window.AudioContext||window.webkitAudioContext)());
/* Built-in generated tones (no files needed) */
const tones=[
 {title:"Singing bowl",cat:"Tone · 5 min",desc:"Slow, resonant bowl strikes to settle the mind before practice.",dur:300,make(ctx,out){
   let stop=false;const strike=()=>{if(stop)return;const t=ctx.currentTime,f=196;[[1,.5,9],[2.76,.22,6],[5.4,.1,3.5],[8.9,.04,2]].forEach(([r,a,d])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f*r*(1+Math.random()*.002);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(out);o.start(t);o.stop(t+d+.1)});};
   strike();const iv=setInterval(strike,9000);return()=>{stop=true;clearInterval(iv)}}},
 {title:"Om drone · 136.1 Hz",cat:"Tone · 10 min",desc:"A warm, grounding hum tuned to the traditional 'Om' frequency.",dur:600,make(ctx,out){
   const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=900;lp.connect(out);const os=[];
   [[136.1,.18,"sawtooth"],[136.6,.14,"sawtooth"],[68.05,.22,"sine"],[272.2,.05,"sine"]].forEach(([f,a,t])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=t;o.frequency.value=f;g.gain.value=a;o.connect(g).connect(lp);o.start();os.push(o)});
   const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=.07;lg.gain.value=350;l.connect(lg).connect(lp.frequency);l.start();os.push(l);
   return()=>os.forEach(o=>o.stop())}},
 {title:"Ocean breath",cat:"Tone · 10 min",desc:"Soft waves rising and falling. Let your awareness ride each wave out and back.",dur:600,make(ctx,out){
   const n=ctx.sampleRate*4,buf=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=buf.getChannelData(c);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2}}
   const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=700;const g=ctx.createGain();g.gain.value=.35;
   const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=1/9;lg.gain.value=.3;l.connect(lg).connect(g.gain);
   const lf=ctx.createGain();lf.gain.value=500;l.connect(lf).connect(lp.frequency);
   src.connect(lp).connect(g).connect(out);src.start();l.start();return()=>{src.stop();l.stop()}}}
];
/* Player engine: one track at a time, file or generated */
const P={cur:null,el:null,stopGen:null,master:null,genStart:0,genPaused:0,playing:false,loop:false,timer:0,timerEnd:0};
const pl=$("#player"),pp=$("#pplay"),ps=$("#pseek");pp.innerHTML=ICON_PLAY;
function fadeMaster(to,sec){const t=AC.currentTime;P.master.gain.cancelScheduledValues(t);P.master.gain.setValueAtTime(P.master.gain.value,t);P.master.gain.linearRampToValueAtTime(to,t+sec)}
function stopAll(){if(P.el){P.el.pause();P.el.src="";P.el=null}if(P.stopGen){const s=P.stopGen,m=P.master;P.stopGen=null;try{fadeMaster(0,.4)}catch(e){}setTimeout(()=>{s();m&&m.disconnect()},450)}P.playing=false;$$(".track").forEach(t=>t.classList.remove("playing"))}
function playTrack(t,card){
  if(P.cur===t){togglePlay();return}
  stopAll();P.cur=t;P.card=card;$("#ptitle").textContent=t.title;pl.classList.add("on");document.body.classList.add("playing-bar");
  if(t.file){const a=new Audio();a.preload="auto";a.src=t.file;a.loop=P.loop;P.el=a;
    a.onloadedmetadata=()=>{$("#pdur").textContent=fmt(a.duration)};
    a.ontimeupdate=()=>{$("#pcur").textContent=fmt(a.currentTime);if(a.duration)ps.value=a.currentTime/a.duration*1000};
    a.onended=()=>{P.playing=false;sync()};
    a.onerror=()=>{toast(`Couldn't load "${t.title}". Check the file name in sounds.json.`);stopAll();sync()};
    a.play().then(()=>{P.playing=true;sync()}).catch(()=>{});
  }else{const ctx=ac();ctx.resume();P.master=ctx.createGain();P.master.gain.value=0;P.master.connect(ctx.destination);P.stopGen=t.make(ctx,P.master);fadeMaster(.8,2.5);P.genStart=performance.now();P.genPaused=0;P.playing=true;$("#pdur").textContent=fmt(t.dur);sync()}
}
function togglePlay(){if(!P.cur)return;
  if(P.el){P.playing?P.el.pause():P.el.play();P.playing=!P.playing}
  else if(P.stopGen){if(P.playing){AC.suspend();P.pauseAt=performance.now()}else{AC.resume();P.genStart+=performance.now()-P.pauseAt}P.playing=!P.playing}
  else{const t=P.cur;P.cur=null;playTrack(t,P.card);return}
  sync()}
function sync(){pp.innerHTML=P.playing?ICON_PAUSE:ICON_PLAY;$$(".track").forEach(c=>{const on=P.playing&&c._t===P.cur;c.classList.toggle("playing",on);c.querySelector(".tbtn").innerHTML=on?ICON_PAUSE:ICON_PLAY})}
setInterval(()=>{if(P.stopGen&&P.playing&&P.cur){const el=(performance.now()-P.genStart)/1000;let e=el;if(e>=P.cur.dur){if(P.loop){P.genStart=performance.now();e=0}else{stopAll();sync();return}}$("#pcur").textContent=fmt(e);ps.value=e/P.cur.dur*1000}
  if(P.timerEnd&&Date.now()>=P.timerEnd){P.timerEnd=0;P.timer=0;$("#ptimer").textContent="⏲ Off";$("#ptimer").classList.remove("on");if(P.playing)togglePlay();toast("Sleep timer ended. Sound paused.")}
  else if(P.timerEnd){const m=Math.ceil((P.timerEnd-Date.now())/60000);$("#ptimer").textContent=`⏲ ${m}m`}},500);
pp.onclick=togglePlay;
ps.oninput=()=>{const f=ps.value/1000;if(P.el&&P.el.duration)P.el.currentTime=f*P.el.duration;else if(P.stopGen&&P.cur){P.genStart=performance.now()-f*P.cur.dur*1000}};
$("#ploop").onclick=e=>{P.loop=!P.loop;e.currentTarget.classList.toggle("on",P.loop);if(P.el)P.el.loop=P.loop};
const timers=[0,10,20,30,60];
$("#ptimer").onclick=e=>{P.timer=timers[(timers.indexOf(P.timer)+1)%timers.length];P.timerEnd=P.timer?Date.now()+P.timer*60000:0;e.currentTarget.textContent=P.timer?`⏲ ${P.timer}m`:"⏲ Off";e.currentTarget.classList.toggle("on",!!P.timer)};
$("#pclose").onclick=()=>{stopAll();P.cur=null;sync();pl.classList.remove("on");document.body.classList.remove("playing-bar")};
function card(t){const b=document.createElement("button");b.className="track";b._t=t;
  b.innerHTML=`<span class="tbtn">${ICON_PLAY}</span><span class="tmeta"><small>${t.cat||"Practice"}</small><h4>${t.title}</h4>${t.desc?`<p>${t.desc}</p>`:""}<span class="dur">${t.file?"Audio":"Generated live"}${t.dur?" · "+fmt(t.dur):""}</span></span>`;
  b.onclick=()=>playTrack(t,b);if(t.file){const a=new Audio();a.preload="metadata";a.src=t.file;a.onloadedmetadata=()=>{b.querySelector(".dur").textContent="Audio · "+fmt(a.duration)}}
  return b}
const tw=$("#tones");tones.forEach(t=>tw.appendChild(card(t)));
/* Your own recordings: listed in sounds.json, files in /sounds */
fetch("sounds.json",{cache:"no-cache"}).then(r=>r.ok?r.json():[]).catch(()=>[]).then(list=>{
  const box=$("#mytracks");if(!Array.isArray(list)||!list.length)return;
  const groups={};list.forEach(t=>{if(!t||!t.file)return;const g=t.group||"Guided practices";(groups[g]=groups[g]||[]).push({title:t.title||t.file,cat:t.category||"",desc:t.description||"",file:t.file})});
  Object.entries(groups).forEach(([g,items])=>{const h=document.createElement("div");h.className="sgroup";h.textContent=g;const w=document.createElement("div");w.className="tracks";items.forEach(t=>w.appendChild(card(t)));box.append(h,w)});
  
});

})();

/* Hero background: slow flowing lines and drifting motes (qi flow) */
(function(){
 const c=document.getElementById('qi'); if(!c) return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const x=c.getContext('2d'); let w,h,dpr,motes=[],t=0,run=true,raf;
 function size(){dpr=Math.min(devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);
  const n=Math.round(Math.min(60,w/22));motes=Array.from({length:n},()=>({x:Math.random()*w,y:Math.random()*h,r:1.4+Math.random()*2.6,s:.15+Math.random()*.35,p:Math.random()*6.28,o:Math.random()<.18}))}
 function draw(){
  x.clearRect(0,0,w,h);
  const lines=7;
  for(let i=0;i<lines;i++){
   const base=h*(.22+i*.1), amp=18+i*6, f=.0022+i*.00025, sp=t*(.25+i*.04);
   x.beginPath();
   for(let px=-20;px<=w+20;px+=14){const py=base+Math.sin(px*f+sp+i)*amp+Math.sin(px*f*.5-sp*.6)*amp*.6; px<0?x.moveTo(px,py):x.lineTo(px,py)}
   x.strokeStyle=`rgba(70,143,233,${.10+i*.025})`; x.lineWidth=1.5; x.stroke();
  }
  for(const m of motes){
   m.y-=m.s; m.x+=Math.sin(t*.6+m.p)*.25;
   if(m.y<-10){m.y=h+10;m.x=Math.random()*w}
   const a=.4+.3*Math.sin(t*1.2+m.p);
   x.beginPath(); x.arc(m.x,m.y,m.r,0,6.283);
   x.fillStyle=m.o?`rgba(247,162,83,${a})`:`rgba(70,143,233,${a})`; x.fill();
  }
 }
 function loop(){t+=.012;draw();if(run)raf=requestAnimationFrame(loop)}
 size(); addEventListener('resize',()=>{size();if(reduce)draw()});
 if(reduce){draw();return}
 new IntersectionObserver(e=>{run=e[0].isIntersecting;cancelAnimationFrame(raf);if(run)loop()}).observe(c);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){run=false;cancelAnimationFrame(raf)}else{run=true;loop()}});
})();
(function(){const i=document.querySelector('.hero-photo');if(!i)return;const on=()=>i.classList.add('loaded');i.complete&&i.naturalWidth?on():i.addEventListener('load',on);setTimeout(on,2500)})();
