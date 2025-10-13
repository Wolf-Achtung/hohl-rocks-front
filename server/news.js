import express from 'express';
import NodeCache from 'node-cache';

export const newsRouter = express.Router();
const cache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

async function safeFetch(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// Hosts / Heuristics
const DACH_SITES = ['heise.de','golem.de','t3n.de','tagesschau.de','spiegel.de','sueddeutsche.de','faz.net','zeit.de','derstandard.at','nzz.ch'];
const EU_SITES = ['europa.eu','ec.europa.eu','eur-lex.europa.eu'];
const AI_ACT_TERMS = ['EU AI Act','AI Act','KI-Gesetz','KI-Verordnung','AI-Verordnung','EU-KI-Gesetz'];

const boostDACH = (items) => items.map(it => {
  const host = (it.url || '').replace(/^https?:\/\//,'').split('/')[0];
  const score = DACH_SITES.some(d => host.endsWith(d)) ? 1 : 0;
  return { ...it, _score: (it._score || 0) + score };
}).sort((a,b) => (b._score||0)-(a._score||0));

function filterByAiAct(items) {
  return items.filter(it => {
    const t = (it.title || '') + ' ' + (it.snippet || '');
    return AI_ACT_TERMS.some(term => t.toLowerCase().includes(term.toLowerCase()));
  });
}

function buildQuery(region) {
  const base = '("EU AI Act" OR "AI Act" OR KI-Verordnung OR EU-KI-Gesetz OR KI-Gesetz)';
  if (region === 'eu') {
    return base + ' AND (site:europa.eu OR site:ec.europa.eu OR site:eur-lex.europa.eu)';
  }
  if (region === 'dach') {
    return base + ' AND (site:de OR site:at OR site:ch)';
  }
  return base + ' AND (site:de OR site:at OR site:ch OR site:europa.eu OR site:ec.europa.eu)';
}

async function fetchTavily(query) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { source: 'none', items: [] };
  const data = await safeFetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tavily-Api-Key': key },
    body: JSON.stringify({ query, search_depth: 'advanced', max_results: 12 })
  });
  let items = (data.results || []).map(r => ({ title:r.title, url:r.url, snippet:r.content, published:r.published_date || null }));
  items = filterByAiAct(items);
  items = boostDACH(items);
  return { source:'tavily', items };
}

newsRouter.get('/news/live', async (req, res) => {
  const region = (req.query.region || 'all').toString();
  const q = buildQuery(region);
  const cacheKey = `tavily:${region}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ source:'cache', items: cached });
  try {
    const { items } = await fetchTavily(q);
    cache.set(cacheKey, items);
    res.json({ source:'tavily', items });
  } catch (err) {
    res.status(502).json({ error:'news_live_failed', message: String(err) });
  }
});

newsRouter.get('/ai-weekly', async (req, res) => {
  const key = process.env.PERPLEXITY_API_KEY;
  const cacheKey = 'perplexity:weekly';
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ source:'cache', items: cached });
  try {
    if (!key) return res.json({ source:'none', items: [] });
    const resp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          { role: 'system', content: 'Fasse die wichtigsten Meldungen zum EU AI Act und KI-Regulierung (DACH) der letzten 7 Tage prägnant auf Deutsch zusammen. 6-8 Einträge, je 1-2 Sätze, Quelle+URL.' },
          { role: 'user', content: 'EU AI Act + DACH-KI-Regulierung der letzten Woche.' }
        ],
        max_tokens: 800
      })
    });
    if (!resp.ok) throw new Error('perplexity ' + resp.status);
    const json = await resp.json();
    const text = json.choices?.[0]?.message?.content || '';
    const items = text.split('\n').map(s => s.trim()).filter(Boolean).map(line => ({ title: line, url: null, snippet: '', published: null }));
    cache.set(cacheKey, items);
    res.json({ source:'perplexity', items });
  } catch (err) {
    res.status(502).json({ error:'ai_weekly_failed', message: String(err) });
  }
});

// Digest as SVG (OG-ish card)
newsRouter.get('/digest.svg', async (req, res) => {
  try {
    const region = (req.query.region || 'all').toString();
    const q = buildQuery(region);
    const { items } = await fetchTavily(q);
    const top = (items || []).slice(0,4).map((it,i) => `${i+1}. ${it.title}`);
    const title = region === 'eu' ? 'EU · AI Act Digest' : (region === 'dach' ? 'DACH · AI Act Digest' : 'AI Act Digest');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#16334f"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="s"/>
      <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(80,90)" fill="#e8f0ff">
    <text x="0" y="0" font-size="56" font-weight="700" filter="url(#glow)">hohl.rocks</text>
    <text x="0" y="56" font-size="28" opacity="0.8">${title}</text>
  </g>
  <g transform="translate(80,170)" fill="#e8f0ff">
    <text x="0" y="0" font-size="28">${top[0] || ''}</text>
    <text x="0" y="48" font-size="24" opacity="0.9">${top[1] || ''}</text>
    <text x="0" y="90" font-size="24" opacity="0.85">${top[2] || ''}</text>
    <text x="0" y="132" font-size="24" opacity="0.8">${top[3] || ''}</text>
  </g>
  <text x="80" y="590" fill="#9bb0c3" font-size="18">Generated ${new Date().toISOString()}</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.send(svg);
  } catch (err) {
    res.status(502).type('text/plain').send('failed to render digest');
  }
});
