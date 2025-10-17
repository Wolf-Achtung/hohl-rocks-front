/**
 * App glue: API calls, modal, copy, audio, ticker, news, prompts-grid.
 */

const API_BASE = "/api";

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

const modalBackdrop = qs("#modalBackdrop");
const modalTitle = qs("#modalTitle");
const modalBody  = qs("#modalBody");
const btnCopy    = qs("#btnCopy");
const btnClose   = qs("#btnClose");
const btnModalClose = qs("#modalClose");
const toastEl    = qs("#toast");

const btnTicker  = qs("#btnTicker");
const btnNews    = qs("#btnNews");
const btnPrompts = qs("#btnPrompts");
const btnImpressum = qs("#btnImpressum");
const btnKlang   = qs("#btnKlang");

let lastModalCopyText = "";

/** ---------- AUDIO (WebAudio) ---------- */
const AudioMod = {
  ctx: null,
  nodes: null,
  enabled: false,
  ensure(){
    if(this.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0.05;
    master.connect(ctx.destination);

    // pad + gentle shimmer
    const osc1 = ctx.createOscillator(); osc1.type = "sine"; osc1.frequency.value = 120;
    const osc2 = ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 203;
    const lfo  = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.05;

    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 1200;

    const lfoGain = ctx.createGain(); lfoGain.gain.value = 400;
    lfo.connect(lfoGain).connect(filt.frequency);

    const mix = ctx.createGain(); mix.gain.value = 0.9;
    osc1.connect(mix); osc2.connect(mix); mix.connect(filt).connect(master);

    osc1.start(); osc2.start(); lfo.start();

    this.ctx = ctx;
    this.nodes = {master, osc1, osc2, lfo, filt, mix};
  },
  async start(){
    this.ensure();
    if(this.ctx.state === "suspended") await this.ctx.resume();
    this.enabled = true; btnKlang.setAttribute("aria-pressed","true");
  },
  async stop(){
    if(!this.ctx) return;
    await this.ctx.suspend();
    this.enabled = false; btnKlang.setAttribute("aria-pressed","false");
  },
  toggle(){ this.enabled ? this.stop() : this.start(); }
};

btnKlang.addEventListener("click", ()=> AudioMod.toggle());
// Any first user gesture starts audio softly (if not explicitly toggled)
window.addEventListener("pointerdown", ()=>{ if(!AudioMod.enabled) AudioMod.start(); }, {once:true});

/** ---------- MODAL ---------- */
function openModal(title, html, copyText=""){
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  lastModalCopyText = copyText || stripHtml(html);
  modalBackdrop.hidden = false;
  // focus trap
  setTimeout(()=> btnClose.focus(), 0);
}
function closeModal(){ modalBackdrop.hidden = true; }
btnClose.addEventListener("click", closeModal);
btnModalClose.addEventListener("click", closeModal);
document.addEventListener("keydown", (e)=>{
  if(!modalBackdrop.hidden && e.key === "Escape") closeModal();
});

btnCopy.addEventListener("click", async()=>{
  try{
    await navigator.clipboard.writeText(lastModalCopyText || "");
    showToast("✓ Kopiert");
  }catch(e){ showToast("Kopieren fehlgeschlagen"); }
});
function showToast(text){
  toastEl.textContent = text;
  toastEl.hidden = false;
  setTimeout(()=> toastEl.hidden = true, 1500);
}
function stripHtml(s){ const div = document.createElement("div"); div.innerHTML = s; return div.textContent || ""; }

/** ---------- API HELPERS (with graceful errors) ---------- */
async function apiGet(path){
  try{
    const res = await fetch(`${API_BASE}${path}`, {headers:{'x-api-base':'netlify-proxy'}});
    if(!res.ok) throw new Error(res.status + "");
    return await res.json();
  }catch(err){
    return {ok:false, error: err.message || "offline"};
  }
}

async function apiRun(id, userInput=""){
  const res = await fetch(`${API_BASE}/run`, {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({id, input:userInput})
  }).catch(()=>null);

  if(!res || !res.ok){
    openModal("Fehler", "<p>Service nicht erreichbar.</p>");
    return;
  }
  // pseudo streaming (read chunks)
  const reader = res.body.getReader();
  const utf8 = new TextDecoder("utf-8");
  let acc = "";
  openModal("Antwort", "<div class='small'>läuft …</div>");
  (async function pump(){
    while(true){
      const {value, done} = await reader.read();
      if(done) break;
      acc += utf8.decode(value, {stream:true});
      modalBody.textContent = acc;
      lastModalCopyText = acc;
    }
  })().catch(()=>{});
}

/** ---------- NAV: News, Ticker, Prompts, Impressum ---------- */
btnNews.addEventListener("click", async()=>{
  const data = await apiGet("/news");
  if(!data || !data.ok || !data.items) return openModal("News", "<p>News‑Service nicht erreichbar.</p>");
  const list = data.items.map(i=>`<li><a href="${i.url}" target="_blank" rel="noopener">${i.title}</a></li>`).join("");
  openModal("News", `<ul class="news-list">${list}</ul>`, data.items.map(i=>`${i.title} – ${i.url}`).join("\n"));
});

// Heute-Neu ticker (auto-rotation)
let tickerTimer = 0;
async function refreshTicker(){
  const data = await apiGet("/daily");
  if(!data || !data.ok){ btnTicker.textContent = "Heute neu – offline"; return; }
  let idx = 0;
  const rotate = () => {
    const item = data.items[idx % data.items.length];
    btnTicker.textContent = `Heute neu – ${item.title}`;
    idx++;
  };
  rotate();
  clearInterval(tickerTimer);
  tickerTimer = setInterval(rotate, 6000);
}
refreshTicker();
btnTicker.addEventListener("click", ()=> btnNews.click()); // opens news/daily modal could be extended

// Prompts Grid (Office)
btnPrompts.addEventListener("click", ()=>{
  const prompts = officePrompts();
  const cards = prompts.map(p=>`<div class="prompt-card"><div class="prompt-title">${p.title}</div><div class="prompt-desc">${p.desc}</div><div class="prompt-actions"><button class="copy-btn" data-id="${p.id}">Kopieren</button></div></div>`).join("");
  openModal("Prompts (Büroalltag)", `<div class="prompts-grid">${cards}</div>`, "");
  modalBody.addEventListener("click", (e)=>{
    const btn = e.target.closest(".copy-btn");
    if(!btn) return;
    const p = prompts.find(x=>x.id === btn.dataset.id);
    if(p){
      navigator.clipboard.writeText(p.prompt).then(()=> showToast("✓ Kopiert"));
    }
  }, {once:false});
});

btnImpressum.addEventListener("click", ()=>{
  openModal("Impressum", `
  <p><strong>Verantwortlich für den Inhalt:</strong><br>
  Wolf Hohl · Greifswalder Str. 224a · 10405 Berlin · <a href="mailto:mail@wolf-hohl.de">E‑Mail schreiben</a></p>
  <p><strong>Haftungsausschluss:</strong> Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>
  <p><strong>Urheberrecht:</strong> Alle Inhalte unterliegen dem deutschen Urheberrecht, Bilder teils KI-generiert (Midjourney).</p>
  <p><strong>Hinweis zum EU AI Act:</strong> Informationen ohne Gewähr; keine Rechtsberatung.</p>
  <p><strong>Datenschutz:</strong> Keine Tracking‑Cookies; Kontaktanfragen werden zur Bearbeitung bis zu sechs Monate gespeichert.</p>
  `);
});

/** ---------- PUBLIC API ---------- */
window.app = {
  openRunModal(item){
    openModal(item.title, "<p class='small'>Starte …</p>");
    apiRun(item.id);
  }
};

/** ---------- OFFICE PROMPTS ---------- */
function officePrompts(){
  // 20 kurze, nutzwertige Prompts – Beschreibung sichtbar, Prompt nur via Copy
  return [
    {id:"mail-klartext", title:"E‑Mail‑Klartext", desc:"Eine zu lange Mail in 5 klare Sätze verdichten (diplomatisch / direkt / motivierend).", prompt:"Du bist mein Klartext-Editor. Verdichte die folgende E-Mail in 5 Sätze in drei Varianten: (1) diplomatisch, (2) direkt, (3) motivierend. Bewahre Intention & Höflichkeit. Text:
<<<TEXT>>>
"},
    {id:"agenda-30", title:"Meeting‑Agenda 30 min", desc:"3 Blöcke, Timebox, Entscheidungsfragen – schlanke Agenda.", prompt:"Erstelle eine knappe Agenda für ein 30‑Minuten‑Meeting: 3 Blöcke, Timebox (in Minuten), Ziel, Entscheidungsfragen, benötigte Vorarbeit."},
    {id:"protokoll-stichpunkte", title:"Protokoll aus Stichpunkten", desc:"Bullet‑Stichpunkte → kompaktes Aufgabenprotokoll (Wer? Bis wann?).", prompt:"Wandle die Stichpunkte in ein nummeriertes, kompaktes Protokoll um: Aufgabenliste (Wer? Bis wann?), Entscheidungen, Risiken mit Ampel."},
    {id:"status-exec", title:"Status‑Update wie Exec", desc:"120‑Wörter‑Update mit 3 KPIs & Ampelstatus.", prompt:"Verdichte die folgenden Infos in ein 120‑Wörter‑Update im Executive‑Ton, mit 3 KPIs und Ampelstatus:
<<<INPUT>>>
"},
    {id:"okr-feinschliff", title:"OKR‑Feinschliff", desc:"Metrik‑klar, Outcome‑Fokus, max. 5 KRs.", prompt:"Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen. Maximal 5 Key Results, jedes messbar:
<<<OKRS>>>
"},
    {id:"pr-statement", title:"PR‑Statement", desc:"Kurzes, neutrales Pressestatement ohne Superlative.", prompt:"Schreibe ein kurzes Pressestatement (max. 120 Wörter), neutral, faktenbasiert, ohne Superlative. Baue 1–2 belegbare Zahlen ein, falls vorhanden."},
    {id:"social-copy", title:"Social Copy ×3", desc:"3 LinkedIn‑Posts à 280 Zeichen (Hook, Nutzen, Hashtag).", prompt:"Erzeuge 3 LinkedIn‑Posts à 280 Zeichen mit: Hook, kleinem Nutzenversprechen und 1 passendem Hashtag. Thema:
<<<THEMA>>>
"},
    {id:"kundenmail-heikel", title:"Kundenmail – heikel", desc:"Höfliche Deeskalation + nächster Schritt.", prompt:"Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation, Lösungsvorschlag, nächster Schritt. Text:
<<<MAIL>>>
"},
    {id:"sales-pitch", title:"Sales‑Pitch Kurzfassung", desc:"90‑Sekunden‑Pitch mit Nutzen, 2 Belegen & CTA.", prompt:"Erstelle einen 90‑Sekunden‑Pitch mit: Zielgruppe, Nutzen in 2 Sätzen, zwei glaubwürdigen Belegen (z.B. Zahlen/Referenzen) und einem klaren Call‑to‑Action."},
    {id:"swot", title:"SWOT in 8 Punkten", desc:"SWOT kompakt je Quadrant 2 Aussagen.", prompt:"Erstelle eine SWOT‑Analyse mit je zwei prägnanten Punkten für Stärken, Schwächen, Chancen, Risiken. Thema:
<<<THEMA>>>
"},
    {id:"briefing-designer", title:"Briefing für Designer", desc:"1‑Seiten‑Briefing aus Anforderungen & Beispielen.", prompt:"Fasse die folgenden Anforderungen in ein 1‑Seiten‑Design‑Briefing: Ziel, Ton/Look, Pflicht‑Elemente, Nicht‑Ziele, 3 Referenzbeispiele.
<<<ANFORDERUNGEN>>>
"},
    {id:"roadmap", title:"Roadmap in Meilensteinen", desc:"Vorhaben in 5 Milestones mit Done‑Definition.", prompt:"Zerlege das Vorhaben in 5 Meilensteine. Für jeden: Ziel, Deliverables, Definition of Done, Hauptrisiken mit Gegenmaßnahme."},
    {id:"stakeholder-map", title:"Stakeholder‑Map", desc:"Interessen/Einfluss einschätzen + Umgangsstrategie.", prompt:"Erzeuge eine Stakeholder‑Map: Liste mit Rolle, Interesse (low/med/high), Einfluss (low/med/high) und Strategie. Thema:
<<<THEMA>>>
"},
    {id:"interview-leitfaden", title:"Interview‑Leitfaden", desc:"8 Fragen: Bedarf, Barrieren, Kaufkriterien.", prompt:"Erstelle 8 Interviewfragen für ein Kundengespräch: Bedarf, bisherige Lösungen, Kaufbarrieren, Entscheiderkriterien. Produkt:
<<<PRODUKT>>>
"},
    {id:"ki-policy", title:"KI‑Policy Light", desc:"Praxisnahe, kurze KI‑Nutzungsrichtlinie (10 Punkte).", prompt:"Schreibe eine kurze KI‑Nutzungsrichtlinie (10 Punkte) für ein KMU: sichere Tools, Datenklassifizierung, Prompts, Qualitätssicherung, EU AI Act‑Awareness."},
    {id:"faq-bot", title:"FAQ‑Bot Wissen", desc:"Eingabetexte → FAQ‑Katalog mit Antwortbausteinen.", prompt:"Wandle die folgenden Infos in einen FAQ‑Katalog um (Fragen + kurze Baustein‑Antworten). Markiere unsichere Stellen mit [?].
<<<WISSEN>>>
"},
    {id:"meeting-minutes", title:"Meeting‑Minutes", desc:"Prägnantes Protokoll mit Actions & Ownern.", prompt:"Verarbeite die Meeting‑Notizen zu einem prägnanten Protokoll: Entscheidungen, offene Punkte, Action Items (Owner, Fällig, Priorität)."},
    {id:"release-notes", title:"Release Notes", desc:"Änderungsliste → Nutzerfreundliche Notes.", prompt:"Formuliere aus der Änderungsliste kurze, verständliche Release Notes, mit 3 Highlights oben und klarer Struktur."},
    {id:"risk-check", title:"Risiko‑Check", desc:"Top‑Risiken + Eintrittswahrscheinlichkeit + Gegenmaßnahme.", prompt:"Liste die Top‑10 Risiken inkl. Eintrittswahrscheinlichkeit, Auswirkung und pragmatischen Gegenmaßnahmen. Kontext:
<<<KONTEXT>>>
"},
    {id:"excel-formel", title:"Excel‑Formel Coach", desc:"Beste Formel für das Ziel inkl. kurzer Erklärung.", prompt:"Schlage eine Excel‑Formel für folgendes Ziel vor und erkläre kurz, warum: 
<<<ZIEL>>>
"}
  ];
}
