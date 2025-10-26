// public/js/app.js - VERBESSERTE VERSION
import { $, el, fmtUrl, toast, copy, storage } from './utils.js';
import { api, selfCheck, streamRun, getJson } from './api.js';
import { initBubbleEngine } from './bubbleEngine.js';

/* EU toggle */
const pref = storage('prefs'); 
const prefs = pref.get() || { eu:false, lastNewsPrefetch: 0, lastTipsPrefetch: 0, layout:'drift' };
const btnEU = $('#btn-eu'); 

function renderEU(){ 
  if(!btnEU) return; 
  btnEU.setAttribute('aria-pressed', prefs.eu ? 'true':'false'); 
  btnEU.textContent = 'EU: ' + (prefs.eu ? 'an' : 'aus'); 
}

btnEU?.addEventListener('click', ()=>{ 
  prefs.eu = !prefs.eu; 
  pref.set(prefs); 
  renderEU(); 
  toast('EU‑only: ' + (prefs.eu?'an':'aus')); 
});
renderEU();

/* Overlays */
const lastFocus = new Map();

function firstFocusable(root){ 
  return root.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); 
}

function openOverlay(id){ 
  const ov = $(id); 
  if(!ov) return; 
  lastFocus.set(id, document.activeElement); 
  ov.dataset.open = "1"; 
  ov.setAttribute('aria-hidden','false'); 
  (ov.querySelector('.close') || firstFocusable(ov) || document.body)?.focus(); 
  
  const esc = (e)=>{ 
    if(e.key==='Escape'){ 
      closeOverlay(id); 
      window.removeEventListener('keydown', esc);
    } 
  }; 
  window.addEventListener('keydown', esc); 
  ov.addEventListener('keydown', trapTab); 
}

function closeOverlay(id){ 
  const ov = $(id); 
  if(!ov) return; 
  ov.removeEventListener('keydown', trapTab); 
  (ov.querySelector(':focus')?.blur?.()); 
  delete ov.dataset.open; 
  ov.setAttribute('aria-hidden','true'); 
  (lastFocus.get(id) || document.querySelector('.site-nav .nav-btn'))?.focus?.(); 
}

function trapTab(e){ 
  if (e.key !== 'Tab') return; 
  const root = e.currentTarget; 
  const f = Array.from(root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled')); 
  if (!f.length) return; 
  const first = f[0], last = f[f.length-1]; 
  if (e.shiftKey && document.activeElement === first){ 
    last.focus(); 
    e.preventDefault(); 
  } else if (!e.shiftKey && document.activeElement === last){ 
    first.focus(); 
    e.preventDefault(); 
  } 
}

document.addEventListener('click', (e)=>{ 
  if (e.target?.matches('[data-close]')){ 
    const p = e.target.closest('.overlay'); 
    if(p) closeOverlay('#'+p.id); 
  } 
  if (e.target?.matches('.overlay .backdrop')){ 
    const p = e.target.closest('.overlay'); 
    if(p) closeOverlay('#'+p.id); 
  } 
});

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
      if (window.AudioController){ 
        try { 
          const on = window.AudioController.toggle(); 
          toast(on?'Sound: an':'Sound: aus'); 
        } catch { 
          toast('Audio-Fehler'); 
        } 
      } else toast('Audio-Modul nicht geladen');
      break;
    case 'locale': toast('Sprachumschaltung folgt'); break;
  }
}

document.addEventListener('click', (e)=>{ 
  const act = e.target?.dataset?.action; 
  if (act){ 
    e.preventDefault(); 
    onAction(act); 
  } 
});

window.addEventListener('keydown', (e)=>{
  if (e.key==='t' || e.key==='T'){ e.preventDefault(); onAction('tips'); }
  if (e.key==='n' || e.key==='N'){ e.preventDefault(); onAction('news'); }
  if (e.key==='p' || e.key==='P'){ e.preventDefault(); onAction('prompts'); }
  if (e.key==='o' || e.key==='O'){ 
    e.preventDefault(); 
    prefs.layout = (prefs.layout==='drift'?'orbit':'drift'); 
    pref.set(prefs); 
    window.dispatchEvent(new CustomEvent('layout:toggle', { detail: { layout:prefs.layout } })); 
    toast('Layout: ' + (prefs.layout==='orbit'?'Orbit':'Drift')); 
  }
  if (e.key==='Escape'){ 
    document.querySelectorAll('.overlay[data-open="1"]').forEach(el=> closeOverlay('#'+el.id)); 
  }
});

