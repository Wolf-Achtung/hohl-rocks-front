/* hohl.rocks Front API – v2.0 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimiter } from './rate-limit.js';
import newsRouter from './news.js';
import { sseRouter } from './sse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 8080);
const NODE_ENV = String(process.env.NODE_ENV || 'production');

// Trust proxy for correct client IPs when behind reverse proxies
app.set('trust proxy', 1);

// Allowed origins via env (comma separated), fallback to same-origin
const ALLOWED = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const isAllowed = (origin) => {
  if (!origin) return true; // same-origin
  try { return ALLOWED.length === 0 ? true : ALLOWED.includes(new URL(origin).origin); }
  catch { return false; }
};

// Security, gzip, logging
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(cors({
  origin: (origin, cb) => cb(null, isAllowed(origin)),
  methods: ['GET','HEAD','OPTIONS'],
  credentials: false
}));
app.use((_, res, next) => { res.set('Vary', 'Origin'); next(); });

// Rate limit everything under /api
app.use('/api', rateLimiter);

// Routers
app.use('/api/news', newsRouter);
app.use('/api/sse', sseRouter);

// Health/ready
app.get('/healthz', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get('/readyz', (_req, res) => res.json({ ready: true }));

// Static assets (cache aggressively except HTML)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, {
  etag: true,
  lastModified: true,
  maxAge: '1h',
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    else res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
  }
}));

// SPA-style fallback to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[hohl.rocks] ${NODE_ENV} server listening on http://localhost:${PORT}`);
});
