// ----------- Helpers -----------
const $ = (sel, el=document)=> el.querySelector(sel);
const $$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
const API = location.hostname.endsWith('localhost') ? '/api' : '/api';
const modal = $('#modal');
const modalTitle = $('#modalTitle');
const modalBody = $('#modalBody');
const toastTpl = $('#toastTpl');

function showModal(title, html){
  modalTitle.textContent = title;
  modalBody.innerHTML = '';
  if(typeof html === 'string'){ modalBody.innerHTML = html; }
  else if(html instanceof Node){ modalBody.appendChild(html); }
  modal.hidden = false;
}
function hideModal(){ modal.hidden = true; }
$('#closeModal').onclick = hideModal;
$('#closeBtn').onclick = hideModal;

function showToast(text='Kopiert ✓'){
  const n = toastTpl.content.firstElementChild.cloneNode(true);
  n.textContent = text;
  document.body.appendChild(n);
  setTimeout(()=> n.remove(), 1200);
}

async function copyText(t){
  try{ await navigator.clipboard.writeText(t); showToast(); }catch{ /* ignore */ }
}
$('#copyBtn').onclick = ()=>{
  const sel = modalBody.querySelector('[data-copy]');
  if(sel) copyText(sel.getAttribute('data-copy'));
};

// ----------- Ticker -----------
async function loadTicker(){
  try{
    const r = await fetch(`${API}/news/daily`);
    const j = await r.json();
    const items = j.items || [];
    const el = $('#tickerText');
    if(items.length === 0){ el.textContent = '—'; return; }
    let i = 0; el.textContent = items[0].title;
    setInterval(()=>{ i = (i+1) % items.length; el.textContent = items[i].title; }, 6000);
  }catch{ $('#tickerText').textContent = '—'; }
}
loadTicker();

// ----------- News modal -----------
$('[data-open="news"]').onclick = async ()=>{
  try{
    const r = await fetch(`${API}/news`);
    const j = await r.json();
    const ul = document.createElement('ul'); ul.className='news';
    (j.items||[]).forEach(it=>{
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = it.url; a.target = '_blank'; a.rel='noopener';
      a.textContent = it.title;
      li.appendChild(a); ul.appendChild(li);
    });
    const wrap = document.createElement('div'); wrap.className='news'; wrap.appendChild(ul);
    showModal('News', wrap);
  }catch(e){
    showModal('News', `<p class="small">API nicht erreichbar.</p>`);
  }
};

// ----------- Imprint -----------
$('[data-open="imprint"]').onclick = ()=>{
  showModal('Impressum', `<div class="small">
    <strong>Rechtliches & Transparenz</strong><br><br>
    Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin<br><br>
    <em>E‑Mail:</em> bitte Kontaktformular nutzen.<br><br>
    <strong>Haftungsausschluss:</strong> Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.<br><br>
    <strong>Urheberrecht:</strong> Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.<br><br>
    <strong>Hinweis zum EU AI Act:</strong> Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.<br><br>
    <strong>Datenschutzerklärung:</strong> Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.<br><br>
    <strong>Kontakt mit mir:</strong> Wenn Sie per Formular oder E‑Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.<br><br>
    <strong>Cookies:</strong> Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.<br><br>
    <strong>Ihre Rechte laut DSGVO:</strong> Auskunft, Berichtigung oder Löschung Ihrer Daten · Datenübertragbarkeit · Widerruf erteilter Einwilligungen · Beschwerde bei der Datenschutzbehörde.
  </div>`);
};

