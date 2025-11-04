files["public/js/api.js"] = r"""// public/js/api.js
// Unified frontend API for hohl.rocks (UTF-8)
// - Uses <meta name="x-api-base" content="/api"> if present
// - Stable helpers: getJson, postJson, selfCheck
// - Endpoints: /news, /tips, /metrics, /spark/today

const API_BASE =
  document.querySelector('meta[name="x-api-base"]')?.content?.replace(/\/$/,'') || '/api';

export async function getJson(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }, ...opts });
  // Sicherheitsnetz: nie ungeparst lassen
  const txt = await res.text();
  if (!res.ok) {
    console.debug('[api:getJson] HTTP', res.status, url, txt.slice(0, 300));
    return {};
  }
  try { return JSON.parse(txt); } catch { return {}; }
}

export async function postJson(path, body, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body ?? {}),
    ...opts
  });
  const txt = await res.text();
  if (!res.ok) { console.debug('[api:postJson] HTTP', res.status, url, txt.slice(0, 300)); return {}; }
  try { return JSON.parse(txt); } catch { return {}; }
}

export async function selfCheck() {
  try { const j = await getJson('/self'); return !!j?.ok; } catch { return false; }
}

// Optional: Streaming-Stub (kann später an OpenAI/Server-Events gekoppelt werden)
export async function streamRun(prompt, onChunk) {
  // Platzhalter – bewusst einfach gehalten.
  onChunk?.('Streaming ist hier (noch) nicht verdrahtet.'); return { done: true };
}

export const api = {
  news: (qs='') => getJson(`/news${qs ? `?${qs}` : ''}`),
  searchNews: (q) => getJson(`/news?q=${encodeURIComponent(q || '')}`),
  tips: () => getJson('/tips'),
  metrics: (name, payload={}) => postJson('/metrics', { name, payload }),
  spark: () => getJson('/spark/today'),
};
"""