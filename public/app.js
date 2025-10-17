// Simple helpers
const qs = (s, el=document)=> el.querySelector(s);
const qsa = (s, el=document)=> [...el.querySelectorAll(s)];
const byId = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ----- Telemetry (local only) -----
const logEvent = (type, detail={}) => {
  const key = 'hrx_events';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push({ t: Date.now(), type, ...detail });
  if (arr.length > 500) arr.shift();
  localStorage.setItem(key, JSON.stringify(arr));
};

// ----- Audio Engine (starts on first user gesture) -----
let audioCtx = null, masterGain=null, filter=null;
let audioEnabled = false;
function initAudio(){
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.12;
  filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  const o1 = audioCtx.createOscillator(); o1.type='sine'; o1.frequency.value = 80;
  const o2 = audioCtx.createOscillator(); o2.type='triangle'; o2.frequency.value = 160;
  const o3 = audioCtx.createOscillator(); o3.type='sine'; o3.frequency.value = 320;
  o1.connect(filter); o2.connect(filter); o3.connect(filter);
  filter.connect(masterGain); masterGain.connect(audioCtx.destination);
  o1.start(); o2.start(); o3.start();
  audioEnabled = true;
}
function updateAudioByPointer(xNorm=0.5, yNorm=0.5){
  if (!audioEnabled) return;
  const freq = 800 + yNorm * 2400; // tiefe->hoch mit scroll/pos
  filter.frequency.setTargetAtTime(freq, audioCtx.currentTime, .2);
  const pan = (xNorm - .5) * .6; // not using PannerNode for simplicity; emulate via gain
  masterGain.gain.setTargetAtTime(0.08 + (1 - yNorm)*0.08, audioCtx.currentTime, .2);
}

// ----- Modal with focus trap -----
const modal = byId('modal');
const modalBody = byId('modalBody');
const modalTitle = byId('modalTitle');
const btnCopy = byId('copyBtn');
const btnClose = byId('closeBtn');
let lastFocus=null;
let copiedPayload='';

function openModal({title='Info', html='', copy=''}){
  copiedPayload = copy || '';
  modalTitle.textContent = title || 'Info';
  modalBody.innerHTML = html || '<p></p>';
  modal.classList.remove('hidden');
  lastFocus = document.activeElement;
  const fEl = qs('.modal__panel', modal);
  fEl && fEl.focus();
  document.addEventListener('keydown', escClose);
}
function closeModal(){
  modal.classList.add('hidden');
  document.removeEventListener('keydown', escClose);
  lastFocus && lastFocus.focus();
}
function escClose(e){ if (e.key === 'Escape') closeModal(); }
modal.addEventListener('click', (e)=>{
  if (e.target === modal) closeModal();
});
btnClose.addEventListener('click', closeModal);
qs('.x', modal).addEventListener('click', closeModal);
btnCopy.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(copiedPayload || '');
    showToast('Kopiert ✓');
    logEvent('copy', { len: (copiedPayload||'').length });
  }catch{ showToast('Kopieren fehlgeschlagen'); }
});
function showToast(t){ const el = byId('toast'); el.textContent = t; el.classList.add('show'); setTimeout(()=> el.classList.remove('show'), 1200); }

// ----- Bubbles (jellyfish drift) -----
const bubbleLayer = byId('bubbleLayer');
const COLORS = [
  ['#ff9ef2','#72ffd8'], ['#7ad7ff','#ffd66b'], ['#9effa8','#7abfff'],
  ['#ffb3a7','#b395ff'], ['#ffd06e','#84ffd1'], ['#ff82c9','#7eeeff']
];

const ITEMS = [
  { id:'zeitreise_tagebuch', title:'Zeitreise‑Tagebuch', short:'Schreibe einen Eintrag aus einer anderen Epoche.', kind:'prompt' },
  { id:'briefing_assistant', title:'Briefing‑Assistent', short:'Erzeugt ein kompaktes Creative‑Briefing.', kind:'prompt' },
  { id:'surrealismus_generator', title:'Surrealismus‑Generator', short:'Alltagsobjekte → surreale Kunst.', kind:'prompt' },
  { id:'image_gen', title:'Bild‑Generator', short:'Erzeuge ein Bild aus Text.', kind:'module' },
  { id:'advisor', title:'LLM‑Berater', short:'Welcher Dienst passt zu mir?', kind:'module' }
];

