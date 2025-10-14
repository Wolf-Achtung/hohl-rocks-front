(()=>{'use strict';
const $=(s,c=document)=>c.querySelector(s); const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const esc=(t)=>{const d=document.createElement('div'); d.textContent=t; return d.innerHTML;};
const modal=$('#modal'); const modalC=$('#modal-content');
const consent=$('#consent');

function openModal(html){
  // Nur EIN Modal aktiv (verhindert ARIA-Warnung)
  consent.setAttribute('aria-hidden','true');
  modalC.innerHTML=html;
  modal.setAttribute('aria-hidden','false');
  const p=$('.modal__panel', modal); if(p){ setTimeout(()=>p.focus(), 0); }
}
function closeModal(){
  modal.setAttribute('aria-hidden','true');
  if(document.activeElement) document.activeElement.blur();
}
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal')) closeModal(); });
$('[data-copy="modal"]').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText($('#modal-content').innerText.trim()); alert('Kopiert ✓'); }catch{} });
$('#modal-share').addEventListener('click', ()=>{ try{ const txt=$('#modal-content')?.innerText?.trim(); navigator.share ? navigator.share({text:txt||'Schau mal: hohl.rocks'}) : navigator.clipboard.writeText(location.href); }catch{} });

// Consent
function ensureConsent(){ if(localStorage.getItem('consent')==='true') return;
  consent.setAttribute('aria-hidden','false'); $('.modal__panel', consent).focus();
  $('#consent-accept').onclick=()=>{ localStorage.setItem('consent','true'); consent.setAttribute('aria-hidden','true'); };
  $('#consent-decline').onclick=()=>{ alert('Ohne Einwilligung keine KI-Aufrufe.'); };
}

// API base
async function resolveApiBase(){
  const candidates=['/_api',(document.querySelector('meta[name="x-api-base"]')||{}).content||'','/api'].filter(Boolean);
  for(const base of candidates){ try{ const ac=new AbortController(); const tm=setTimeout(()=>ac.abort(),4000);
    const r=await fetch(`${base}/healthz`,{method:'GET',mode:'cors',cache:'no-store',signal:ac.signal});
    clearTimeout(tm); if(r.ok) return base; }catch{} }
  throw new Error('no_api_base');
}
async function apiJson(method, path, body){
  const base=await resolveApiBase();
  const opt={ method, mode:'cors', cache:'no-store', headers:{'Content-Type':'application/json'} };
  if(body) opt.body=JSON.stringify(body);
  const r=await fetch(`${base}${path}`, opt); if(!r.ok) throw new Error(`api_${r.status}`);
  return await r.json();
}

// Background video
(async ()=>{ try{
  const video=$('#bg-video'); const saveData=(navigator.connection&&navigator.connection.saveData)?true:false;
  const srcs=saveData?['/videos/road_540p_bg.webm','/videos/road_540p_bg.mp4','/videos/road.mp4']
                     :['/videos/road_720p_bg.webm','/videos/road_720p_bg.mp4','/videos/road.mp4','/videos/road_540p_bg.webm'];
  async function headOk(u){ try{ const r=await fetch(u,{method:'HEAD',cache:'no-store'}); return r.ok; }catch{return false;} }
  let chosen=''; for(const s of srcs){ if(await headOk(s)){ chosen=s; break; } }
  if(!chosen) return; const type=chosen.endsWith('.webm')?'video/webm':'video/mp4';
  video.innerHTML=`<source src="${chosen}" type="${type}">`; video.load(); video.play().catch(()=>{}); video.classList.add('visible');
}catch{}})();

// Bubbles + Swarm
let allDefs=[];
async function loadBubbles(){
  try{
    const r=await fetch('/bubbles.json?v=20251014c',{cache:'no-store'}); allDefs=r.ok?await r.json():[];
    renderCards(allDefs); startSwarm(allDefs);
    // Deep link
    const params=new URLSearchParams(location.search); const deeplink=params.get('bubble'); const input=params.get('input');
    if(deeplink){ const def=allDefs.find(x=>x.id===deeplink); if(def){ const data=input?JSON.parse(atob(input)):null; openBubble(def,data); } }
  }catch(e){ console.error('bubbles.json fehlte', e); }
}
function renderCards(list){
  const grid=$('#bubble-grid');
  grid.innerHTML=list.map(b=>cardHtml(b)).join('');
  $$('#bubble-grid [data-run]').forEach(btn=>btn.addEventListener('click',()=>openBubble(list.find(x=>x.id===btn.dataset.run))));
  document.addEventListener('click',(e)=>{
    const t=e.target.closest('[data-share]'); if(!t) return;
    const id=t.dataset.share;
    const last = JSON.parse(localStorage.getItem('bubble_'+id+'_lastInput')||'{}');
    const url=new URL(location.href); url.searchParams.set('bubble', id);
    if(Object.keys(last).length) url.searchParams.set('input', btoa(JSON.stringify(last)));
    navigator.clipboard.writeText(url.toString()).then(()=>alert('Share‑Link kopiert')).catch(()=>{});
  });
}
function cardHtml(b){
  return `<article class="card" data-id="${esc(b.id)}">
    <header class="card__header"><span class="card__dot"></span><h3 class="card__title">${esc(b.title)}</h3></header>
    <div class="card__body">${esc(b.desc||'')}</div>
    <footer class="card__cta">
      <div class="card__tools"><input class="card__seed" type="number" min="0" step="1" placeholder="Seed" title="Seed (optional)" data-seed>
        <button class="card__btn" data-share="${esc(b.id)}" title="Link teilen">Teilen</button></div>
      <button class="card__btn" data-run="${esc(b.id)}">Start</button>
    </footer>
  </article>`;
}

