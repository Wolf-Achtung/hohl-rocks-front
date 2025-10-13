import { Router } from 'express';

const router = Router();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

const DACH_SITES = ['heise.de','golem.de','t3n.de','zeit.de','tagesschau.de','spiegel.de','handelsblatt.com','faz.net','br.de','orfonline.org'];
const EU_SITES = ['europa.eu','europa.eu/commission','edpb.europa.eu','edps.europa.eu','eur-lex.europa.eu','parlament.europa.eu'];

const AI_ACT_TERMS = ['EU AI Act','AI Act','KI-Verordnung','Hochrisiko-KI','Transparenzpflichten','Konformitätsbewertung','CE-Kennzeichnung'];

function boostQuery(region='all'){
  const base = `${AI_ACT_TERMS.join(' OR ')}`;
  if (region === 'dach') return `${base} site:${DACH_SITES.join(' OR site:')}`;
  if (region === 'eu') return `${base} site:${EU_SITES.join(' OR site:')}`;
  return base;
}

router.get('/news/live', async (req, res) => {
  const region = (req.query.region || 'all').toString();
  const q = boostQuery(region);
  if (!TAVILY_API_KEY) return res.json({ items: [] });

  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: q,
        search_depth: 'advanced',
        max_results: 20
      })
    });
    const j = await r.json().catch(() => ({}));
    // Normalisiere
    const items = Array.isArray(j.results) ? j.results.map(x => ({
      title: x.title, url: x.url, snippet: x.content, published: x.published_date || null
    })) : [];
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'tavily_failed' });
  }
});

router.get('/ai-weekly', async (_req, res) => {
  if (!PERPLEXITY_API_KEY) return res.json({ items: [] });
  // Platzhalter: bessere Weekly-Logik wäre möglich – hier minimal zurückgeben
  res.json({ items: [] });
});

router.get('/digest.svg', async (req, res) => {
  const region = (req.query.region || 'all').toString();
  const title = region === 'dach' ? 'DACH' : region.toUpperCase();
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="628">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1824"/>
      <stop offset="100%" stop-color="#030a12"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="60" y="140" font-family="system-ui, Segoe UI, Roboto" font-size="72" fill="#cfe7ff">EU AI Act – ${title} Digest</text>
  <text x="60" y="210" font-family="system-ui, Segoe UI, Roboto" font-size="24" fill="#9db8cc">hohl.rocks</text>
  <text x="60" y="580" font-family="system-ui, Segoe UI, Roboto" font-size="18" fill="#7aa0bb">Automatisch erzeugt</text>
</svg>`;
  res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
  res.send(svg);
});

export default router;
