(() => {
const cv = document.getElementById('sky'), c = cv.getContext('2d');
let W, H, mx = 0, my = 0, angle = 0, scroll = 0, hover = -1, picked = -1;
const dpr = Math.min(devicePixelRatio || 1, 2);
function size(){ W = innerWidth; H = innerHeight; cv.width = W*dpr; cv.height = H*dpr; c.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize', size); size();

// seeded stars (polar coordinates around the pole)
let s = 7; const rnd = () => (s = (s*16807) % 2147483647) / 2147483647;
const stars = Array.from({length: 420}, () => ({r: Math.sqrt(rnd())*1.25, a: rnd()*6.283, z: .3+rnd()*.7, t: rnd()*6.283}));

// constellations: polar anchor + relative points
const groups = [
 {n:'Yettiqaroqchi', r:.45, a:.6, pts:[[0,0],[.05,.02],[.1,.01],[.15,-.03],[.17,-.1],[.24,-.12],[.23,-.2]], link:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,5]],
  t:'Katta Ayiq turkumi. Uzoq o‘tmishdan sayohatchilar yo‘nalishni shu yetti yulduzdan topgan.'},
 {n:'Qutb yulduzi', r:.02, a:0, pts:[[0,0]], link:[], t:'Shimoliy osmon qutbi yaqinidagi yulduz. Butun osmon uning atrofida aylanadi, sayt fonidagi harakat ham shunday.'},
 {n:'Surayyo', r:.8, a:2.4, pts:[[0,0],[.02,.015],[.035,-.01],[.05,.012],[.06,-.02],[.075,.01]], link:[[0,1],[1,2],[2,3],[3,4],[4,5]],
  t:'Parvin deb ham ataladigan sochma yulduz to‘dasi. Ko‘z bilan olti-yetti yulduzi ko‘rinadi.'},
 {n:'Kassiopeya', r:.6, a:4.1, pts:[[0,0],[.04,.05],[.09,.02],[.13,.06],[.18,.01]], link:[[0,1],[1,2],[2,3],[3,4]],
  t:'W shaklidagi turkum. Qutb yulduzi yonida joylashgani uchun uni yil bo‘yi ko‘rish mumkin.'},
 {n:'Qosh-Qosh (Orion kamari)', r:.95, a:5.4, pts:[[0,0],[.045,.01],[.09,.02]], link:[[0,1],[1,2]],
  t:'Uchta yorqin yulduz bitta qatorda turadi. Qishki osmonda eng oson topiladigan belgi.'}
];
const cx = () => W*.62 + mx*18, cy = () => H*.3 - scroll*.25 + my*12, R = () => Math.max(W,H)*.75;
const pos = (r,a) => { const th = a + angle; return [cx()+Math.cos(th)*r*R(), cy()+Math.sin(th)*r*R()]; };

function gpt(g,p){ // place relative point on the anchor, rotating with the sky
  const [bx,by] = pos(g.r,g.a), k = R()*1.6, th = angle;
  const x = p[0]*k, y = p[1]*k;
  return [bx + x*Math.cos(th) - y*Math.sin(th), by + x*Math.sin(th) + y*Math.cos(th)];
}

function frame(t){
  c.fillStyle = '#0a1024'; c.fillRect(0,0,W,H);
  const g = c.createRadialGradient(W*.7,H*.1,0,W*.7,H*.1,W*.9);
  g.addColorStop(0,'rgba(42,91,208,.28)'); g.addColorStop(1,'transparent'); c.fillStyle = g; c.fillRect(0,0,W,H);
  for (const st of stars){
    const [x,y] = pos(st.r, st.a);
    if (x<-5||x>W+5||y<-5||y>H+5) continue;
    c.globalAlpha = (.35+.65*Math.abs(Math.sin(t/1400+st.t)))*st.z;
    c.fillStyle = st.z>.8 ? '#fff4d6' : '#bcd0ff';
    c.fillRect(x,y,st.z*1.8,st.z*1.8);
  }
  c.globalAlpha = 1;
  let h = -1;
  groups.forEach((gr,i) => {
    const P = gr.pts.map(p => gpt(gr,p));
    const on = i===hover || i===picked;
    c.strokeStyle = on ? '#e0ad4a' : 'rgba(53,208,192,.35)'; c.lineWidth = on ? 1.8 : 1;
    c.beginPath(); gr.link.forEach(([a,b]) => { c.moveTo(...P[a]); c.lineTo(...P[b]); }); c.stroke();
    P.forEach(([x,y]) => { c.fillStyle = on ? '#ffd98a' : '#e8fffb'; c.beginPath(); c.arc(x,y,on?3.6:2.6,0,6.283); c.fill(); });
    if (on){ c.fillStyle = '#e0ad4a'; c.font = '16px Marcellus, serif'; c.fillText(gr.n, P[0][0]+12, P[0][1]-10); }
    if (P.some(([x,y]) => Math.hypot(x-lastX,y-lastY) < 26)) h = i;
  });
  hover = h; cv.style.cursor = h>=0 ? 'pointer' : 'default';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) angle += .00018 + scroll*.0000002;
  requestAnimationFrame(frame);
}
let lastX = -999, lastY = -999;
addEventListener('mousemove', e => { lastX = e.clientX; lastY = e.clientY; mx = e.clientX/W-.5; my = e.clientY/H-.5; });
addEventListener('scroll', () => scroll = scrollY);
addEventListener('click', e => {
  if (e.target.closest('header,#info,.block,footer')) return;
  lastX = e.clientX; lastY = e.clientY;
  setTimeout(() => { if (hover>=0){ picked = hover; document.getElementById('i-title').textContent = groups[hover].n; document.getElementById('i-text').textContent = groups[hover].t; chime(hover); } }, 40);
});
requestAnimationFrame(frame);

