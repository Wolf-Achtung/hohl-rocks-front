// public/js/bubbleEngine.js
// Fixed version with proper ES6 module exports
import { $ } from './utils.js';
import { runBubble as runBubbleFromApi } from './api.js';

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
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeRegExp(pattern, flags) {
  if (!pattern) return null;
  if (typeof pattern === 'string' && pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const last = pattern.lastIndexOf('/');
    const body = pattern.slice(1, last);
    const f = flags || pattern.slice(last + 1);
    try { return new RegExp(body, f); } catch { /* ignore */ }
  }
  try { return new RegExp(escapeForRegExp(String(pattern)), flags || 'i'); } catch { return null; }
}

function matches(text, pattern) {
  if (!pattern) return true;
  const rx = safeRegExp(pattern, 'i');
  if (rx) return rx.test(text);
  return String(text).toLowerCase().indexOf(String(pattern).toLowerCase()) !== -1;
}

// ---- DOM helpers ---------------------------------------------------------
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

// Container elements
let modal = null;
let modalContent = null;

function ensureModal() {
  if (modal) return modal;
  
  // Check if modal already exists
  modal = document.getElementById('bubble-modal');
  if (modal) {
    modalContent = modal.querySelector('#bubble-modal-content');
    return modal;
  }
  
  // Create modal
  const m = document.createElement('div');
  m.id = 'bubble-modal';
  m.setAttribute('role','dialog');
  m.setAttribute('aria-modal','true');
  m.style.display = 'none';
  m.style.position = 'fixed';
  m.style.inset = '0';
  m.style.background = 'rgba(0,0,0,.45)';
  m.style.zIndex = '9999';
  m.innerHTML = `
    <div id="bubble-modal-content" style="max-width:760px;margin:6vh auto;background:rgba(10,10,14,.95);backdrop-filter:blur(10px);padding:20px;border-radius:16px;color:#fff;max-height:80vh;overflow-y:auto;">
      <button id="bubble-modal-close" aria-label="Schließen" style="float:right;background:transparent;border:none;color:#fff;font-size:2em;cursor:pointer;">×</button>
      <div class="be-stream" style="padding:20px;"></div>
    </div>
  `;
  
  document.body.appendChild(m);
  
  // Event listeners
  m.addEventListener('click', (e) => { 
    if (e.target === m) hideModal(); 
  });
  
  const closeBtn = m.querySelector('#bubble-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideModal);
  }
  
  modal = m;
  modalContent = m.querySelector('#bubble-modal-content');
  return m;
}

function showModal() {
  const m = ensureModal();
  m.style.display = 'block';
  const closeBtn = m.querySelector('#bubble-modal-close');
  if (closeBtn) closeBtn.focus();
}

function hideModal() {
  if (modal) {
    modal.style.display = 'none';
  }
}

// ---- Streaming -----------------------------------------------------------
async function runBubble(id, payload, opts = {}) {
  try {
    // Use the API function from api.js
    const result = await runBubbleFromApi(id, payload, opts);
    return result || '';
  } catch (e) {
    console.error('[bubbleEngine] runBubble failed', e);
    return 'Entschuldigung, das hat nicht geklappt.';
  }
}

// Render answer into target element
async function renderAnswer(targetEl, result) {
  if (!targetEl) return;
  
  if (typeof result === 'string' && result.startsWith('__HTML__')) {
    const raw = result.slice(8);
    targetEl.innerHTML = raw;
    return;
  }
  
  // Plain text (escaped)
  const text = String(result);
  targetEl.innerHTML = escapeHtml(text).replace(/\n/g,'<br>');
}

