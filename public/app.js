(()=>{
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const META_API=(document.querySelector('meta[name="x-api-base"]')||{}).content||'';
  const API_CANDIDATES=['/_api', META_API.replace(/\/$/, '')].filter(Boolean).concat(['/api']);
  function joinBase(base,path){ const b=base.replace(/\/$/,''); if(b.endsWith('/api')&&path.startsWith('/api')) return b+path.slice(4); return b+path; }
  async function tryHealth(base){ const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),3500);
    try{ const r=await fetch(joinBase(base,'/healthz'),{mode:'cors',cache:'no-store',signal:ctrl.signal}); return r.ok; }catch{return false}finally{clearTimeout(t)} }
  let apiBaseWorking=localStorage.getItem('apiBaseWorking')||'';
  async function resolveApiBase(){ const c=apiBaseWorking?[apiBaseWorking].concat(API_CANDIDATES):API_CANDIDATES;
    for(const b of c){ if(!b) continue; if(await tryHealth(b)){ localStorage.setItem('apiBaseWorking',b); return b; } } throw new Error('no_api'); }
  async function apiFetch(p){ const b=await resolveApiBase(); const r=await fetch(joinBase(b,p),{mode:'cors',cache:'no-store'}); if(!r.ok) throw new Error('api_'+r.status); return await r.json(); }

  // Video optional
  (async()=>{ try{ const head=await fetch('/videos/road.mp4',{method:'HEAD'}); if(head.ok){ const v=$('#bg-video'); v.innerHTML='<source src="/videos/road.mp4" type="video/mp4">'; v.load(); v.play().catch(()=>{}); v.classList.add('visible'); } }catch{} })();

  // Modal
  const modal=$('#modal'), panel=$('.modal__panel'), content=$('#modal-content'), closeBtn=$('#modal-close'); let lastF=null;
  function openModal(html){ lastF=document.activeElement; content.innerHTML=html; modal.setAttribute('aria-hidden','false'); panel.focus(); }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); content.innerHTML=''; if(lastF && document.contains(lastF)) lastF.focus(); lastF=null; }
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); }); closeBtn.addEventListener('click',closeModal);
  window.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
  $('[data-copy="modal"]').addEventListener('click',async()=>{ try{ await navigator.clipboard.writeText($('#modal-content').innerText) }catch{} });

  // Prompts
  const BIZ=[
    {t:'1‑Minute‑Briefing',b:'Du bist Chief of Staff. Fasse folgendes in 1 Minute zusammen: Ziel, 3 Kernfakten, 1 Risiko, Entscheidung für heute. Text: <EINFÜGEN>.'},
    {t:'Meeting‑Design',b:'Entwirf eine 30‑Minuten‑Agenda (Ziel, Vorbereitung, 3 Blöcke, Entscheidung, Nachlauf). Kontext: <EINFÜGEN>.'},
    {t:'Pitch‑Storyboard',b:'Erstelle ein 7‑Folien‑Storyboard (Hook, Problem, Lösung, Beweis, Nutzen, Plan, CTA). Produkt/Idee: <EINFÜGEN>.'},
    {t:'Brainstorm‑Sprint',b:'Leite einen 15‑Minuten‑Sprint: 3 Perspektiven, 10 Ideen, 3 Cluster, 1 Test. Thema: <EINFÜGEN>.'},
    {t:'Kontrast‑Paar',b:'Gib mir Lösung A konservativ vs. B radikal – jeweils mit 3 Kriterien: Zeit, Risiko, Wirkung. Thema: <EINFÜGEN>.'},
    {t:'Stakeholder‑Map',b:'Erstelle eine Map (Treiber, Blocker, Influencer, Nutzer). Für jeden: Motiv, Nutzwert, Win.'},
    {t:'Risiko‑PreMortem',b:'Tu so, als sei das Projekt gescheitert. Liste die 7 Gründe, Frühwarnsignale und Gegenmaßnahmen.'},
    {t:'Email‑Rewrite (klar)',b:'Schreibe diese Mail kürzer, präziser, freundlich‑klar. 3 Bullet‑Entscheidungen zuerst. Text: <EINFÜGEN>.'},
    {t:'Kundeninterview‑Leitfaden',b:'Baue 10 Fragen: Problemtiefe, Alternativen, Kaufkriterien, Budget, Nächste Schritte. Produkt: <EINFÜGEN>.'},
    {t:'Value Proposition',b:'Formuliere eine präzise Value Prop (Zielgruppe, Schmerz, Nutzen, Beweis). Produkt: <EINFÜGEN>.'},
    {t:'Landing‑Page‑Copy',b:'Schreibe Headline, Subline, 3 Nutzen, 1 Beweis, CTA. Ton: seriös‑optimistisch. Produkt: <EINFÜGEN>.'},
    {t:'Change‑Memo (1‑Pager)',b:'Erstelle ein 1‑Pager‑Memo: Warum jetzt? Was ändert sich? Was bleibt? 30‑Tage‑Plan.'},
    {t:'Entscheidungsmatrix',b:'Baue eine 2×2 oder gewichtete Matrix. Kriterien & Gewichte vorschlagen, dann Entscheidung.'},
    {t:'Roadmap‑Quartal',b:'Skizziere eine Q‑Roadmap: 3 Ziele, 6 Initiativen, Meilensteine, Risiken, KPIs.'},
    {t:'Post‑Mortem (konstruktiv)',b:'Schreibe ein blameless Post‑Mortem mit Ursachen, Learnings, 3 Prozess‑Fixes.'}
  ];
  const FUN=[
    {t:'Zeitreise‑Tagebuch',b:'Du bist ein Zeitreise‑Editor...'},
    {t:'Rückwärts‑Zivilisation',b:'Beschreibe eine Zivilisation...'},
    {t:'Bewusstsein eines Gebäudes',b:'Erzähle aus der Perspektive...'},
    {t:'KI‑Philosophie‑Mentor',b:'Du bist ein altgriechischer Philosoph...'},
    {t:'Interdimensionaler Marktplatz',b:'Ich bin Besucher...'},
    {t:'Geheimes Leben eines NPCs',b:'Du bist ein NPC...'},
    {t:'Prompt‑Archäologe',b:'Analysiere einen Prompt...'},
    {t:'KI‑Träume',b:'Simuliere Träume einer KI...'},
    {t:'Recursive Story',b:'Geschichte über einen Autor...'},
    {t:'Xenobiologe 2157',b:'Stelle drei Lebensformen...'},
    {t:'Quantentagebuch',b:'Tagebuch eines Teilchens...'},
    {t:'Rückwärts‑Apokalypse',b:'Die Welt wird immer perfekter...'},
    {t:'Farbsynästhetiker',b:'Wandle Musik...'},
    {t:'Museum verlorener Träume',b:'Du bist Kurator...'},
    {t:'Zeitlupen‑Explosion',b:'Beschreibe eine Explosion...'}
  ];
  function esc(s){return s.replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function openPrompt(p){ openModal(`<h2>${p.t}</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(p.b)}</pre>`); }
  function showPrompts(cat='business'){ const set=cat==='business'?BIZ:FUN;
    const items=set.map(p=>`<li><button class="ui btn" data-p="${p.t}">${p.t}</button></li>`).join('');
    openModal(`<h2>Prompts</h2>
      <div class="tabs"><button class="ui btn ${cat==='business'?'active':''}" data-tab="business">Büro‑Tauglich (15)</button>
      <button class="ui btn ${cat==='creative'?'active':''}" data-tab="creative">Kreativ‑Eye‑Candy (15)</button></div>
      <ul class="news">${items}</ul>`);
    $('#modal').querySelectorAll('[data-p]').forEach(b=>{ const p=set.find(x=>x.t===b.getAttribute('data-p')); b.addEventListener('click',()=>openPrompt(p)); });
    $('#modal').querySelectorAll('[data-tab]').forEach(t=>t.addEventListener('click',()=>showPrompts(t.getAttribute('data-tab'))));
  }

  async function showNews(){
    let used='';
    try{
      used=await resolveApiBase();
      const data=await apiFetch('/api/news/live?region='+(localStorage.getItem('newsRegion')||'all'));
      const items=(data.items||[]).slice(0,12);
      const list=items.map(it=>`<li><a href="${it.url}" target="_blank" rel="noopener">${esc(it.title||it.url)}</a></li>`).join('');
      const chip=(v,l)=>`<button class="ui btn ${localStorage.getItem('newsRegion')===v?'active':''}" data-region="${v}">${l}</button>`;
      openModal(`<h2>EU AI Act & DACH-News</h2>
        <div class="tabs"><span class="ui btn ghost">API: ${esc(used)}</span>
        <a class="ui btn" href="${joinBase(used,'/healthz')}" target="_blank" rel="noopener">Health</a></div>
        <div class="filter-chips">${chip('all','Alle')}${chip('dach','DACH')}${chip('eu','EU')}</div>
        <ul class="news">${list || '<li>Keine Einträge (API/Key?)</li>'}</ul>`);
      $('#modal').querySelectorAll('[data-region]').forEach(el=>el.addEventListener('click',()=>{ localStorage.setItem('newsRegion', el.getAttribute('data-region')); showNews(); }));
    }catch(e){
      const links=API_CANDIDATES.map(b=>`<li><a class="ui btn" target="_blank" rel="noopener" href="${joinBase(b,'/healthz')}">${joinBase(b,'/healthz')}</a></li>`).join('');
      openModal(`<h2>News</h2><p>API derzeit nicht erreichbar. Kandidaten:</p><ul class="news">${links}</ul>`);
    }
  }

  function showProjekte(){ openModal(`<h2>Projekte</h2><p><strong>Mit TÜV-zertifizierter Sicherheit in die KI-Zukunft:</strong> Der erfolgreiche Einsatz von KI ist keine Raketenwissenschaft – sondern das Ergebnis unabhängiger Prüfung, fundierter Expertise und strukturierter Vorbereitung.</p><p>Als TÜV-zertifizierter KI-Manager begleite ich Ihr Unternehmen dabei, sämtliche Anforderungen des EU AI Acts transparent, nachvollziehbar und rechtssicher umzusetzen.</p><p><a class="ui btn" href="https://ki-sicherheit.jetzt/" target="_blank" rel="noopener">ki-sicherheit.jetzt</a></p>`); }
  function showImpressum(){ openModal(`<h2>Rechtliches & Transparenz</h2><p><strong>Verantwortlich:</strong> Wolf Hohl, Greifswalder Str. 224a, 10405 Berlin · <a href="mailto:info@hohl.rocks">info@hohl.rocks</a></p><p><strong>Haftung:</strong> Keine Haftung für externe Links.</p><p><strong>Urheberrecht:</strong> Inhalte unterliegen deutschem Urheberrecht; Bilder mit Midjourney erzeugt.</p><p><strong>EU AI Act:</strong> Hinweise ersetzen keine Rechtsberatung.</p><p><strong>DSGVO:</strong> Keine Tracking-Cookies. Kontaktanfragen werden 6 Monate aufbewahrt.</p>`); }
  function openSettings(){ openModal(`<h2>Einstellungen</h2><p>Hier können später Pads, Farben, very-slow-mode etc. justiert werden.</p>`); }

  $('.site-nav').addEventListener('click',e=>{ const b=e.target.closest('[data-action]'); if(!b) return;
    const a=b.dataset.action; if(a==='news') return showNews(); if(a==='prompts') return showPrompts('business'); if(a==='projekte') return showProjekte(); if(a==='impressum') return showImpressum(); if(a==='settings') return openSettings(); });

  // Bubbles
  const cfg={ max:22, spawn:4200, speed:.7, sizes:[160,240,320,420,560] };
  class Bubble{ constructor(x,y,r,h){ this.x=x;this.y=y;this.r=r;this.h=h;this.a=0; const a=Math.random()*Math.PI*2,s=.12+Math.random()*.22; this.vx=Math.cos(a)*s; this.vy=Math.sin(a)*s*.6; this.osc=Math.random()*Math.PI*2; this.oscS=.003+Math.random()*.003; this.ttl=26000+Math.random()*18000; this.t0=performance.now(); this.el=null; } alive(t){return t-this.t0<this.ttl} p(t){return Math.min(1,(t-this.t0)/this.ttl)} }
  const canvas=$('#bubbles'), ctx=canvas.getContext('2d'), layer=$('#labels'); let bubbles=[];
  function resize(){ const dpr=Math.min(2,window.devicePixelRatio||1); canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  window.addEventListener('resize',resize); resize();
  function neonHue(){ return Math.random()<.6 ? 200+Math.floor(Math.random()*40-20) : 320+Math.floor(Math.random()*50-25); }
  function spawn(){ if(bubbles.length>=cfg.max) return; const r=cfg.sizes[Math.floor(Math.random()*cfg.sizes.length)]; const x=r+Math.random()*(innerWidth-2*r), y=Math.max(80,r)+Math.random()*(innerHeight-r-80); const b=new Bubble(x,y,r,neonHue()); bubbles.push(b); const el=document.createElement('button'); el.className='bubble-label'; el.type='button'; el.textContent=['Recursive Story','Museum verlorener Träume','Vintage‑Futurist','Emotions‑Alchemist','Rückwärts‑Apokalypse','Change‑Memo (1‑Pager)','Roadmap‑Quartal','Pitch‑Storyboard','Entscheidungsmatrix'][Math.floor(Math.random()*9)]; el.style.left=`${x}px`;el.style.top=`${y}px`; el.addEventListener('click',()=>openModal(`<h2>${el.textContent}</h2><p>Kurze Beschreibung…</p>`)); layer.appendChild(el); b.el=el; }
  function tick(t){ ctx.clearRect(0,0,canvas.width,canvas.height); const alive=[]; for(const b of bubbles){ if(!b.alive(t)){ b.el&&b.el.remove(); continue; } const p=b.p(t); b.a=p<.12?p/.12:(p>.88?(1-p)/.12:1); b.osc+=b.oscS; b.x+=b.vx+Math.cos(b.osc)*.08; b.y+=b.vy+Math.sin(b.osc*.7)*.05; const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r); g.addColorStop(0,`hsla(${b.h},100%,65%,${.6*b.a})`); g.addColorStop(.6,`hsla(${b.h},100%,50%,${.3*b.a})`); g.addColorStop(1,`hsla(${b.h},100%,35%,0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); if(b.el){ b.el.style.left=`${b.x}px`; b.el.style.top=`${b.y}px`; b.el.style.opacity=String(Math.max(0,Math.min(1,b.a))); } alive.push(b); } bubbles=alive; requestAnimationFrame(tick); }
  setInterval(spawn, cfg.spawn); spawn(); requestAnimationFrame(tick);
})();
