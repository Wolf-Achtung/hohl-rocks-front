import { $, el, fmtUrl, toast } from './utils.js';
import { api, selfCheck } from './api.js';

const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
const ulNews = $('#news');
const ulDaily = $('#daily');

function mark(el, ok){
  const cls = 'tag ' + (ok ? 'ok' : 'err');
  el.className = cls;
  el.textContent = el.textContent.replace(/[…✕✓]/g,'') + (ok ? ' ✓' : ' ✕');
}

async function loadNews(){
  try {
    const j = await api.news();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulNews.innerHTML = '';
    if (!items.length){ ulNews.append(el('li',{}, 'Keine Ergebnisse.')); mark(tagNews, true); return; }
    for (const it of items.slice(0, 10)){
      ulNews.append(
        el('li',{},
          el('a', { href: it.url, target: '_blank', rel: 'noopener noreferrer' }, it.title || it.url),
          el('div', {}, el('small', { class: 'muted' }, fmtUrl(it.url)))
        )
      );
    }
    mark(tagNews, true);
  } catch (e){
    console.error(e); toast('News-Fehler'); mark(tagNews, false);
  }
}
async function loadDaily(){
  try {
    const j = await api.daily();
    const items = Array.isArray(j?.items) ? j.items : [];
    ulDaily.innerHTML = '';
    if (!items.length){ ulDaily.append(el('li',{}, 'Nichts für heute.')); mark(tagDaily, true); return; }
    for (const it of items.slice(0, 6)){
      ulDaily.append(el('li',{}, el('strong',{}, it.title || 'Tipp'),
        it.url ? el('div',{}, el('a',{href: it.url, target:'_blank', rel:'noopener noreferrer'}, 'Öffnen')) : null));
    }
    mark(tagDaily, true);
  } catch (e){
    console.error(e); toast('Daily-Fehler'); mark(tagDaily, false);
  }
}

// UI buttons
document.getElementById('btn-health').addEventListener('click', async ()=> {
  const ok = await selfCheck(); toast(ok ? 'Backend OK' : 'Backend nicht erreichbar'); mark(tagApi, ok);
});
document.getElementById('btn-news').addEventListener('click', loadNews);
document.getElementById('btn-daily').addEventListener('click', loadDaily);

// Sound toggle – expects a global AudioController from audio.js (if present)
const btnSound = document.getElementById('btn-sound');
btnSound?.addEventListener('click', ()=> {
  try {
    if (window.AudioController){
      const on = window.AudioController.toggle();
      btnSound.setAttribute('aria-pressed', on ? 'true':'false');
      btnSound.textContent = on ? 'Sound: an' : 'Sound';
    } else {
      toast('Audio-Modul nicht geladen');
    }
  } catch { toast('Audio-Fehler'); }
});

// Bubble engine hook – if the module exposes init(canvas)
window.addEventListener('load', ()=> {
  try {
    if (window.Bubbles && typeof window.Bubbles.init === 'function'){
      const canvas = document.getElementById('bubble-canvas');
      window.Bubbles.init(canvas, { speed: .4, density: .6 }); // entschleunigt
    }
  } catch {}
});

// init
(async function init(){
  const ok = await selfCheck();
  mark(tagApi, ok);
  await Promise.all([loadNews(), loadDaily()]);
})();
