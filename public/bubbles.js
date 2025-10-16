// Bubble engine – jellyfish motion
const canvas = document.getElementById('bubbleCanvas');
const ctx = canvas.getContext('2d');
const DPR = Math.min(window.devicePixelRatio||1, 2);
let W=0,H=0;
function resize(){ W=canvas.width=innerWidth*DPR; H=canvas.height=innerHeight*DPR; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; }
addEventListener('resize', resize, {passive:true}); resize();

const NEONS = ['#86ffad','#6ef7ff','#9aa3ff','#ff90e8','#ffd36e','#9bffb1','#7ee2ff','#ffab91','#e5ff6e','#c2a3ff'];
const ITEMS = [
  {id:'zeitreise-tagebuch', t:'Zeitreise‑Tagebuch'},
  {id:'weltbau', t:'Weltbau'},
  {id:'poesie-html', t:'Bunte Poesie'},
  {id:'bild-generator', t:'Bild‑Generator'},
  {id:'idea-realitaets-debugger', t:'Realitäts‑Debugger'},
  {id:'idea-rueckwaerts-zivilisation', t:'Rückwärts‑Zivilisation'},
  {id:'idea-bibliothek-ungelebter-leben', t:'Bibliothek ungelebter Leben'},
  {id:'idea-vintage-futurist', t:'Vintage‑Futurist'},
  {id:'idea-emotional-alchemist', t:'Emotional‑Alchemist'},
  {id:'idea-surrealismus-generator', t:'Surrealismus‑Generator'},
  {id:'idea-zeitlupen-explosion', t:'Zeitlupen‑Explosion'},
  {id:'idea-ki-traeume', t:'KI‑Träume'},
  {id:'idea-philosophie-mentor', t:'KI‑Philosophie‑Mentor'}
];
let queueIndex = 0;
function nextItem(){ const it = ITEMS[queueIndex % ITEMS.length]; queueIndex++; return it; }

const bubbles = [];
const MAX = 8;

function spawn(){
  const it = nextItem();
  const color = NEONS[Math.floor(Math.random()*NEONS.length)];
  const base = Math.min(180, Math.max(110, 40 + it.t.length*6));
  const r = (base + (Math.random()*40-20)) * DPR;
  const x = Math.random()*W, y = Math.random()*H*0.7 + H*0.2;
  const speed = 0.15 + Math.random()*0.25; // langsam
  const angle = Math.random()*Math.PI*2;
  const life = 18000 + Math.random()*10000; // ms
  bubbles.push({it, color, r, x, y, vx: Math.cos(angle)*speed*DPR, vy: Math.sin(angle)*speed*DPR, born: performance.now(), life, alpha:0});
}

for(let i=0;i<MAX;i++) spawn();

function drawBubble(b){
  // glow layers
  ctx.beginPath();
  ctx.arc(b.x,b.y,b.r*0.95,0,Math.PI*2);
  ctx.fillStyle = hexToRgba(b.color, 0.08*b.alpha);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(b.x,b.y,b.r*0.92,0,Math.PI*2);
  ctx.fillStyle = hexToRgba(b.color, 0.22*b.alpha);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(b.x,b.y,b.r*0.75,0,Math.PI*2);
  ctx.fillStyle = hexToRgba(b.color, 0.35*b.alpha);
  ctx.fill();
  // label
  const label = b.it.t;
  ctx.fillStyle = 'rgba(0,0,0,'+(0.55*b.alpha)+')';
  ctx.font = `${Math.max(12, Math.min(22, b.r*0.08/DPR))}px ui-sans-serif, system-ui`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label, b.x, b.y - 6*DPR);
  // button
  const bw = 44*DPR, bh = 20*DPR, rx=8*DPR;
  const bx = b.x - bw/2, by = b.y + b.r*0.35 - bh/2;
  roundRect(bx,by,bw,bh,rx);
  ctx.fillStyle = 'rgba(0,0,0,'+(0.55*b.alpha)+')';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,'+(0.9*b.alpha)+')';
  ctx.font = `${12*DPR}px ui-sans-serif, system-ui`;
  ctx.fillText('Start', b.x, by+bh/2);
  b._btn = {x:bx,y:by,w:bw,h:bh};
}

function tick(){
  ctx.clearRect(0,0,W,H);
  const now = performance.now();
  for(const b of bubbles){
    const age = now - b.born;
    b.alpha = Math.min(1, Math.max(0, age<1200 ? age/1200 : (age > b.life-1200 ? 1-(age-(b.life-1200))/1200 : 1)));
    b.x += b.vx; b.y += b.vy;
    if(b.x - b.r < 0 || b.x + b.r > W){ b.vx *= -1; }
    if(b.y - b.r < 0 || b.y + b.r > H){ b.vy *= -1; }
    drawBubble(b);
  }
  for(let i=bubbles.length-1;i>=0;i--){
    if(now - bubbles[i].born > bubbles[i].life){ bubbles.splice(i,1); spawn(); }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function hexToRgba(hex, a){
  const v = hex.replace('#','');
  const r = parseInt(v.slice(0,2),16), g=parseInt(v.slice(2,4),16), b=parseInt(v.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

canvas.addEventListener('click', (ev)=>{
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * DPR;
  const y = (ev.clientY - rect.top) * DPR;
  for(const b of bubbles){
    const btn=b._btn;
    if(btn && x>=btn.x && x<=btn.x+btn.w && y>=btn.y && y<=btn.y+btn.h){
      runSSE(b.it.id);
      break;
    }
  }
}, {passive:true});
