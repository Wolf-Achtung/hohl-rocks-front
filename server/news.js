import { Router } from 'express';

const router = Router();
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';

const DACH_SITES = ['heise.de','golem.de','t3n.de','zeit.de','tagesschau.de','spiegel.de','handelsblatt.com','faz.net','br.de'];
const EU_SITES = ['europa.eu','edpb.europa.eu','edps.europa.eu','eur-lex.europa.eu','europarl.europa.eu'];
const AI_ACT_TERMS = ['EU AI Act','KI‑Verordnung','Hochrisiko‑KI','Transparenzpflicht','Konformitätsbewertung','CE‑Kennzeichnung'];
const SAFETY_TERMS = ['Deepfake','Phishing','Passkeys','2FA','Sicherheit','Datenschutz','DSGVO','Leak','Missbrauch','Warnung'];

function boostQuery(region='all'){
  const base = [...AI_ACT_TERMS, 'OpenAI', 'Anthropic', 'Google Gemini', 'LLM', 'KI', 'AI'].join(' OR ');
  if(region==='dach') return `${base} site:${DACH_SITES.join(' OR site:')}`;
  if(region==='eu') return `${base} site:${EU_SITES.join(' OR site:')}`;
  return base;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(x => {
    try {
      const u = new URL(x.url);
      const k = u.hostname + '|' + (x.title||'').trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    } catch {
      return true;
    }
  });
}

async function tavilySearch(query, max=8) {
  if (!TAVILY_API_KEY) return [];
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      topic: 'news',
      max_results: max
    })
  });
  if (!r.ok) throw new Error(`tavily_http_${r.status}`);
  const j = await r.json().catch(()=>({}));
  const items = Array.isArray(j.results) ? j.results.map(x => ({
    title: x.title,
    url: x.url,
    snippet: x.content,
    published: x.published_date || null
  })) : [];
  return items;
}

// Existing live route (general-purpose; preserved)
router.get('/live', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const region = String(req.query.region || 'dach');
    const query = q ? q : boostQuery(region);
    const items = await tavilySearch(query, 12);
    res.set('Cache-Control','public, max-age=120');
    res.json({ items: dedupe(items) });
  } catch (e) {
    console.error('news/live failed', e);
    res.status(500).json({ error: 'tavily_failed' });
  }
});

// New: Opinionated brief for normal KI-Nutzer in DACH – curated queries + tips
router.get('/brief', async (req, res) => {
  const region = String(req.query.region || 'dach');
  const limit = Math.max(3, Math.min(20, Number(req.query.limit || 10)));

  const tips = [
    { kind: 'tip', title: 'Tipp: 2FA überall aktivieren', snippet: 'Aktiviere Zwei-Faktor-Authentifizierung für Mail, Banking und KI-Accounts. Bevorzugt App-basierte Codes oder Passkeys.' },
    { kind: 'tip', title: 'Tipp: Bilder prüfen (Exif/Reverse Image Search)', snippet: 'Bei viralen KI-Bildern: Reverse-Suche (Google/Bing) und Quellencheck; Exif-Daten sind oft entfernt.' },
    { kind: 'tip', title: 'Tipp: Datenhygiene', snippet: 'Keine Kundendaten in öffentliche Modelle einfügen. Nutze On-Prem/Enterprise-Optionen, falls nötig.' }
  ];

  try {
    const queryMain = boostQuery(region);
    const querySafety = `${SAFETY_TERMS.join(' OR ')} site:${DACH_SITES.join(' OR site:')}`;
    const [main, safety] = await Promise.all([
      tavilySearch(queryMain, limit),
      tavilySearch(querySafety, Math.ceil(limit/2))
    ]);
    let items = dedupe([...(main||[]), ...(safety||[])]).slice(0, limit);
    res.set('Cache-Control','public, max-age=120');
    res.json({ items, tips });
  } catch (e) {
    console.error('news/brief failed', e);
    res.status(200).json({ items: [], tips }); // graceful fallback with tips
  }
});

export default router;
