# Backend-Briefing: hohl.rocks Optimierungen

**Datum:** 2026-02-01
**Projekt:** hohl.rocks Backend (Railway)
**Ziel:** Web- und Mobile-Optimierungen umsetzen

---

## 1. Aktuelle Backend-Endpoints

Das Frontend nutzt folgende API-Endpoints:

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/self` | GET | Backend Self-Test & UI-Konfiguration |
| `/api/chat` | POST | Chat-Widget Nachrichten |
| `/api/model-battle` | POST | Model Battle Arena (Claude, GPT, etc.) |
| `/api/prompt-generator` | POST | Prompt generieren |
| `/api/prompt-optimizer` | POST | Prompt optimieren |
| `/api/prompts` | GET | Prompt-Bibliothek abrufen |
| `/api/prompts/:id` | GET | Einzelnen Prompt abrufen |
| `/api/daily-challenge` | GET | Tages-Challenge abrufen |
| `/api/submit-challenge` | POST | Challenge-Antwort einreichen |
| `/api/news` | GET | KI-News abrufen |
| `/api/spark/today` | GET | Spark of the Day |
| `/healthz` | GET | Health Check |
| `/readyz` | GET | Readiness Check |

---

## 2. Empfohlene Backend-Optimierungen

### 2.1 Response Compression

```javascript
// Bereits im Frontend-Server konfiguriert, aber im Backend pruefen:
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

### 2.2 Caching-Headers setzen

```javascript
// Fuer statische API-Antworten (z.B. News, Sparks)
app.get('/api/news', async (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'Vary': 'Accept-Encoding'
  });
  // ... response
});

// Fuer dynamische Antworten (z.B. Chat, Battle)
app.post('/api/chat', async (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  });
  // ... response
});
```

### 2.3 Rate Limiting optimieren

```javascript
import rateLimit from 'express-rate-limit';

// Unterschiedliche Limits fuer verschiedene Endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 10, // 10 Anfragen pro Minute
  message: { error: 'Zu viele Anfragen. Bitte warte kurz.' }
});

const battleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // Model Battle ist teurer
  message: { error: 'Zu viele Battle-Anfragen.' }
});

app.post('/api/chat', chatLimiter, chatHandler);
app.post('/api/model-battle', battleLimiter, battleHandler);
```

### 2.4 CORS optimieren

```javascript
import cors from 'cors';

const corsOptions = {
  origin: [
    'https://hohl.rocks',
    'https://www.hohl.rocks',
    /\.netlify\.app$/  // Preview deployments
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 Stunden Preflight-Cache
};

app.use(cors(corsOptions));
```

### 2.5 Response-Format standardisieren

```javascript
// Einheitliche Response-Struktur
const sendSuccess = (res, data, meta = {}) => {
  res.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

const sendError = (res, status, message, code = 'ERROR') => {
  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
};
```

---

## 3. Performance-Optimierungen

### 3.1 Database Connection Pooling

```javascript
// Falls PostgreSQL/MySQL verwendet wird:
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### 3.2 Response Streaming fuer Chat

```javascript
// Streaming fuer bessere UX bei Chat-Antworten
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Stream AI response
  for await (const chunk of aiStream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.end();
});
```

### 3.3 Model Battle Parallelisierung

```javascript
// Alle Modelle parallel abfragen
app.post('/api/model-battle', async (req, res) => {
  const { question, models } = req.body;

  const results = await Promise.allSettled(
    models.map(model => queryModel(model, question))
  );

  const responses = results.map((result, i) => ({
    model: models[i],
    success: result.status === 'fulfilled',
    response: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));

  res.json({ responses });
});
```

---

## 4. Monitoring & Observability

### 4.1 Health Checks erweitern

```javascript
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/readyz', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    ai_providers: await checkAIProviders(),
    cache: await checkCache()
  };

  const allHealthy = Object.values(checks).every(c => c);

  res.status(allHealthy ? 200 : 503).json({
    ready: allHealthy,
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### 4.2 Request Logging

```javascript
import morgan from 'morgan';

// Custom Token fuer Response-Zeit
morgan.token('response-time-ms', (req, res) => {
  return res.get('X-Response-Time') || '-';
});

app.use(morgan(':method :url :status :response-time-ms ms'));
```

### 4.3 Error Tracking

```javascript
// Sentry oder aehnliches integrieren
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 5. Sicherheit

### 5.1 Helmet-Konfiguration

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 5.2 Input Validation

```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/chat',
  body('message').isString().trim().isLength({ min: 1, max: 2000 }),
  body('context').optional().isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... handler
  }
);
```

---

## 6. Mobile-spezifische Optimierungen

### 6.1 Response-Groesse minimieren

```javascript
// Kurze Feld-Namen fuer Mobile
app.get('/api/news', (req, res) => {
  const compact = req.query.compact === 'true';

  const news = getNews().map(item => compact ? {
    t: item.title,      // title
    d: item.date,       // date
    u: item.url         // url
  } : item);

  res.json({ items: news });
});
```

### 6.2 Pagination

```javascript
app.get('/api/prompts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const prompts = getPrompts();
  const paginated = prompts.slice(offset, offset + limit);

  res.json({
    items: paginated,
    pagination: {
      page,
      limit,
      total: prompts.length,
      pages: Math.ceil(prompts.length / limit)
    }
  });
});
```

---

## 7. Checkliste fuer Claude Code Backend

- [ ] Compression aktivieren (gzip/brotli)
- [ ] Caching-Headers fuer statische Endpoints
- [ ] Rate Limiting pro Endpoint-Typ
- [ ] CORS auf Produktion einschraenken
- [ ] Response-Format standardisieren
- [ ] Streaming fuer Chat implementieren
- [ ] Model Battle parallelisieren
- [ ] Health Checks erweitern
- [ ] Request Logging
- [ ] Error Tracking (Sentry)
- [ ] Input Validation
- [ ] Pagination fuer Listen-Endpoints
- [ ] Mobile-optimierte Responses (compact mode)

---

## 8. Umgebungsvariablen

```bash
# Erforderlich
NODE_ENV=production
PORT=3000

# AI Provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_KEY=...

# Monitoring (optional)
SENTRY_DSN=https://...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

**Erstellt von:** Claude Code
**Fuer:** hohl.rocks Backend Optimierung
