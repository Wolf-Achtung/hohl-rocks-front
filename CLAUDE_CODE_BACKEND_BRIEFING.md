# Claude Code Backend-Briefing: hohl-rocks-back

**Für: Claude Code im Backend-Projekt**
**Von: Frontend-Analyse (hohl-rocks-front)**

---

## AUFGABE

Analysiere und optimiere das Backend-Projekt `hohl-rocks-back` basierend auf den Erkenntnissen aus der Frontend-Analyse.

---

## 1. KRITISCHE PRÜFUNGEN

### 1.1 Daily Challenge Status

Das Feature wurde im Frontend entfernt. Prüfe im Backend:

```bash
# Suche nach Daily Challenge Endpoints
grep -r "daily-challenge" --include="*.js" --include="*.ts"
grep -r "dailyChallenge" --include="*.js" --include="*.ts"
```

**Entscheidung nötig:**
- [ ] Endpoints `/api/daily-challenge` und `/api/submit-challenge` entfernen
- [ ] ODER: Endpoints behalten für späteren Relaunch

**Empfehlung:** Endpoints behalten, aber dokumentieren dass sie derzeit nicht verwendet werden.

### 1.2 API-Endpunkte verifizieren

Prüfe diese Endpoints auf Funktionalität:

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/health` | GET | Health Check |
| `/api/self` | GET | API Info |
| `/api/model-battle` | POST | KI-Modell-Vergleich |
| `/api/prompts` | GET | Prompt Library Daten |
| `/api/prompt-generator` | POST | Prompt generieren |
| `/api/prompt-optimizer` | POST | Prompt optimieren |
| `/api/news` | GET | News Aggregation |
| `/api/daily-challenge` | GET | (derzeit ungenutzt) |
| `/api/submit-challenge` | POST | (derzeit ungenutzt) |

### 1.3 Rate Limiting prüfen

Das Frontend erwartet sinnvolles Rate Limiting:

```javascript
// Prüfe ob Rate Limiting konfiguriert ist
// Empfohlene Limits:
// - /api/model-battle: 10 requests/minute pro IP
// - /api/prompt-generator: 20 requests/minute pro IP
// - /api/prompts: 60 requests/minute pro IP (read-only)
```

---

## 2. SICHERHEITS-AUDIT

### 2.1 Input Validation

Prüfe alle POST-Endpoints auf:
- [ ] Prompt-Länge begrenzt (max 2000-5000 Zeichen)
- [ ] HTML/Script Tags escaped oder rejected
- [ ] Request Body Size Limit gesetzt

### 2.2 API Keys

Prüfe Environment Variables:
- [ ] `ANTHROPIC_API_KEY` - Für Claude API
- [ ] `OPENAI_API_KEY` - Für GPT API
- [ ] `PERPLEXITY_API_KEY` - Für Perplexity API (falls verwendet)

**Niemals** API Keys in Response zurückgeben!

### 2.3 CORS

Prüfe CORS-Konfiguration:
```javascript
// Empfohlen: Spezifische Origins statt '*'
const allowedOrigins = [
  'https://hohl.rocks',
  'https://www.hohl.rocks'
];
```

### 2.4 Error Handling

Prüfe ob Fehler sicher behandelt werden:
- [ ] Keine Stack Traces in Production Responses
- [ ] Keine API Keys in Error Messages
- [ ] Sinnvolle HTTP Status Codes (400, 401, 429, 500)

---

## 3. PERFORMANCE-CHECKS

### 3.1 Response Times

Analysiere typische Response Times:
- Model Battle: < 30s (wegen KI-Calls)
- Prompt Library: < 500ms
- Health Check: < 100ms

### 3.2 Caching

Prüfe ob Caching implementiert ist für:
- [ ] `/api/prompts` - Statische Daten, gut cachebar
- [ ] `/api/news` - Mit TTL (z.B. 5 Minuten)

### 3.3 Timeouts

Prüfe KI-API Timeouts:
- Claude: 60s Timeout empfohlen
- GPT: 60s Timeout empfohlen
- Perplexity: 60s Timeout empfohlen

---

## 4. CODE-QUALITÄT

### 4.1 Console Logs

Entferne oder konditioniere Console Logs für Production:
```javascript
// Vorher
console.log('API called:', endpoint);

// Nachher
if (process.env.NODE_ENV === 'development') {
  console.log('API called:', endpoint);
}
```

### 4.2 Error Handling

Prüfe auf leere catch-Blöcke:
```javascript
// Schlecht
try { ... } catch (err) {}

// Besser
try { ... } catch (err) {
  logger.error('Operation failed:', err.message);
  throw new ApiError(500, 'Internal server error');
}
```

---

## 5. DOKUMENTATION

### 5.1 API-Dokumentation

Falls nicht vorhanden, erstelle eine README.md mit:
- Alle Endpoints mit Request/Response Beispielen
- Environment Variables Liste
- Deployment Anweisungen

### 5.2 Kommentare

Stelle sicher, dass komplexe Logik kommentiert ist:
- Rate Limiting Konfiguration
- KI-API Integration
- Error Handling Strategien

---

## 6. OPTIONAL: Cleanup

### 6.1 Daily Challenge (falls entfernen)

```bash
# Dateien identifizieren
find . -name "*challenge*" -type f
find . -name "*daily*" -type f

# Routes entfernen aus main router
# Controller/Handler entfernen
# Tests entfernen
```

### 6.2 Unbenutzte Dependencies

Prüfe package.json auf unbenutzte Dependencies:
```bash
npx depcheck
```

---

## 7. DEPLOYMENT-CHECKS

### 7.1 Railway Konfiguration

Prüfe:
- [ ] NODE_ENV=production gesetzt
- [ ] Alle API Keys als Environment Variables
- [ ] Memory/CPU Limits angemessen
- [ ] Auto-Restart bei Crashes

### 7.2 Health Endpoint

Stelle sicher, dass `/health` sinnvolle Daten zurückgibt:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T...",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## ZUSAMMENFASSUNG

**Priorität HOCH:**
1. Rate Limiting verifizieren
2. Input Validation prüfen
3. CORS-Konfiguration sichern

**Priorität MITTEL:**
4. Console Logs konditionieren
5. Error Handling verbessern
6. API-Dokumentation erstellen

**Priorität NIEDRIG:**
7. Daily Challenge Entscheidung
8. Unbenutzte Dependencies entfernen
9. Performance-Monitoring

---

*Dieses Briefing ist für Claude Code im Backend-Projekt bestimmt.*
*Bei Rückfragen: Kommunikation über die Frontend-Dokumentation.*
