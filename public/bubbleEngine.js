// Neon Jellyfish Bubbles on Canvas
const canvas = document.getElementById('bubbleCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
let W, H, DPR = Math.min(2, window.devicePixelRatio || 1);

function resize() {
  W = canvas.width  = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width  = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
window.addEventListener('resize', resize);
resize();

const neon = ["#00FFD1","#7CFF00","#FFD300","#FF00E5","#00B3FF","#FF7A00","#C4FF00","#FF0051"];
function rand(a,b){ return a + Math.random()*(b-a); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

class Bubble {
  constructor(x,y,r,color,id,label){
    this.x = x; this.y = y; this.r = r; this.baseR = r;
    this.color = color; this.id = id; this.label = label;
    this.phase = Math.random()*Math.PI*2;
    this.speed = rand(0.2,0.6);
  }
  step(dt){
    this.phase += this.speed * dt;
    this.x += Math.cos(this.phase*0.5)*0.2*DPR;
    this.y += Math.sin(this.phase*0.6)*0.2*DPR;
    if(this.x < this.r || this.x > W - this.r) this.phase += Math.PI*0.9;
    if(this.y < this.r || this.y > H - this.r) this.phase += Math.PI*0.9;
    this.r = this.baseR + Math.sin(this.phase*0.9)*3*DPR;
  }
  draw(ctx){
    ctx.save();
    const g = ctx.createRadialGradient(this.x,this.y,this.r*0.2, this.x,this.y,this.r);
    g.addColorStop(0,this.color+"cc");
    g.addColorStop(1,this.color+"00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  hit(px,py){ const dx = px - this.x, dy = py - this.y; return Math.hypot(dx,dy) <= this.r; }
}

const items = [
  { id:"zeitreise_tagebuch", label:"Zeitreise‑Tagebuch" },
  { id:"surrealismus_generator", label:"Surrealismus‑Generator" },
  { id:"bild_generator", label:"Bild‑Generator" },
  { id:"briefing_assistant", label:"Briefing‑Assistent" },
  { id:"bunte_poesie", label:"Bunte Poesie" },
  { id:"llm_berater", label:"LLM‑Berater" }
];
const bubbles = [];
function seed(){
  bubbles.length = 0;
  const cx = W * 0.62, cy = H * 0.45;
  const spread = Math.min(W,H) * 0.18;
  items.forEach((it, i) => {
    const a = i / items.length * Math.PI * 2;
    const x = cx + Math.cos(a)*spread + rand(-50,50)*DPR;
    const y = cy + Math.sin(a)*spread + rand(-50,50)*DPR;
    const r = rand(40,95) * DPR;
    bubbles.push(new Bubble(x,y,r,pick(neon), it.id, it.label));
  });
}
seed();

let last = performance.now();
function loop(t){
  const dt = Math.min(0.05, (t - last)/1000); last = t;
  ctx.clearRect(0,0,W,H);
  for(const b of bubbles){ b.step(dt); b.draw(ctx); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * DPR;
  const py = (e.clientY - rect.top) * DPR;
  const b = bubbles.find(b => b.hit(px,py));
  if(!b) return;
  const ev = new CustomEvent('bubble-select', { detail: { id: b.id, label: b.label } });
  window.dispatchEvent(ev);
});
