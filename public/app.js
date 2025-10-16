// Front v1.24 – ticker + robust video + bubble autosize + SSE path fix
const META_BASE = document.querySelector('meta[name="x-api-base"]')?.content?.trim() || '';
const API_BASES = ['/_api', META_BASE, '/api'].filter(Boolean);

const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
function on(el, ev, fn, opts){ el && el.addEventListener(ev, fn, opts); }
function toast(msg){ const el=$('#toast'); if(!el) return; el.textContent = msg; el.classList.add('show'); setTimeout(()=> el.classList.remove('show'), 2200); }

function joinApi(base, path){
  if(!base) return path;
  if(base === '/_api' || base.endsWith('/_api')) return `${base}${path}`;       // proxy passthrough
  if(base.endsWith('/api')) return `${base}${path}`;                            // already /api
  return `${base}/api${path}`;                                                  // host root
}
function bestApi(path){ return API_BASES.map(b => joinApi(b, path)); }

async function fetchJsonFallback(paths, opts={}, timeoutMs=8000){
  for(const url of paths){
    try{
      const ctrl = new AbortController(); const t=setTimeout(()=>ctrl.abort(), timeoutMs);
      const r = await fetch(url, { ...opts, signal: ctrl.signal, headers: {'accept':'application/json', ...(opts.headers||{}) } });
      clearTimeout(t);
      if(r.ok) return await r.json();
    }catch{}
  }
  throw new Error('API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.');
}

// ---- Modal wiring
const modal = $('#modal'), modalTitle = $('#modal-title'), modalBody = $('#modal-body');
on($('#close-btn'), 'click', closeModal);
on($('#modal-close-x'), 'click', closeModal);
on(modal, 'click', (e)=> { if(e.target === modal) closeModal(); });
on(window, 'keydown', (e)=> { if(e.key === 'Escape') closeModal(); });
function openModal(title, html){ if(modalTitle) modalTitle.textContent = title||''; if(modalBody) modalBody.innerHTML = html||''; modal?.setAttribute('aria-hidden','false'); }
function closeModal(){ modal?.setAttribute('aria-hidden','true'); if(modalBody) modalBody.innerHTML=''; }

on($('#copy-btn'), 'click', ()=>{ const txt=modalBody?.textContent||''; navigator.clipboard.writeText(txt).then(()=>toast('Kopiert ✓')).catch(()=>toast('Kopieren nicht möglich')); });

// ---- Audio (gentle)
let audioCtx=null, masterGain=null, isAudioOn=false;
on($('#audio-toggle'), 'click', async (e)=>{
  try{
    if(!audioCtx){
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      masterGain = audioCtx.createGain(); masterGain.gain.value=0.1; masterGain.connect(audioCtx.destination);
      const mkOsc=(type,f,g)=>{const o=audioCtx.createOscillator();o.type=type;o.frequency.value=f;const ga=audioCtx.createGain();ga.gain.value=g;o.connect(ga);ga.connect(masterGain);o.start();return [o,ga];};
      const [o1]=mkOsc('sine',135,0.05); const [o2]=mkOsc('triangle',205,0.03);
      const lfo=audioCtx.createOscillator(), lg=audioCtx.createGain(); lfo.frequency.value=.035; lg.gain.value=25; lfo.connect(lg); lg.connect(o2.frequency); lfo.start();
    }
    if(audioCtx.state==='suspended') await audioCtx.resume();
    isAudioOn=!isAudioOn; masterGain.gain.linearRampToValueAtTime(isAudioOn?0.1:0.0, audioCtx.currentTime+.25);
    e.currentTarget?.setAttribute('aria-pressed', String(isAudioOn));
  }catch(err){ console.warn('Audio failed', err); }
});

// ---- BG video readiness + multi-kick (Safari/iOS safe)
(function(){
  const v = $('#bg-video'); if(!v) return;
  const markReady = ()=> v.classList.add('ready');
  ['canplay','loadeddata','canplaythrough','loadedmetadata'].forEach(ev => v.addEventListener(ev, markReady, {once:true}));
  const kick = ()=>{ v.play?.().catch(()=>{}); };
  window.addEventListener('pointerdown', ()=>{ kick(); }, { once:true });
  window.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') kick(); });
  setTimeout(kick, 800); setTimeout(kick, 2500); setTimeout(kick, 5000);
  v.addEventListener('error', (e)=> console.warn('Video error', e));
})();

