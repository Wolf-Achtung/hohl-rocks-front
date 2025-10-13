/* hohl.rocks API – v1.4.5 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const ALLOWED = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const isAllowed = (origin) => {
  if (!origin) return true;
  try {
    const o = new URL(origin).origin;
    return ALLOWED.includes(o);
  } catch {
    return false;
  }
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, cb) => cb(null, isAllowed(origin))
}));

app.use('/api', rateLimit({ windowMs: 60_000, max: 90 }));

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true, version: '1.4.5' }));

// News
import newsRouter from './news.js';
app.use('/api', newsRouter);

// Optional: statische Auslieferung (nur zum Testen)
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`api up on :${PORT}`));
