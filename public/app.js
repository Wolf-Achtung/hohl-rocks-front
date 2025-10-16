// Frontend – Jellyfish Bubbles + SSE + Overlays
const META_BASE = document.querySelector('meta[name="x-api-base"]')?.content?.trim() || '';
const API_CANDIDATES = [
  '/_api',                 // Reverse proxy case
  META_BASE,               // Explicit backend
  '/api'                   // Same-origin (dev)
].filter(Boolean);

function bestApi(path){
  // Build list of candidate URLs
  return API_CANDIDATES.map(b => b.endsWith('/api') ? b + path : b + (path.startsWith('/api') ? path : '/api' + path));
}

async function fetchJsonFallback(paths, opts={}, timeoutMs=5000){
  for(const url of paths){
    try{
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), timeoutMs);
      const r = await fetch(url, { ...opts, signal: ctrl.signal, headers:{'accept':'application/json', ...(opts.headers||{}) } });
      clearTimeout(t);
      if(r.ok) return await r.json();
    }catch(e){ /* try next */ }
  }
  throw new Error('API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.');
}

// ---------- BUBBLE CONTENT ----------

// Primary micro-apps (click -> run)
const CORE = [
  { id:'zeitreise-tagebuch', title:'Zeitreise‑Tagebuch' },
  { id:'weltbau', title:'Weltbau' },
  { id:'poesie-html', title:'Bunte Poesie' },
  { id:'bild-generator', title:'Bild‑Generator' },
  { id:'musik-generator', title:'Musik‑Generator' },
  { id:'bild-beschreibung', title:'Bild‑Beschreibung' }
];

// 30 creative ideas (ids must match backend)
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

// Queue: first CORE mixed with IDEAS
const QUEUE = [...CORE, ...IDEAS];

// ---------- UTIL ----------
const $ = s=>document.querySelector(s);
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.add('show'); setTimeout(()=> el.classList.remove('show'), 2200); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// ---------- MODAL ----------
const modal = $('#modal');
const modalTitle = $('#modal-title');
const modalBody = $('#modal-body');
$('#close-btn').addEventListener('click', ()=> modal.setAttribute('aria-hidden','true'));
$('#copy-btn').addEventListener('click', ()=> {
  const txt = modalBody.textContent || modalBody.innerText || '';
  navigator.clipboard.writeText(txt).then(()=>toast('Kopiert ✓')).catch(()=>toast('Kopieren nicht möglich'));
});
function openModal(title, html){ modalTitle.textContent = title; modalBody.innerHTML = html; modal.setAttribute('aria-hidden','false'); }

// ---------- AUDIO ----------
let audioCtx=null, masterGain=null, isAudioOn=false;
$('#audio-toggle').addEventListener('click', async (e)=>{
  if(!audioCtx){
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    masterGain = audioCtx.createGain(); masterGain.gain.value=0.12; masterGain.connect(audioCtx.destination);
    const osc1 = audioCtx.createOscillator(); const g1 = audioCtx.createGain(); osc1.type='sine'; osc1.frequency.value=140; g1.gain.value=0.05; osc1.connect(g1); g1.connect(masterGain); osc1.start();
    const osc2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain(); osc2.type='triangle'; osc2.frequency.value=220; g2.gain.value=0.03; osc2.connect(g2); g2.connect(masterGain); osc2.start();
    const lfo=audioCtx.createOscillator(), lGain=audioCtx.createGain(); lfo.frequency.value=.05; lGain.gain.value=30; lfo.connect(lGain); lGain.connect(osc2.frequency); lfo.start();
  }
  if(audioCtx.state==='suspended') await audioCtx.resume();
  isAudioOn=!isAudioOn; masterGain.gain.linearRampToValueAtTime(isAudioOn?0.12:0.0, audioCtx.currentTime+.2);
  e.currentTarget.setAttribute('aria-pressed', String(isAudioOn));
});

