import { $, el, fmtUrl, toast, copy } from './utils.js';
import { api, selfCheck } from './api.js';
import { initBubbleEngine } from './bubbleEngine.js';

/* ---------- Overlay focus management (avoid aria-hidden warnings) ---------- */
const lastFocus = new Map();
function firstFocusable(root){
  return root.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
}
function openOverlay(id){
  const ov = $(id); if (!ov) return;
  lastFocus.set(id, document.activeElement);
  ov.dataset.open = "1"; ov.setAttribute('aria-hidden', 'false');
  const btn = ov.querySelector('.close') || firstFocusable(ov) || document.body;
  btn?.focus();
  const esc = (e)=>{ if(e.key==='Escape'){ closeOverlay(id); window.removeEventListener('keydown', esc); } };
  window.addEventListener('keydown', esc);
}
function closeOverlay(id){
  const ov = $(id); if (!ov) return;
  (ov.querySelector(':focus')?.blur?.());
  delete ov.dataset.open; ov.setAttribute('aria-hidden','true');
  const prev = lastFocus.get(id) || document.querySelector('.site-nav .nav-btn');
  prev?.focus?.();
}

/* ---------- Bind top nav actions ---------- */
function onAction(action){
  switch (action) {
    case 'news': openOverlay('#ov-news'); loadNews(); break;
    case 'prompts': openOverlay('#ov-prompts'); renderPrompts(); break;
    case 'impressum': openOverlay('#ov-impressum'); renderImpressum(); break;
    case 'projekte': toast('Projekte folgen'); break;
    case 'settings': toast('Einstellungen folgen'); break;
    case 'klang':
      if (window.AudioController){
        try { const on = window.AudioController.toggle(); toast(on?'Sound: an':'Sound: aus'); }
        catch { toast('Audio-Fehler'); }
      } else toast('Audio-Modul nicht geladen');
      break;
    case 'locale': toast('Sprachumschaltung folgt'); break;
    default: break;
  }
}
document.addEventListener('click', (e)=> {
  const act = e.target?.dataset?.action;
  if (act){ e.preventDefault(); onAction(act); }
  if (e.target?.matches('[data-close]')){
    const p = e.target.closest('.overlay');
    if (p) closeOverlay('#'+p.id);
  }
  if (e.target?.matches('.overlay .backdrop')){
    const p = e.target.closest('.overlay'); if (p) closeOverlay('#'+p.id);
  }
});

/* ---------- Keyboard shortcuts ---------- */
window.addEventListener('keydown', (e)=>{
  if (e.key === 'n' || e.key === 'N'){ e.preventDefault(); onAction('news'); }
  if (e.key === 'p' || e.key === 'P'){ e.preventDefault(); onAction('prompts'); }
  if (e.key === 'Escape'){ document.querySelectorAll('.overlay[data-open="1"]').forEach(el=> closeOverlay('#'+el.id)); }
});

/* ---------- Status tags ---------- */
const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
function mark(el, ok){
  if (!el) return; el.className = 'tag ' + (ok ? 'ok' : ''); el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : '');
}

/* ---------- Loaders ---------- */
const ulNews = $('#news');
const ulDaily = $('#daily');
async function loadNews(){
  try {
    const j = await api.news();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulNews.innerHTML = '';
    if (!items.length){ ulNews.append(el('li',{}, 'Keine Ergebnisse.')); mark(tagNews, true); return; }
    for (const it of items.slice(0, 12)){
      ulNews.append(el('li',{}, el('a', { href: it.url, target: '_blank', rel: 'noopener noreferrer' }, it.title || it.url), el('div', {}, el('small', { class: 'small' }, fmtUrl(it.url)))));
    }
    mark(tagNews, true);
  } catch (e){ console.error(e); toast('News-Fehler'); mark(tagNews, false); }
}
async function loadDaily(){
  try {
    const j = await api.daily();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulDaily.innerHTML = '';
    if (!items.length){ ulDaily.append(el('li',{}, 'Nichts für heute.')); mark(tagDaily, true); return; }
    for (const it of items.slice(0, 6)){
      ulDaily.append(el('li',{}, el('strong',{}, it.title || 'Tipp'), it.url ? el('div',{}, el('a', { href: it.url, target: '_blank', rel:'noopener noreferrer' }, 'Öffnen')) : null));
    }
    mark(tagDaily, true);
  } catch (e){ console.error(e); toast('Daily-Fehler'); mark(tagDaily, false); }
}

