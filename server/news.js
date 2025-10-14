import { Router } from 'express';

const router = Router();
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

const DACH_SITES = ['heise.de','golem.de','t3n.de','zeit.de','tagesschau.de','spiegel.de','handelsblatt.com','faz.net','br.de'];
const EU_SITES = ['europa.eu','edpb.europa.eu','edps.europa.eu','eur-lex.europa.eu','europarl.europa.eu'];
const AI_ACT_TERMS = ['EU AI Act','KI‑Verordnung','Hochrisiko‑KI','Transparenzpflicht','Konformitätsbewertung','CE‑Kennzeichnung'];

function boostQuery(region='all'){
  const base = AI_ACT_TERMS.join(' OR ');
  if(region==='dach') return `${base} site:${DACH_SITES.join(' OR site:')}`;
  if(region==='eu') return `${base} site:${EU_SITES.join(' OR site:')}`;
  return base;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(x => {
    const k = new URL(x.url).hostname + '|' + (x.title||'').trim();
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

router.get('/live', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const region = String(req.query.region || 'dach');
    const query = q ? q : boostQuery(region);

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
        max_results: 12
      })
    });

    if (!r.ok) throw new Error(`tavily_http_${r.status}`);
    const j = await r.json().catch(()=>({}));
    const itemsRaw = Array.isArray(j.results) ? j.results.map(x => ({
      title: x.title,
      url: x.url,
      snippet: x.content,
      published: x.published_date || null
    })) : [];
    const items = dedupe(itemsRaw);
    res.set('Cache-Control','public, max-age=120');
    res.json({ items });
  } catch (e) {
    console.error('news/live failed', e);
    res.status(500).json({ error: 'tavily_failed' });
  }
});

export default router;
