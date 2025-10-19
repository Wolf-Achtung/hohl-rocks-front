import { $, el, fmtUrl, toast, copy } from './utils.js';
import { api, selfCheck, streamRun } from './api.js';
import { initBubbleEngine } from './bubbleEngine.js';

/* ---------- Overlay focus management ---------- */
const lastFocus = new Map();
function firstFocusable(root){ return root.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); }
function openOverlay(id){
  const ov = $(id); if(!ov) return;
  lastFocus.set(id, document.activeElement);
  ov.dataset.open = "1"; ov.setAttribute('aria-hidden','false');
  (ov.querySelector('.close') || firstFocusable(ov) || document.body)?.focus();
  const esc = (e)=>{ if(e.key==='Escape'){ closeOverlay(id); window.removeEventListener('keydown', esc);} };
  window.addEventListener('keydown', esc);
}
function closeOverlay(id){
  const ov = $(id); if(!ov) return;
  (ov.querySelector(':focus')?.blur?.());
  delete ov.dataset.open; ov.setAttribute('aria-hidden','true');
  (lastFocus.get(id) || document.querySelector('.site-nav .nav-btn'))?.focus?.();
}
document.addEventListener('click', (e)=>{
  if (e.target?.matches('[data-close]')){ const p = e.target.closest('.overlay'); if(p) closeOverlay('#'+p.id); }
  if (e.target?.matches('.overlay .backdrop')){ const p = e.target.closest('.overlay'); if(p) closeOverlay('#'+p.id); }
});

/* ---------- NAV actions ---------- */
function onAction(action){
  switch(action){
    case 'news': openOverlay('#ov-news'); loadNews(); break;
    case 'prompts': openOverlay('#ov-prompts'); renderPrompts(); break;
    case 'impressum': openOverlay('#ov-impressum'); renderImpressum(); break;
    case 'projekte': toast('Projekte folgen'); break;
    case 'settings': toast('Einstellungen folgen'); break;
    case 'klang':
      if (window.AudioController){ try { const on = window.AudioController.toggle(); toast(on?'Sound: an':'Sound: aus'); } catch { toast('Audio-Fehler'); } }
      else toast('Audio-Modul nicht geladen');
      break;
    case 'locale': toast('Sprachumschaltung folgt'); break;
  }
}
document.addEventListener('click', (e)=>{
  const act = e.target?.dataset?.action;
  if (act){ e.preventDefault(); onAction(act); }
});
window.addEventListener('keydown', (e)=>{
  if (e.key==='n' || e.key==='N'){ e.preventDefault(); onAction('news'); }
  if (e.key==='p' || e.key==='P'){ e.preventDefault(); onAction('prompts'); }
  if (e.key==='Escape'){ document.querySelectorAll('.overlay[data-open="1"]').forEach(el=> closeOverlay('#'+el.id)); }
});

/* ---------- Status tags ---------- */
const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
function mark(el, ok){ if(!el) return; el.className = 'tag ' + (ok ? 'ok' : ''); el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : ''); }

/* ---------- KI-News ---------- */
const ulNews = $('#news');
async function loadNews(){
  try{
    const j = await api.news();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulNews.innerHTML = '';
    if (!items.length){ ulNews.append(el('li',{}, 'Keine Ergebnisse.')); mark(tagNews, true); return; }
    for (const it of items.slice(0, 14)){
      ulNews.append(el('li',{}, el('a', { href: it.url, target:'_blank', rel:'noopener noreferrer' }, it.title || it.url), el('div',{}, el('small',{class:'small'}, fmtUrl(it.url)))));
    }
    mark(tagNews, true);
  }catch(e){ console.error(e); toast('News-Fehler'); mark(tagNews, false); }
}

/* ---------- Daily ---------- */
const ulDaily = $('#daily');
async function loadDaily(){
  try {
    const j = await api.daily();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulDaily.innerHTML='';
    if(!items.length){ ulDaily.append(el('li',{}, 'Nichts für heute.')); mark(tagDaily, true); return; }
    for (const it of items.slice(0,6)){
      ulDaily.append(el('li',{}, el('strong',{}, it.title || 'Tipp'), it.url ? el('div',{}, el('a',{href:it.url,target:'_blank',rel:'noopener noreferrer'},'Öffnen')) : null));
    }
    mark(tagDaily, true);
  } catch(e){ console.error(e); toast('Daily-Fehler'); mark(tagDaily, false); }
}

