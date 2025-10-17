/**
 * Neon Jellyfish Bubble Engine (DOM + rAF)
 * - Each bubble drifts gently and oscillates in size
 * - Queue replaces faded bubbles with the next items
 * - Click triggers runPrompt(id)
 */

const BUBBLE_COLORS = [
  "#ff43b6", "#8bff7a", "#67d1ff", "#ffd166", "#a78bfa", "#ff8fab", "#5eead4", "#b0f", "#f59e0b"
];

// Define initial catalog of interactive experiences (id matches backend prompts)
const BUBBLE_ITEMS = [
  { id: "zeitreise-tagebuch", title: "Zeitreise‑Tagebuch" },
  { id: "weltbau", title: "Weltbau" },
  { id: "bunte-poesie", title: "Bunte Poesie" },
  { id: "bild-beschreibung", title: "Bild‑Beschreibung" },
  { id: "realitaets-debugger", title: "Realitäts‑Debugger" },
  { id: "briefing-assistent", title: "Briefing‑Assistent" },
  { id: "fuenf-why", title: "5‑Why‑Analyse" },
  { id: "surrealismus-generator", title: "Surrealismus‑Generator" },
  { id: "bibliothek-leben", title: "Bibliothek ungelebter Leben" },
  { id: "emotion-visualizer", title: "Emotion‑Visualizer" }
];

const root = document.getElementById("bubble-root");

function createBubbleEl(item, idx){
  const el = document.createElement("div");
  el.className = "bubble";
  const size = 120 + Math.min(220, Math.max(0, item.title.length * 6));
  el.style.width = el.style.height = size + "px";

  const color = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
  el.style.background = `radial-gradient(60% 60% at 30% 25%, rgba(255,255,255,.85), ${color})`;
  el.style.boxShadow = `0 0 80px ${hexToRgba(color, .45)}, inset 0 0 22px rgba(255,255,255,.18)`;

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = item.title;
  el.appendChild(label);

  // starting position
  const pad = 60;
  const x = pad + Math.random()*(root.clientWidth - size - pad*2);
  const y = pad + Math.random()*(root.clientHeight - size - pad*2);
  el.style.transform = `translate(${x}px, ${y}px)`;

  // physics
  el.__vx = (Math.random()*0.2+0.05)* (Math.random()<.5?-1:1);
  el.__vy = (Math.random()*0.2+0.05)* (Math.random()<.5?-1:1);
  el.__x = x; el.__y = y; el.__size = size;
  el.__scalePhase = Math.random()*Math.PI*2;
  el.__item = item;

  el.addEventListener("click",(e)=>{
    e.preventDefault();
    window.app && window.app.openRunModal(item);
  });

  root.appendChild(el);
  return el;
}

function step(){
  const children = Array.from(root.children);
  const w = root.clientWidth, h = root.clientHeight;

  for(const el of children){
    let {__x:x, __y:y, __vx:vx, __vy:vy, __size:size} = el;
    x += vx; y += vy;

    // bounce softly at edges
    if(x < 8 || x > (w - size - 8)) el.__vx = vx = -vx;
    if(y < 80 || y > (h - size - 8)) el.__vy = vy = -vy;

    el.__x = x; el.__y = y;
    el.__scalePhase += 0.01;
    const scale = 1 + Math.sin(el.__scalePhase)*0.015;
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
  requestAnimationFrame(step);
}

function mount(){
  root.innerHTML = "";
  const max = Math.min(9, BUBBLE_ITEMS.length);
  for(let i=0;i<max;i++){
    createBubbleEl(BUBBLE_ITEMS[i], i);
  }
  requestAnimationFrame(step);
}

function hexToRgba(hex, alpha){
  const v = hex.replace('#','');
  const bigint = parseInt(v, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

window.addEventListener("resize", ()=>{
  // Re-center a bit on resize (optional)
});

mount();