function startSwarm(list){
  const swarm = $('#swarm'); if(!swarm) return;
  const MAX=12; let alive=0;
  const guard = $('.logo-guard').getBoundingClientRect();
  const headerH = document.querySelector('.site-header').getBoundingClientRect().height + 8;
  function spawn(){
    if(alive>=MAX) return;
    const def = list[Math.floor(Math.random()*list.length)];
    const el = document.createElement('div');
    el.className = 'nbubble nb-c'+(1+Math.floor(Math.random()*4));
    el.textContent = def.title;
    el.style.setProperty('--dur', (8 + Math.random()*6).toFixed(2)+'s');
    // random position avoiding header and logo
    const vw = window.innerWidth, vh = window.innerHeight;
    let left, top, tries=0;
    while(tries++<40){
      left = Math.random()*(vw*0.86); top = headerH + Math.random()*(vh*0.72);
      const w = 220 + Math.random()*80, h = 36;
      if(!(left+w>guard.left && left<guard.right && top+h>guard.top && top<guard.bottom)) break;
    }
    el.style.left = Math.max(8, left) + 'px';
    el.style.top  = Math.max(headerH+4, top) + 'px';
    el.addEventListener('click', ()=>{ const d=allDefs.find(x=>x.id===def.id); if(d) openBubble(d); });
    el.addEventListener('animationend', ()=>{ alive--; el.remove(); });
    swarm.appendChild(el); alive++;
  }
  for(let i=0;i<6;i++) setTimeout(spawn, i*400);
  setInterval(spawn, 2200);
}

// Build form
function formHtml(fields, preset){
  return (fields||[]).map(f=>{
    const val=preset && preset[f.name]!==undefined ? String(preset[f.name]) : '';
    if(f.type==='file') return `<div class="form-row"><label>${esc(f.label)}</label><input type="file" name="${esc(f.name)}" ${f.accept?`accept="${esc(f.accept)}"`:''}></div>`;
    if(f.type==='textarea') return `<div class="form-row"><label>${esc(f.label)}</label><textarea name="${esc(f.name)}" placeholder="${esc(f.placeholder||'')}">${esc(val)}</textarea></div>`;
    const t=f.type||'text';
    return `<div class="form-row"><label>${esc(f.label)}</label><input type="${esc(t)}" name="${esc(f.name)}" placeholder="${esc(f.placeholder||'')}" value="${esc(val)}"></div>`;
  }).join('');
}

function openBubble(def, presetInput=null){
  if(!def) return; if(localStorage.getItem('consent')!=='true'){ ensureConsent(); return; }
  const last = presetInput || JSON.parse(localStorage.getItem('bubble_'+def.id+'_lastInput')||'{}');
  openModal(`
    <h2>${esc(def.title)}</h2>
    <form id="bubble-form">
      ${formHtml(def.fields, last)}
      <div class="form-row" style="justify-content:flex-end">
        <button class="ui btn" type="submit">Generieren</button>
      </div>
    </form>
    <div class="result" id="bubble-result"></div>`);
  const form=$('#bubble-form');
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const out={}; const fd=new FormData(form); const files={};
    for(const f of def.fields||[]){
      if(f.type==='file'){ const file=fd.get(f.name); if(file&&file.size>0){ files[f.name]=await fileToBase64(file); } }
      else out[f.name]=fd.get(f.name);
    }
    const card=$(`.card[data-id="${def.id}"]`); const seedEl=card? $('[data-seed]', card):null;
    if(seedEl && seedEl.value) out.seed = seedEl.value;
    localStorage.setItem('bubble_'+def.id+'_lastInput', JSON.stringify(out));
    showSpinner('#bubble-result');
    try{
      const res = await apiJson('POST', `/api/bubble/${encodeURIComponent(def.id)}`, { input: out, files });
      renderResult(def, res);
      addToGallery(def, out, res);
      localStorage.setItem('bubble_'+def.id+'_lastOutput', JSON.stringify(res));
    }catch(e){
      $('#bubble-result').innerHTML = `<p>Fehler: ${esc(String(e.message||e))}</p>`;
    }
  });
}

