// hohl.rocks front – Jellyfish Bubbles, SSE, Overlays (no inline JS)
const META_BASE = document.querySelector('meta[name="x-api-base"]')?.content?.trim() || '';
const API_CANDIDATES = [
  '/_api',                 // Proxy path on Netlify
  META_BASE,               // Explicit backend (Railway)
  '/api'                   // same-origin (dev)
].filter(Boolean);

const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
function on(el, ev, fn, opts){ el && el.addEventListener(ev, fn, opts); }
function toast(msg){
  const el = $('#toast'); if(!el) { console.warn('toast container missing'); return; }
  el.textContent = msg; el.classList.add('show'); setTimeout(()=> el.classList.remove('show'), 2200);
}

function bestApi(path){
  return API_CANDIDATES.map(b => b.endsWith('/api') ? (b + path) : (b + (path.startsWith('/api') ? path : '/api' + path)));
}

async function fetchJsonFallback(paths, opts={}, timeoutMs=7000){
  for(const url of paths){
    try{
      const ctrl = new AbortController(); const t = setTimeout(()=>ctrl.abort(), timeoutMs);
      const r = await fetch(url, { ...opts, signal: ctrl.signal, headers: {'accept':'application/json', ...(opts.headers||{}) }});
      clearTimeout(t);
      if(r.ok) return await r.json();
    }catch(e){ /* try next */ }
  }
  throw new Error('API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.');
}

// ---- Modal
const modal = $('#modal');
const modalTitle = $('#modal-title');
const modalBody = $('#modal-body');
const modalPanel = $('.modal__panel');
on($('#close-btn'), 'click', closeModal);
on($('#modal-close-x'), 'click', closeModal);
on(modal, 'click', (e)=> { if(e.target === modal) closeModal(); });
on(window, 'keydown', (e)=> { if(e.key === 'Escape') closeModal(); });

function openModal(title, html){
  if(modalTitle) modalTitle.textContent = title || '';
  if(modalBody) modalBody.innerHTML = html || '';
  modal?.setAttribute('aria-hidden','false');
}
function closeModal(){
  modal?.setAttribute('aria-hidden','true');
  if(modalBody) modalBody.innerHTML = '';
}

// Copy button (contextual)
on($('#copy-btn'), 'click', ()=> {
  const txt = modalBody?.textContent || '';
  navigator.clipboard.writeText(txt).then(()=>toast('Kopiert ✓')).catch(()=>toast('Kopieren nicht möglich'));
});

// ---- Audio (on demand)
let audioCtx=null, masterGain=null, isAudioOn=false;
on($('#audio-toggle'), 'click', async (e)=>{
  try{
    if(!audioCtx){
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      masterGain = audioCtx.createGain(); masterGain.gain.value=0.12; masterGain.connect(audioCtx.destination);
      const mkOsc = (type, freq, gain)=>{ const o = audioCtx.createOscillator(); o.type=type; o.frequency.value=freq; const g=audioCtx.createGain(); g.gain.value=gain; o.connect(g); g.connect(masterGain); o.start(); return [o,g]; };
      const [osc1] = mkOsc('sine', 140, 0.05);
      const [osc2] = mkOsc('triangle', 220, 0.03);
      const lfo=audioCtx.createOscillator(), lGain=audioCtx.createGain(); lfo.frequency.value=.05; lGain.gain.value=30; lfo.connect(lGain); lGain.connect(osc2.frequency); lfo.start();
    }
    if(audioCtx.state==='suspended') await audioCtx.resume();
    isAudioOn=!isAudioOn; masterGain.gain.linearRampToValueAtTime(isAudioOn?0.12:0.0, audioCtx.currentTime+.2);
    e.currentTarget?.setAttribute('aria-pressed', String(isAudioOn));
  }catch(err){ console.warn('Audio failed', err); }
});

// ---- BG video play on first interaction (no inline script required)
(function(){
  const v = $('#bg-video');
  if(!v) return;
  const kick = ()=>{ v.play?.().catch(()=>{}); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick, { once:true });
})();