// Web Audio: soft drone + chimes
let ac, drone, on = false;
function chime(i){
  if (!on || !ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = [392,440,523,587,659][i%5];
  g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(.12, ac.currentTime+.03);
  g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime+1.6);
  o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime+1.7);
}
const btn = document.getElementById('sound');
btn.addEventListener('click', () => {
  on = !on; btn.setAttribute('aria-pressed', on); btn.textContent = 'Ovoz: ' + (on ? 'yoqiq' : 'o‘chiq');
  if (on){
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (!drone){
      const g = ac.createGain(); g.gain.value = .035; g.connect(ac.destination);
      [98,147,196].forEach((f,i) => { const o = ac.createOscillator(); o.frequency.value = f; o.detune.value = i*4; o.connect(g); o.start(); });
      drone = g;
    }
    drone.gain.setTargetAtTime(.035, ac.currentTime, .3);
  } else if (drone) drone.gain.setTargetAtTime(0, ac.currentTime, .2);
});

// count-up numbers + reveals
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add('on'); io.unobserve(e.target);
  if (e.target.dataset.n){ const n = +e.target.dataset.n, t0 = performance.now();
    (function step(t){ const p = Math.min((t-t0)/1400,1); e.target.textContent = Math.round(n*(1-Math.pow(1-p,3))); if (p<1) requestAnimationFrame(step); })(t0); }
}), {threshold:.4});
document.querySelectorAll('[data-n]').forEach(el => io.observe(el));

// age → sky rotations
const yi = document.getElementById('year'), out = document.getElementById('calc-out');
function calc(){ const y = +yi.value, now = new Date().getFullYear();
  if (!y || y>now || y<1900){ out.textContent = 'Yilni 1900 va ' + now + ' oralig‘ida kiriting.'; return; }
  const d = Math.round((now-y)*365.2422);
  out.textContent = 'Siz taxminan ' + d.toLocaleString('uz-UZ') + ' marta quyosh chiqishini ko‘rgansiz. Ulug‘bek bu sonni juda aniq hisoblagan bo‘lardi.'; }
yi.addEventListener('input', calc); calc();
})();
