import { $, el, fmtUrl, toast } from './utils.js';
import { api, selfCheck } from './api.js';

/* ---------- Overlay helpers ---------- */
function openOverlay(id){
  const ov = $(id); if (!ov) return;
  ov.dataset.open = "1"; ov.setAttribute('aria-hidden', 'false');
  const esc = (e)=> { if (e.key === 'Escape'){ closeOverlay(id); window.removeEventListener('keydown', esc);} };
  window.addEventListener('keydown', esc);
}
function closeOverlay(id){
  const ov = $(id); if (!ov) return;
  delete ov.dataset.open; ov.setAttribute('aria-hidden', 'true');
}
document.body.addEventListener('click', (e)=>{
  if (e.target.matches('[data-close]')){
    const p = e.target.closest('.overlay'); if (p) closeOverlay('#'+p.id);
  }
  if (e.target.matches('.overlay .backdrop')){
    const p = e.target.closest('.overlay'); if (p) closeOverlay('#'+p.id);
  }
});

/* ---------- Actions via legacy data-action ---------- */
function onAction(action){
  switch (action) {
    case 'news': openOverlay('#ov-news'); loadNews(); break;
    case 'prompts': openOverlay('#ov-run'); break; // placeholder: could open an own prompts overlay
    case 'projekte': toast('Projekte folgt'); break;
    case 'impressum': toast('Impressum folgt'); break;
    case 'about': toast('Über folgt'); break;
    case 'favoriten': toast('Favoriten folgt'); break;
    case 'settings': toast('Einstellungen: S'); break;
    case 'klang':
      if (window.AudioController){
        try {
          const on = window.AudioController.toggle();
          // Optional: reflect somewhere
          toast(on ? 'Sound: an' : 'Sound: aus');
        } catch { toast('Audio-Fehler'); }
      } else toast('Audio-Modul nicht geladen');
      break;
    case 'locale': toast('Sprachumschaltung folgt'); break;
    default: break;
  }
}
document.addEventListener('click', (e)=> {
  const act = e.target?.dataset?.action;
  if (act){ e.preventDefault(); onAction(act); }
});

/* ---------- Status tags ---------- */
const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
function mark(el, ok){
  if (!el) return;
  el.className = 'tag ' + (ok ? 'ok' : '');
  el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : '');
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
      ulNews.append(el('li',{},
        el('a', { href: it.url, target: '_blank', rel: 'noopener noreferrer' }, it.title || it.url),
        el('div', {}, el('small', { class: 'small' }, fmtUrl(it.url)))
      ));
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
      ulDaily.append(el('li',{},
        el('strong',{}, it.title || 'Tipp'),
        it.url ? el('div',{}, el('a', { href: it.url, target: '_blank', rel:'noopener noreferrer' }, 'Öffnen')) : null
      ));
    }
    mark(tagDaily, true);
  } catch (e){ console.error(e); toast('Daily-Fehler'); mark(tagDaily, false); }
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

  // bubble engine compatibility: call if any known entrypoints exist
  const canvas = document.getElementById('bubbles');
  try {
    if (window.Bubbles?.init) {
      window.Bubbles.init(canvas, { speed:.4, density:.6, labelsEl: document.getElementById('bubble-labels') });
    } else if (window.initBubbles) {
      window.initBubbles(canvas, document.getElementById('bubble-labels'));
    } else if (window.BubbleEngine?.init) {
      window.BubbleEngine.init(canvas, { labels: '#bubble-labels' });
    }
  } catch (err) {
    console.warn('Bubble engine init failed:', err);
  }
})();
