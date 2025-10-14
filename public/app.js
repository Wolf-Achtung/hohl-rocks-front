(()=>{
  'use strict';
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const esc=(t)=>{const d=document.createElement('div'); d.textContent=t; return d.innerHTML;}
  const rand=(a,b)=>Math.random()*(b-a)+a;

  // ===== Settings (localStorage) =====
  const DEFAULTS={ maxBubbles:10, spawnEveryMs:1400, verySlowMode:false, huePrimary:207, hueAccent:289, neonStrength:0.7 };
  let SETTINGS = (()=>{ try{ return {...DEFAULTS, ...(JSON.parse(localStorage.getItem('settings')||'{}')) }; }catch{ return {...DEFAULTS}; }})();
  const saveSettings=()=>localStorage.setItem('settings', JSON.stringify(SETTINGS));
  const applyTheme=()=>{
    const r=document.documentElement.style;
    r.setProperty('--hue-primary', String(SETTINGS.huePrimary));
    r.setProperty('--hue-accent', String(SETTINGS.hueAccent));
    r.setProperty('--neon', String(SETTINGS.neonStrength));
  };
  applyTheme();

  // ===== Modal helpers =====
  const modal=$('.modal'); const modalC=$('#modal-content');
  const openModal=(html)=>{ modalC.innerHTML=html; modal.setAttribute('aria-hidden','false'); $('.modal__panel').focus(); }
  const closeModal=()=>modal.setAttribute('aria-hidden','true');
  $('#modal-close').addEventListener('click', closeModal);
  $('.modal').addEventListener('click', (e)=>{ if(e.target.classList.contains('modal')) closeModal(); });
  $('[data-copy="modal"]').addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(modalC.innerText.trim()); alert('Kopiert ✓'); }catch{} });

  // ===== API base detection =====
  async function resolveApiBase(){
    const candidates = ['/_api', (document.querySelector('meta[name="x-api-base"]')||{}).content || '', '/api'].filter(Boolean);
    for(const base of candidates){
      try{
        const ac = new AbortController();
        const tm = setTimeout(()=>ac.abort(), 4000);
        const r = await fetch(`${base}/healthz`, { method:'GET', mode:'cors', cache:'no-store', signal: ac.signal });
        clearTimeout(tm);
        if(r.ok) return base;
      }catch{}
    }
    throw new Error('no_api_base');
  }
  async function apiJson(path){
    const base = await resolveApiBase();
    const r = await fetch(`${base}${path}`, { mode:'cors', cache:'no-store' });
    if(!r.ok) throw new Error(`api_${r.status}`);
    return await r.json();
  }

  // ===== Video attach (choose best source, respect Save-Data) =====
  (async function attachVideo(){
    try{
      const video = $('#bg-video');
      const saveData = (navigator.connection && navigator.connection.saveData) ? true : false;
      const sources = saveData
        ? ['/videos/road_540p_bg.webm','/videos/road_540p_bg.mp4','/videos/road.mp4']
        : ['/videos/road_720p_bg.webm','/videos/road_720p_bg.mp4','/videos/road.mp4','/videos/road_540p_bg.webm'];
      async function headOk(url){ try{ const r = await fetch(url, { method:'HEAD', cache:'no-store' }); return r.ok; } catch { return false; }}
      let chosen=''; for(const s of sources){ if(await headOk(s)){ chosen=s; break; } }
      if(!chosen) return;
      const type = chosen.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      video.innerHTML = `<source src="${chosen}" type="${type}">`;
      video.load(); video.play().catch(()=>{});
      video.classList.add('visible');
    }catch{}
  })();

  // ===== Data =====
  let PROMPTS=[], BUBBLES=[];
  const getPrompts=async()=>{ if(PROMPTS.length) return PROMPTS; try{ const r=await fetch('/prompts.json',{cache:'no-store'}); PROMPTS = r.ok? await r.json():[]; }catch{ PROMPTS=[]; } return PROMPTS; };
  const getBubbles=async()=>{ if(BUBBLES.length) return BUBBLES; try{ const r=await fetch('/bubbles.json',{cache:'no-store'}); BUBBLES = r.ok? await r.json():[]; }catch{ BUBBLES=[]; } return BUBBLES; };

  // ===== Bubble field (Canvas optional) =====
  let canvas=null, ctx=null, labels=null, running=false, rafId=0, spawnTimer=0, liteMode=false, bubbles=[];
  class Bubble{
    constructor(x,y,r,c,label){ this.x=x; this.y=y; this.r=r; this.c=c; this.label=label; this.vx=(Math.random()-.5)*.22; this.vy=(Math.random()-.5)*.22; }
    tick(W,H){ this.x+=this.vx; this.y+=this.vy; if(this.x<this.r||this.x>W-this.r) this.vx*=-1; if(this.y<this.r+80||this.y>H-this.r) this.vy*=-1; }
  }
  function resize(){
    if(!canvas || liteMode) return;
    const dpr=Math.min(2, window.devicePixelRatio||1);
    canvas.width = Math.floor(window.innerWidth*dpr);
    canvas.height= Math.floor(window.innerHeight*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function spawn(){
    if(bubbles.length>=SETTINGS.maxBubbles) return;
    const sizes=[26,30,34,38,46,60,70], r=sizes[Math.floor(Math.random()*sizes.length)];
    const W=window.innerWidth,H=window.innerHeight;
    let x=rand(r, W-r), y=rand(Math.max(80,r), H-r);
    // simple de-overlap
    let ok=true; for(const b of bubbles){ const dx=b.x-x, dy=b.y-y; if(Math.hypot(dx,dy)<(b.r*0.9+r*0.9)){ ok=false; break; } }
    if(!ok) return; // skip; next spawn will try again
    const color=`rgba(${[175,205,255,0.28]})`;
    const label=((Math.random()<.5?PROMPTS:BUBBLES).find(Boolean)||{title:'Thema'}).title||'Thema';
    const b=new Bubble(x,y,r,color,label); bubbles.push(b);
    const badge=document.createElement('button');
    badge.className='bubble-label'; badge.type='button'; badge.textContent=label;
    badge.style.left=x+'px'; badge.style.top=y+'px';
    badge.addEventListener('click', ()=>{
      const p=(PROMPTS.find(p=>p.title===label) || BUBBLES.find(p=>p.title===label));
      openModal(`<h2>${esc(label)}</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(p?.content||p?.desc||'Kein Prompttext hinterlegt.')}</pre>`);
    });
    labels.appendChild(badge);
  }
  function tick(t){
    if(!running) return;
    const W=window.innerWidth,H=window.innerHeight;
    if(!liteMode){
      ctx.clearRect(0,0,W,H);
      ctx.globalCompositeOperation='screen';
      for(const b of bubbles){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle=b.c; ctx.fill(); }
    }
    for(const b of bubbles) b.tick(W,H);
    rafId=requestAnimationFrame(tick);
  }
  function start(){
    running=true;
    if(!liteMode){ resize(); rafId=requestAnimationFrame(tick); }
    clearInterval(spawnTimer);
    spawnTimer=setInterval(spawn, SETTINGS.spawnEveryMs*(SETTINGS.verySlowMode?1.6:1));
  }
  function stop(){ running=false; cancelAnimationFrame(rafId); clearInterval(spawnTimer); }

  // Performance guard: auto‑lite if FPS < 45 for 2s or Save‑Data/low cores
  (function guard(){
    const saveData = (navigator.connection && navigator.connection.saveData);
    const lowCores = (navigator.hardwareConcurrency||8) <= 4;
    if(saveData || lowCores) { document.body.classList.add('lite'); liteMode=true; }
    else {
      let frames=0, start=performance.now();
      function probe(){ frames++; const now=performance.now(); if(now-start>2000){ const fps=frames/2; if(fps<45){ document.body.classList.add('lite'); liteMode=true; } } else { requestAnimationFrame(probe); } }
      requestAnimationFrame(probe);
    }
  })();

  // Init field
  (async ()=>{
    PROMPTS = await getPrompts(); BUBBLES = await getBubbles();
    canvas = $('#bubbles'); labels = $('#labels');
    if(liteMode){ canvas.style.display='none'; } else { ctx = canvas.getContext('2d', { alpha:true }); window.addEventListener('resize', resize); }
    start();
  })();

  // ===== Actions =====
  async function showNews(){
    try{
      const base = await resolveApiBase();
      const region = localStorage.getItem('newsRegion') || 'all';
      const j = await apiJson(`/api/news/live?region=${encodeURIComponent(region)}`);
      const items = (j.items||[]).slice(0,12).map(it=>{
        const host = (()=>{ try{ return new URL(it.url).hostname.replace(/^www\./,''); }catch{return''} })();
        const date = it.published ? `<small>· ${it.published.split('T')[0]}</small>` : '';
        return `<li><a href="${it.url}" target="_blank" rel="noopener">${esc(it.title||it.url)}</a> ${host?`<small>· ${host}</small>`:''} ${date}<p>${esc(it.snippet||'')}</p></li>`;
      }).join('');
      openModal(`<h2>News</h2>
        <p class="muted">Quelle: ${esc(base)}</p>
        <div class="filter-chips">
          <button class="ui btn ${region==='all'?'active':''}" data-r="all">ALLE</button>
          <button class="ui btn ${region==='dach'?'active':''}" data-r="dach">DACH</button>
          <button class="ui btn ${region==='eu'?'active':''}" data-r="eu">EU</button>
          <button class="ui btn" id="reload-news">Neu laden</button>
        </div>
        <ul class="news">${items || '<li>Keine Einträge.</li>'}</ul>`);
      $$('#modal [data-r]').forEach(btn=>btn.addEventListener('click',()=>{ localStorage.setItem('newsRegion', btn.dataset.r); showNews(); }));
      $('#reload-news').addEventListener('click', showNews);
    }catch(e){
      openModal(`<h2>News</h2><p>API derzeit nicht erreichbar. Prüfe Proxy (/_api) oder x-api-base im <code>&lt;head&gt;</code>.</p>`);
    }
  }

  function showPrompts(){
    const groups = PROMPTS.reduce((acc,p)=>{ const k=(p.category||'Allgemein').trim(); (acc[k]=acc[k]||[]).push(p); return acc; },{});
    const html = Object.keys(groups).sort().map(k=>`
      <details ${k==='Allgemein'?'open':''}><summary><strong>${esc(k)}</strong></summary>
        <ul>${groups[k].map(p=>`<li><button class="ui btn" data-pid="${esc(p.title)}">${esc(p.title)}</button></li>`).join('')}</ul>
      </details>`).join('');
    openModal(`<h2>Prompts</h2>${html}`);
    $$('#modal [data-pid]').forEach(btn=>btn.addEventListener('click',()=>{
      const p = PROMPTS.find(x=>x.title===btn.dataset.pid); if(p) openModal(`<h2>${esc(p.title)}</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(p.content||'')}</pre>`);
    }));
  }
  function showProjekte(){
    const html = (BUBBLES||[]).map(b=>`<li><strong>${esc(b.title)}</strong><br><small>${esc(b.desc||'')}</small></li>`).join('');
    openModal(`<h2>Projekte</h2><ul>${html}</ul>`);
  }
  function showImpressum(){ openModal('<h2>Impressum</h2><p>Bitte hinterlegen.</p>'); }
  function settings(){
    openModal(`<h2>Einstellungen</h2>
      <p><label>Max. Bubbles <input id="s-max" type="range" min="4" max="20" step="1" value="${SETTINGS.maxBubbles}"></label></p>
      <p><label>Spawn (ms) <input id="s-spawn" type="range" min="600" max="3000" step="100" value="${SETTINGS.spawnEveryMs}"></label></p>
      <p><label>Sehr langsamer Modus <input id="s-vslow" type="checkbox" ${SETTINGS.verySlowMode?'checked':''}></label></p>
      <p><label>Primär‑Hue <input id="s-huep" type="range" min="160" max="240" step="1" value="${SETTINGS.huePrimary}"></label></p>
      <p><label>Akzent‑Hue <input id="s-huea" type="range" min="270" max="320" step="1" value="${SETTINGS.hueAccent}"></label></p>
      <p><label>Neon‑Intensität <input id="s-neon" type="range" min="0" max="1" step="0.05" value="${SETTINGS.neonStrength}"></label></p>`);
    $('#s-max').addEventListener('input', e=>{ SETTINGS.maxBubbles=Number(e.target.value); saveSettings(); });
    $('#s-spawn').addEventListener('input', e=>{ SETTINGS.spawnEveryMs=Number(e.target.value); saveSettings(); });
    $('#s-vslow').addEventListener('change', e=>{ SETTINGS.verySlowMode=!!e.target.checked; saveSettings(); });
    $('#s-huep').addEventListener('input', e=>{ SETTINGS.huePrimary=Number(e.target.value); saveSettings(); applyTheme(); });
    $('#s-huea').addEventListener('input', e=>{ SETTINGS.hueAccent=Number(e.target.value); saveSettings(); applyTheme(); });
    $('#s-neon').addEventListener('input', e=>{ SETTINGS.neonStrength=Number(e.target.value); saveSettings(); applyTheme(); });
  }

  // Wire actions
  $$('[data-action="news"]').forEach(b=>b.addEventListener('click', showNews));
  $$('[data-action="prompts"]').forEach(b=>b.addEventListener('click', showPrompts));
  $$('[data-action="projekte"]').forEach(b=>b.addEventListener('click', showProjekte));
  $$('[data-action="impressum"]').forEach(b=>b.addEventListener('click', showImpressum));
  $$('[data-action="klang"]').forEach(b=>b.addEventListener('click', ()=>alert('Klang: Platzhalter')));
  $$('[data-action="locale"]').forEach(b=>b.addEventListener('click', ()=>{ const cur=localStorage.getItem('locale')||'de'; localStorage.setItem('locale', cur==='de'?'en':'de'); alert('Locale: '+localStorage.getItem('locale')); }));
  $$('[data-action="settings"]').forEach(b=>b.addEventListener('click', settings));
})();
