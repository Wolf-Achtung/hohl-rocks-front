files["public/js/bubbleEngine.js"] = r"""// public/js/bubbleEngine.js (UTF-8)
// Interaktive Prompt-Bubbles als <button> mit data-run.
// - Zwei Layouts (drift/orbit), leichtgewichtige Animation
// - Respektiert window.BUBBLE_CONFIG als Fallback
// - Exporte: initBubbleEngine(items), destroyBubbleEngine()

const rnd = (a,b)=> a + Math.random()*(b-a);
const clamp = (v,a,b)=> v<a?a : v>b?b : v;

const MAX_ACTIVE = 6;
const TTL_MIN = 18_000, TTL_MAX = 32_000;
const SCALE_MIN = 0.85, SCALE_MAX = 1.25;
const SPEED_MIN = 0.05, SPEED_MAX = 0.18;

let ENGINE = null;

function pickItems(items){
  if (Array.isArray(items) && items.length) return items;
  if (Array.isArray(window.BUBBLE_CONFIG) && window.BUBBLE_CONFIG.length){
    return window.BUBBLE_CONFIG.map(x => ({
      title: x.text || x.id || 'Bubble',
      desc:  x.description || '',
      prompt: x.description || x.text || '',
      sizeHint: x.size || 140
    }));
  }
  return [
    { title:'Executive Briefing', desc:'Schneller Überblick', prompt:'Gib mir ein Executive Briefing zu …', sizeHint:140 },
    { title:'Meeting‑Agenda', desc:'30‑Min Fokus', prompt:'Erzeuge eine Agenda zu …', sizeHint:130 },
    { title:'60s Pitch', desc:'Kurz & knackig', prompt:'Schreibe einen 60‑Sekunden‑Pitch zu …', sizeHint:120 }
  ];
}

function normalize(items){
  return items.map((it,i)=>({
    id: 'b'+i,
    title: it.title || it.question || it.text || ('Bubble '+(i+1)),
    sub:   it.desc || it.why || '',
    run:   it.prompt || it.run || it.text || '',
    size:  clamp(it.sizeHint || it.size || rnd(110,210), 90, 260)
  }));
}

function makeButton(item){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ai-bubble';
  btn.dataset.run = item.run;
  btn.setAttribute('aria-label', item.title);
  btn.innerHTML = `<strong class="t">${item.title}</strong>${item.sub?`<span class="s">${item.sub}</span>`:''}`;
  Object.assign(btn.style, {
    position:'absolute', willChange:'transform', padding:'12px 16px', borderRadius:'999px',
    backdropFilter:'blur(6px)', background:'rgba(255,255,255,0.1)', color:'#fff',
    border:'1px solid rgba(255,255,255,0.16)', font:'600 14px/1.15 Inter, system-ui, sans-serif',
    textAlign:'left', cursor:'pointer', boxShadow:'0 6px 28px rgba(0,0,0,0.25)', whiteSpace:'nowrap'
  });
  const scale = clamp(item.size/160, 0.8, 1.4);
  return { el: btn, scale };
}

function placeAt(b,x,y,s){ b.x=x; b.y=y; b.s=s; b.el.style.transform=`translate3d(${x}px,${y}px,0) scale(${s})`; }

function layoutOrbit(engine){
  const { bounds, bubbles } = engine;
  const cx = bounds.width/2, cy = bounds.height/2;
  const R = Math.min(cx, cy) * 0.62;
  bubbles.forEach((b, i)=>{
    const a = (i / bubbles.length) * Math.PI * 2;
    b.tx = cx + Math.cos(a) * R;
    b.ty = cy + Math.sin(a) * R;
    b.ts = b.scale;
  });
}
function layoutDrift(engine){
  const { bounds, bubbles } = engine;
  bubbles.forEach(b=>{
    b.tx = rnd(0.15*bounds.width, 0.85*bounds.width);
    b.ty = rnd(0.15*bounds.height, 0.85*bounds.height);
    b.ts = b.scale * rnd(SCALE_MIN, SCALE_MAX);
    b.vx = rnd(-SPEED_MAX, SPEED_MAX);
    b.vy = rnd(-SPEED_MAX, SPEED_MAX);
    if(Math.abs(b.vx) < SPEED_MIN) b.vx = Math.sign(b.vx || 1) * SPEED_MIN;
    if(Math.abs(b.vy) < SPEED_MIN) b.vy = Math.sign(b.vy || 1) * SPEED_MIN;
  });
}
function step(engine, dt){
  const { bubbles, bounds, layout } = engine;
  const k = 8;
  bubbles.forEach(b=>{
    b.x += (b.tx - b.x) * Math.min(1, k*dt);
    b.y += (b.ty - b.y) * Math.min(1, k*dt);
    b.s += (b.ts - b.s) * Math.min(1, k*dt);
    if(layout==='drift'){
      b.x += b.vx * dt * 1000;
      b.y += b.vy * dt * 1000;
      if(b.x<30 || b.x>bounds.width-30) b.vx = -b.vx;
      if(b.y<30 || b.y>bounds.height-30) b.vy = -b.vy;
    }
    b.el.style.transform = `translate3d(${b.x|0}px,${b.y|0}px,0) scale(${b.s})`;
  });
}

class Engine{
  constructor(containerSel, labelsSel, items){
    this.container = document.querySelector(containerSel);
    this.labels    = document.querySelector(labelsSel);
    if(!this.container) throw new Error('bubbleEngine: Container nicht gefunden: '+containerSel);
    this.items = normalize(pickItems(items));
    this.bubbles = [];
    this.layout = 'drift';
    this.raf = 0; this.last = performance.now();
    this.onResize = this.onResize.bind(this);
    this.loop = this.loop.bind(this);
    this.onLayoutToggle = this.onLayoutToggle.bind(this);
    this.mount();
  }
  mount(){
    this.container.innerHTML = '';
    if(this.labels) this.labels.innerHTML = '';
    const rect = this.container.getBoundingClientRect();
    this.bounds = { width: rect.width || window.innerWidth, height: rect.height || window.innerHeight };
    for(const it of this.items.slice(0, MAX_ACTIVE)){
      const b = makeButton(it);
      this.container.appendChild(b.el);
      placeAt(b, rnd(40,this.bounds.width-40), rnd(40,this.bounds.height-40), b.scale);
      b.ttl = performance.now() + rnd(TTL_MIN, TTL_MAX);
      this.bubbles.push(b);
    }
    this.layout==='orbit' ? layoutOrbit(this) : layoutDrift(this);
    window.addEventListener('resize', this.onResize, { passive:true });
    window.addEventListener('layout:toggle', this.onLayoutToggle);
    // Sicherstellen, dass Clicks funktionieren, auch wenn CSS überschrieben wurde:
    this.container.addEventListener('click', (e)=>{
      const btn = e.target.closest('button.ai-bubble');
      if(btn?.dataset?.run){
        // delegiere ans Hauptdokument (app.js lauscht bereits auf dataset.run)
        const ev = new Event('click', { bubbles:true, cancelable:true });
        btn.dispatchEvent(ev);
      }
    });
    this.raf = requestAnimationFrame(this.loop);
  }
  onResize(){
    const rect = this.container.getBoundingClientRect();
    this.bounds = { width: rect.width || window.innerWidth, height: rect.height || window.innerHeight };
    this.layout==='orbit' ? layoutOrbit(this) : layoutDrift(this);
  }
  onLayoutToggle(e){
    this.layout = e?.detail?.layout || (this.layout==='drift' ? 'orbit' : 'drift');
    this.layout==='orbit' ? layoutOrbit(this) : layoutDrift(this);
  }
  loop(now){
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    step(this, dt);
    for(const b of this.bubbles){
      if(now >= b.ttl){
        b.ttl = now + rnd(TTL_MIN, TTL_MAX);
        if(this.layout==='orbit') layoutOrbit(this);
        else { b.tx = rnd(0.15*this.bounds.width, 0.85*this.bounds.width);
               b.ty = rnd(0.15*this.bounds.height, 0.85*this.bounds.height);
               b.ts = b.scale * rnd(SCALE_MIN, SCALE_MAX); }
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  }
  destroy(){
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('layout:toggle', this.onLayoutToggle);
    this.container.innerHTML = '';
    if(this.labels) this.labels.innerHTML = '';
  }
}

export function initBubbleEngine(items=[], options={}){
  if(ENGINE){ ENGINE.destroy(); ENGINE = null; }
  const container = options.container || '#bubbles';
  const labels    = options.labels || '#bubble-labels';
  ENGINE = new Engine(container, labels, items);
  return ENGINE;
}
export function destroyBubbleEngine(){ if(ENGINE){ ENGINE.destroy(); ENGINE = null; } }
export default { initBubbleEngine, destroyBubbleEngine };
"""