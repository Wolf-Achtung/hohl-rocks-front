# Backend-Briefing: Technische Anforderungen & Bugfixes

**Stand: Januar 2025**
**Für: Backend-Entwicklung (hohl-rocks-back auf Railway)**

---

## 1. KRITISCHE BUGS ZU FIXEN

### 1.1 API-Endpunkte prüfen

| Endpoint | Status | Problem | Priorität |
|----------|--------|---------|-----------|
| `/api/daily-challenge` | UNKLAR | Nicht mehr auf Hauptseite verlinkt | HOCH |
| `/api/submit-challenge` | UNKLAR | Abhängig von daily-challenge | HOCH |
| `/api/model-battle` | AKTIV | Funktioniert | - |
| `/api/prompt-generator` | UNKLAR | Nicht in UI integriert | MITTEL |
| `/api/prompt-optimizer` | UNKLAR | Nicht in UI integriert | MITTEL |
| `/api/prompts` | AKTIV | Für Prompt Library | - |
| `/api/news` | UNKLAR | Feature nicht prominent | NIEDRIG |
| `/health` | AKTIV | Health Check | - |

### 1.2 Daily Challenge - Entscheidung nötig

**Aktueller Stand:**
- Frontend existiert: `/daily-challenge.html`
- JavaScript existiert: `/daily-challenge.js`
- API-Endpoint existiert: `/api/daily-challenge`
- **ABER**: Nicht mehr auf Hauptseite verlinkt

**Fragen:**
1. Soll Daily Challenge reaktiviert werden?
2. Wenn ja: Funktioniert der Backend-Endpoint noch?
3. Gibt es Rate-Limiting für Challenge-Submissions?

**Empfehlung:**
- Endpoint testen: `GET /api/daily-challenge`
- Logs prüfen: Gibt es 500er Errors?
- Entscheidung treffen: Reaktivieren oder Feature entfernen

---

## 2. RATE LIMITING ANALYSE

### 2.1 Aktuelle Konfiguration (Frontend)

Im `package.json` sind diese Dependencies:
- `express-rate-limit`: ^7.2.0
- `rate-limiter-flexible`: ^5.0.0

### 2.2 Fragen an Backend

1. **Model Battle Rate Limiting:**
   - Wie viele Requests pro User/IP pro Minute?
   - Was passiert bei Überschreitung? (429 Response?)
   - Gibt es einen Cooldown?

2. **Daily Challenge Rate Limiting:**
   - Wie viele Submissions pro Tag pro User?
   - Wird IP-basiert oder Session-basiert limitiert?

3. **Allgemein:**
   - Gibt es Logs für geblockte Requests?
   - Wird Rate Limiting umgangen? (z.B. durch Proxy)

---

## 3. API RESPONSE VALIDIERUNG

### 3.1 Model Battle Response

**Expected Format:**
```json
{
  "responses": [
    {
      "model": "claude",
      "name": "Claude Sonnet 4",
      "response": "...",
      "responseTime": 1234,
      "success": true
    },
    {
      "model": "gpt",
      "name": "GPT-4o Mini",
      "response": "...",
      "responseTime": 1234,
      "success": true
    },
    {
      "model": "perplexity",
      "name": "Perplexity Sonar Pro",
      "response": "...",
      "responseTime": 1234,
      "success": true
    }
  ]
}
```

**Zu prüfen:**
- Was passiert, wenn ein Modell nicht antwortet?
- Gibt es Timeout-Handling?
- Wird `success: false` zurückgegeben bei Fehlern?

### 3.2 Daily Challenge Response

**Expected Format (GET):**
```json
{
  "challenge": {
    "theme": "KI-Ethik",
    "challenges": {
      "beginner": {
        "title": "...",
        "description": "...",
        "task": "...",
        "hint": "...",
        "estimatedTime": "5-10 Min"
      },
      "intermediate": { ... },
      "expert": { ... }
    }
  }
}
```

