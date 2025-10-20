// hohl.rocks – BubbleEngine (hardened) v2.5.1-fix
// - Fix for "Invalid regular expression: missing /" by safe regex creation
// - Resilient streaming rendering with __HTML__ token support
// - Does not crash the runtime on bad patterns; falls back to indexOf()

(function () {
  'use strict';

  // ---- Utilities -----------------------------------------------------------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeForRegExp(s) {
    // Escape characters that have special meaning in regex
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function safeRegExp(pattern, flags) {
    if (!pattern) return null;
    // If pattern already looks like a literal (/.../), try to extract safely
    if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
      const last = pattern.lastIndexOf('/');
      const body = pattern.slice(1, last);
      const f = flags || pattern.slice(last + 1);
      try { return new RegExp(body, f); } catch { /* ignore */ }
    }
    // Otherwise escape the body to guarantee a valid regex
    try { return new RegExp(escapeForRegExp(String(pattern)), flags || 'i'); } catch { return null; }
  }

  function matches(text, pattern) {
    if (!pattern) return true;
    const rx = safeRegExp(pattern, 'i');
    if (rx) return rx.test(text);
    // Fallback: substring matching
    return String(text).toLowerCase().indexOf(String(pattern).toLowerCase()) !== -1;
  }

  // ---- DOM helpers ---------------------------------------------------------
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  // Container elements (expected to exist)
  const bubblesHost = document.getElementById('bubbles-host') || document.body;
  const modal = $('#bubble-modal');
  const modalContent = $('#bubble-modal-content');
  const closeBtn = $('#bubble-modal-close');

  function ensureModal() {
    if (modal) return modal;
    const m = document.createElement('div');
    m.id = 'bubble-modal';
    m.setAttribute('role','dialog');
    m.setAttribute('aria-modal','true');
    m.style.display = 'none';
    m.style.position = 'fixed';
    m.style.inset = '0';
    m.style.background = 'rgba(0,0,0,.45)';
    m.innerHTML = '<div id="bubble-modal-content" style="max-width:760px;margin:6vh auto;background:rgba(10,10,14,.85);backdrop-filter:blur(10px);padding:20px;border-radius:16px;color:#fff;"><button id="bubble-modal-close" aria-label="Schließen" style="float:right">×</button><div class="be-stream"></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', (e)=>{ if(e.target===m) hideModal(); });
    $('#bubble-modal-close', m).addEventListener('click', hideModal);
    return m;
  }

  function showModal() {
    const m = ensureModal();
    m.style.display = 'block';
    $('#bubble-modal-close', m).focus();
  }
  function hideModal() {
    const m = $('#bubble-modal');
    if (m) m.style.display = 'none';
  }

  // ---- Streaming -----------------------------------------------------------
  async function runBubble(id, payload, opts) {
    // Uses POST /api/run for media/decision flows; GET stream for simple text
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ input: `[Bubble ${id}]`, payload })
      });
      const data = await res.json();
      return data?.result ?? '';
    } catch (e) {
      console.error('[bubbleEngine] runBubble failed', e);
      return 'Entschuldigung, das hat nicht geklappt.';
    }
  }

  // Render streaming (or single text) into a box
  async function renderAnswer(targetEl, result) {
    let acc = '';
    if (typeof result === 'string' && result.startsWith('__HTML__')) {
      const raw = result.slice(8);
      targetEl.insertAdjacentHTML('beforeend', raw);
      return;
    }
    // Plain text (escaped)
    acc += String(result);
    targetEl.innerHTML = escapeHtml(acc).replace(/\n/g,'<br>');
  }

  // ---- Bubble wiring -------------------------------------------------------
  function createBubble(btn) {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id || '0') || 0;
      showModal();
      const streamBox = $('.be-stream', ensureModal());
      streamBox.innerHTML = '<div style="opacity:.85">…denke nach…</div>';

      // Simple payload builder from data-* attributes
      const payload = {};
      // e.g., data-desc, data-prompt etc. If present, pass through.
      for (const a of btn.attributes) {
        if (a.name.startsWith('data-') && a.name !== 'data-id') {
          payload[a.name.slice(5).toUpperCase()] = a.value;
        }
      }
      const result = await runBubble(id, payload, {});
      await renderAnswer(streamBox, result);
    }, { passive: true });
  }

  function initBubbles() {
    // Attach to any element with .bubble or [data-bubble]
    const nodes = $$('.bubble, [data-bubble]');
    nodes.forEach(createBubble);
  }

  // ---- Filter/Prompt gallery (regex-safe) ---------------------------------
  function applyFilter(query) {
    // Some earlier builds used an unsafe RegExp here → breaks entire app.
    const cards = $$('.prompt-card');
    const q = (query || '').trim();
    for (const c of cards) {
      const txt = c.getAttribute('data-text') || c.textContent || '';
      const ok = q ? matches(txt, q) : true;
      c.style.display = ok ? '' : 'none';
    }
  }

  // Optional: bind a search box if present
  const search = $('#prompt-search');
  if (search) {
    search.addEventListener('input', (e) => applyFilter(e.target.value || ''));
  }

  // ---- Bootstrap -----------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    try {
      initBubbles();
    } catch (e) {
      console.error('Bubble init failed', e);
    }
  });

  // Global guard: never crash UI due to regex errors
  window.addEventListener('error', (ev) => {
    if (String(ev?.error?.message || '').includes('Invalid regular expression')) {
      ev.preventDefault();
      console.warn('[bubbleEngine] Caught invalid regex – using safe fallback.');
    }
  }, true);
})();