// ----------- Büro-Prompts -----------
const OFFICE = [
  {t:'E‑Mail‑Klartext', why:'Für lange Mails schnell eine respektvolle, klare Kurzfassung (3 Varianten).', p:'Formuliere diese zu lange E-Mail respektvoll, klar und in 5 Sätzen. Erhalte 3 Varianten (direkt, diplomatisch, motivierend). Text: """{TEXT}"""'},
  {t:'Meeting‑Agenda 30 Min', why:'Strukturiert Meetings: Ziel, 3 Blöcke, Timebox, Entscheidungsfragen.', p:'Erstelle eine straffe Agenda für ein 30‑Minuten‑Meeting mit Ziel, 3 Blöcken, Timebox und Entscheidungsfragen. Thema: {THEMA}'},
  {t:'Protokoll aus Stichpunkten', why:'Schnell sauberer Outcome aus Notizen.', p:'Wandle diese Stichpunkte in ein prägnantes, nummeriertes Protokoll mit Aufgaben (Wer? Bis wann?). Stichpunkte: """{NOTIZEN}"""'},
  {t:'Status‑Update wie Exec', why:'Verdichtet Infos in 120 Wörtern, Executive‑Ton, 3 KPIs mit Ampelfarbe.', p:'Verdichte folgende Infos zu einem 120‑Wörter‑Update im Executive‑Ton, mit 3 KPIs und Ampelstatus. Daten: """{DATEN}"""'},
  {t:'OKR‑Feinschliff', why:'Schärft Metriken, Outcome‑Fokus, klare Formulierungen.', p:'Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen. Max. 5 Key Results. Text: """{OKR}"""'},
  {t:'PR‑Statement', why:'Neutrales, faktenbasiertes Statement ohne Superlative.', p:'Schreibe ein kurzes Presse‑Statement (neutral, faktenbasiert, ohne Superlative) zu: {THEMA}'},
  {t:'Social Copy ×3', why:'Drei LinkedIn‑Posts mit Hook, Nutzen, Hashtag.', p:'Erzeuge 3 Social‑Posts (LinkedIn), je 280 Zeichen, mit Hook, Nutzen, Nützlichkeit, 1 Hashtag. Thema: {THEMA}'},
  {t:'Customer E‑Mail – heikel', why:'Deeskalation + nächste Schritte bei Beschwerden.', p:'Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation + nächster Schritt. Text: """{TEXT}"""'},
  {t:'Sales‑Pitch Kurzfassung', why:'90‑Sekunden‑Pitch mit Nutzen, 3 Belegen, CTA.', p:'Erstelle einen 90‑Sekunden‑Pitch mit Nutzen, 3 Belegen, CTA. Zielgruppe: Entscheider. Produkt/Service: {THEMA}'},
  {t:'SWOT in 8 Punkten', why:'Klarer Überblick mit je 2 knappen Aussagen pro Quadrant.', p:'Erzeuge eine SWOT zu {THEMA} mit jeweils 2 kompakten Aussagen pro Quadrant.'},
  {t:'Briefing für Designer', why:'Sauberes Design‑Briefing: Ziel, Ton, Pflicht‑Elemente.', p:'Fasse diese Anforderungen in ein Design‑Briefing: Ziel, Ton, Pflicht‑Elemente, Nicht‑Ziele, 3 Beispiele. Text: """{TEXT}"""'},
  {t:'Roadmap in Meilensteinen', why:'Schnell planbares Gerüst inkl. Done & Risiken.', p:'Zerlege folgendes Vorhaben in 5 Meilensteine mit Definition of Done und Risiken. Vorhaben: {THEMA}'},
  {t:'Stakeholder‑Map', why:'Identifiziert Stakeholder + Quick‑Win‑Strategie.', p:'Identifiziere Stakeholder, ordne Power/Interesse ein und schlage Quick‑Wins vor. Projekt: {THEMA}'},
  {t:'Kundeninterview‑Leitfaden', why:'Gute Fragen sparen Zeit und liefern Einsichten.', p:'Erstelle 10 Fragen: Problemverständnis, bisherige Lösungen, Entscheidungswege, Erfolgskriterien. Zielgruppe: {ZIELGRUPPE}'},
  {t:'Onboarding‑Plan 30 Tage', why:'Klarer Start für neue Mitarbeitende.', p:'Erstelle einen Plan für neue Mitarbeitende: Woche 1–4, Lernziele, Shadowing, erste Aufgaben. Rolle: {ROLLE}'},
  {t:'Budget‑Schätzung', why:'Schnelle S/M/L‑Schätzung + Kostentreiber.', p:'Grobe Kosten‑Schätzung (T‑Shirt‑Sizing S/M/L) für {THEMA}. Annahmen transparent machen; 3 Kostentreiber.'},
  {t:'Interview‑Leitfaden', why:'Gute Interviewschablone inkl. Kaufbarrieren.', p:'Erstelle 8 Interviewfragen für ein Kundengespräch zu {THEMA}. Ziel: Bedarf, Kaufbarrieren, Entscheiderkriterien.'},
  {t:'KI‑Policy Light', why:'Praxistaugliche, knappe KI‑Policy für KMU.', p:'Formuliere eine kurze, praxistaugliche KI‑Nutzungsrichtlinie (10 Punkte) für ein KMU (DSGVO‑konform, EU AI Act‑aware).'},
  {t:'Projektplan 2 Wochen', why:'Mini‑Projektplan inkl. Risiken & Abhängigkeiten.', p:'Erstelle einen zweiwöchigen Mini‑Projektplan inkl. Meilensteine, Abhängigkeiten und Risiken für {THEMA}.'},
  {t:'Website‑Hero Copy', why:'3 Varianten in 30 Sekunden.', p:'Schreibe 3 Varianten einer Hero‑Zeile (max 10 Wörter) und eines Subheaders (max 18 Wörter) für {THEMA}.'}
];

$('[data-open="prompts"]').onclick = ()=>{
  const wrap = document.createElement('div'); wrap.className='grid';
  OFFICE.forEach(item=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<h3>${item.t}</h3><p class="small">${item.why}</p>`;
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Kopieren';
    btn.onclick = ()=> copyText(item.p);
    card.appendChild(btn); wrap.appendChild(card);
  });
  showModal('Prompts (Büroalltag)', wrap);
};

// ----------- SSE runner (for Bubble items) -----------
async function runSSE(id, text=''){
  const r = await fetch(`${API}/run`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, input: { text } }) });
  if(!r.ok){ showModal('Fehler', `<p>HTTP ${r.status}</p>`); return; }
  const reader = r.body.getReader(); const dec = new TextDecoder();
  const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.setAttribute('data-copy',''); modalBody.innerHTML=''; modalBody.appendChild(pre);
  showModal('Antwort', pre);
  let buf='';
  while(true){
    const {value,done}=await reader.read(); if(done) break;
    buf += dec.decode(value,{stream:true});
    const parts = buf.split('\n\n'); buf = parts.pop()||'';
    for(const p of parts){
      if(!p.startsWith('data:')) continue;
      const payload = p.slice(5).trim(); if(!payload) continue;
      try{
        const j = JSON.parse(payload);
        if(j.delta) pre.textContent += j.delta;
        if(j.error) pre.textContent += `\n[Fehler] ${j.error}`;
      }catch{}
    }
  }
}

// ----------- Modal openers -----------
$('[data-open="projects"]').onclick = ()=> showModal('Projekte', '<p class="small">Bald mehr …</p>');