// ---- SSE Runner
async function runBubble(id, input={}, thread=[]){
  openModal('Assistant', '<pre id="stream-box" style="white-space:pre-wrap;word-wrap:break-word;"></pre>');
  const box = $('#stream-box');
  const paths = bestApi('/run');
  let success=false, lastErr=null;
  for(const url of paths){
    try{
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input, thread }) });
      if(!resp.ok) { lastErr = new Error('HTTP '+resp.status); continue; }
      if(!resp.body){ // maybe JSON
        const data = await resp.json().catch(()=>null);
        if(data?.text || data?.html){ box && (box.textContent = data.text || data.html); success=true; break; }
        lastErr = new Error('Kein Stream/Body'); continue;
      }
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf='';
      while(true){
        const {value, done} = await reader.read(); if(done) break;
        buf += dec.decode(value, {stream:true});
        const parts = buf.split('\n\n'); buf = parts.pop() || '';
        for(const part of parts){
          if(!part.startsWith('data:')) continue;
          const payload = part.slice(5).trim();
          if(payload === '[DONE]') continue;
          try { const j = JSON.parse(payload); if(j.delta && box) box.textContent += j.delta; if(j.error && box) box.textContent += '\n\n[Fehler] '+j.error; } catch {}
        }
      }
      success=true; break;
    }catch(e){ lastErr = e; }
  }
  if(!success) openModal('Fehler', `<p>${(lastErr && lastErr.message)||'Unbekannter Fehler'}</p>`);
}

// ---- Bubble Engine
const CORE = [
  { id:'zeitreise-tagebuch', title:'Zeitreise‑Tagebuch' },
  { id:'weltbau', title:'Weltbau' },
  { id:'poesie-html', title:'Bunte Poesie' },
  { id:'bild-generator', title:'Bild‑Generator' },
  { id:'musik-generator', title:'Musik‑Generator' },
  { id:'bild-beschreibung', title:'Bild‑Beschreibung' }
];
const IDEAS = [
  {id:'idea-zeitreise-editor', title:'Zeitreise‑Editor'},
  {id:'idea-rueckwaerts-zivilisation', title:'Rückwärts‑Zivilisation'},
  {id:'idea-bewusstsein-gebaeude', title:'Bewusstsein Gebäude'},
  {id:'idea-philosophie-mentor', title:'KI‑Philosophie‑Mentor'},
  {id:'idea-marktplatz-guide', title:'Interdimensionaler Guide'},
  {id:'idea-npc-leben', title:'NPC Privatleben'},
  {id:'idea-prompt-archaeologe', title:'Prompt‑Archäologe'},
  {id:'idea-ki-traeume', title:'KI‑Träume'},
  {id:'idea-recursive-story', title:'Rekursive Story'},
  {id:'idea-xenobiologe', title:'Xenobiologe'},
  {id:'idea-quantentagebuch', title:'Quantentagebuch'},
  {id:'idea-rueckwaerts-apokalypse', title:'Rückwärts‑Apokalypse'},
  {id:'idea-farbsynaesthetiker', title:'Farbsynästhetiker'},
  {id:'idea-museum-verlorene-traeume', title:'Museum verlorene Träume'},
  {id:'idea-zeitlupen-explosion', title:'Zeitlupen‑Explosion'},
  {id:'idea-gps-bewusstsein', title:'GPS Bewusstsein'},
  {id:'idea-biografie-pixel', title:'Biografie eines Pixels'},
  {id:'idea-rueckwaerts-detektiv', title:'Rückwärts‑Detektiv'},
  {id:'idea-bewusstsein-internet', title:'Bewusstsein des Internets'},
  {id:'idea-emotional-alchemist', title:'Emotional‑Alchemist'},
  {id:'idea-bibliothek-ungelebter-leben', title:'Bibliothek ungelebter Leben'},
  {id:'idea-realitaets-debugger', title:'Realitäts‑Debugger'},
  {id:'idea-empathie-tutorial', title:'Empathie‑Tutorial'},
  {id:'idea-surrealismus-generator', title:'Surrealismus‑Generator'},
  {id:'idea-vintage-futurist', title:'Vintage‑Futurist'},
  {id:'idea-synaesthetisches-internet', title:'Synästhetisches Internet'},
  {id:'idea-code-poet', title:'Code‑Poet'},
  {id:'idea-kollektiv-gedanke-moderator', title:'Kollektiv‑Moderator'},
  {id:'idea-paradox-loesungszentrum', title:'Paradox‑Zentrum'},
  {id:'idea-universums-uebersetzer', title:'Universums‑Übersetzer'}
];
const QUEUE = [...CORE, ...IDEAS];