/* ---------- Prompts (office-friendly) ---------- */
const OFFICE_PROMPTS = [
  { t: 'Email – prägnant & freundlich', p: 'Formuliere diese E‑Mail klar, freundlich und prägnant (max. 120 Wörter). Ziele: klare Bitte, nächste Schritte, Ton: professionell, positiv. Text: ' },
  { t: 'Meeting‑Agenda (30 Min)', p: 'Erstelle eine knackige 30‑Minuten‑Agenda (max. 5 Punkte) mit Ziel, Rollen, Vorab‑Materialien und Timebox je Punkt. Thema: ' },
  { t: 'Entscheidungs‑Briefing', p: 'Fasse das Thema als Entscheidungs‑Briefing in 6 Bulletpoints: Kontext · Optionen · Bewertung · Risiken · Empfehlung · Nächste Schritte. Thema: ' },
  { t: 'Projekt‑Status (Ampel)', p: 'Schreibe einen Statusbericht im Ampel‑Format (Grün/Gelb/Rot) mit Fortschritt, Blockern, Risiken (Wahrscheinlichkeit×Auswirkung) und Maßnahmen. Projekt: ' },
  { t: 'Follow‑up nach Meeting', p: 'Formuliere ein Follow‑up mit Entscheidungen, To‑Dos (Owner, Termin), offenen Punkten und nächstem Termin. Meeting: ' },
  { t: 'Anforderungs‑Ticket (Jira)', p: 'Erzeuge eine User Story im Format „Als [Rolle] möchte ich [Ziel], damit [Nutzen]“ inklusive Akzeptanzkriterien (Given/When/Then) und technischem Hinweis. Thema: ' },
  { t: 'Bug‑Report klar', p: 'Schreibe einen präzisen Bug‑Report: Umgebung · Schritte · Erwartet · Tatsächlich · Logs/Screens. Bug: ' },
  { t: 'Risiko‑Analyse', p: 'Liste die Top‑Risiken mit Eintrittswahrscheinlichkeit (1‑5), Auswirkung (1‑5), Risikostufe und Mitigationsmaßnahmen. Kontext: ' },
  { t: 'Kunden‑Pitch (60 Sek.)', p: 'Schreibe einen 60‑Sekunden‑Pitch: Problem · Lösung · Beleg · Nutzen · Call‑to‑Action. Produkt/Service: ' },
  { t: 'Social‑Post (3 Varianten)', p: 'Erzeuge 3 Varianten eines LinkedIn‑Posts (Ton: sachlich‑optimistisch), je 70‑110 Wörter, mit Hook & Call‑to‑Action. Thema: ' },
  { t: 'Excel/Sheets‑Formelhilfe', p: 'Erkläre Schritt für Schritt die passende Formel (inkl. Beispiel) für: ' },
  { t: 'Zusammenfassung „Für Busy Execs“', p: 'Fasse das Dokument in 6 Bulletpoints zusammen (1 Zeile je Bullet, ohne Floskeln). Link/Text: ' }
];
function renderPrompts(){
  const list = $('#prompt-list');
  list.innerHTML = '';
  for (const it of OFFICE_PROMPTS){
    const li = el('li',{},
      el('strong',{}, it.t),
      el('div',{}, el('button',{type:'button','data-copy':it.p},'Kopieren'), ' ',
                     el('button',{type:'button','data-run':it.p},'In Run öffnen'))
    );
    list.append(li);
  }
}
document.addEventListener('click', async (e)=>{
  if (e.target?.dataset?.copy){ await copy(e.target.dataset.copy); }
  if (e.target?.dataset?.run){
    openOverlay('#ov-run');
    const box = $('#run-input'); box.value = e.target.dataset.run;
    box.focus();
  }
});

/* ---------- Impressum ---------- */
const IMPRESSUM = `Rechtliches & Transparenz
Impressum
Verantwortlich für den Inhalt:
Wolf Hohl
Greifswalder Str. 224a
10405 Berlin

E-Mail schreiben
Haftungsausschluss:
Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.

Urheberrecht:
Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.

Hinweis zum EU AI Act:
Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.

Datenschutzerklärung
Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.

Kontakt mit mir
Wenn Sie per Formular oder E-Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.

Cookies
Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.

Ihre Rechte laut DSGVO
Auskunft, Berichtigung oder Löschung Ihrer Daten
Datenübertragbarkeit
Widerruf erteilter Einwilligungen
Beschwerde bei der Datenschutzbehörde`;
function renderImpressum(){
  const elHost = $('#impressum-body');
  elHost.innerHTML = IMPRESSUM.split('\n\n').map(p => '<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
}

/* ---------- Run form ---------- */
const runForm = $('#run-form');
const runOut = $('#run-out');
runForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const q = $('#run-input').value.trim();
  if (!q) return;
  runOut.textContent = '…';
  try {
    const j = await api.run(q);
    runOut.textContent = j?.result || '(leer)';
  } catch { runOut.textContent = 'Fehler'; }
});

/* ---------- Init ---------- */
(async function init(){
  const ok = await selfCheck(); mark(tagApi, ok);

  // Load bubbles data and init engine (using user's bubbleEngine.js ESM)
  try {
    const r = await fetch('./data/bubbles.json', { cache: 'no-store' });
    if (r.ok){
      const items = await r.json();
      await initBubbleEngine(items);
    } else {
      console.warn('bubbles.json not found');
    }
  } catch (err){ console.warn('bubbles init failed', err); }
})();
