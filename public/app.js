// app.js – Overlays, SSE, Audio, News, Prompts
const API_BASE = document.querySelector('meta[name="x-api-base"]')?.content?.trim() || window.location.origin;

const $ = s => document.querySelector(s);
const modal = $('#modal'), modalTitle=$('#modal-title'), modalBody=$('#modal-body');

function openModal(title, html){ modalTitle.textContent=title; modalBody.innerHTML=html; modal.setAttribute('aria-hidden','false'); }
function closeModal(){ modal.setAttribute('aria-hidden','true'); }
$('#close-btn').addEventListener('click', closeModal);
$('#copy-btn').addEventListener('click', ()=> navigator.clipboard.writeText(modalBody.innerText||'').catch(()=>{}));

// Toast
const toastEl = $('#toast');
function toast(t){ toastEl.textContent=t; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),2200); }

// FPS (micro telemetry)
let last=performance.now(), frames=0;
setInterval(()=>{ const now=performance.now(); const fps = Math.round((frames*1000)/(now-last) || 0); $('#fps').textContent = String(fps).padStart(2,'0'); frames=0; last=now; }, 1000);
(function raf(){ frames++; requestAnimationFrame(raf); })();

// Audio
let ctx=null, gain=null, audioOn=false;
$('#audio-toggle').addEventListener('click', async (e)=>{
  if(!ctx){ ctx = new (window.AudioContext||window.webkitAudioContext)(); gain=ctx.createGain(); gain.gain.value=.11; gain.connect(ctx.destination);
    const o1=ctx.createOscillator(), g1=ctx.createGain(); o1.type='sine'; o1.frequency.value=140; g1.gain.value=.05; o1.connect(g1); g1.connect(gain); o1.start();
    const o2=ctx.createOscillator(), g2=ctx.createGain(); o2.type='triangle'; o2.frequency.value=220; g2.gain.value=.03; o2.connect(g2); g2.connect(gain); o2.start();
    const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=.05; lg.gain.value=30; lfo.connect(lg); lg.connect(o2.frequency); lfo.start();
  }
  if(ctx.state==='suspended') await ctx.resume();
  audioOn=!audioOn; gain.gain.linearRampToValueAtTime(audioOn?0.11:0.0, ctx.currentTime+.2);
  e.currentTarget.setAttribute('aria-pressed', String(audioOn));
});

// SSE Runner
async function runBubble(id, input={}, thread=[]){
  openModal('Assistant', '<pre id="stream-box"></pre>');
  const box = document.getElementById('stream-box');
  try{
    const res = await fetch(`${API_BASE}/api/run`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input, thread }) });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf='';
    while(true){
      const {value, done}=await reader.read(); if(done) break;
      buf += dec.decode(value,{stream:true});
      const parts = buf.split('\\n\\n'); buf = parts.pop() || '';
      for(const part of parts){
        const ln = part.split('\\n').find(x=>x.startsWith('data:')); if(!ln) continue;
        const payload = ln.slice(5).trim(); if(payload==='[DONE]') continue;
        try{ const j = JSON.parse(payload); if(j.delta) box.textContent += j.delta; if(j.error) box.textContent += '\\n[Fehler] '+j.error; }catch{}
      }
    }
  }catch(err){ box.textContent = 'Fehler beim Stream: '+(err?.message||err); }
}

window.addEventListener('bubble:run', (e)=> runBubble(e.detail.id));

// NAV: Prompts (20 Büro‑Prompts)
const OFFICE_PROMPTS = [
  {title:'E‑Mail präzisieren', prompt:'Formuliere diese E‑Mail klarer, kürzer und mit positiver Tonalität. Erhalte 3 Varianten mit Betreff: \\n<Dein Text>'},
  {title:'Meeting‑Agenda 30 Min', prompt:'Erstelle eine Agenda (5 Punkte) für ein 30‑Minuten‑Meeting zu: <Thema>. Zielorientiert, mit Zeitbudget je Punkt.'},
  {title:'LinkedIn‑Post Draft', prompt:'Schreibe einen LinkedIn‑Post (max. 120 Wörter) zu <Thema> in professionellem, freundlichem Ton. 3 Hook‑Vorschläge.'},
  {title:'Protokoll‑Synthese', prompt:'Fasse dieses Rohprotokoll in 5 Bullets zusammen und extrahiere To‑Dos mit Verantwortlichen: \\n<Notizen>'},
  {title:'Pitch‑Struktur', prompt:'Baue eine 6‑Slide‑Struktur (Titel der Slides, Kernbotschaft, 1 Visual‑Idee) für einen Pitch zu <Thema>.'},
  {title:'Projektplan 2 Wochen', prompt:'Erstelle einen zweiwöchigen Mini‑Projektplan inkl. Meilensteine, Abhängigkeiten und Risiken für <Vorhaben>.'},
  {title:'Kundenmail heikel', prompt:'Formuliere eine diplomatische Antwort auf diese heikle Kundenmail. Ziel: Deeskalation, Lösungsweg, klare nächsten Schritte.'},
  {title:'Excel‑Formel Coach', prompt:'Erkläre mir anhand von Beispielen die beste Excel‑Formel für: <Problem>. Gib Kopier‑fertige Beispiele.'},
  {title:'User‑Storys', prompt:'Erzeuge 6 User‑Storys im Format „Als <Rolle> will ich <Wunsch>, um <Nutzen>“ für <Produkt>.'},
  {title:'Website‑Hero Copy', prompt:'Schreibe 3 Varianten einer Hero‑Zeile (max 10 Wörter) und eines Subheaders (max 18 Wörter) für <Angebot>.'},
  {title:'Onboarding‑Guide', prompt:'Erstelle einen 7‑Punkte‑Onboarding‑Guide für neue Teammitglieder in <Bereich>. Enthält: Tools, Prozesse, Do/Don’t.'},
  {title:'Risiko‑Check', prompt:'Liste für <Vorhaben> die Top‑10 Risiken inkl. Eintrittswahrscheinlichkeit und pragmatische Gegenmaßnahmen.'},
  {title:'Budget‑Schätzung', prompt:'Grobe Kosten‑Schätzung (T‑Shirt‑Sizing S/M/L) für <Projekt>, Annahmen transparent machen, 3 Kostentreiber.'},
  {title:'Interview‑Leitfaden', prompt:'Erstelle 8 Interviewfragen für ein Kundengespräch zu <Thema>. Ziel: Bedarf, Kaufbarrieren, Entscheiderkriterien.'},
  {title:'KI‑Policy Light', prompt:'Formuliere eine kurze, praxistaugliche KI‑Nutzungsrichtlinie (10 Punkte) für ein KMU (DSGVO‑konform, EU AI Act‑aware).'},
  {title:'Change‑Kommunikation', prompt:'Schreibe ein internes Memo zum Change <Thema> mit: Zielbild, 3 Gründen, Zeitplan, „Was ändert sich für mich?“. Max 180 Wörter.'},
  {title:'Kundensegmente', prompt:'Erzeuge eine 2x2‑Segmentierung der Zielkunden für <Produkt>. Beschreibe Bedürfnisse, Kaufkriterien und Botschaften je Segment.'},
  {title:'FAQ‑Generator', prompt:'Baue eine FAQ‑Liste (10 Fragen + knappe Antworten) für <Service>. Priorisiere Einwände.'},
  {title:'Roadmap Quartal', prompt:'Erstelle eine Q‑Roadmap (3 Ziele, 9 Epics, messbare KRs) für <Team>.'},
  {title:'Workshop‑Design', prompt:'Konzipiere einen 90‑Min‑Workshop zu <Thema> inkl. Ablauf, Übungen, benötigtes Material und erwartete Ergebnisse.'}
];