/* Tags */
const tagApi = $('#tag-api'), tagNews = $('#tag-news'), tagTips = $('#tag-tips');

function mark(el, ok){ 
  if(!el) return; 
  el.className = 'tag ' + (ok ? 'ok' : ''); 
  el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : ''); 
}

/* KI-Tipps (Cards) - VERBESSERT */
const tipsGrid = $('#tips-grid');

async function loadTips(){
  console.log('[loadTips] Start loading tips...');
  
  try{
    // Zuerst prüfen, ob TIPS_DATA verfügbar ist (statische Daten)
    if (window.TIPS_DATA && window.TIPS_DATA.length > 0) {
      console.log('[loadTips] Using static TIPS_DATA:', window.TIPS_DATA.length, 'tips');
      renderStaticTips(window.TIPS_DATA);
      mark(tagTips, true);
      return;
    }
    
    // Fallback: API-Daten
    console.log('[loadTips] Fetching from API...');
    const j = await api.tips();
    console.log('[loadTips] API response:', j);
    
    const items = Array.isArray(j?.items) ? j.items : [];
    
    if (!items.length){ 
      console.warn('[loadTips] No tips found');
      tipsGrid.innerHTML = '<p class="empty-state">⚠️ Keine Tipps verfügbar. Prüfe Backend-Konfiguration oder verwende statische Daten.</p>'; 
      mark(tagTips, true); 
      return; 
    }
    
    // API-Tipps rendern (externe Links)
    renderApiTips(items);
    mark(tagTips, true);
    
  }catch(e){ 
    console.error('[loadTips] Error:', e); 
    tipsGrid.innerHTML = '<p class="error-state">❌ Fehler beim Laden der Tipps. Bitte Backend prüfen.</p>';
    toast('Tipps-Fehler'); 
    mark(tagTips, false); 
  }
}

// Statische Tips rendern (mit Modal-Öffnung)
function renderStaticTips(items){
  tipsGrid.innerHTML = '';
  
  for (const it of items.slice(0, 20)){
    const card = el('article', { class:'tip tip-card', 'data-id': it.id },
      el('h3', {}, it.title || 'Untitled'),
      el('div', { class:'meta' }, 
        el('span', { class:'category' }, it.category || 'Allgemein'),
        el('span', { class:'tags' }, (it.tags || []).join(', '))
      ),
      el('p', { class:'problem' }, it.problem || ''),
      el('div', { class:'actions' },
        el('button', { type:'button', 'data-action':'open-tip', 'data-tip-id': it.id }, 'Öffnen'),
        el('button', { type:'button', 'data-action':'copy-tip', 'data-tip-id': it.id }, 'Prompt kopieren')
      )
    );
    tipsGrid.append(card);
  }
  
  console.log('[renderStaticTips] Rendered', items.length, 'static tips');
}

// API-Tips rendern (externe Links)
function renderApiTips(items){
  tipsGrid.innerHTML = '';
  
  for (const it of items.slice(0, 20)){
    const host = new URL(it.url).hostname.replace(/^www\./,'');
    const card = el('article', { class:'tip' },
      el('h3', {}, it.title || host),
      el('div', { class:'meta' }, 
        el('span', { class:'why' }, it.why || 'Praxis'), 
        el('span', { class:'host' }, host)
      ),
      el('div', { class:'actions' },
        el('a', { href: it.url, target:'_blank', rel:'noopener noreferrer' }, 'Öffnen'),
        el('button', { type:'button', 'data-copy': it.url }, 'Link kopieren')
      )
    );
    tipsGrid.append(card);
  }
  
  console.log('[renderApiTips] Rendered', items.length, 'API tips');
}

/* KI-News - VERBESSERT */
const ulNews = $('#news');

async function loadNews(){
  console.log('[loadNews] Start loading news...');
  
  try{
    const j = await api.news();
    console.log('[loadNews] API response:', j);
    
    const items = Array.isArray(j?.items) ? j.items : [];
    ulNews.innerHTML = '';
    
    if (!items.length){ 
      console.warn('[loadNews] No news found');
      ulNews.append(el('li', { class:'empty-state' }, 
        '⚠️ Keine News verfügbar.',
        el('br'),
        el('small', { class:'small' }, 'Backend-Konfiguration prüfen (Tavily API, RSS Feeds)')
      )); 
      mark(tagNews, true); 
      return; 
    }
    
    for (const it of items.slice(0, 20)){
      const li = el('li', {});
      const a = el('a', { href: it.url, target:'_blank', rel:'noopener noreferrer' }, it.title || it.url);
      a.addEventListener('click', ()=> api.metrics('news_click', { url: it.url }));
      
      const host = (()=>{
        try { return (new URL(it.url)).hostname.replace(/^www\./,''); } 
        catch { return it.source || ''; }
      })();
      
      li.append(a);
      if (it.summary) li.append(el('div', { class:'small' }, it.summary));
      li.append(el('div',{}, el('small',{class:'small'}, host)));
      ulNews.append(li);
    }
    
    mark(tagNews, true);
    console.log('[loadNews] Rendered', items.length, 'news items');
    
  }catch(e){ 
    console.error('[loadNews] Error:', e); 
    ulNews.innerHTML = '<li class="error-state">❌ News-Fehler. Backend nicht erreichbar.</li>';
    toast('News-Fehler'); 
    mark(tagNews, false); 
  }
}