function makeBubble(item, idx){
  const el = document.createElement('div');
  el.className = 'bubble';
  const [c1,c2] = COLORS[idx % COLORS.length];
  el.style.setProperty('--c1', c1);
  el.style.setProperty('--c2', c2);
  el.style.setProperty('--glow', `${c1}55`);
  const size = 120 + (idx%5)*40 + Math.random()*30;
  el.style.width = `${size}px`; el.style.height = `${size}px`;
  el.style.left = `${10 + Math.random()*80}%`;
  el.style.top = `${8 + Math.random()*40}%`;
  el.innerHTML = `<h3>${item.title}</h3><small>${item.short||''}</small><div class="cta">Start</div>`;
  el.tabIndex = 0;
  el.addEventListener('click', ()=> handleBubble(item));
  el.addEventListener('keydown', (e)=>{ if (e.key==='Enter') handleBubble(item); });
  bubbleLayer.appendChild(el);
  // drift animation
  const driftX = (Math.random()*.6+ .2) * (Math.random()>.5?1:-1);
  const driftY = (Math.random()*.4+ .2) * (Math.random()>.5?1:-1);
  let t=0;
  function tick(){
    t+=0.0025;
    const dx = Math.sin(t*1.2) * driftX;
    const dy = Math.cos(t*0.9) * driftY;
    el.style.transform = `translate(${dx}rem, ${dy}rem)`;
    requestAnimationFrame(tick);
  }
  tick();
}

function renderBubbles(){
  bubbleLayer.innerHTML='';
  ITEMS.forEach((it, i)=> makeBubble(it, i));
}

// ----- Nav actions -----
document.addEventListener('click', (e)=>{
  const b = e.target.closest('button.chip');
  if (!b) return;
  const a = b.dataset.action;
  if (a === 'news') openNews();
  if (a === 'prompts') openPrompts();
  if (a === 'imprint') openImprint();
  if (a === 'sound') toggleSound();
  if (a === 'daily') {/* noop - label rotates automatically */}
});

function toggleSound(){
  if (!audioCtx){
    initAudio();
    byId('soundBtn').textContent = 'Klang • an';
    showToast('Klang an');
  } else {
    if (audioCtx.state === 'running'){
      audioCtx.suspend(); showToast('Klang aus'); byId('soundBtn').textContent='Klang';
    }else{
      audioCtx.resume(); showToast('Klang an'); byId('soundBtn').textContent='Klang • an';
    }
  }
}

// ----- API helpers -----
const API_BASE = '/api'; // netlify proxy to railway

async function apiGet(path){
  const r = await fetch(API_BASE + path);
  if (!r.ok) throw new Error('http_'+r.status);
  return r.json();
}

async function apiStreamRun({prompt, system, provider, model}){
  const ctrl = new AbortController();
  const r = await fetch(API_BASE + '/run', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ prompt, system, provider, model }),
    signal: ctrl.signal
  });
  if (!r.ok) throw new Error('http_'+r.status);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  return {
    async *chunks(){
      while(true){
        const {done, value} = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const block of text.split('\n\n')){
          const line = block.trim();
          if (!line) continue;
          const evLine = line.split('\n').find(l=> l.startsWith('data:'));
          if (!evLine) continue;
          const payload = evLine.slice(5).trim();
          yield payload;
        }
      }
    },
    cancel(){ ctrl.abort(); }
  }
}

// ----- Features -----
async function openNews(){
  try{
    const j = await apiGet('/news');
    const list = (j.items||[]).map(x => `<li><a href="${x.url}" target="_blank" rel="noopener">${x.title}</a></li>`).join('');
    openModal({ title:'News', html:`<ul>${list}</ul>` });
  }catch{
    openModal({ title:'News', html:'<p>News‑Service nicht erreichbar.</p>' });
  }
}

async function openPrompts(){
  try{
    const j = await apiGet('/prompts');
    const items = j.items || [];
    const cards = items.map(p => `
      <div class="card">
        <div class="card__title">${p.title}</div>
        <div class="card__desc">${p.short||''}</div>
        <button class="btn btn--ghost" data-copy="${encodeURIComponent(p.copy)}">Kopieren</button>
      </div>
    `).join('');
    openModal({ title:'Prompts (Büroalltag)', html:`<div class="grid">${cards}</div>` });
    // delegate copy
    byId('modalBody').addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-copy]');
      if (!b) return;
      copiedPayload = decodeURIComponent(b.dataset.copy);
      btnCopy.click(); // reuse copy + toast
    }, { once:true });
  }catch{
    openModal({ title:'Prompts', html:'<p>Service nicht erreichbar.</p>' });
  }
}

