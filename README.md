# hohl.rocks – API (Railway)
Start command: `node server/index.js`
Env:
  - ALLOWED_ORIGINS="https://hohl.rocks,https://www.hohl.rocks"
  - TAVILY_API_KEY=...
Health: `/healthz` and `/api/healthz`
News:   `/api/news/live?region=dach|eu|all`