// ---------- SSE Runner ----------
async function runBubble(id, input={}, thread=[]){
  try{
    openModal('Assistant', '<pre id="stream-box"></pre>');
    const box = $('#stream-box');
    const res = await fetchJsonFallback(bestApi('/run'), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input, thread }) });
    // Wenn das Backend JSON (nicht SSE) liefert, erscheint hier bereits Antwort:
    if(res && typeof res === 'object' && (res.text || res.html)){
      box.textContent = res.text || (res.html || '');
      return;
    }
  }catch(e){
    // Fallback: echte SSE streamen (standardpfad)
    try{
      const paths = bestApi('/run');
      const url = paths[0]; // erster Kandidat
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input, thread }) });
      if(!resp.ok || !resp.body){ $('#stream-box').textContent = 'Fehler: '+resp.status; return; }
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf='';
      while(true){
        const {value, done} = await reader.read(); if(done) break;
        buf += dec.decode(value, {stream:true});
        const parts = buf.split('\n\n'); buf = parts.pop() || '';
        for(const part of parts){
          if(!part.startsWith('data:')) continue;
          const payload = part.slice(5).trim(); if(payload==='[DONE]') continue;
          try{ const j=JSON.parse(payload); if(j.delta) $('#stream-box').textContent += j.delta; if(j.error) $('#stream-box').textContent += '\\n\\n[Fehler] '+j.error; }catch{}
        }
      }
    }catch(err2){
      openModal('Fehler', `<p>${(e && e.message)||String(e)}<br>${(err2 && err2.message)||String(err2)}</p>`);
    }
  }
}

// ---------- Jellyfish Bubble Engine ----------
class BubbleEngine{
  constructor(root){
    this.root = root;
    this.items = [...QUEUE]; // feed
    this.idx = 0;
    this.nodes = new Set();
    this.max = window.innerWidth < 820 ? 4 : 7;
    this.running = false;
    this.last = performance.now();
    this.anim = this.anim.bind(this);
  }
  nextItem(){
    const item = this.items[this.idx % this.items.length];
    this.idx++;
    if(this.idx >= this.items.length) this.idx = 0; // loop
    return item;
  }
  spawn(){
    const item = this.nextItem();
    const rMin = 110, rMax = 160;
    const r = Math.round(rMin + Math.random()*(rMax-rMin));
    const node = document.createElement('div');
    node.className = 'bubble-node';
    node.style.setProperty('--r', r+'px');
    node.dataset.id = item.id;
    node.dataset.title = item.title;
    node.innerHTML = `<div class="bubble-core"></div>
      <div class="bubble-label">${item.title}</div>
      <div class="bubble-actions">
        <button class="small" data-act="start">Start</button>
      </div>`;
    const fieldRect = this.root.getBoundingClientRect();
    const x = Math.random() * (fieldRect.width - r);
    const y = Math.random() * (fieldRect.height - r);
    const v = { x: (Math.random()-.5)*0.08, y: (Math.random()-.5)*0.08 }; // px/ms
    const life = 14000 + Math.random()*16000;
    const born = performance.now();
    const lfo = 0.6 + Math.random()*0.8;
    node.__b = { x, y, v, r, life, born, lfo };
    node.style.setProperty('--x', x+'px'); node.style.setProperty('--y', y+'px');
    this.root.appendChild(node);
    requestAnimationFrame(()=> node.classList.add('live'));
    node.addEventListener('mouseenter', ()=> node.__b.v = {x: node.__b.v.x*0.2, y: node.__b.v.y*0.2});
    node.addEventListener('mouseleave', ()=> node.__b.v = {x: node.__b.v.x*5, y: node.__b.v.y*5});
    node.addEventListener('click', (e)=>{
      const act = e.target.closest('[data-act]')?.dataset?.act;
      if(act==='start'){ runBubble(item.id); }
    });
    this.nodes.add(node);
  }
  start(){
    this.running = true;
    for(let i=0;i<this.max;i++) this.spawn();
    requestAnimationFrame(this.anim);
  }
  stop(){
    this.running = false;
  }
  anim(now){
    const dt = now - this.last; this.last = now;
    const rect = this.root.getBoundingClientRect();
    for(const node of Array.from(this.nodes)){
      const b = node.__b; if(!b) continue;
      // position
      b.x += b.v.x * dt * (1 + 0.15*Math.sin((now-b.born)/1000*b.lfo));
      b.y += b.v.y * dt * (1 + 0.15*Math.cos((now-b.born)/1200*b.lfo));
      // bounds (soft bounce)
      if(b.x < 0 || b.x > rect.width - b.r) b.v.x *= -1;
      if(b.y < 0 || b.y > rect.height - b.r) b.v.y *= -1;
      // apply
      node.style.setProperty('--x', Math.max(0, Math.min(rect.width - b.r, b.x))+'px');
      node.style.setProperty('--y', Math.max(0, Math.min(rect.height - b.r, b.y))+'px');
      // lifetime
      const age = now - b.born;
      if(age > b.life - 1600 && !node.classList.contains('fading')) node.classList.add('fading');
      if(age > b.life){
        node.remove(); this.nodes.delete(node);
        this.spawn();
      }
    }
    if(this.running) requestAnimationFrame(this.anim);
  }
}

