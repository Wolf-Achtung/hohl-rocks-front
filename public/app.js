(() => {
  'use strict';

  // Utilities
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
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

  // Background video: respect reduced motion
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

  // Modal helpers
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalContent = $('#modal-content');
  const closeModal = () => {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
  };
  const openModal = (title, html) => {
    modalTitle.textContent = title || 'Details';
    modalContent.innerHTML = html || '';
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    // Focus management
    $('#modal-close')?.focus();
  };
  on($('#modal-close'), 'click', closeModal);
  on($('#modal-close-2'), 'click', closeModal);
  on(modal, 'click', (e) => { if (e.target === modal) closeModal(); });

  // Copy modal content
  $$('[data-copy="modal"]').forEach(btn => {
    on(btn, 'click', async () => {
      const text = modalContent.innerText.trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Kopiert ✓';
        setTimeout(() => btn.textContent = 'Kopieren', 1200);
      } catch (e) {
        console.warn('Clipboard failed', e);
      }
    });
  });

  // Fetch helpers
  async function getJSON(url) {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.json();
  }
  async function loadPrompts() {
    if (state.prompts) return state.prompts;
    try {
      const data = await getJSON('/prompts.json');
      state.prompts = Array.isArray(data) ? data : [];
    } catch { state.prompts = []; }
    return state.prompts;
  }
  async function loadBubbles() {
    if (state.bubbles) return state.bubbles;
    try {
      const data = await getJSON('/bubbles.json');
      state.bubbles = Array.isArray(data) ? data : [];
    } catch { state.bubbles = []; }
    return state.bubbles;
  }

  // Render helpers
  const cards = $('#cards');
  function renderList(items, opts={}) {
    const { title='Liste', mapItem } = opts;
    const html = `
      <div class="list">
        ${items.map((it, i) => mapItem(it, i)).join('')}
      </div>
    `;
    openModal(title, html);
  }

  // Actions
  async function actionNews() {
    try {
      const q = qs('q') || '';
      const r = await getJSON(`${apiBase}/news/live${q ? ('?q='+encodeURIComponent(q)) : ''}`);
      const items = Array.isArray(r.items) ? r.items : [];
      renderList(items, {
        title: 'Aktuelle News',
        mapItem: (it) => {
          const u = new URL(it.url);
          const d = (it.published || '').split('T')[0] || '';
          return `
            <article class="news">
              <h3><a href="${it.url}" target="_blank" rel="noopener">${it.title || u.hostname}</a></h3>
              <p class="muted">${u.hostname}${d ? ' · '+d : ''}</p>
              <p>${it.snippet || ''}</p>
            </article>
          `;
        }
      });
    } catch (e) {
      openModal('News', `<p class="muted">Keine News abrufbar.</p>`);
    }
  }

  async function actionPrompts() {
    const items = await loadPrompts();
    renderList(items, {
      title: 'Prompts',
      mapItem: (it) => `
        <article class="prompt">
          <h3>${it.title || it.id}</h3>
          <p class="muted">${it.category || ''}</p>
          <pre class="code">${(it.content || '').toString().trim()}</pre>
        </article>
      `
    });
  }

  async function actionProjekte() {
    const items = await loadBubbles();
    renderList(items, {
      title: 'Projekte',
      mapItem: (it) => `
        <article class="proj">
          <h3>${it.title}</h3>
          <p class="muted">${it.desc || ''}</p>
        </article>
      `
    });
  }

  // Wire navigation
  const actions = {
    news: actionNews,
    prompts: actionPrompts,
    projekte: actionProjekte
  };
  document.querySelectorAll('[data-action]').forEach(btn => {
    on(btn, 'click', async () => {
      const act = btn.dataset.action;
      if (actions[act]) await actions[act]();
    });
  });

  // Keyboard: escape closes modal
  on(window, 'keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // SSE ping (optional)
  (async () => {
    try {
      const ev = new EventSource(`${apiBase}/sse/pulse`);
      ev.addEventListener('ping', () => { /* heartbeat for later use */ });
      ev.addEventListener('end', () => ev.close());
    } catch {}
  })();
})();