function openImprint(){
  openModal({ title:'Impressum', html:`
    <p><strong>Wolf Hohl</strong><br/>Greifswalder Str. 224a<br/>10405 Berlin</p>
    <p>E‑Mail: bitte über Kontakt</p>
    <p>Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>
    <p>Keine Cookies, keine Tracker. Telemetrie nur lokal (anonym).</p>
  `});
}

async function handleBubble(item){
  logEvent('bubble', { id: item.id });
  if (item.kind === 'prompt'){
    // fetch prompt text from server
    try{
      const j = await apiGet('/prompts');
      const found = (j.items||[]).find(x => x.id === item.id);
      if (!found) return openModal({title:item.title, html:'<p>Nicht gefunden.</p>'});
      openModal({ title:item.title, html:`<p>${found.short||''}</p>`, copy: found.copy });
    }catch{
      openModal({ title:item.title, html:'<p>Service nicht erreichbar.</p>' });
    }
  } else if (item.id === 'advisor'){
    openModal({ title:'LLM‑Berater', html:`
      <p>Kurze Orientierungshilfe:</p>
      <ul>
        <li><strong>Claude (Anthropic)</strong>: sehr gut in Deutsch, reflektiert, sicherheitsbewusst, langes Kontextfenster.</li>
        <li><strong>GPT (OpenAI)</strong>: sehr kreativ, viel Tool‑Ökosystem, solide Bild‑/Codefähigkeiten.</li>
        <li><strong>OpenRouter</strong>: Meta‑Plattform – Zugriff auf viele Modelle (inkl. Claude/GPT); flexibel, Anbieterwahl.</li>
      </ul>
      <p>Tipp: Für sensible Daten EU‑Hosting bevorzugen; bei Kreativ‑Tasks Modelle vergleichen.</p>
    `});
  } else if (item.id === 'image_gen'){
    openModal({ title:'Bild‑Generator', html:`
      <p>Gib eine Bildbeschreibung ein (z.B. „Futuristische Straße im Nebel, cinematisch“):</p>
      <textarea id="imgPrompt" rows="3" style="width:100%;"></textarea>
      <div style="margin-top:10px"><button id="goImg" class="btn">Generieren</button></div>
      <div id="imgOut" style="margin-top:12px"></div>
    `});
    byId('goImg').addEventListener('click', async ()=>{
      const txt = byId('imgPrompt').value.trim();
      if (!txt) return;
      // Placeholder: For now, demo with LLM text stream instead of real image call (keep it simple).
      const stream = await apiStreamRun({ prompt: `Beschreibe eindrücklich ein Bild zu: ${txt}`, system:'Du bist ein poetischer Bildbeschreiber.', provider:'anthropic' });
      const box = byId('imgOut'); box.innerHTML='<pre></pre>';
      let acc='';
      for await (const ch of stream.chunks()){
        try{
          const obj = JSON.parse(ch);
          if (obj.ok) continue;
        }catch{
          acc += ch;
          box.firstChild.textContent = acc;
        }
      }
    });
  }
}

// ----- Daily ticker rotation -----
async function initTicker(){
  try{
    const j = await apiGet('/daily');
    const items = j.items || [];
    const lbl = byId('dailyLabel');
    let i=0;
    function step(){
      const it = items[i % items.length];
      lbl.textContent = it?.title ? it.title : 'Heute neu – …';
      i++; setTimeout(step, 7000);
    }
    step();
  }catch{
    byId('dailyLabel').textContent = 'Heute neu – n/a';
  }
}

// Events to kick audio mapping
window.addEventListener('mousemove', (e)=>{
  const x = e.clientX / innerWidth; const y = e.clientY / innerHeight;
  updateAudioByPointer(x,y);
});
window.addEventListener('scroll', ()=>{
  const y = window.scrollY / Math.max(1, (document.body.scrollHeight - innerHeight));
  updateAudioByPointer(.5, y);
}, { passive:true });

// First user gesture to start audio
['click','keydown','pointerdown','touchstart'].forEach(ev => {
  window.addEventListener(ev, ()=> initAudio(), { once:true, passive:true });
});

// Boot
window.addEventListener('DOMContentLoaded', ()=>{
  renderBubbles();
  initTicker();
});