/* Prompt-Galerie */
let PROMPTS = []; 

async function loadPrompts(){ 
  if (PROMPTS.length) return PROMPTS; 
  const r = await fetch('./data/prompts.json', { cache:'no-store' }); 
  PROMPTS = r.ok ? await r.json() : []; 
  return PROMPTS; 
}

const grid = $('#prompt-grid'); 
const searchBox = $('#prompt-search'); 
let currentFilter = 'Alle';

function renderPrompts(){ 
  loadPrompts().then(()=>{ 
    const q = (searchBox?.value||'').toLowerCase().trim(); 
    const list = PROMPTS.filter(p => 
      (currentFilter==='Alle' || (p.tags||[]).includes(currentFilter)) && 
      (p.question.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q))
    ); 
    
    grid.innerHTML = ''; 
    
    for (const it of list){ 
      const card = el('div',{class:'card'}, 
        el('h3',{}, it.question), 
        el('p',{}, it.desc || ''), 
        el('div',{class:'actions'}, 
          el('button',{type:'button','data-copy':it.prompt},'Kopieren'), 
          el('button',{type:'button','data-run':it.prompt},'Im Run öffnen')
        )
      ); 
      grid.append(card); 
    } 
  }); 
}

document.addEventListener('click', async (e)=>{
  const dc = e.target?.dataset?.copy;
  if (dc){
    if (dc === 'modal'){
      const p = document.querySelector('#modal .prompt-text')?.innerText?.trim();
      if (p){ await copy(p); toast('Prompt kopiert'); }
    } else {
      await copy(dc); toast('Kopiert');
    }
  }
  
  const run = e.target?.dataset?.run;
  if (run){ 
    openOverlay('#ov-run'); 
    const box = $('#run-input'); 
    box.value = run; 
    box.focus(); 
    api.metrics('prompt_run', {}); 
  }
});

document.addEventListener('click', (e)=>{ 
  const f = e.target?.dataset?.filter; 
  if (!f) return; 
  currentFilter = f; 
  document.querySelectorAll('.tools .chip').forEach(ch => ch.toggleAttribute('data-active', ch.dataset.filter === f)); 
  renderPrompts(); 
});

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

function renderImpressum(){ 
  const elHost = $('#impressum-body'); 
  elHost.innerHTML = IMPRESSUM.split('\n\n').map(p => '<p>'+p.replace(/\n/g,'<br>')+'</p>').join(''); 
}

/* Init */
(async function init(){
  console.log('[init] Starting app initialization...');
  
  const ok = await selfCheck(); 
  if(tagApi) mark(tagApi, ok);
  
  console.log('[init] Backend health:', ok);
  
  // Prefetch einmal täglich (SWR)
  const now = Date.now();
  if (!prefs.lastNewsPrefetch || (now - prefs.lastNewsPrefetch) > 23*60*60*1000){ 
    prefs.lastNewsPrefetch = now; 
    pref.set(prefs); 
    try{ await getJson('/news?prefetch=1'); } catch(e) { 
      console.warn('[init] News prefetch failed:', e); 
    } 
  }
  
  if (!prefs.lastTipsPrefetch || (now - prefs.lastTipsPrefetch) > 23*60*60*1000){ 
    prefs.lastTipsPrefetch = now; 
    pref.set(prefs); 
    try{ await getJson('/tips?prefetch=1'); } catch(e) { 
      console.warn('[init] Tips prefetch failed:', e); 
    } 
  }
  
  // Bubbles direkt aus prompts.json
  try { 
    const items = await loadPrompts(); 
    initBubbleEngine({ selector: '.bubble, [data-bubble], [data-id]' }); 
  } catch (err) { 
    console.warn('[init] Bubbles init failed', err); 
  }
  
  console.log('[init] App initialization complete');
})();