// ---- SSE Runner
async function runBubble(id, input={}, thread=[]){
  openModal('Assistant', '<pre id="stream-box" style="white-space:pre-wrap;word-wrap:break-word;"></pre>');
  const box = $('#stream-box'); let success=false, lastErr=null;
  for(const url of bestApi('/run')){
    try{
      const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input, thread }) });
      if(!resp.ok) { lastErr = new Error('HTTP '+resp.status); continue; }
      if(resp.body){
        const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf='';
        while(true){
          const {value, done} = await reader.read(); if(done) break;
          buf += dec.decode(value, {stream:true});
          const parts = buf.split('\n\n'); buf = parts.pop() || '';
          for(const part of parts){
            if(!part.startsWith('data:')) continue;
            const payload = part.slice(5).trim(); if(payload === '[DONE]') continue;
            try{ const j=JSON.parse(payload); if(j.delta && box) box.textContent += j.delta; if(j.error && box) box.textContent += '\n\n[Fehler] '+j.error; }catch{}
          }
        }
        success=true; break;
      }else{
        const data = await resp.json().catch(()=>null);
        if(data?.text || data?.html){ box && (box.textContent = data.text || data.html); success=true; break; }
      }
    }catch(e){ lastErr=e; }
  }
  if(!success) openModal('Fehler', `<p>${(lastErr && lastErr.message)||'Unbekannter Fehler'}</p>`);
}

// ---- Bubbles
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
const NEONS = ['#82f6ff','#8cffc2','#a0a7ff','#ffd166','#ff7bd5','#9dff6a','#8df','#f0f','#4dfcff','#ff9d5b'];