// ---- Bubble wiring -------------------------------------------------------
function createBubble(item) {
  // Create button element
  const btn = document.createElement('button');
  btn.className = 'bubble bubble-btn';
  btn.dataset.id = item.id;
  btn.textContent = item.question || item.title || `Bubble ${item.id}`;
  btn.style.cssText = 'padding:10px 15px;margin:5px;border-radius:8px;background:#333;color:#fff;border:none;cursor:pointer;';
  
  btn.addEventListener('click', async () => {
    const id = item.id;
    showModal();
    const m = ensureModal();
    const streamBox = m.querySelector('.be-stream');
    
    if (!streamBox) {
      console.error('Stream box not found');
      return;
    }
    
    streamBox.innerHTML = '<div style="opacity:.85">…denke nach…</div>';

    // Build payload from item data
    const payload = {
      prompt: item.prompt || '',
      desc: item.desc || '',
      question: item.question || ''
    };
    
    const result = await runBubble(id, payload, {});
    await renderAnswer(streamBox, result);
  }, { passive: true });
  
  return btn;
}

// ---- Initialize Bubble Engine -------------------------------------------------------
export async function initBubbleEngine(prompts = []) {
  try {
    // Get or create container for bubbles
    let bubblesHost = document.getElementById('bubbles-host');
    if (!bubblesHost) {
      // Try to find a suitable container
      bubblesHost = document.querySelector('.bubbles-container') || 
                     document.querySelector('#ov-prompts .content') ||
                     document.querySelector('main') ||
                     document.body;
    }
    
    // Create a container for bubble buttons if needed
    let bubbleContainer = bubblesHost.querySelector('.bubble-buttons');
    if (!bubbleContainer) {
      bubbleContainer = document.createElement('div');
      bubbleContainer.className = 'bubble-buttons';
      bubbleContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;padding:20px;';
      
      // Add it at the beginning of the host
      if (bubblesHost.firstChild) {
        bubblesHost.insertBefore(bubbleContainer, bubblesHost.firstChild);
      } else {
        bubblesHost.appendChild(bubbleContainer);
      }
    }
    
    // Add some sample bubbles from prompts
    const samplePrompts = prompts.slice(0, 6); // First 6 prompts as bubbles
    
    for (const prompt of samplePrompts) {
      const btn = createBubble(prompt);
      bubbleContainer.appendChild(btn);
    }
    
    // Also attach to any existing .bubble elements
    const existingBubbles = document.querySelectorAll('.bubble, [data-bubble]');
    existingBubbles.forEach(el => {
      if (!el.dataset.bubbleInit) {
        el.dataset.bubbleInit = 'true';
        el.addEventListener('click', async () => {
          const id = el.dataset.id || el.dataset.bubble || '1';
          showModal();
          const m = ensureModal();
          const streamBox = m.querySelector('.be-stream');
          streamBox.innerHTML = '<div style="opacity:.85">…denke nach…</div>';
          
          const payload = {};
          for (const a of el.attributes) {
            if (a.name.startsWith('data-') && a.name !== 'data-id' && a.name !== 'data-bubble' && a.name !== 'data-bubble-init') {
              payload[a.name.slice(5).toUpperCase()] = a.value;
            }
          }
          
          const result = await runBubble(id, payload, {});
          await renderAnswer(streamBox, result);
        });
      }
    });
    
    console.log('[BubbleEngine] Initialized with', samplePrompts.length, 'bubbles');
    
  } catch (e) {
    console.error('[BubbleEngine] Init failed:', e);
  }
}

// ---- Filter/Prompt gallery ---------------------------------
export function applyFilter(query) {
  const cards = $$('.prompt-card');
  const q = (query || '').trim();
  for (const c of cards) {
    const txt = c.getAttribute('data-text') || c.textContent || '';
    const ok = q ? matches(txt, q) : true;
    c.style.display = ok ? '' : 'none';
  }
}

// Auto-init on DOM ready if not explicitly called
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    // Check if there are bubbles to init but no explicit init call
    const bubbles = document.querySelectorAll('.bubble, [data-bubble]');
    if (bubbles.length > 0 && !window.bubbleEngineInitialized) {
      initBubbleEngine([]);
    }
  });
  
  // Prevent regex errors from crashing the UI
  window.addEventListener('error', (ev) => {
    if (String(ev?.error?.message || '').includes('Invalid regular expression')) {
      ev.preventDefault();
      console.warn('[bubbleEngine] Caught invalid regex – using safe fallback.');
    }
  }, true);
}

// Mark as available
window.bubbleEngineInitialized = false;

// Export for use in other modules
export default { initBubbleEngine, applyFilter };