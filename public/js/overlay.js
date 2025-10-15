// js/overlay.js
import { $, el, $$, formatTime } from './utils.js';
import { news, daily, topPrompts } from './api.js';

const overlay = $('#overlay');
const panel = $('.overlay__panel', overlay);
const content = $('#overlay-content');
const titleEl = $('#overlay-title');

function open(){ overlay.setAttribute('aria-hidden','false'); setTimeout(()=> panel?.focus(), 0); }
export function close(){ overlay.setAttribute('aria-hidden','true'); content.innerHTML=''; titleEl.textContent='Overlay'; }

document.addEventListener('click', (e)=>{
  if(e.target.matches('[data-close="overlay"]')) close();
});

export async function showNews(){
  titleEl.textContent = 'News & Daily';
  open();
  content.innerHTML = '<p>⏳ Lade…</p>';
  try{
    const [n, d] = await Promise.all([news(), daily()]);
    // Research mini-form
    const form = el('form', {class:'ui form', style:'margin:0 0 12px 0'});
    const row = el('div', {class:'form-row'});
    row.append(el('label', {for:'q'}, 'Research'));
    const inp = el('input', {id:'q', type:'text', placeholder:'Thema oder Frage…'});
    const btn = el('button', {class:'ui btn', type:'submit'}, 'Fragen');
    row.append(inp, btn);
    form.append(row);
    content.innerHTML = ''; content.append(form);
    const resultWrap = el('div', {}); content.append(resultWrap);
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      resultWrap.innerHTML = '<p>⏳ recherchiere …</p>';
      try{
        const q = inp.value.trim(); if(!q) return;
        const base = (document.querySelector('meta[name="x-api-base"]')?.content||'/_api');
        const res = await fetch(base + '/api/research', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({q})});
        const j = await res.json();
        const art = el('article', {class:'card'});
        art.append(el('div', {class:'result', style:'white-space:pre-wrap'}, j.answer || ''));
        if(j.sources?.length){
          const ul = el('ul', {});
          j.sources.slice(0,8).forEach(s=> ul.append(el('li', {}, el('a', {href:s.url, target:'_blank', rel:'noopener'}, s.title||s.url))));
          art.append(ul);
        }
        resultWrap.innerHTML = ''; resultWrap.append(art);
      }catch(err){
        resultWrap.innerHTML = '<p>API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.</p>';
      }
    });

    const list = el('div', {});
    if(d){ list.append(el('h3', {}, 'Daily‑Spotlight ('+formatTime(Date.now())+')')); }
    if(d?.items?.length){
      const ul = el('ul', {});
      d.items.slice(0,5).forEach(it=> ul.append(el('li', {}, el('a', {href: it.url, target:'_blank', rel:'noopener'}, it.title || it.url))));
      list.append(ul);
    }
    list.append(el('h3', {}, 'News'));
    const ul = el('ul', {});
    (n?.items||[]).slice(0,10).forEach(it=> ul.append(el('li', {}, el('a',{href:it.url, target:'_blank', rel:'noopener'}, it.title || it.url))));
    list.append(ul);
    content.append(list);
  }catch(err){
    content.innerHTML = `<p>Fehler beim Laden: ${err.message||err}</p>`;
  }
}

export async function showPrompts(){
  titleEl.textContent = 'Top‑Prompts';
  open();
  content.innerHTML = '<p>⏳ Lade…</p>';
  try{
    const items = await topPrompts();
    const wrap = el('div', {});
    const grid = el('div', {class:'masonry'});
    (items||[]).forEach((it, idx)=>{
      const fig = el('figure', {});
      fig.append(el('figcaption', {}, (idx+1)+'. '+(it.title || 'Prompt')));
      const pre = el('pre', {}, it.prompt || '');
      const btns = el('div', {class:'form-row'});
      const copy = el('button', {class:'ui btn', type:'button'}, 'Kopieren');
      copy.addEventListener('click', ()=> navigator.clipboard.writeText(it.prompt||'').then(()=>{}));
      btns.append(copy);
      fig.append(pre, btns);
      grid.append(fig);
    });
    wrap.append(grid);
    content.innerHTML=''; content.append(wrap);
  }catch(err){
    content.innerHTML = `<p>Fehler: ${err.message||err}</p>`;
  }
}

export function showProjects(){
  titleEl.textContent = 'Projekte';
  open();
  content.innerHTML = `<div class="masonry">
    <figure><figcaption>hohl.rocks Frontend</figcaption><p>Neo‑brutalistisches, ruhiges UI mit organischen Bubbles und KI‑Micro‑Apps.</p></figure>
    <figure><figcaption>Audio‑Layer</figcaption><p>Dezenter Ambient‑Sound auf dem Gerät, DSGVO‑freundlich.</p></figure>
    <figure><figcaption>Backend</figcaption><p>Anthropic/OpenAI‑SSE, Tavily‑News, Perplexity‑Research, Top‑Prompts.</p></figure>
  </div>`;
}

export function showImpressum(){
  titleEl.textContent = 'Impressum & Datenschutz';
  open();
  content.innerHTML = `<article class="card">
  <h3>Angaben gemäß § 5 TMG</h3>
  <p><strong>Wolf Hohl</strong><br/>Berlin · Deutschland</p>
  <p>E‑Mail: <a href="mailto:hallo@hohl.rocks">hallo@hohl.rocks</a></p>
  <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
  <p>Wolf Hohl</p>
  <h3>Haftungsausschluss</h3>
  <p>Alle Inhalte wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.</p>
  <h3>Datenschutz</h3>
  <p>Es werden keine Cookies und keine Tracker eingesetzt. Einstellungen (z. B. Klang) werden ausschließlich lokal im Browser gespeichert. Bei Nutzung der KI‑Funktionen werden Anfragen an die vom Nutzer ausgelösten API‑Dienste (z. B. Anthropic, OpenAI, Replicate) über das eigene Backend weitergeleitet.</p>
  </article>`;
}
