import { $, el, fmtUrl, toast } from './utils.js';
import { api, selfCheck } from './api.js';

const tagApi = $('#tag-api');
const tagNews = $('#tag-news');
const tagDaily = $('#tag-daily');
const ulNews = $('#news');
const ulDaily = $('#daily');

function mark(el, ok){ el.className = 'tag ' + (ok ? 'ok' : 'err'); el.textContent = ok ? el.textContent.replace('…', '✓') : el.textContent.replace('…','✕'); }

async function loadNews(){
  try {
    const j = await api.news();
    const items = (j && j.items) || [];
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
    const items = (j && j.items) || [];
    ulDaily.innerHTML = '';
    if (!items.length){ ulDaily.append(el('li',{}, 'Nichts für heute.')); mark(tagDaily, true); return; }
    for (const it of items.slice(0, 6)){
      ulDaily.append(
        el('li',{},
          el('strong',{}, it.title || 'Tipp'),
          it.url ? el('div',{}, el('a',{href: it.url, target:'_blank', rel:'noopener noreferrer'}, fmtUrl(it.url))) : null
        )
      );
    }
    mark(tagDaily, true);
  } catch (e){
    console.error(e); toast('Daily-Fehler'); mark(tagDaily, false);
  }
}

$('#btn-refresh').addEventListener('click', ()=> { loadNews(); loadDaily(); });
$('#btn-health').addEventListener('click', async ()=> {
  const ok = await selfCheck();
  toast(ok ? 'Backend OK' : 'Backend nicht erreichbar');
  mark(tagApi, ok);
});

// init
(async function init(){
  const ok = await selfCheck();
  mark(tagApi, ok);
  await Promise.all([loadNews(), loadDaily()]);
})();
