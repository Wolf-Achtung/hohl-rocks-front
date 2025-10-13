import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { createServer } from 'http';
import { rateLimiter } from './rate-limit.js';
import { newsRouter } from './news.js';
import { sseRouter } from './sse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 8080;
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:' + PORT)
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", "data:"],
      "connect-src": ["'self'", ...ORIGINS, "https:"],
      "media-src": ["'self'", "blob:"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use('/api', cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = ORIGINS.includes(origin) || ORIGINS.includes('*');
    cb(ok ? null : new Error('CORS: origin not allowed'), ok);
  }
}));

app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use(morgan(':date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms'));

app.get('/healthz', (req, res) => res.json({ ok: true, ts: new Date().toISOString(), version: '1.4.2' }));

app.use('/api', rateLimiter);
app.use('/api', newsRouter);
app.use('/api', sseRouter);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, { maxAge: '1h', etag: true }));

app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|map|svg|png|jpg|jpeg|webp|mp4|json)$/)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  next();
});

app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

server.listen(PORT, () => console.log('[info] server up on', PORT));
process.on('SIGTERM', () => { console.log('[info] received SIGTERM, shutting down gracefully'); server.close(() => process.exit(0)); });