**Expected Format (POST /api/submit-challenge):**
```json
{
  "evaluation": {
    "badge": "gold|silver|bronze",
    "score": 85,
    "summary": "...",
    "feedback": {
      "positive": ["..."],
      "improvements": ["..."]
    }
  }
}
```

---

## 4. SICHERHEITS-CHECKLISTE

### 4.1 Input Validation

- [ ] Prompt-Länge begrenzt? (Frontend: 2000 Zeichen)
- [ ] HTML/Script Tags escaped?
- [ ] SQL Injection verhindert?
- [ ] Rate Limiting aktiv?

### 4.2 Output Sanitization

- [ ] AI-Responses escaped vor Anzeige?
- [ ] Keine sensiblen Daten in Responses?

### 4.3 CORS

- [ ] Welche Origins sind erlaubt?
- [ ] Ist `*` konfiguriert? (Sicherheitsrisiko)

---

## 5. LOGGING & MONITORING

### 5.1 Fragen

1. **Error Logging:**
   - Wo werden Errors geloggt? (Railway Logs?)
   - Gibt es Error-Alerts?

2. **Usage Metrics:**
   - Wie viele Model Battles pro Tag?
   - Wie viele Daily Challenge Submissions?
   - Welches Modell wird am häufigsten gewählt?

3. **Performance:**
   - Durchschnittliche Response-Zeit?
   - Gibt es Timeouts?

---

## 6. FEATURE REQUESTS (OPTIONAL)

### 6.1 Für Daily Challenge Relaunch

Wenn Daily Challenge reaktiviert wird, wären diese Features sinnvoll:

1. **Challenge-Historie API:**
   - `GET /api/challenge-history?userId=...`
   - Liefert vergangene Challenges zurück

2. **Leaderboard API:**
   - `GET /api/leaderboard?period=week|month|all`
   - Top-Scorer mit Badges

3. **Streak-Tracking Backend:**
   - Aktuell nur im Frontend (LocalStorage)
   - Backend-Persistierung wäre robuster

### 6.2 Für Prompt Generator/Optimizer

Wenn diese Features integriert werden sollen:

1. **Prompt Generator:**
   - Was generiert er genau?
   - Welche Parameter akzeptiert er?

2. **Prompt Optimizer:**
   - Wie optimiert er Prompts?
   - Gibt es Vorher/Nachher-Vergleich?

---

## 7. DEPLOYMENT NOTES

### 7.1 Railway Konfiguration

**Aktuell:**
- Frontend redirected `/api/*` zu Railway Backend
- Base URL: `https://hohl-rocks-back-production.up.railway.app`

**Zu prüfen:**
- Ist der Service stabil?
- Gibt es Cold-Start-Probleme?
- Memory/CPU Limits?

### 7.2 Env Variables

Diese Variables werden vermutlich benötigt:
- `ANTHROPIC_API_KEY` - Für Claude
- `OPENAI_API_KEY` - Für GPT
- `PERPLEXITY_API_KEY` - Für Perplexity
- `NODE_ENV` - production/development

---

## 8. NÄCHSTE SCHRITTE

### Sofort (Diese Woche)

1. [ ] Daily Challenge Endpoint testen
2. [ ] Rate Limiting Konfiguration dokumentieren
3. [ ] Error Logs der letzten 7 Tage analysieren

### Kurzfristig (2 Wochen)

4. [ ] Entscheidung: Daily Challenge reaktivieren?
5. [ ] Prompt Generator/Optimizer integrieren?
6. [ ] CORS-Konfiguration prüfen

### Mittelfristig (1 Monat)

7. [ ] Usage Analytics implementieren
8. [ ] Leaderboard API (falls Daily Challenge reaktiviert)
9. [ ] Performance-Monitoring aufsetzen

---

## 9. KONTAKT & KOMMUNIKATION

**Für Rückfragen:**
- Dieses Briefing ist die Grundlage für Backend-Änderungen
- Vor größeren Änderungen bitte abstimmen
- Frontend-Änderungen werden parallel gemacht

---

*Dokument erstellt: Januar 2025*
*Version: 1.0*