const field = document.getElementById('bubble-field');
const engine = new BubbleEngine(field);
engine.start();

// ---------- Overlays ----------
async function renderNews(){
  try{
    const data = await fetchJsonFallback(bestApi('/news'));
    const html = (data.items||[]).map(it=> `<li><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></li>`).join('');
    openModal('News', `<ul>${html || '<li>Keine Einträge gefunden.</li>'}</ul>`);
  }catch(err){
    openModal('News', `<p>${err.message}</p>`);
  }
}
function renderProjects(){
  openModal('Projekte', `
    <ul>
      <li><strong>Bubble Engine</strong> – Jellyfish Motion (Bewegung, Lebensdauer, sanftes Aus-/Einblenden)</li>
      <li><strong>SSE‑Runner</strong> – Live‑Streaming von Text (Claude/OpenAI/OpenRouter)</li>
      <li><strong>Audio‑UX</strong> – dezente Ambient‑Schicht (On‑Demand, DSGVO‑freundlich)</li>
    </ul>`);
}

// 20 Büro‑Prompts (kopierbereit)
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
  const items = OFFICE_PROMPTS.map(([title, text]) => `
    <div class="bubble-node live" style="--r: 260px; position:relative; opacity:1; transform:none; pointer-events:auto;">
      <div class="bubble-core"></div>
      <div class="bubble-label">${title}</div>
      <div class="bubble-actions">
        <button class="small" data-copy='${text.replace(/"/g,"&quot;")}'>Kopieren</button>
      </div>
    </div>
  `).join('');
  openModal('Prompts (Büroalltag)', `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${items}</div>`);
  modalBody.querySelectorAll('[data-copy]').forEach(b=> b.addEventListener('click', ()=> {
    navigator.clipboard.writeText(b.getAttribute('data-copy')).then(()=>toast('Kopiert ✓'));
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

// Nav
document.querySelector('[data-open="news"]').addEventListener('click', renderNews);
document.querySelector('[data-open="prompts"]').addEventListener('click', renderPrompts);
document.querySelector('[data-open="projects"]').addEventListener('click', renderProjects);
document.querySelector('[data-open="imprint"]').addEventListener('click', renderImprint);

// Sprache Toggle (Placeholder)
document.getElementById('lang-toggle').addEventListener('click', (e)=>{
  const v = e.currentTarget.getAttribute('aria-pressed') === 'true';
  e.currentTarget.setAttribute('aria-pressed', String(!v));
  toast(!v ? 'English UI soon' : 'Deutsch');
});
