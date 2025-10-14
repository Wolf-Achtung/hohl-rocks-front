(()=>{
  'use strict';
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const esc=(t)=>{const d=document.createElement('div'); d.textContent=t; return d.innerHTML;};

  // ===== Modal helpers =====
  const modal=$('#modal'); const modalC=$('#modal-content');
  const openModal=(html)=>{ modalC.innerHTML=html; modal.setAttribute('aria-hidden','false'); $('.modal__panel', modal).focus(); }
  const closeModal=()=>modal.setAttribute('aria-hidden','true');
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal')) closeModal(); });
  $('[data-copy="modal"]').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText($('#modal-content').innerText.trim()); alert('Kopiert ✓'); }catch{} });

  // ===== Consent (DSGVO) =====
  const consent=$('#consent');
  function ensureConsent(){
    if(localStorage.getItem('consent')==='true') return;
    consent.setAttribute('aria-hidden','false'); $('.modal__panel', consent).focus();
    $('#consent-accept').onclick=()=>{ localStorage.setItem('consent','true'); consent.setAttribute('aria-hidden','true'); };
    $('#consent-decline').onclick=()=>{ alert('Ohne Einwilligung keine KI-Aufrufe.'); };
  }

  // ===== API base detection =====
  async function resolveApiBase(){
    const candidates=['/_api', (document.querySelector('meta[name="x-api-base"]')||{}).content || '', '/api'].filter(Boolean);
    for(const base of candidates){
      try{
        const ac=new AbortController(); const tm=setTimeout(()=>ac.abort(), 4000);
        const r=await fetch(`${base}/healthz`, {method:'GET',mode:'cors',cache:'no-store',signal:ac.signal});
        clearTimeout(tm); if(r.ok) return base;
      }catch{}
    } throw new Error('no_api_base');
  }
  async function apiJson(method, path, body){
    const base=await resolveApiBase();
    const opt={ method, mode:'cors', cache:'no-store', headers:{'Content-Type':'application/json'} };
    if(body) opt.body=JSON.stringify(body);
    const r=await fetch(`${base}${path}`, opt);
    if(!r.ok) throw new Error(`api_${r.status}`);
    return await r.json();
  }

  // ===== Video attach =====
  (async ()=>{
    try{
      const video=$('#bg-video');
      const saveData = (navigator.connection && navigator.connection.saveData) ? true : false;
      const sources = saveData
        ? ['/videos/road_540p_bg.webm','/videos/road_540p_bg.mp4','/videos/road.mp4']
        : ['/videos/road_720p_bg.webm','/videos/road_720p_bg.mp4','/videos/road.mp4','/videos/road_540p_bg.webm'];
      async function headOk(url){ try{ const r=await fetch(url,{method:'HEAD',cache:'no-store'}); return r.ok; }catch{return false;} }
      let chosen=''; for(const s of sources){ if(await headOk(s)){ chosen=s; break; } }
      if(!chosen) return; const type=chosen.endsWith('.webm')?'video/webm':'video/mp4';
      video.innerHTML=`<source src="${chosen}" type="${type}">`; video.load(); video.play().catch(()=>{}); video.classList.add('visible');
    }catch{}
  })();

  // ===== Bubbles (interactive cards) =====
  async function loadBubbles(){
    try{
      const r=await fetch('/bubbles.json',{cache:'no-store'});
      const list = r.ok ? await r.json() : [];
      const grid=$('#bubble-grid');
      grid.innerHTML = list.map(b => `
        <article class="card" data-id="${esc(b.id)}">
          <header class="card__header">
            <span class="card__dot"></span><h3 class="card__title">${esc(b.title)}</h3>
          </header>
          <div class="card__body">${esc(b.desc||'')}</div>
          <footer class="card__cta"><button class="card__btn" data-run="${esc(b.id)}">Start</button></footer>
        </article>`).join('');
      $$('#bubble-grid [data-run]').forEach(btn => btn.addEventListener('click', ()=>openBubble(list.find(x=>x.id===btn.dataset.run))));
    }catch(e){ console.error('bubbles.json fehlte', e); }
  }

  function formHtml(fields){
    return fields.map(f=>{
      if(f.type==='file') return `<div class="form-row"><label>${esc(f.label)}</label><input type="file" name="${esc(f.name)}" ${f.accept?`accept="${esc(f.accept)}"`:''}></div>`;
      if(f.type==='textarea') return `<div class="form-row"><label>${esc(f.label)}</label><textarea name="${esc(f.name)}" placeholder="${esc(f.placeholder||'')}"></textarea></div>`;
      const t=f.type||'text';
      return `<div class="form-row"><label>${esc(f.label)}</label><input type="${esc(t)}" name="${esc(f.name)}" placeholder="${esc(f.placeholder||'')}"></div>`;
    }).join('');
  }

  function openBubble(def){
    if(!def) return;
    if(localStorage.getItem('consent')!=='true'){ ensureConsent(); return; }
    const last = JSON.parse(localStorage.getItem('bubble_'+def.id+'_lastInput')||'{}');
    const fields = (def.fields||[]).map(f => ({...f, value:last[f.name]||''}));
    openModal(`
      <h2>${esc(def.title)}</h2>
      <form id="bubble-form">
        ${formHtml(fields)}
        <div class="form-row" style="justify-content:flex-end">
          <button class="ui btn" type="submit">Generieren</button>
        </div>
      </form>
      <div class="result" id="bubble-result"></div>
    `);
    const form = $('#bubble-form');
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const out = {}; const fd = new FormData(form);
      const files = {};
      for(const f of def.fields||[]){
        if(f.type==='file'){ const file = fd.get(f.name); if(file && file.size>0){ files[f.name]=await fileToBase64(file); } }
        else { out[f.name] = fd.get(f.name); }
      }
      localStorage.setItem('bubble_'+def.id+'_lastInput', JSON.stringify(out));
      $('#bubble-result').innerHTML = '<p>⏳ Erzeuge Ergebnis…</p>';
      try{
        const payload = { input: out, files };
        const res = await apiJson('POST', `/api/bubble/${encodeURIComponent(def.id)}`, payload);
        renderResult(def, res);
        localStorage.setItem('bubble_'+def.id+'_lastOutput', JSON.stringify(res));
      }catch(e){
        $('#bubble-result').innerHTML = `<p>Fehler: ${esc(String(e.message||e))}</p>`;
      }
    });
  }

  function renderResult(def, res){
    const box = $('#bubble-result');
    const type = res.type || def.output || 'text';
    if(type==='image'){
      const url = res.url || res.data || '';
      box.innerHTML = url ? `<img src="${esc(url)}" alt="KI‑Bild">` : '<p>Kein Bild erhalten.</p>';
    } else if(type==='audio'){
      const url = res.url || res.data || '';
      box.innerHTML = url ? `<audio controls src="${esc(url)}"></audio>` : '<p>Kein Audio erhalten.</p>';
    } else if(type==='html'){
      box.innerHTML = res.html || res.data || '<p>Kein HTML‑Ergebnis.</p>';
    } else {
      const text = res.text || res.data || '';
      box.innerHTML = text ? `<pre style="white-space:pre-wrap">${esc(text)}</pre>` : '<p>Kein Text erhalten.</p>';
    }
  }

  async function fileToBase64(file){
    const buf = await file.arrayBuffer();
    const bin = new Uint8Array(buf);
    let s=''; for(const b of bin) s+=String.fromCharCode(b);
    return btoa(s);
  }

  // ===== News (Sicherheit & Tipps, nur DE) =====
  async function showNews(){
    try{
      const base = await resolveApiBase();
      const tab = localStorage.getItem('newsTab') || 'security';
      const data = await apiJson('GET', `/api/news/live?category=${encodeURIComponent(tab)}`);
      const items = (data.items||[]).slice(0,12).map(it=>{
        const host = (()=>{ try{ return new URL(it.url).hostname.replace(/^www\./,''); }catch{return''} })();
        const date = it.published ? `<small>· ${it.published.split('T')[0]}</small>` : '';
        return `<li><a href="${it.url}" target="_blank" rel="noopener">${esc(it.title||it.url)}</a> ${host?`<small>· ${host}</small>`:''} ${date}<p>${esc(it.snippet||'')}</p></li>`;
      }).join('');
      openModal(`<h2>News</h2>
        <div class="filter-chips">
          <button class="ui btn ${tab==='security'?'active':''}" data-news="security">Sicherheit</button>
          <button class="ui btn ${tab==='tips'?'active':''}" data-news="tips">Tipps & Tricks</button>
          <button class="ui btn" id="reload-news">Neu laden</button>
        </div>
        <ul class="news">${items || '<li>Keine Einträge.</li>'}</ul>`);
      $$('#modal [data-news]').forEach(b=>b.addEventListener('click',()=>{ localStorage.setItem('newsTab', b.dataset.news); showNews(); }));
      $('#reload-news').addEventListener('click', showNews);
    }catch(e){
      openModal('<h2>News</h2><p>API nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base.</p>');
    }
  }

  // ===== Navi-Actions =====
  $$('[data-action="news"]').forEach(b=>b.addEventListener('click', showNews));
  $$('[data-action="prompts"]').forEach(b=>b.addEventListener('click', ()=>openModal('<h2>Prompts</h2><p>Nutze die interaktiven Bubbles auf der Startseite.</p>')));
  $$('[data-action="projekte"]').forEach(b=>b.addEventListener('click', ()=>openModal('<h2>Projekte</h2><p>In Arbeit …</p>')));
  $$('[data-action="impressum"]').forEach(b=>b.addEventListener('click', ()=>openModal('<h2>Impressum</h2><p>Bitte hinterlegen.</p>')));
  $$('[data-action="klang"]').forEach(b=>b.addEventListener('click', ()=>alert('Klang: Platzhalter')));
  $$('[data-action="locale"]').forEach(b=>b.addEventListener('click', ()=>{ const cur=localStorage.getItem('locale')||'de'; localStorage.setItem('locale', cur==='de'?'en':'de'); alert('Locale: '+localStorage.getItem('locale')); }));
  $$('[data-action="settings"]').forEach(b=>b.addEventListener('click', ()=>openModal('<h2>Einstellungen</h2><p>Noch nichts hier – die Bubbles sind schon schnell.</p>')));

  // ===== Init =====
  ensureConsent();
  loadBubbles();
})();
