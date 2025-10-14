import { Router } from 'express';

const router = Router();
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

// Basic topic groups for DACH KI users
const GROUPS = {
  all: ['KI','AI','ChatGPT','OpenAI','Anthropic','Llama','Claude','Copilot','Midjourney','Stable Diffusion','Datenschutz','Sicherheit','EU AI Act','Prompt Engineering','Model Update'],
  ki: ['KI','ChatGPT','OpenAI','Anthropic','Llama','Claude','Copilot','Groq','Gemini','Perplexity'],
  features: ['Update','Release','Feature','Preview','Beta','Roadmap','Launch'],
  security: ['Sicherheit','Security','Leak','Vulnerability','Breach','Schwachstelle','Datenschutz','DSGVO']
};

const DACH_SITES = ['heise.de','golem.de','t3n.de','zeit.de','tagesschau.de','spiegel.de','handelsblatt.com','faz.net','br.de','netzpolitik.org'];
const EU_SITES = ['europa.eu','edpb.europa.eu','edps.europa.eu','eur-lex.europa.eu','europarl.europa.eu'];

function buildQuery(type='all'){
  const terms = (GROUPS[type] || GROUPS.all).join(' OR ');
  const scope = `site:${DACH_SITES.join(' OR site:')} OR site:${EU_SITES.join(' OR site:')}`;
  return `${terms} ${scope}`;
}
function dedupe(items){
  const seen = new Set();
  return items.filter(x => {
    try {
      const k = new URL(x.url).hostname + '|' + (x.title||'').trim();
      if (seen.has(k)) return false; seen.add(k); return true;
    } catch { return false; }
  });
}

// 5‑minute in‑memory cache
const cache = new Map(); // key -> {ts:number, items:any[]}
const TTL = 5 * 60 * 1000;
function getCache(key){ const e = cache.get(key); if (!e) return null; if (Date.now()-e.ts>TTL){ cache.delete(key); return null; } return e.items; }
function setCache(key, items){ cache.set(key, { ts: Date.now(), items }); }

router.get('/live', async (req, res) => {
  try {
    const qParam = String(req.query.q || '').trim();
    const type = String(req.query.type || 'all').toLowerCase();
    const query = qParam || buildQuery(type);
    const cacheKey = `live:${type}:${qParam}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ items: cached, cached: true });

    if (!TAVILY_API_KEY) {
      return res.status(200).json({ items: [] });
    }

    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        topic: 'news',
        max_results: 16
      })
    });

    if (!r.ok) throw new Error(`tavily_http_${r.status}`);
    const j = await r.json().catch(()=>({}));
    const itemsRaw = Array.isArray(j.results) ? j.results.map(x => ({
      title: x.title, url: x.url, snippet: x.content, published: x.published_date || null
    })) : [];
    const items = dedupe(itemsRaw);
    setCache(cacheKey, items);
    res.set('Cache-Control','public, max-age=120');
    res.json({ items });
  } catch (e) {
    console.error('news/live failed', e);
    res.status(500).json({ error: 'tavily_failed' });
  }
});

export default router;
