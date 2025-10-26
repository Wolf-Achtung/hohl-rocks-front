// hohl.rocks – BubbleEngine (ESM) v2.5.4
// Exports: initBubbleEngine(opts)
// Also attaches window.initBubbleEngine for non-ESM callers.

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeForRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
}
function safeRegExp(pattern, flags) {
  if (!pattern) return null;
  if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const last = pattern.lastIndexOf('/');
    const body = pattern.slice(1, last);
    const f = flags || pattern.slice(last + 1);
    try { return new RegExp(body, f); } catch {}
  }
  try { return new RegExp(escapeForRegExp(String(pattern)), flags || 'i'); } catch { return null; }
}
function matches(text, pattern) {
  if (!pattern) return true;
  const rx = safeRegExp(pattern, 'i');
  if (rx) return rx.test(text);
  return String(text).toLowerCase().indexOf(String(pattern).toLowerCase()) !== -1;
}

// ----- Modal helpers -------------------------------------------------------
function ensureModal() {
  let modal = document.getElementById('bubble-modal');
  if (modal) return modal;
  modal = document.createElement('section');
  modal.id = 'bubble-modal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Overlay');
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
  modal.innerHTML = `
    <div id="bubble-modal-content" class="dialog" role="document">
      <button id="bubble-modal-close" class="btn ghost modal__close" aria-label="Schließen">×</button>
      <div class="be-stream" aria-live="polite"></div>
    </div>`;
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
  document.body.appendChild(modal);
  document.getElementById('bubble-modal-close').addEventListener('click', hideModal);
  return modal;
}

function trapFocus(container) {
  const FOCUSABLE = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const nodes = Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => !el.hasAttribute('disabled'));
  if (!nodes.length) return () => {};
  const first = nodes[0], last = nodes[nodes.length - 1];
  function onKey(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

let restoreFocus = null;
let releaseTrap = () => {};

function showModal() {
  const modal = ensureModal();
  const content = document.getElementById('bubble-modal-content');
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
  restoreFocus = document.activeElement;
  releaseTrap = trapFocus(content);
  const closeBtn = document.getElementById('bubble-modal-close');
  if (closeBtn) closeBtn.focus();
}
function hideModal() {
  const modal = document.getElementById('bubble-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  releaseTrap();
  if (restoreFocus && typeof restoreFocus.focus === 'function') {
    try { restoreFocus.focus(); } catch {}
  }
}

// ----- API calls -----------------------------------------------------------
async function runBubble(id, payload) {
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

async function renderAnswer(targetEl, result) {
  if (typeof result === 'string' && result.startsWith('__HTML__')) {
    targetEl.insertAdjacentHTML('beforeend', result.slice(8));
    return;
  }
  targetEl.innerHTML = escapeHtml(String(result)).replace(/\n/g,'<br>');
}

function wireBubbleButton(btn) {
  btn.addEventListener('click', async () => {
    const id = Number(btn.dataset.id || '0') || 0;
    showModal();
    const box = document.querySelector('#bubble-modal .be-stream');
    if (box) box.innerHTML = '<div style="opacity:.85">…denke nach…</div>';
    const payload = {};
    for (const a of btn.attributes) {
      if (a.name.startsWith('data-') && a.name !== 'data-id') {
        payload[a.name.slice(5).toUpperCase()] = a.value;
      }
    }
    const result = await runBubble(id, payload);
    await renderAnswer(box, result);
  }, { passive: true });
}

// ----- Public init ---------------------------------------------------------
export function initBubbleEngine(options = {}) {
  const selector = options.selector || '.bubble, [data-bubble], [data-id]';
  document.addEventListener('click', (ev) => {
    // Delegate wiring only if needed (progressive enhancement)
    const btn = ev.target.closest(selector);
    if (!btn || btn.hasAttribute('data-be-wired')) return;
    btn.setAttribute('data-be-wired','1');
    wireBubbleButton(btn);
    btn.click(); // replay original click
  }, { capture: true });

  // Fallback initial wiring (for static DOM)
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((n) => {
    if (!n.hasAttribute('data-be-wired')) {
      n.setAttribute('data-be-wired','1');
      wireBubbleButton(n);
    }
  });

  // ESC schließt
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hideModal();
  });

  // Safety: avoid Invalid RegEx from 3rd-party filters
  window.addEventListener('error', (ev) => {
    if (String(ev?.error?.message || '').includes('Invalid regular expression')) {
      ev.preventDefault(); console.warn('[bubbleEngine] invalid regex – fallback');
    }
  }, true);
}

// Also attach to window for non-module callers
if (typeof window !== 'undefined') {
  window.initBubbleEngine = initBubbleEngine;
}
// End of module
