/* hohl.rocks front core (patch 1.8)
 * - Sets API_BASE to '/api' (proxied by Netlify).
 * - Adds helpers to call /api/news and /api/daily.
 * - SSE client for /api/run.
 * - Keeps existing UI hooks minimal.
 */
(() => {
  const API_BASE = '/api';

  async function fetchJSON(path, opts = {}) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      ...opts
    });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }

  // News modal
  window.loadNews = async (container) => {
    try {
      const data = await fetchJSON('/news');
      const ul = document.createElement('ul');
      (data.items || []).forEach(it => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = it.url; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = it.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      container.innerHTML = '';
      container.appendChild(ul);
    } catch (e) {
      container.textContent = 'News‑Service nicht erreichbar.';
    }
  };

  // Daily ticker (header)
  window.loadDaily = async (el) => {
    try {
      const data = await fetchJSON('/daily');
      if (data?.item?.title) {
        el.textContent = `Heute neu – ${data.item.title}`;
        el.onclick = () => window.open(data.item.url, '_blank', 'noopener');
        el.style.cursor = 'pointer';
      } else {
        el.textContent = 'Heute neu – n/a';
      }
    } catch {
      el.textContent = 'Heute neu – n/a';
    }
  };

  // SSE runner for text responses
  window.apiStreamRun = async (payload, onDelta) => {
    const r = await fetch(`${API_BASE}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('http_' + r.status);
    const reader = r.body.getReader();
    const dec = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const chunk of parts) {
        const line = chunk.split('\n').find(l => l.startsWith('data:'));
        if (!line) continue;
        const data = line.replace(/^data:\s?/, '');
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          if (json?.content) onDelta(json.content);
        } catch {}
      }
    }
  };

  // Expose small API for existing UI to use
  window.__API__ = { fetchJSON, apiStreamRun };

  // Boot small checks
  window.addEventListener('DOMContentLoaded', () => {
    const dailyEl = document.querySelector('[data-daily]');
    if (dailyEl) loadDaily(dailyEl);
  });
})();