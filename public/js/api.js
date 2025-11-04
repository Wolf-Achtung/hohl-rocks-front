'use strict';

// Unified frontend API (strict ASCII)
// - Uses <meta name="x-api-base" content="/api"> if present
// - Defensive JSON parsing and graceful degradation

function apiBase() {
  var m = document.querySelector('meta[name="x-api-base"]');
  var base = (m && typeof m.content === 'string') ? m.content.trim() : '';
  if (!base) return '/api';
  return base.replace(/\/$/, '');
}
var API_BASE = apiBase();

export async function getJson(path, opts) {
  opts = opts || {};
  var url = path.startsWith('http') ? path : (API_BASE + path);
  var res;
  try {
    var headers = Object.assign({ 'Accept': 'application/json' }, (opts.headers || {}));
    res = await fetch(url, Object.assign({}, opts, { headers: headers }));
  } catch (err) {
    console.debug('[api] network error', err);
    return {};
  }
  var txt = '';
  try { txt = await res.text(); } catch (e) { txt = ''; }
  if (!res.ok) {
    console.debug('[api] HTTP', res.status, url);
    return {};
  }
  try { return txt ? JSON.parse(txt) : {}; }
  catch (e) { console.debug('[api] invalid json', url); return {}; }
}

export async function postJson(path, body, opts) {
  opts = opts || {};
  var url = path.startsWith('http') ? path : (API_BASE + path);
  var res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body || {})
    });
  } catch (err) {
    console.debug('[api] network error', err); return {};
  }
  var txt = '';
  try { txt = await res.text(); } catch (e) { txt = ''; }
  if (!res.ok) { console.debug('[api] HTTP', res.status, url); return {}; }
  try { return txt ? JSON.parse(txt) : {}; }
  catch (e) { return {}; }
}

export async function selfCheck() {
  try { const j = await getJson('/self'); return !!(j && j.ok); }
  catch { return false; }
}

export async function streamRun(prompt, onChunk) {
  if (typeof onChunk === 'function') onChunk('Streaming not configured.');
  return { done: true };
}

// --- News helpers (primary + fallback) ---------------------------------------

async function newsPrimary(q) {
  var qs = q ? ('?q=' + encodeURIComponent(q)) : '';
  var r = await getJson('/news' + qs);
  if (r && Array.isArray(r.items) && r.items.length) return r;
  return { items: [] };
}

async function newsFallback() {
  try {
    const r = await fetch('/data/news.json', { cache: 'no-store' });
    if (!r.ok) return { items: [] };
    const arr = await r.json();
    const items = Array.isArray(arr) ? arr : [];
    return { items };
  } catch { return { items: [] }; }
}

// Public API object (used by app.js)
export const api = {
  news: async () => {
    const p = await newsPrimary('');
    if (p.items.length) return p;
    return newsFallback();
  },
  searchNews: async (q) => {
    const p = await newsPrimary(q || '');
    if (p.items.length) return p;
    return newsFallback();
  },
  tips: () => getJson('/tips'),
  metrics: (name, payload) => postJson('/metrics', { name: name || '', payload: payload || {} }),
  spark: () => getJson('/spark/today')
};