class BubbleEngine{
  constructor(root){
    this.root = root;
    this.items = [...QUEUE];
    this.idx = 0;
    this.nodes = new Set();
    this.max = window.innerWidth < 820 ? 4 : 7;
    this.running = false;
    this.last = performance.now();
    this.anim = this.anim.bind(this);
  }
  nextItem(){ const item = this.items[this.idx % this.items.length]; this.idx++; if(this.idx>=this.items.length) this.idx=0; return item; }
  spawn(){
    const item = this.nextItem();
    const rMin = 110, rMax = 160; const r = Math.round(rMin + Math.random()*(rMax-rMin));
    const node = document.createElement('div'); node.className = 'bubble-node'; node.style.setProperty('--r', r+'px');
    node.dataset.id=item.id; node.dataset.title=item.title;
    node.innerHTML = `<div class="bubble-core"></div>
      <div class="bubble-label">${item.title}</div>
      <div class="bubble-actions"><button class="small" data-act="start">Start</button></div>`;
    const rect = this.root.getBoundingClientRect();
    const x = Math.random() * (rect.width - r); const y = Math.random() * (rect.height - r);
    const v = { x: (Math.random()-.5)*0.08, y: (Math.random()-.5)*0.08 };
    const life = 14000 + Math.random()*16000; const born = performance.now(); const lfo = 0.6 + Math.random()*0.8;
    node.__b = { x, y, v, r, life, born, lfo };
    node.style.setProperty('--x', x+'px'); node.style.setProperty('--y', y+'px');
    this.root.appendChild(node);
    requestAnimationFrame(()=> node.classList.add('live'));
    on(node, 'mouseenter', ()=> node.__b.v = {x: node.__b.v.x*0.2, y: node.__b.v.y*0.2});
    on(node, 'mouseleave', ()=> node.__b.v = {x: node.__b.v.x*5, y: node.__b.v.y*5});
    on(node, 'click', (e)=>{ if(e.target.closest('[data-act="start"]')) runBubble(item.id); });
    this.nodes.add(node);
  }
  start(){ if(this.running) return; this.running = true; for(let i=0;i<this.max;i++) this.spawn(); requestAnimationFrame(this.anim); }
  stop(){ this.running=false; }
  anim(now){
    const dt = now - this.last; this.last = now;
    const rect = this.root.getBoundingClientRect();
    for(const node of Array.from(this.nodes)){
      const b = node.__b; if(!b) continue;
      b.x += b.v.x * dt * (1 + 0.15*Math.sin((now-b.born)/1000*b.lfo));
      b.y += b.v.y * dt * (1 + 0.15*Math.cos((now-b.born)/1200*b.lfo));
      if(b.x < 0 || b.x > rect.width - b.r) b.v.x *= -1;
      if(b.y < 0 || b.y > rect.height - b.r) b.v.y *= -1;
      node.style.setProperty('--x', Math.max(0, Math.min(rect.width - b.r, b.x))+'px');
      node.style.setProperty('--y', Math.max(0, Math.min(rect.height - b.r, b.y))+'px');
      const age = now - b.born;
      if(age > b.life - 1600 && !node.classList.contains('fading')) node.classList.add('fading');
      if(age > b.life){ node.remove(); this.nodes.delete(node); this.spawn(); }
    }
    if(this.running) requestAnimationFrame(this.anim);
  }
}

const field = document.getElementById('bubble-field');
if(field){ const engine = new BubbleEngine(field); engine.start(); }