/* ---------- Prompt-Galerie (allgemein, überraschend) ---------- */
const PROMPTS = [
  { title: 'Zeit sparen im Alltag', desc: 'Alltags‑To‑Do in 3 Stufen: „Sofort“, „Heute“, „Kann warten“. Liefert dir eine klare Reihenfolge.', prompt: 'Sortiere diese Aufgaben in drei Stufen (Sofort/Heute/Kann warten). Erstelle daraus eine 5-Punkte-Reihenfolge mit kurzer Begründung je Schritt. Aufgaben: ' },
  { title: 'Koch‑Ko‑Pilot', desc: 'Aus 3 Zutaten kocht der Assistent ein kleines Gericht inkl. Einkaufsliste & 20‑Min‑Plan.', prompt: 'Ich habe diese Zutaten: [ZUTATEN]. Schlage ein Gericht (1 Portion) vor, mit Einkaufsliste (fehlende Zutaten) und 20-Minuten-Schrittplan.' },
  { title: 'Fokus‑Reframing', desc: 'Lass ein nerviges Problem in 3 Blickwinkeln neu einordnen – inklusive Mini‑Handlung.', prompt: 'Formuliere 3 neue Blickwinkel (Reframing) für dieses Problem und gib je eine konkrete Mini-Handlung: ' },
  { title: 'Mini‑Coach Schlaf', desc: 'Erstelle für mich eine 7‑Tage‑„Schlaf‑Routine light“ – kurz, machbar, ohne Gadgets.', prompt: 'Entwerfe eine minimalistische 7-Tage-Schlaf-Routine. Vorgaben: 3 Kernregeln, 1 Abendritual, 1 Notfallplan bei schlechtem Schlaf.' },
  { title: 'Lern‑Sprint 30′', desc: 'In 30 Minuten ein Thema wirklich kapieren – du bekommst Plan + Quizfragen.', prompt: 'Leite mich durch einen Lern-Sprint (30 Minuten) für das Thema: [THEMA]. Gib mir einen Blockplan und 5 Quizfragen mit Lösungen.' },
  { title: 'Foto‑Caption Pro', desc: 'Schreibe drei knackige Captions (seriös/freundlich/spielerisch) fürs gleiche Bild.', prompt: 'Erzeuge 3 Captions in verschiedenen Tönen (seriös, freundlich, spielerisch) für ein Foto, Thema: [KONTEXT].' },
  { title: 'Explain‑Like‑I’m‑5 (ELI5)', desc: 'Hol dir eine klare, bildhafte Erklärung zu etwas Kompliziertem.', prompt: 'Erkläre mir [THEMA] so, dass es ein Kind (5) versteht. Benutze ein greifbares Bild/Analogien und max. 140 Wörter.' },
  { title: 'Schnell‑Briefing für Chefs', desc: 'Kurze „Chef‑Zusammenfassung“: 6 klare Punkte, kein Fluff.', prompt: 'Gib mir ein Chef-Briefing in 6 Bulletpoints. Struktur: Kontext · Zahlen · Risiko · Option A/B · Empfehlung · Nächste Schritte. Thema: ' },
  { title: 'Gesprächs‑Vorbereitung', desc: 'Vor heiklen Gesprächen: Argumente & Fragen ohne Aggro.', prompt: 'Hilf mir, ein heikles Gespräch vorzubereiten. Gib 5 Fragen und 5 Ich-Botschaften. Kontext: ' }
];
function renderPrompts(){
  const grid = $('#prompt-grid'); grid.innerHTML = '';
  for (const it of PROMPTS){
    const card = el('div',{class:'card'},
      el('h3',{}, it.title),
      el('p',{}, it.desc),
      el('div',{class:'actions'},
        el('button',{type:'button','data-copy':it.prompt},'Kopieren'),
        el('button',{type:'button','data-run':it.prompt,class:'ghost'},'In Run öffnen')
      )
    );
    grid.append(card);
  }
}
document.addEventListener('click', async (e)=>{
  if (e.target?.dataset?.copy){ await copy(e.target.dataset.copy); }
  if (e.target?.dataset?.run){ openOverlay('#ov-run'); const box = $('#run-input'); box.value = e.target.dataset.run; box.focus(); }
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

/* ---------- Run form (SSE) ---------- */
const runForm = $('#run-form');
const runOut = $('#run-out');
let closeStream = null;
runForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = $('#run-input').value.trim();
  if(!q) return;
  runOut.textContent = '';
  if (closeStream) try{ closeStream(); } catch {}
  closeStream = streamRun(q, {
    onToken: (t)=> { runOut.textContent += t; },
    onDone: ()=> { toast('Fertig'); closeStream = null; },
    onError: ()=> { toast('Stream-Fehler'); closeStream = null; }
  });
});

/* ---------- Init ---------- */
(async function init(){
  const ok = await selfCheck(); mark(tagApi, ok);
  try {
    const r = await fetch('./data/bubbles.json', { cache:'no-store' });
    if (r.ok){ const items = await r.json(); await initBubbleEngine(items); }
  } catch (err) { console.warn('bubbles init failed', err); }
})();
