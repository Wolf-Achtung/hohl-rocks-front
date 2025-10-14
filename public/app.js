(() => {
  'use strict';

  // Utilities
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, cb, opts) => el.addEventListener(ev, cb, opts);
  const qs = (name) => new URLSearchParams(location.search).get(name);

  const apiBase = (() => {
    const meta = document.querySelector('meta[name="x-api-base"]');
    const v = meta?.getAttribute('content')?.trim();
    return v || '/api';
  })();

  const state = {
    prompts: null,
    bubbles: null
  };

  // Respect reduced motion
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videoEl = $('#bg-video');
  const applyMotionPref = () => {
    if (!videoEl) return;
    if (prefersReduce.matches) {
      videoEl.pause();
      videoEl.style.display = 'none';
      document.body.classList.add('no-motion');
    } else {
      videoEl.style.display = '';
      videoEl.play?.();
      document.body.classList.remove('no-motion');
    }
  };
  applyMotionPref();
  prefersReduce.addEventListener?.('change', applyMotionPref);

  // Modal
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalContent = $('#modal-content');
  const closeModal = () => { modal.setAttribute('aria-hidden', 'true'); modal.classList.remove('is-open'); };
  const openModal = (title, html) => {
    modalTitle.textContent = title || 'Details';
    modalContent.innerHTML = html || '';
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    $('#modal-close')?.focus();
  };
  on($('#modal-close'), 'click', closeModal);
  on($('#modal-close-2'), 'click', closeModal);
  on(modal, 'click', (e) => { if (e.target === modal) closeModal(); });
  $$('[data-copy="modal"]').forEach(btn => on(btn,'click', async () => {
    try { await navigator.clipboard.writeText(modalContent.innerText.trim()); btn.textContent='Kopiert ✓'; setTimeout(()=>btn.textContent='Kopieren',1100); } catch {}
  }));

  // Fetch helpers
  async function getJSON(url, init) {
    const r = await fetch(url, { headers:{'Accept':'application/json'}, ...init });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.json();
  }

  async function loadPrompts() {
    if (state.prompts) return state.prompts;
    try { const data = await getJSON('/prompts.json'); state.prompts = Array.isArray(data)?data:[]; }
    catch { state.prompts = []; }
    return state.prompts;
  }
  async function loadBubbles() {
    if (state.bubbles) return state.bubbles;
    try { const data = await getJSON('/bubbles.json'); state.bubbles = Array.isArray(data)?data:[]; }
    catch { state.bubbles = []; }
    return state.bubbles;
  }

  // Bubble layer
  const layer = $('#bubble-layer');
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9äöüß\- ]/gi,'').trim(); }
  function findPromptByTitle(title, prompts){
    const nt = norm(title);
    return prompts.find(p => norm(p.title) === nt) || prompts.find(p => norm(p.id) === nt);
  }
  function spawnBubbles(items){
    if (!layer) return;
    layer.innerHTML = '';
    const w = layer.clientWidth || window.innerWidth;
    const h = layer.clientHeight || Math.round(window.innerHeight*0.6);
    const avoid = { x: w*0.5, y: h*0.28, r: Math.min(w,h)*0.22 };

    const N = Math.min(items.length, 18);
    const picked = items.slice(0).sort(() => Math.random()-0.5).slice(0, N);

    const placed = [];
    function collides(x,y){
      if (Math.hypot(x-avoid.x,y-avoid.y) < avoid.r) return true;
      return placed.some(p => Math.hypot(x-p.x,y-p.y) < 120);
    }

    picked.forEach(it => {
      // pick position
      let x=0,y=0,tries=0;
      do{
        x = 60 + Math.random()*(w-120);
        y = 20 + Math.random()*(h-60);
        tries++;
        if (tries>50) break;
      } while(collides(x,y));
      placed.push({x,y});
      const hue = Number(it.hue ?? (Math.random()*360|0));
      const el = document.createElement('button');
      el.className = 'bubble';
      el.style.left = `${x}px`; el.style.top = `${y}px`;
      el.dataset.hue = String(hue);
      el.innerHTML = `<span class="dot" style="background:hsl(${hue} 90% 60%)"></span>${it.title}`;
      el.setAttribute('aria-label', it.title);
      layer.appendChild(el);

      // gentle floating animation
      const amp = 6 + Math.random()*8;
      const spd = .4 + Math.random()*0.6;
      let t = Math.random()*Math.PI*2;
      function tick(){
        t += 0.01*spd;
        const dx = Math.cos(t)*amp, dy = Math.sin(t*0.8)*amp*0.6;
        el.style.transform = `translate(${dx}px,${dy}px)`;
        el._raf = requestAnimationFrame(tick);
      }
      el._raf = requestAnimationFrame(tick);

      // click: open prompt if available
      on(el,'click', async () => {
        const prompts = await loadPrompts();
        const p = findPromptByTitle(it.title, prompts);
        if (p) {
          openModal(p.title || 'Prompt', `<p class="muted">${p.category || ''}</p><pre class="code">${(p.content||'').toString().trim()}</pre>`);
        } else {
          openModal(it.title, `<p class="muted">Kein verknüpfter Prompt gefunden.</p>`);
        }
      });
    });
  }

  // Render helpers
  function renderList(items, {title='Liste', mapItem}={}){
    const html = `<div class="list">${items.map((it,i)=>mapItem(it,i)).join('')}</div>`;
    openModal(title, html);
  }

  // Actions
  async function actionNews(kind='all'){
    const filters = {
      all: 'DACH-News',
      ki: 'KI & Tools',
      security: 'Sicherheit',
      features: 'Neue Features'
    };
    try {
      const searchParam = qs('q') || '';
      const url = `${apiBase}/news/live${searchParam ? ('?q='+encodeURIComponent(searchParam)) : ''}${!searchParam && kind!=='all' ? ('?type='+encodeURIComponent(kind)) : ''}`;
      const r = await getJSON(url);
      const items = Array.isArray(r.items) ? r.items : [];
      renderList(items, {
        title: `News – ${filters[kind] || 'DACH'}`,
        mapItem: (it) => {
          try {
            const u = new URL(it.url);
            const d = (it.published || '').split('T')[0] || '';
            return `<article class="news">
              <h3><a href="${it.url}" target="_blank" rel="noopener">${it.title || u.hostname}</a></h3>
              <p class="muted">${u.hostname}${d ? ' · '+d : ''}</p>
              <p>${it.snippet || ''}</p>
            </article>`;
          } catch { return ''; }
        }
      });
      // add filter chips
      const bar = document.createElement('div');
      bar.style.cssText = 'position:sticky;top:0;background:#0b0f14;padding:.5rem 1rem;display:flex;gap:.4rem;border-bottom:1px solid rgba(255,255,255,.08)';
      ['all','ki','features','security'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'chip';
        b.textContent = (filters[k]||k);
        b.onclick = () => actionNews(k);
        bar.appendChild(b);
      });
      modalContent.prepend(bar);
    } catch (e) {
      openModal('News', `<p class="muted">Keine News abrufbar.</p>`);
    }
  }

  async function actionPrompts(){
    const items = await loadPrompts();
    renderList(items, {
      title: 'Prompts',
      mapItem: (it) => `<article class="prompt"><h3>${it.title || it.id}</h3><p class="muted">${it.category || ''}</p><pre class="code">${(it.content||'').toString().trim()}</pre></article>`
    });
  }

  async function actionProjekte(){
    const items = await loadBubbles();
    renderList(items, {
      title: 'Projekte',
      mapItem: (it) => `<article class="proj"><h3>${it.title}</h3><p class="muted">${it.desc || ''}</p></article>`
    });
  }

  function actionStatic(title, html){
    openModal(title, html);
  }

  // Nav wiring
  const actions = { news: actionNews, prompts: actionPrompts, projekte: actionProjekte,
    impressum: () => actionStatic('Impressum','<p>Wolf Hohl · Berlin · E-Mail: —</p>'),
    datenschutz: () => actionStatic('Datenschutz','<p>Keine Cookies, keine Tracker. Server-Logs anonymisiert.</p>')
  };
  document.querySelectorAll('[data-action]').forEach(btn => on(btn,'click', async () => {
    const act = btn.dataset.action; if (actions[act]) await actions[act]();
  }));

  // Initial load: spawn bubbles
  (async () => {
    const items = await loadBubbles();
    spawnBubbles(items);
    window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz=setTimeout(()=>spawnBubbles(items), 250); });
  })();

  // SSE ping (optional)
  (async () => {
    try {
      const ev = new EventSource(`${apiBase}/sse/pulse`);
      ev.addEventListener('end', () => ev.close());
    } catch {}
  })();
})();
