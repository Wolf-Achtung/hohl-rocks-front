// public/js/bubbleEngine.js
// Clickable Prompt-Bubbles mit zwei Layouts (drift/orbit).
// Robust gegen leere Daten, bietet Fallback auf window.BUBBLE_CONFIG.
// Exporte: initBubbleEngine(items[, options]), destroyBubbleEngine()

import { $, el, storage } from './utils.js';

// -----------------------------
// Konfiguration & State
// -----------------------------
const MAX_ACTIVE = 6;
const TTL_MIN = 18_000;          // 18s
const TTL_MAX = 32_000;          // 32s
const SPEED_MIN = 0.05;          // px/ms
const SPEED_MAX = 0.18;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.25;

let ENGINE = null;               // Singleton–Instanz

// -----------------------------
// Helper
// -----------------------------
const rnd = (a,b)=> a + Math.random()*(b-a);
const clamp = (v,a,b)=> v<a?a : v>b?b : v;

function pickItems(items){
  if (Array.isArray(items) && items.length) return items;
  if (Array.isArray(window.BUBBLE_CONFIG) && window.BUBBLE_CONFIG.length) {
    // mappe config -> items
    return window.BUBBLE_CONFIG.map(x => ({
      title: x.text || x.id || 'Bubble',
      prompt: x.description || x.text || '',
      sizeHint: x.size || 140
    }));
  }
  // Minimale Defaults
  return [
    { title: 'Executive Briefing', prompt: 'Gib mir ein Executive Briefing zum Thema …', sizeHint: 140 },
    { title: 'Meeting‑Agenda',     prompt: 'Erzeuge eine straffe 30‑Minuten‑Agenda zu …', sizeHint: 130 },
    { title: '60s Pitch',          prompt: 'Schreibe einen 60‑Sekunden‑Pitch zu …',       sizeHint: 120 },
  ];
}

function normalize(items){
  return items.map((it,i) => ({
    id: 'b'+i,
    title: it.title || it.question || it.text || ('Bubble '+(i+1)),
    sub:   it.desc || it.why || '',
    run:   it.prompt || it.run || it.text || '',
    size:  clamp(it.sizeHint || it.size || rnd(110,210), 90, 260)
  }));
}

function createBubbleEl(item){
  // Button, damit dein globaler Handler in app.js über data-run greift
  // (siehe document.addEventListener('click', … dataset.run)).  ✔️
  const btn = el ? el('button', { class:'ai-bubble', type:'button', 'data-run': item.run }) :
                   Object.assign(document.createElement('button'), { className:'ai-bubble', type:'button', dataset:{ run: item.run } });

  btn.innerHTML = `
    <strong class="t">${item.title}</strong>
    ${item.sub ? `<span class="s">${item.sub}</span>` : ''}
  `;
  btn.style.position = 'absolute';
  btn.style.willChange = 'transform';
  btn.style.padding = '12px 16px';
  btn.style.borderRadius = '999px';
  btn.style.backdropFilter = 'blur(6px)';
  btn.style.background = 'rgba(255,255,255,0.08)';
  btn.style.color = '#fff';
  btn.style.border = '1px solid rgba(255,255,255,0.16)';
  btn.style.font = '600 14px/1.15 Inter, system-ui, sans-serif';
  btn.style.textAlign = 'left';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 6px 28px rgba(0,0,0,0.25)';
  btn.style.whiteSpace = 'nowrap';

  // kleine Größenanmutung
  const scale = clamp(item.size / 160, 0.8, 1.4);
  return { el: btn, scale };
}

// -----------------------------
// Layout/Animation
// -----------------------------
function placeAt(b, x, y, s){
  b.x = x; b.y = y; b.s = s;
  b.el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
}

function layoutOrbit(engine){
  const { bounds, bubbles } = engine;
  const cx = bounds.width  / 2;
  const cy = bounds.height / 2;
  const R  = Math.min(cx, cy) * 0.62;

  bubbles.forEach((b, i) => {
    const a = (i / bubbles.length) * Math.PI * 2;
    // Ziel:
    b.tx = cx + Math.cos(a) * R;
    b.ty = cy + Math.sin(a) * R;
    b.ts = b.scale;
  });
}

function layoutDrift(engine){
  const { bounds, bubbles } = engine;
  bubbles.forEach((b) => {
    b.tx = rnd(0.15*bounds.width, 0.85*bounds.width);
    b.ty = rnd(0.15*bounds.height, 0.85*bounds.height);
    b.ts = b.scale * rnd(SCALE_MIN, SCALE_MAX);
    // zufällige Driftgeschwindigkeit:
    b.vx = rnd(-SPEED_MAX, SPEED_MAX);
    b.vy = rnd(-SPEED_MAX, SPEED_MAX);
    if (Math.abs(b.vx) < SPEED_MIN) b.vx = Math.sign(b.vx||1) * SPEED_MIN;
    if (Math.abs(b.vy) < SPEED_MIN) b.vy = Math.sign(b.vy||1) * SPEED_MIN;
  });
}

