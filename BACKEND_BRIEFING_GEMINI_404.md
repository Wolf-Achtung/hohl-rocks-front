# Backend Briefing: Gemini API Integration

## Status: HANDLUNGSBEDARF

**Aktualisiert:** 2026-01-31
**Problem:** Gemini zeigt "Keine Antwort erhalten" im Frontend
**Endpoint:** `POST /api/model-battle`

---

## Aktuelle Umgebungsvariablen (Railway)

Der `GEMINI_API_KEY` ist bereits gesetzt. Folgende relevante Variablen existieren:

```env
GEMINI_API_KEY="XXX"  # ✅ Gesetzt
```

**Hinweis:** Der Key heißt `GEMINI_API_KEY`, nicht `GOOGLE_API_KEY`. Bitte im Code prüfen!

---

## Frontend Status: BEREIT

Das Frontend zeigt bereits alle 4 Modelle an:
- Claude ✅ funktioniert
- GPT ✅ funktioniert
- Perplexity ✅ funktioniert
- Gemini ❌ "Keine Antwort erhalten" (Backend-Problem)

**Frontend-Änderung:** "GPT-4o" wurde zu "GPT" umbenannt.

---

## Was im Backend zu tun ist

### 1. API-Key Variable prüfen

```javascript
// Prüfen ob der Code die richtige Variable liest:
const apiKey = process.env.GEMINI_API_KEY;  // NICHT process.env.GOOGLE_API_KEY
```

### 2. Modellname aktualisieren

Der 404-Fehler deutet auf einen falschen/veralteten Modellnamen hin:

| Veraltet (404) | Aktuell (funktioniert) |
|----------------|------------------------|
| `gemini-pro` | `gemini-2.0-flash` |
| `gemini-1.0-pro` | `gemini-1.5-pro` |
| `gemini` | `gemini-2.0-flash` |

**Empfohlen:** `gemini-2.0-flash` (schnell, günstig, aktuell)

### 3. Implementierung mit Google AI SDK

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key aus der korrekten Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Aktueller Modellname
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function callGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Error:', error);
    throw error;
  }
}
```

### 4. Alternative: Direkte REST API

Falls kein SDK verwendet wird:

```javascript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

async function callGeminiREST(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

---

## Schnelltest: API-Key validieren

Führe diesen cURL-Befehl auf dem Server aus:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Sag Hallo"}]}]}'
```

**Erwartete Antwort:** JSON mit `candidates[0].content.parts[0].text`

---

## Checkliste für Backend-Fix

- [ ] Prüfen: Wird `GEMINI_API_KEY` gelesen (nicht `GOOGLE_API_KEY`)?
- [ ] Prüfen: Welcher Modellname wird verwendet?
- [ ] Aktualisieren: Modellname auf `gemini-2.0-flash` setzen
- [ ] Optional: `@google/generative-ai` Paket installieren/aktualisieren
- [ ] Testen: `/api/model-battle` mit Prompt aufrufen
- [ ] Verifizieren: Gemini-Antwort erscheint im Frontend

---

## Response-Format

Das Frontend erwartet dieses Format vom `/api/model-battle` Endpoint:

```json
{
  "responses": [
    { "model": "claude", "text": "...", "time": 1.234 },
    { "model": "gpt", "text": "...", "time": 0.987 },
    { "model": "perplexity", "text": "...", "time": 1.567 },
    { "model": "gemini", "text": "...", "time": 0.876 }
  ]
}
```

**Wichtig:** Der `model`-Key muss exakt `"gemini"` (lowercase) sein.

---

## Google Cloud Console Prüfung

Falls der cURL-Test fehlschlägt:

1. Öffne https://console.cloud.google.com/
2. Gehe zu **APIs & Services > Enabled APIs**
3. Prüfe ob **"Generative Language API"** aktiviert ist
4. Falls nicht → Aktivieren

---

**Erstellt:** 2026-01-31
**Aktualisiert:** 2026-01-31
**Für:** Backend-Team
**Status:** Backend-Änderung erforderlich