// Spinner/Progress
function showSpinner(sel){
  const el=$(sel); el.innerHTML = `<p>⏳ Erzeuge Ergebnis… <span class="dots">•</span></p>`;
  let i=0; const t=setInterval(()=>{ const d=['•','••','•••','••']; $('.dots', el).textContent=d[i++%d.length]; }, 300);
  el.dataset.spin = t;
}
function stopSpinner(sel){ const el=$(sel); const t=Number(el?.dataset?.spin||0); if(t) clearInterval(t); }

function renderResult(def,res){
  stopSpinner('#bubble-result');
  const box=$('#bubble-result');
  const type=res.type||def.output||'text';
  if(Array.isArray(res)){ // A/B compare
    box.innerHTML = `<div class="ab-grid" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))"></div>`;
    const grid=$('.ab-grid',box);
    res.forEach(r=>{
      const title=esc(r.model||'Modell');
      const body=esc(r.text||r.data||'');
      const card=`<article class="card"><header class="card__header"><span class="card__dot"></span><h3 class="card__title">${title}</h3></header><div class="card__body"><pre style="white-space:pre-wrap">${body}</pre></div></article>`;
      grid.insertAdjacentHTML('beforeend', card);
    });
    return;
  }
  if(type==='image'){
    const url=res.url||res.data||'';
    box.innerHTML = url ? `<img src="${esc(url)}" alt="KI‑Bild">` : '<p>Kein Bild erhalten.</p>';
  } else if(type==='audio'){
    const url=res.url||res.data||'';
    box.innerHTML = url ? `<audio controls src="${esc(url)}"></audio>` : '<p>Kein Audio erhalten.</p>';
  } else if(type==='html'){
    box.innerHTML = res.html||res.data||'<p>Kein HTML‑Ergebnis.</p>';
  } else {
    const text=res.text||res.data||'';
    box.innerHTML = text ? `<pre style="white-space:pre-wrap">${esc(text)}</pre>` : '<p>Kein Text erhalten.</p>';
  }
}

// File to base64
async function fileToBase64(file){ const buf=await file.arrayBuffer(); const bin=new Uint8Array(buf); let s=''; for(const b of bin) s+=String.fromCharCode(b); return btoa(s); }

// News
async function showNews(){
  try{ const tab=localStorage.getItem('newsTab')||'security';
    const data=await apiJson('GET', `/api/news/live?category=${encodeURIComponent(tab)}`);
    const items=(data.items||[]).slice(0,12).map(it=>{ const host=(()=>{ try{return new URL(it.url).hostname.replace(/^www\./,'');}catch{return''} })();
      const date=it.published?`<small>· ${it.published.split('T')[0]}</small>`:'';
      return `<li><a href="${it.url}" target="_blank" rel="noopener">${esc(it.title||it.url)}</a> ${host?`<small>· ${host}</small>`:''} ${date}<p>${esc(it.snippet||'')}</p></li>`; }).join('');
    openModal(`<h2>News</h2>
      <div class="filter-chips">
        <button class="ui btn ${tab==='security'?'active':''}" data-news="security">Sicherheit</button>
        <button class="ui btn ${tab==='tips'?'active':''}" data-news="tips">Tipps & Tricks</button>
        <button class="ui btn" id="reload-news">Neu laden</button>
      </div>
      <ul class="news">${items||'<li>Keine Einträge.</li>'}</ul>`);
    $$('#modal [data-news]').forEach(b=>b.addEventListener('click',()=>{ localStorage.setItem('newsTab', b.dataset.news); showNews(); }));
    $('#reload-news').addEventListener('click', showNews);
  }catch(e){ openModal('<h2>News</h2><p>API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.</p>'); }
}

// Gallery
function addToGallery(def, input, res){
  const key='gallery_items';
  const arr=JSON.parse(localStorage.getItem(key)||'[]');
  arr.unshift({ ts:Date.now(), id:def.id, input, res });
  localStorage.setItem(key, JSON.stringify(arr.slice(0,60)));
}
function showGallery(){
  const key='gallery_items';
  const arr=JSON.parse(localStorage.getItem(key)||'[]');
  const items=arr.map((g,i)=>{
    const r=g.res; const type=r.type||'text';
    if(type==='image') return `<figure><img src="${esc(r.url||'')}" alt="Bild ${i+1}"><figcaption>${esc(g.id)}</figcaption></figure>`;
    if(type==='audio') return `<figure><audio controls src="${esc(r.url||'')}"></audio><figcaption>${esc(g.id)}</figcaption></figure>`;
    if(type==='html') return `<figure>${r.html||''}<figcaption>${esc(g.id)}</figcaption></figure>`;
    return `<figure><pre style="white-space:pre-wrap">${esc(r.text||r.data||'')}</pre><figcaption>${esc(g.id)}</figcaption></figure>`;
  }).join('');
  openModal(`<h2>Galerie</h2><div class="masonry">${items||'<p>Noch keine Ergebnisse.</p>'}</div>`);
}

