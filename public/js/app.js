import { $, el, fmtUrl, toast } from './utils.js';
import { api, selfCheck } from './api.js';

/* ---------- NAV: load from partial (1:1 restore supported) ---------- */
async function loadNav(){
  const wrap = $('#top-nav');
  try {
    const res = await fetch('./partials/nav.html', { cache: 'no-store' });
    wrap.innerHTML = await res.text();
  } catch {
    wrap.innerHTML = '<div class="brand">hohl.rocks</div><div class="menu"><button id="btn-sound" type="button">Sound</button><a href="#" id="btn-open-news">News</a><a href="#" id="btn-open-daily">Daily</a><a href="#" id="btn-open-run">Run</a><button id="btn-health" type="button">Check</button></div>';
  }
}
await loadNav();

/* ---------- Overlay helpers ---------- */
function openOverlay(id){
  const ov = $(id); if (!ov) return;
  ov.dataset.open = "1"; ov.setAttribute('aria-hidden', 'false');
  // Esc to close
  const esc = (e)=> { if (e.key === 'Escape'){ closeOverlay(id); window.removeEventListener('keydown', esc);} };
  window.addEventListener('keydown', esc);
}
function closeOverlay(id){
  const ov = $(id); if (!ov) return;
  delete ov.dataset.open; ov.setAttribute('aria-hidden', 'true');
}

/* ---------- Elements ---------- */
const ovNews = '#ov-news';
const ovDaily = '#ov-daily';
const ovRun = '#ov-run';
const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
const ulNews = $('#news');
const ulDaily = $('#daily');

document.body.addEventListener('click', (e)=>{
  const t = e.target;
  if (t.matches('[data-close]')){
    const p = t.closest('.overlay');
    if (p) closeOverlay('#'+p.id);
  }
});

/* ---------- Feature: Sound toggle (if audio.js defines AudioController) ---------- */
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'btn-sound'){
    if (window.AudioController){
      const on = window.AudioController.toggle();
      e.target.setAttribute('aria-pressed', on ? 'true':'false');
      e.target.textContent = on ? 'Sound: an' : 'Sound';
    } else {
      toast('Audio-Modul nicht geladen');
    }
  }
});

/* ---------- Bind nav buttons ---------- */
document.addEventListener('click', (e)=>{
  if (e.target?.id === 'btn-open-news'){ e.preventDefault(); openOverlay(ovNews); loadNews(); }
  if (e.target?.id === 'btn-open-daily'){ e.preventDefault(); openOverlay(ovDaily); loadDaily(); }
  if (e.target?.id === 'btn-open-run'){ e.preventDefault(); openOverlay(ovRun); }
  if (e.target?.id === 'btn-health'){ e.preventDefault(); doHealth(); }
});

/* ---------- Loaders ---------- */
function mark(el, ok){ if (!el) return; el.className = 'tag ' + (ok ? 'ok' : ''); el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : ''); }

async function doHealth(){
  const ok = await selfCheck();
  toast(ok ? 'Backend OK' : 'Backend nicht erreichbar');
  mark(tagApi, ok);
}

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
  await doHealth(); // updates API tag
  // Bubbles hook (if available)
  try {
    if (window.Bubbles?.init){
      const canvas = document.getElementById('bubble-canvas');
      window.Bubbles.init(canvas, { speed:.4, density:.6 });
    }
  } catch {}
})();