function step(engine, dt){
  const { bubbles, bounds, layout } = engine;
  const k = 8; // weiches easing
  bubbles.forEach(b => {
    // Easing zum Ziel
    b.x += (b.tx - b.x) * Math.min(1, k*dt);
    b.y += (b.ty - b.y) * Math.min(1, k*dt);
    b.s += (b.ts - b.s) * Math.min(1, k*dt);

    // bei drift zusätzlich leicht treiben lassen
    if (layout === 'drift'){
      b.x += b.vx * dt * 1000;
      b.y += b.vy * dt * 1000;
      // Rand-Umkehr
      if (b.x < 30 || b.x > bounds.width-30) b.vx = -b.vx;
      if (b.y < 30 || b.y > bounds.height-30) b.vy = -b.vy;
    }

    b.el.style.transform = `translate3d(${b.x|0}px,${b.y|0}px,0) scale(${b.s})`;
  });
}

// -----------------------------
// Engine Klasse
// -----------------------------
class Engine {
  constructor(containerSel, labelsSel, items){
    this.container = $(containerSel) || document.querySelector(containerSel);
    this.labels    = $(labelsSel)    || document.querySelector(labelsSel);
    if (!this.container) throw new Error('bubbleEngine: Container nicht gefunden: '+containerSel);

    // Präferenz: drift/orbit aus persistenten prefs
    const prefs = (storage && storage('prefs').get()) || {};
    this.layout = prefs.layout || 'drift';

    // Items
    this.items = normalize(pickItems(items));
    this.bubbles = [];
    this.raf = 0;
    this.last = performance.now();

    this.onResize = this.onResize.bind(this);
    this.onLayoutToggle = this.onLayoutToggle.bind(this);

    this.mount();
  }

  mount(){
    this.container.innerHTML = '';
    if (this.labels) this.labels.innerHTML = '';

    // Initiale Maße
    const rect = this.container.getBoundingClientRect();
    this.bounds = { width: rect.width || window.innerWidth, height: rect.height || window.innerHeight };

    // Baue Bubbles
    for (const it of this.items.slice(0, MAX_ACTIVE)){
      const b = createBubbleEl(it);
      this.container.appendChild(b.el);
      if (this.labels){
        const li = document.createElement('li'); li.textContent = it.title;
        this.labels.appendChild(li);
      }
      // Startposition irgendwo
      placeAt(b, rnd(40, this.bounds.width-40), rnd(40, this.bounds.height-40), b.scale);
      // TTL
      b.ttl = performance.now() + rnd(TTL_MIN, TTL_MAX);
      this.bubbles.push(b);
    }

    // Erstes Layout
    if (this.layout === 'orbit') layoutOrbit(this); else layoutDrift(this);

    // Events
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('layout:toggle', this.onLayoutToggle);

    // Loop starten
    this.raf = requestAnimationFrame(this.loop.bind(this));
  }

  onResize(){
    const rect = this.container.getBoundingClientRect();
    this.bounds = { width: rect.width || window.innerWidth, height: rect.height || window.innerHeight };
    // Re-layout bei Resize:
    if (this.layout === 'orbit') layoutOrbit(this); else layoutDrift(this);
  }

  onLayoutToggle(e){
    this.layout = e?.detail?.layout || (this.layout === 'drift' ? 'orbit' : 'drift');
    if (this.layout === 'orbit') layoutOrbit(this); else layoutDrift(this);
  }

  loop(now){
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;

    step(this, dt);

    // TTL Recycling (sanftes Umpositionieren statt Entfernen)
    for (const b of this.bubbles){
      if (now >= b.ttl){
        b.ttl = now + rnd(TTL_MIN, TTL_MAX);
        // erzeuge neue Ziele
        if (this.layout === 'orbit') layoutOrbit(this); else {
          b.tx = rnd(0.15*this.bounds.width, 0.85*this.bounds.width);
          b.ty = rnd(0.15*this.bounds.height, 0.85*this.bounds.height);
          b.ts = b.scale * rnd(SCALE_MIN, SCALE_MAX);
        }
      }
    }

    this.raf = requestAnimationFrame(this.loop.bind(this));
  }

  destroy(){
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('layout:toggle', this.onLayoutToggle);
    this.container.innerHTML = '';
    if (this.labels) this.labels.innerHTML = '';
  }
}

// -----------------------------
// Public API
// -----------------------------
export function initBubbleEngine(items = [], options = {}){
  if (ENGINE) { ENGINE.destroy(); ENGINE = null; }
  const container = options.container || '#bubbles';
  const labels    = options.labels    || '#bubble-labels';
  ENGINE = new Engine(container, labels, items);
  return ENGINE;
}

export function destroyBubbleEngine(){
  if (ENGINE){ ENGINE.destroy(); ENGINE = null; }
}

// Optionaler Default-Export für tolerantere Importe
export default { initBubbleEngine, destroyBubbleEngine };