// ---- Overlays
async function renderNews(){
  try{
    const data = await fetchJsonFallback(bestApi('/news'));
    const html = (data.items||[]).map(it=> `<li><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></li>`).join('');
    openModal('News', `<ul>${html || '<li>Keine Einträge gefunden.</li>'}</ul>`);
  }catch(err){ openModal('News', `<p>${err.message}</p>`); }
}
function renderProjects(){
  openModal('Projekte', `
    <ul>
      <li><strong>Bubble Engine</strong> – Jellyfish Motion (Bewegung, Lebensdauer, Fade)</li>
      <li><strong>SSE‑Runner</strong> – Streaming von Text (Claude/OpenAI/OpenRouter)</li>
      <li><strong>Audio‑UX</strong> – dezente Ambient‑Schicht (On‑Demand, DSGVO‑freundlich)</li>
    </ul>`);
}
// Büro-Prompts (20)
const OFFICE_PROMPTS = [
  ['E-Mail-Klartext', 'Formuliere diese zu lange E-Mail respektvoll, klar und in 5 Sätzen. Erhalte 3 Varianten (direkt, diplomatisch, motivierend).'],
  ['Meeting-Agenda 30 Min', 'Erstelle eine straffe Agenda für ein 30‑Minuten‑Meeting mit Ziel, 3 Blöcken, Timebox und Entscheidungsfragen.'],
  ['Protokoll aus Stichpunkten', 'Wandle diese Stichpunkte in ein prägnantes, nummeriertes Protokoll mit Aufgaben (Wer? Bis wann?).'],
  ['Status-Update wie Exec', 'Verdichte folgende Infos zu einem 120‑Wörter‑Update im Executive‑Ton, mit 3 KPIs und Ampelstatus.'],
  ['OKR-Feinschliff', 'Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen. Max. 5 Key Results.'],
  ['PR-Statement', 'Schreibe ein kurzes Pressestatement (max. 120 Wörter), neutral, faktisch, ohne Superlative.'],
  ['Social Copy x3', 'Erzeuge 3 Social‑Posts (LinkedIn), je 280 Zeichen, mit Hook, Nützlichkeit, 1 Hashtag.'],
  ['Customer E-Mail – heikel', 'Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation + nächster Schritt.'],
  ['Sales-Pitch Kurzfassung', 'Erstelle einen 90‑Sekunden‑Pitch mit Nutzen, 3 Belegen, CTA. Zielgruppe: Entscheider.'],
  ['SWOT in 8 Punkten', 'Erzeuge eine SWOT zu [Thema] mit jeweils 2 kompakten Aussagen pro Quadrant.'],
  ['Briefing für Designer', 'Fasse diese Anforderungen in ein Design‑Briefing: Ziel, Ton, Pflicht‑Elemente, Nicht‑Ziele, 3 Beispiele.'],
  ['Roadmap in Meilensteinen', 'Zerlege folgendes Vorhaben in 5 Meilensteine mit Definition of Done und Risiken.'],
  ['Stakeholder-Map', 'Identifiziere Stakeholder, ordne Power/Interesse ein und schlage Kommunikationsfrequenzen vor.'],
  ['Kundeninterview-Leitfaden', 'Erstelle 10 Fragen: Problemverständnis, bisherige Lösungen, Entscheidungswege, Budget.'],
  ['Onboarding-Plan 30 Tage', 'Erstelle einen Plan für neue Mitarbeiter: Woche 1–4, Lernziele, Shadowing, erste Quick Wins.'],
  ['Fehleranalyse 5‑Why', 'Wende 5‑Why auf dieses Incident an und formuliere 3 präventive Maßnahmen.'],
  ['Sprechzettel Vorstand', 'Schreibe einen 2‑minütigen Sprechzettel (stichpunktartig) zu [Thema], klar, faktenbasiert.'],
  ['Produkt-FAQ', 'Erzeuge eine FAQ‑Liste (10 Fragen) inkl. präziser Antworten in Kundensprache.'],
  ['Newsletter-Snack', 'Schreibe einen 90‑Wörter‑Newsletter‑Teaser mit Hook, Nutzen und Link‑CTA.'],
  ['Jira-Tickets', 'Zerlege diese User Story in 5–7 umsetzbare Tickets (Akzeptanzkriterien im Given‑When‑Then‑Format).']
];
function renderPrompts(){
  const items = OFFICE_PROMPTS.map(([title, text])=>`
    <div class="card">
      <h4>${title}</h4>
      <p>${text}</p>
      <button class="small" data-copy="${text.replace(/"/g,'&quot;')}">Kopieren</button>
    </div>`).join('');
  openModal('Prompts (Büroalltag)', `<div class="cards">${items}</div>`);
  $$('#modal [data-copy]').forEach(b=> on(b,'click', ()=>{
    navigator.clipboard.writeText(b.getAttribute('data-copy')||'').then(()=>toast('Kopiert ✓'));
  }));
}
function renderImprint(){
  openModal('Rechtliches & Transparenz', `
  <article>
    <h3>Impressum</h3>
    <p><strong>Verantwortlich für den Inhalt:</strong><br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin</p>
    <p><a href="mailto:hello@hohl.rocks">E‑Mail schreiben</a></p>
    <h4>Haftungsausschluss</h4>
    <p>Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>
    <h4>Urheberrecht</h4>
    <p>Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.</p>
    <h4>Hinweis zum EU AI Act</h4>
    <p>Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>
    <h3>Datenschutzerklärung</h3>
    <p><strong>Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.</strong></p>
    <h4>Kontakt mit mir</h4>
    <p>Wenn Sie per Formular oder E‑Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.</p>
    <h4>Cookies</h4>
    <p>Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.</p>
    <h4>Ihre Rechte laut DSGVO</h4>
    <ul>
      <li>Auskunft, Berichtigung oder Löschung Ihrer Daten</li>
      <li>Datenübertragbarkeit</li>
      <li>Widerruf erteilter Einwilligungen</li>
      <li>Beschwerde bei der Datenschutzbehörde</li>
    </ul>
  </article>`);
}

// Nav wiring (with guards)
on(document.querySelector('[data-open="news"]'), 'click', renderNews);
on(document.querySelector('[data-open="prompts"]'), 'click', renderPrompts);
on(document.querySelector('[data-open="projects"]'), 'click', renderProjects);
on(document.querySelector('[data-open="imprint"]'), 'click', renderImprint);

// Language toggle placeholder
on(document.getElementById('lang-toggle'), 'click', (e)=>{
  const v = e.currentTarget.getAttribute('aria-pressed') === 'true';
  e.currentTarget.setAttribute('aria-pressed', String(!v));
  toast(!v ? 'English UI soon' : 'Deutsch');
});
