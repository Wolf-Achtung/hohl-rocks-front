# hohl.rocks — 1.4.2

## Neu
- **News-Regionen**: Alle / DACH / EU, inkl. **Digest‑Absatz** und **Digest‑Karte (SVG)** unter `/api/digest.svg?region=...`.
- **Prompts**: 15 Vorlagen mit **Kategorien** + Favoriten (★).
- **Bubbles**: 5 Größen‑Buckets, **Very‑slow‑mode**, sanfter Drift; Text bleibt lesbar dank Kollisions‑Entschärfung.
- **Audio**: Presets + subtile Auto‑Modulation; very‑slow bevorzugt dunkles Preset.

## Start
- Lokal: `npm i && npm run dev` → http://localhost:8080
- Railway: Start `node server/index.js` · Health `/healthz`

## ENV
- Optional: `ALLOWED_ORIGINS`, `TAVILY_API_KEY`, `PERPLEXITY_API_KEY`
- Video: ersetze `public/videos/road.mp4` durch deine Datei

## Python-Job
Siehe zusätzliches Paket **python-ingest-1.4.2** mit Async‑Scheduler (getrennte Railway‑Service empfohlen).
