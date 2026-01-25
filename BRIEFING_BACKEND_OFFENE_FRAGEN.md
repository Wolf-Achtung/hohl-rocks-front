# Backend-Briefing: Offene Fragen

**Stand: Januar 2025**
**Betrifft: hohl-rocks-back (Railway)**

---

## Offene Punkte zur Klärung

### 1. Daily Challenge

**Status:** Feature existiert (`/daily-challenge.html`), API-Endpoint vorhanden (`/api/daily-challenge`), aber **nicht auf der Hauptseite verlinkt**.

**Fragen:**
- Soll Daily Challenge reaktiviert und verlinkt werden?
- Funktioniert der Endpoint noch?
- Gibt es Gamification-Daten (Streaks, Badges) die gespeichert werden?

**Entscheidung benötigt:**
- [ ] Feature reaktivieren
- [ ] Feature entfernen
- [ ] Feature überarbeiten

---

### 2. Prompt Generator / Optimizer

**Status:** API-Endpoints existieren (`/api/prompt-generator`, `/api/prompt-optimizer`), aber keine UI auf der Hauptseite.

**Fragen:**
- Sind diese Features aktiv?
- Sollen sie in die Prompt Library integriert werden?

---

### 3. News Aggregation

**Status:** `/data/news.json` mit 12 KI-News-Quellen, API-Endpoint vorhanden.

**Fragen:**
- Wird der News-Feed aktiv genutzt?
- Gibt es Caching/Rate-Limiting?

---

### 4. Rate Limiting

**Status:** Backend hat `express-rate-limit` und `rate-limiter-flexible` installiert.

**Fragen:**
- Welche Limits gelten für Model Battle?
- Gibt es Logs zu blockierten Requests?

---

### 5. API Health

**Endpoints zu prüfen:**
- `/api/self` — Health Check
- `/api/model-battle` — Haupt-Feature
- `/api/daily-challenge` — Derzeit unverlinkt
- `/api/prompt-generator` — Derzeit unverlinkt
- `/api/news` — Derzeit unverlinkt

---

## Nächste Schritte

1. Backend lokal testen oder Logs prüfen
2. Entscheidungen zu Daily Challenge treffen
3. Feature-Roadmap für 2025 definieren

---

*Dieses Briefing dient als Gesprächsgrundlage für Backend-Änderungen.*
