/* hohl.rocks API – v1.4.8 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const ALLOWED = String(process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const isAllowed = (origin) => {
  if (!origin) return true; // curl, server-to-server
  try {
    const o = new URL(origin).origin;
    return ALLOWED.includes(o);
  } catch {
    return false;
  }
};

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.use(compression());

app.use(cors({
  origin: (origin, cb) => cb(null, isAllowed(origin)),
  methods: ['GET','HEAD','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}));
app.use((req,res,next)=>{ res.set('Vary','Origin'); next(); });
app.options('*', cors());

app.use('/api', rateLimit({ windowMs: 60_000, max: 90 }));

// Health (alias unter / und /api/)
const health = (_req, res) => res.json({ ok: true, version: '1.4.8' });
app.get('/healthz', health);
app.get('/api/healthz', health);

// Diagnostics (keine Secrets)
app.get('/api/ping', (_req, res) => {
  res.json({
    ok: true,
    tavily: !!process.env.TAVILY_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    allowed: ALLOWED
  });
});

// News
import newsRouter from './news.js';
app.use('/api', newsRouter);

// Optional: statische Auslieferung (nur zum Testen)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Error handler (sanitized)
app.use((err, _req, res, _next) => {
  console.error('Unhandled', err?.message || err);
  res.status(500).json({ ok:false, error:'internal_error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`api up on :${PORT}`));
