/* hohl.rocks API – v1.4.4 */
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const ALLOWED = String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.set('trust proxy', 1);

if (ALLOWED.length) {
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      cb(null, ALLOWED.some(a => origin.startsWith(a)));
    }
  }));
} else {
  app.use(cors());
}

app.use('/api', rateLimit({ windowMs: 60_000, max: 90 }));

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true, version: '1.4.4' }));

// News
import newsRouter from './news.js';
app.use('/api', newsRouter);

// Optional: statische Auslieferung (nur zum Testen)
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`api up on :${PORT}`));
