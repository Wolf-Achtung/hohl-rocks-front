import { $, el, fmtUrl, toast, copy, storage } from './utils.js';
import { api, selfCheck, streamRun, getJson } from './api.js';
import { initBubbleEngine } from './bubbleEngine.js';

/* EU toggle */
const pref = storage('prefs'); const prefs = pref.get() || { eu:false, lastNewsPrefetch: 0, lastTipsPrefetch: 0 };
const btnEU = $('#btn-eu'); function renderEU(){ if(!btnEU) return; btnEU.setAttribute('aria-pressed', prefs.eu ? 'true':'false'); btnEU.textContent = 'EU: ' + (prefs.eu ? 'an' : 'aus'); }
btnEU?.addEventListener('click', ()=>{ prefs.eu = !prefs.eu; pref.set(prefs); renderEU(); toast('EU‑only: ' + (prefs.eu?'an':'aus')); });
renderEU();

/* Overlays */
const lastFocus = new Map();
function firstFocusable(root){ return root.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); }
function openOverlay(id){ const ov = $(id); if(!ov) return; lastFocus.set(id, document.activeElement); ov.dataset.open = "1"; ov.setAttribute('aria-hidden','false'); (ov.querySelector('.close') || firstFocusable(ov) || document.body)?.focus(); const esc = (e)=>{ if(e.key==='Escape'){ closeOverlay(id); window.removeEventListener('keydown', esc);} }; window.addEventListener('keydown', esc); ov.addEventListener('keydown', trapTab); }
function closeOverlay(id){ const ov = $(id); if(!ov) return; ov.removeEventListener('keydown', trapTab); (ov.querySelector(':focus')?.blur?.()); delete ov.dataset.open; ov.setAttribute('aria-hidden','true'); (lastFocus.get(id) || document.querySelector('.site-nav .nav-btn'))?.focus?.(); }
function trapTab(e){ if (e.key !== 'Tab') return; const root = e.currentTarget; const f = Array.from(root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled')); if (!f.length) return; const first = f[0], last = f[f.length-1]; if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); } }
document.addEventListener('click', (e)=>{ if (e.target?.matches('[data-close]')){ const p = e.target.closest('.overlay'); if(p) closeOverlay('#'+p.id); } if (e.target?.matches('.overlay .backdrop')){ const p = e.target.closest('.overlay'); if(p) closeOverlay('#'+p.id); } });

/* NAV */
function onAction(action){
  switch(action){
    case 'tips': openOverlay('#ov-tips'); loadTips(); break;
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
document.addEventListener('click', (e)=>{ const act = e.target?.dataset?.action; if (act){ e.preventDefault(); onAction(act); } });
window.addEventListener('keydown', (e)=>{
  if (e.key==='t' || e.key==='T'){ e.preventDefault(); onAction('tips'); }
  if (e.key==='n' || e.key==='N'){ e.preventDefault(); onAction('news'); }
  if (e.key==='p' || e.key==='P'){ e.preventDefault(); onAction('prompts'); }
  if (e.key==='Escape'){ document.querySelectorAll('.overlay[data-open="1"]').forEach(el=> closeOverlay('#'+el.id)); }
});

/* Tags */
const tagApi = $('#tag-api'), tagNews = $('#tag-news'), tagDaily = $('#tag-daily'), tagTips = $('#tag-tips');
function mark(el, ok){ if(!el) return; el.className = 'tag ' + (ok ? 'ok' : ''); el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : ''); }

/* KI-Tipps */
const ulTips = $('#tips');
async function loadTips(){
  try{
    const j = await api.tips();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulTips.innerHTML = '';
    if (!items.length){ ulTips.append(el('li',{}, 'Keine Ergebnisse.')); mark(tagTips, true); return; }
    for (const it of items.slice(0, 20)){
      const a = el('a', { href: it.url, target:'_blank', rel:'noopener noreferrer' }, it.title || it.url);
      a.addEventListener('click', ()=> api.metrics('tips_click', { url: it.url }));
      ulTips.append(el('li',{}, a, el('div',{}, el('small',{class:'small'}, (new URL(it.url)).hostname.replace(/^www\./,'')))));
    }
    mark(tagTips, true);
  }catch(e){ console.error(e); toast('Tipps-Fehler'); mark(tagTips, false); }
}

/* KI-News */
const ulNews = $('#news');
async function loadNews(){
  try{
    const j = await api.news();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulNews.innerHTML = '';
    if (!items.length){ ulNews.append(el('li',{}, 'Keine Ergebnisse.')); mark(tagNews, true); return; }
    for (const it of items.slice(0, 20)){
      const a = el('a', { href: it.url, target:'_blank', rel:'noopener noreferrer' }, it.title || it.url);
      a.addEventListener('click', ()=> api.metrics('news_click', { url: it.url }));
      ulNews.append(el('li',{}, a, el('div',{}, el('small',{class:'small'}, (new URL(it.url)).hostname.replace(/^www\./,'')))));
    }
    mark(tagNews, true);
  }catch(e){ console.error(e); toast('News-Fehler'); mark(tagNews, false); }
}

/* Daily */
const ulDaily = $('#daily'); // (Optional overlay; falls vorhanden)
async function loadDaily(){
  try {
    const j = await api.daily();
    const items = Array.isArray(j?.items) ? j.items : [];
    if(ulDaily){ ulDaily.innerHTML=''; if(!items.length){ ulDaily.append(el('li',{}, 'Nichts für heute.')); mark(tagDaily, true); return; } for (const it of items.slice(0,6)){ const a = it.url ? el('a',{href:it.url,target:'_blank',rel:'noopener noreferrer'},'Öffnen') : null; if (a) a.addEventListener('click', ()=> api.metrics('daily_click', { url: it.url })); ulDaily.append(el('li',{}, el('strong',{}, it.title || 'Tipp'), a ? el('div',{}, a) : null)); } mark(tagDaily, true); }
  } catch(e){ console.error(e); if(tagDaily) mark(tagDaily, false); }
}

/* Prompt-Galerie */
let PROMPTS = []; async function loadPrompts(){ if (PROMPTS.length) return PROMPTS; const r = await fetch('./data/prompts.json', { cache:'no-store' }); PROMPTS = r.ok ? await r.json() : []; return PROMPTS; }
const grid = $('#prompt-grid'); const searchBox = $('#prompt-search'); let currentFilter = 'Alle';
function renderPrompts(){ loadPrompts().then(()=>{ const q = (searchBox?.value||'').toLowerCase().trim(); const list = PROMPTS.filter(p => (currentFilter==='Alle' || (p.tags||[]).includes(currentFilter)) && (p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q))); grid.innerHTML = ''; for (const it of list){ const card = el('div',{class:'card'}, el('h3',{}, it.title), el('p',{}, it.desc || ''), el('div',{class:'actions'}, el('button',{type:'button','data-copy':it.prompt},'Kopieren'), el('button',{type:'button','data-run':it.prompt,class:'ghost'},'In Run öffnen') ) ); grid.append(card); } }); }
document.addEventListener('click', async (e)=>{ if (e.target?.dataset?.copy){ await copy(e.target.dataset.copy); api.metrics('prompt_copy', { title: e.target.closest('.card')?.querySelector('h3')?.textContent || '' }); } if (e.target?.dataset?.run){ openOverlay('#ov-run'); const box = $('#run-input'); box.value = e.target.dataset.run; box.focus(); api.metrics('prompt_run', { title: e.target.closest('.card')?.querySelector('h3')?.textContent || '' }); } });
document.addEventListener('click', (e)=>{ const f = e.target?.dataset?.filter; if (!f) return; currentFilter = f; document.querySelectorAll('.tools .chip').forEach(ch => ch.toggleAttribute('data-active', ch.dataset.filter === f)); renderPrompts(); });
searchBox?.addEventListener('input', ()=> renderPrompts());

/* Impressum */
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
function renderImpressum(){ const elHost = $('#impressum-body'); elHost.innerHTML = IMPRESSUM.split('\n\n').map(p => '<p>'+p.replace(/\n/g,'<br>')+'</p>').join(''); }

/* Run (SSE + reconnect) */
const runForm = $('#run-form'); const runOut = $('#run-out'); let closeStream = null, retry = 0;
function startStream(q){ if (closeStream) try{ closeStream(); } catch {} runOut.textContent = ''; closeStream = streamRun(q, { eu: !!prefs.eu, onToken: (t)=> { runOut.textContent += t; }, onDone: ()=> { toast('Fertig'); closeStream = null; retry = 0; }, onError: ()=> { if (retry < 2){ const backoff = (retry+1)*600; retry++; setTimeout(()=> startStream(q), backoff); } else { toast('Stream-Fehler'); closeStream = null; retry = 0; } } }); }
runForm?.addEventListener('submit', (e)=>{ e.preventDefault(); const q = $('#run-input').value.trim(); if(!q) return; startStream(q); });

/* Init */
(async function init(){
  const ok = await selfCheck(); if(tagApi) mark(tagApi, ok);
  // Prefetch einmal täglich (SWR)
  const now = Date.now();
  if (!prefs.lastNewsPrefetch || (now - prefs.lastNewsPrefetch) > 23*60*60*1000){ prefs.lastNewsPrefetch = now; pref.set(prefs); try{ await getJson('/news?prefetch=1'); } catch {} }
  if (!prefs.lastTipsPrefetch || (now - prefs.lastTipsPrefetch) > 23*60*60*1000){ prefs.lastTipsPrefetch = now; pref.set(prefs); try{ await getJson('/tips?prefetch=1'); } catch {} }
  // Bubbles laden
  try { const r = await fetch('./data/bubbles.json', { cache:'no-store' }); if (r.ok){ const items = await r.json(); await initBubbleEngine(items); } } catch (err) { console.warn('bubbles init failed', err); }
})();