// Prompts modal: listet ALLE Bubbles mit Start-Button
function showPrompts(){
  if(!allDefs.length){ openModal('<h2>Prompts</h2><p>Nutze die interaktiven Bubbles auf der Startseite.</p>'); return; }
  const items = allDefs.map(d=>`<li style="margin:.3rem 0"><strong>${esc(d.title)}</strong> – ${esc(d.desc||'')} <button class="ui btn" data-open="${esc(d.id)}">Start</button></li>`).join('');
  openModal(`<h2>Prompts</h2><ul>${items}</ul>`);
  $$('#modal [data-open]').forEach(b=>b.addEventListener('click',()=>{ const def=allDefs.find(x=>x.id===b.dataset.open); closeModal(); if(def) openBubble(def); }));
}

// Impressum / Projekte / Über
function showProjekte(){
  const html = `<h2>Projekte</h2>
  <p>Mit TÜV‑zertifizierter Sicherheit in die KI‑Zukunft: Der erfolgreiche Einsatz von KI ist keine Raketenwissenschaft – sondern das Ergebnis unabhängiger Prüfung, fundierter Expertise und strukturierter Vorbereitung. Als TÜV‑zertifizierter KI‑Manager begleite ich Ihr Unternehmen dabei, sämtliche Anforderungen des EU AI Acts transparent, nachvollziehbar und rechtssicher umzusetzen.</p>
  <p><a href="https://ki-sicherheit.jetzt/" target="_blank" rel="noopener">ki-sicherheit.jetzt</a></p>`;
  openModal(html);
}
function showImpressum(){
  const html = `<h2>Rechtliches & Transparenz</h2>
  <h3>Impressum</h3>
  <p>Verantwortlich für den Inhalt:<br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin</p>
  <p><a href="mailto:" rel="nofollow">E‑Mail schreiben</a></p>
  <h3>Haftungsausschluss</h3>
  <p>Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>
  <h3>Urheberrecht</h3>
  <p>Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.</p>
  <h3>Hinweis zum EU AI Act</h3>
  <p>Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>
  <h3>Datenschutzerklärung</h3>
  <p>Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.</p>
  <h4>Kontakt mit mir</h4>
  <p>Wenn Sie per Formular oder E‑Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.</p>
  <h4>Cookies</h4>
  <p>Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.</p>
  <h4>Ihre Rechte laut DSGVO</h4>
  <ul>
    <li>Auskunft, Berichtigung oder Löschung Ihrer Daten</li>
    <li>Datenübertragbarkeit</li>
    <li>Widerruf erteilter Einwilligungen</li>
    <li>Beschwerde bei der Datenschutzbehörde</li>
  </ul>`;
  openModal(html);
}
function showAbout(){
  openModal(`<h2>Über hohl.rocks</h2><p>KI‑gestützte Web‑Experience: ruhige Neon‑Bubbles, sofort nutzbare Prompts, relevante DACH/EU‑News. Bedienung: Bubbles anklicken. Shortcuts: N/P/Esc, Einstellungen: S.</p>`);
}

// Navi
$$('[data-action="news"]').forEach(b=>b.addEventListener('click', showNews));
$$('[data-action="prompts"]').forEach(b=>b.addEventListener('click', showPrompts));
$$('[data-action="gallery"]').forEach(b=>b.addEventListener('click', showGallery));
$$('[data-action="projekte"]').forEach(b=>b.addEventListener('click', showProjekte));
$$('[data-action="impressum"]').forEach(b=>b.addEventListener('click', showImpressum));
$$('[data-action="about"]').forEach(b=>b.addEventListener('click', showAbout));
$$('[data-action="klang"]').forEach(b=>b.addEventListener('click', ()=>alert('Klang: Platzhalter')));
$$('[data-action="locale"]').forEach(b=>b.addEventListener('click', ()=>{ const cur=localStorage.getItem('locale')||'de'; localStorage.setItem('locale', cur==='de'?'en':'de'); alert('Locale: '+localStorage.getItem('locale')); }));
$$('[data-action="settings"]').forEach(b=>b.addEventListener('click', ()=>openModal('<h2>Einstellungen</h2><p>Modellwahl folgt dem Server (ENV). Seeds pro Karte unten links.</p>')));

// Init
ensureConsent(); loadBubbles();

})(); 