function renderPrompts(){
  const items = OFFICE_PROMPTS.map(p=>`
    <div class="bubble" style="position:relative;opacity:1;transform:none;width:auto;height:auto">
      <div class="head"><span class="dot"></span><span>${p.title}</span></div>
      <p class="desc">${p.prompt}</p>
      <div class="actions">
        <button class="btn" data-copy='${JSON.stringify(p.prompt)}'>Kopieren</button>
      </div>
    </div>`).join('');
  openModal('Büro‑Prompts (20)', `<div style="display:grid;gap:12px">${items}</div>`);
  modalBody.querySelectorAll('[data-copy]').forEach(b=> b.addEventListener('click', ()=> navigator.clipboard.writeText(b.getAttribute('data-copy')).then(()=>toast('Kopiert ✓')) ));
}

// News
async function renderNews(){
  openModal('News', '<p>Lade …</p>');
  try{
    const r = await fetch(`${API_BASE}/api/news`, { mode:'cors', headers:{'Accept':'application/json'}});
    const text = await r.text();
    if(!r.ok) throw new Error(`HTTP ${r.status} – ${text.slice(0,180)}`);
    const j = JSON.parse(text);
    const html = (j.items||[]).map(it=>`<li><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></li>`).join('');
    modalBody.innerHTML = `<ul>${html}</ul>`;
  }catch(err){
    modalBody.innerHTML = `<p style="color:#ffb4b4"><strong>API‑Fehler:</strong> ${err.message}</p>
    <p>Bitte prüfe: <code>ALLOWED_ORIGINS</code> im Backend, <code>x-api-base</code> in <code>index.html</code>, und ob <code>/api/news</code> direkt erreichbar ist.</p>`;
  }
}

// Projekte
function renderProjects(){ openModal('Projekte', `
  <ul>
    <li><strong>Bubble Engine</strong> – Jellyfish Motion, Fade‑In/Out, sequentielle Rotation</li>
    <li><strong>SSE‑Streaming</strong> – Live‑Textausgabe aus LLM</li>
    <li><strong>Audio‑Layer</strong> – dezente, interaktive Ambient‑Schicht</li>
  </ul>`); }

// Impressum
function renderImprint(){
  openModal('Rechtliches & Transparenz', `
  <article>
    <h3>Impressum</h3>
    <p><strong>Verantwortlich für den Inhalt:</strong><br>
    Wolf Hohl<br>
    Greifswalder Str. 224a<br>
    10405 Berlin</p>
    <p><a href="mailto:hello@hohl.rocks">E‑Mail schreiben</a></p>

    <h4>Haftungsausschluss</h4>
    <p>Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>

    <h4>Urheberrecht</h4>
    <p>Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.</p>

    <h4>Hinweis zum EU AI Act</h4>
    <p>Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>

    <h3>Datenschutzerklärung</h3>
    <p>Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.</p>

    <h4>Kontakt mit mir</h4>
    <p>Wenn Sie per Formular oder E-Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.</p>

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

// Events
document.querySelector('[data-open="prompts"]').addEventListener('click', renderPrompts);
document.querySelector('[data-open="news"]').addEventListener('click', renderNews);
document.querySelector('[data-open="projects"]').addEventListener('click', renderProjects);
document.querySelector('[data-open="imprint"]').addEventListener('click', renderImprint);

// Sprache Toggle (placeholder)
document.getElementById('lang-toggle').addEventListener('click', (e)=>{
  const v = e.currentTarget.getAttribute('aria-pressed')==='true';
  e.currentTarget.setAttribute('aria-pressed', String(!v));
  toast(!v ? 'English UI soon' : 'Deutsch');
});