class BubbleEngine{
  constructor(root){
    this.root=root; this.items=[...QUEUE]; this.idx=0; this.nodes=new Set();
    this.max = window.innerWidth < 820 ? 4 : 7;
    this.running=false; this.last=performance.now();
    this.anim=this.anim.bind(this);
  }
  nextItem(){ const it=this.items[this.idx % this.items.length]; this.idx=(this.idx+1)%this.items.length; return it; }
  spawn(){
    const it=this.nextItem();
    let r = Math.round(90 + Math.random()*110); // 90–200px
    const node=document.createElement('div'); node.className='bubble-node'; node.style.setProperty('--r', r+'px');
    node.dataset.id=it.id; node.dataset.title=it.title;
    const color = NEONS[Math.floor(Math.random()*NEONS.length)];
    node.style.setProperty('--c', color);
    node.innerHTML = `<div class="bubble-core"></div><div class="bubble-halo"></div>
      <div class="bubble-label">${it.title}</div>
      <div class="bubble-actions"><button class="small" data-act="start">Start</button></div>`;
    const rect=this.root.getBoundingClientRect();
    // Temporary append to measure label width and adjust size if needed
    this.root.appendChild(node);
    const label = node.querySelector('.bubble-label');
    if(label){
      const labelWidth = label.scrollWidth;
      const needed = Math.ceil(labelWidth / 0.85); // center space vs label width
      if(needed > r) { r = Math.min(260, needed + 20); node.style.setProperty('--r', r+'px'); }
    }
    const x = Math.random()*(rect.width - r), y = Math.random()*(rect.height - r);
    const v = { x: (Math.random()-.5)*0.014, y: (Math.random()-.5)*0.014 }; // slow drift
    const life = 17000 + Math.random()*19000; const born = performance.now();
    const lfo = 0.4 + Math.random()*0.6;
    node.__b = { x, y, v, r, life, born, lfo };
    node.style.setProperty('--x', x+'px'); node.style.setProperty('--y', y+'px');
    requestAnimationFrame(()=> node.classList.add('live'));
    on(node, 'click', (e)=>{ if(e.target.closest('[data-act="start"]')) runBubble(it.id); });
    this.nodes.add(node);
  }
  start(){ if(this.running) return; this.running=true; for(let i=0;i<this.max;i++) this.spawn(); requestAnimationFrame(this.anim); }
  stop(){ this.running=false; }
  anim(now){
    const dt = now - this.last; this.last = now;
    const rect=this.root.getBoundingClientRect();
    for(const node of Array.from(this.nodes)){
      const b=node.__b; if(!b) continue;
      b.x += b.v.x * dt * (1 + 0.12*Math.sin((now-b.born)/1100*b.lfo));
      b.y += b.v.y * dt * (1 + 0.12*Math.cos((now-b.born)/1250*b.lfo));
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
const field = document.getElementById('bubble-field'); if(field){ new BubbleEngine(field).start(); }

// ---- Ticker (Heute neu)
(async function(){
  const el = $('#ticker-text'); if(!el) return;
  try{
    const data = await fetchJsonFallback(bestApi('/daily'));
    const items = (data.items||[]).map(x=> x.title || x.text).filter(Boolean);
    if(!items.length){ el.textContent='—'; return; }
    let i=0; el.textContent = items[0];
    setInterval(()=>{ i=(i+1)%items.length; el.textContent = items[i]; }, 6000);
  }catch{ el.textContent='—'; }
})();

// ---- Overlays
async function renderNews(){
  try{
    const data = await fetchJsonFallback(bestApi('/news'));
    const html = (data.items||[]).map(it=>{
      let domain=''; try{ domain=new URL(it.url).hostname.replace('www.',''); }catch{}
      return `<li><a href="${it.url}" target="_blank" rel="noopener noreferrer nofollow"><span>${it.title}</span><span class="badge">${domain}</span></a></li>`;
    }).join('');
    openModal('News', `<ul class="newslist">${html || '<li>Keine Einträge gefunden.</li>'}</ul>`);
  }catch(err){ openModal('News', `<p>${err.message}</p>`); }
}
function renderProjects(){
  openModal('Projekte', `
    <ul>
      <li><strong>Bubble Engine</strong> – Jellyfish Motion (Bewegung, Lebensdauer, Fade, Neon‑Palette, Auto‑Size)</li>
      <li><strong>Ticker</strong> – 'Heute neu' mit Auto‑Rotation</li>
      <li><strong>SSE‑Runner</strong> – Streaming von Text (Claude/OpenAI/OpenRouter)</li>
      <li><strong>Audio‑UX</strong> – dezente Ambient‑Schicht (On‑Demand)</li>
    </ul>`);
}

// Büro-Prompts (benefit visible, prompt copied)
const OFFICE_PROMPTS = [
  { title:'E‑Mail‑Klartext', benefit:'Lange Mails auf 5 Sätze eindampfen – klar, respektvoll, 3 Tonalitäten.', prompt:'Formuliere diese zu lange E‑Mail respektvoll, klar und in 5 Sätzen. Gib 3 Varianten (direkt, diplomatisch, motivierend). Nutze Bulletpoints für To‑dos.' },
  { title:'Meeting‑Agenda 30 Min', benefit:'Strukturierte Kurzmeetings – Ziel, Blöcke, Timebox, Entscheidung.', prompt:'Erstelle eine straffe Agenda für ein 30‑Minuten‑Meeting mit Ziel, 3 Blöcken à 8 Minuten, Timebox, Verantwortlichen und konkreter Entscheidungsfrage.' },
  { title:'Protokoll aus Stichpunkten', benefit:'Schnelles, sauberes Protokoll inkl. Aufgaben (Wer? Bis wann?).', prompt:'Wandle diese Stichpunkte in ein prägnantes, nummeriertes Protokoll mit Aufgaben. Nenne pro Aufgabe Verantwortlichen und Frist (TT.MM.).' },
  { title:'Status‑Update wie Exec', benefit:'Executive‑Summary in 120 Wörtern, mit 3 KPIs und Ampel.', prompt:'Verdichte folgende Infos zu einem 120‑Wörter‑Update im Executive‑Ton. Füge 3 KPIs mit Ziel/Ist + Ampel (grün/gelb/rot) hinzu.' },
  { title:'OKR‑Feinschliff', benefit:'Saubere OKRs – Outcome‑fokussiert, messbar, ohne Aufgaben.', prompt:'Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen. Maximal 5 Key Results, je eine präzise Metrik.' },
  { title:'PR‑Statement', benefit:'Kurze, faktenbasierte Presse‑Statements ohne Superlative.', prompt:'Schreibe ein Pressestatement (max. 120 Wörter), neutral, faktisch, ohne Superlative. Verwende die wichtigsten 3 Fakten und die nächste Maßnahme.' },
  { title:'Social Copy ×3', benefit:'Drei LinkedIn‑Posts – Hook, Nützlichkeit, ein Hashtag.', prompt:'Erzeuge 3 LinkedIn‑Posts à 280 Zeichen, jeweils mit Hook, einem praktischen Tipp und genau einem Hashtag.' },
  { title:'Heikle Kundenmail', benefit:'Deeskalation + nächster Schritt, empathisch und klar.', prompt:'Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Zeige Verständnis, fasse das Problem kurz, biete 2 Lösungsschritte mit Zeitplan an.' },
  { title:'Sales‑Pitch Kurz', benefit:'90‑Sekunden‑Pitch – Nutzen, 3 Belege, CTA.', prompt:'Erstelle einen 90‑Sekunden‑Pitch mit Kundennutzen, 3 Belegen (Zahl/Beispiel/Zitat) und klarer Handlungsaufforderung.' },
  { title:'SWOT kompakt', benefit:'Schnelle SWOT mit je 2 Aussagen pro Quadrant.', prompt:'Erzeuge eine SWOT zu [Thema] mit je 2 kompakten Aussagen pro Quadrant, in Alltagssprache.' },
  { title:'Briefing für Designer', benefit:'Klares Design‑Briefing: Ziel, Ton, Pflicht‑Elemente, No‑Gos.', prompt:'Fasse diese Anforderungen in ein Design‑Briefing: Ziel, Ton/Look, Pflicht‑Elemente, Nicht‑Ziele, 3 Inspirationsbeispiele (mit kurzer Begründung).' },
  { title:'Roadmap in Meilensteinen', benefit:'Vorhaben in 5 Milestones mit DoD und Risiken.', prompt:'Zerlege folgendes Vorhaben in 5 Meilensteine. Für jeden: Definition of Done, Risiko, Abhängigkeit, grobe Dauer.' },
  { title:'Stakeholder‑Map', benefit:'Stakeholder + Kommunikationsplan nach Power/Interesse.', prompt:'Erstelle eine Stakeholder‑Map (Power/Interesse). Schlage Frequenzen, Kanäle und Eigentümer für Updates vor.' },
  { title:'Kundeninterview‑Leitfaden', benefit:'10 Fragen, die wirklich Entscheidungswege & Budget klären.', prompt:'Erstelle 10 Interviewfragen: Problemverständnis, bisherige Lösungen, Auswahlkriterien, Entscheidungswege, Budgetrahmen.' },
  { title:'Onboarding 30 Tage', benefit:'Strukturiertes Onboarding (Woche 1–4) mit Quick Wins.', prompt:'Erstelle einen Onboarding‑Plan für 30 Tage: Woche 1–4, Lernziele, Shadowing, erste Quick Wins, Check‑ins (Tag 3/10/20/30).' },
  { title:'5‑Why Analyse', benefit:'Root‑Cause schnell finden + 3 Präventionsmaßnahmen.', prompt:'Wende 5‑Why auf dieses Incident an. Fasse die Root‑Cause und 3 präventive Maßnahmen klar zusammen.' },
  { title:'Sprechzettel Vorstand', benefit:'2‑Minuten‑Sprechzettel, stichpunktartig & faktenbasiert.', prompt:'Schreibe einen 2‑minütigen Sprechzettel (Stichpunkte) zu [Thema]. Fokussiere auf Fakten, Wirkung, Risiken, klare Bitte/Entscheidung.' },
  { title:'Produkt‑FAQ', benefit:'10 häufige Fragen + präzise Antworten in Kundensprache.', prompt:'Erzeuge eine FAQ‑Liste (10 Fragen) inkl. präziser, kurzer Antworten in Kundensprache. Kein Marketing‑Jargon.' },
  { title:'Newsletter‑Snack', benefit:'90‑Wörter‑Teaser mit Hook, Nutzen, Link‑CTA.', prompt:'Schreibe einen 90‑Wörter‑Teaser für den Newsletter: Hook, Nutzen für Leser, klare Link‑CTA.' },
  { title:'Jira‑Tickets', benefit:'Story in umsetzbare Tickets (GWT‑Akzeptanzkriterien).', prompt:'Zerlege diese User Story in 5–7 Tickets. Formuliere Akzeptanzkriterien im Given‑When‑Then‑Format.' }
];
function renderPrompts(){
  const items = OFFICE_PROMPTS.map(it=>`
    <div class="card">
      <h4>${it.title}</h4>
      <p>${it.benefit}</p>
      <button class="small" data-copy="${it.prompt.replace(/"/g,'&quot;')}">Kopieren</button>
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

// Nav
on(document.querySelector('[data-open="news"]'), 'click', renderNews);
on(document.querySelector('[data-open="prompts"]'), 'click', renderPrompts);
on(document.querySelector('[data-open="projects"]'), 'click', renderProjects);
on(document.querySelector('[data-open="imprint"]'), 'click', renderImprint);

// Lang toggle placeholder
on(document.getElementById('lang-toggle'), 'click', (e)=>{
  const v = e.currentTarget.getAttribute('aria-pressed') === 'true';
  e.currentTarget.setAttribute('aria-pressed', String(!v));
  toast(!v ? 'English UI soon' : 'Deutsch');
});
