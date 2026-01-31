# Backend Briefing: Gemini API 404 Error

## Fehlerbeschreibung

**Datum:** 2026-01-31
**Endpoint:** `/api/model-battle`
**Fehler:** `Gemini API error: 404`

### Log-Auszug
```
[inf]  [2026-01-31T21:20:55.107Z] OPTIONS /api/model-battle - 204 (3ms)
[err]  Gemini error: Gemini API error: 404
[inf]  [2026-01-31T21:20:59.365Z] POST /api/model-battle - 200 (4225ms)
```

---

## Analyse

Der 404-Fehler bei der Gemini API bedeutet: **"Resource Not Found"**. Die API-Anfrage erreicht Google, aber die angeforderte Ressource existiert nicht.

---

## Mögliche Ursachen (bitte prüfen)

### 1. Falscher Modellname
Google Gemini hat spezifische Modellnamen. Häufige Fehler:

| Falsch | Richtig |
|--------|---------|
| `gemini-pro` | `gemini-1.5-pro` oder `gemini-2.0-flash` |
| `gemini-1.0-pro` | Deprecated - verwende neuere Version |
| `gemini` | Benötigt vollständigen Modellnamen |

**Aktuelle Modellnamen (Stand Januar 2026):**
- `gemini-2.0-flash` (schnell, günstig)
- `gemini-2.0-flash-lite` (noch schneller)
- `gemini-1.5-pro` (leistungsstark)
- `gemini-1.5-flash` (balanced)

### 2. Falsche API-URL
Die Gemini API-URL muss korrekt formatiert sein:

```
# Generative Language API (empfohlen)
https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent

# Vertex AI (alternative)
https://[REGION]-aiplatform.googleapis.com/v1/projects/[PROJECT]/locations/[REGION]/publishers/google/models/{MODEL}:generateContent
```

**Prüfen:**
- Ist `/v1beta/` im Pfad? (nicht `/v1/` für neuere Modelle)
- Ist der Modellname URL-encoded?
- Stimmt die Region (falls Vertex AI)?

### 3. API-Key Konfiguration
Prüfen ob der API-Key korrekt gesetzt ist:

```bash
# Environment Variable
echo $GOOGLE_API_KEY
# oder
echo $GEMINI_API_KEY
```

Der API-Key muss:
- Für "Generative Language API" aktiviert sein
- Keine IP-Restrictions haben (oder Railway-IPs erlauben)
- Nicht abgelaufen sein

### 4. API nicht aktiviert
Im Google Cloud Console prüfen:
1. Gehe zu **APIs & Services > Enabled APIs**
2. Suche nach "Generative Language API"
3. Falls nicht aktiviert → **Enable** klicken

### 5. Region-Einschränkungen
Gemini ist nicht in allen Regionen verfügbar. Railway-Server könnten in einer nicht unterstützten Region laufen.

---

## Debugging-Schritte

### Schritt 1: Logging erweitern
```javascript
// Vor dem API-Call loggen:
console.log('Gemini Request URL:', url);
console.log('Gemini Model:', modelName);
console.log('Gemini API Key exists:', !!process.env.GOOGLE_API_KEY);
```

### Schritt 2: Direkten Test durchführen
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, test message"}]
    }]
  }'
```

### Schritt 3: Error-Response analysieren
Der 404 sollte einen Body haben mit Details:
```javascript
try {
  // Gemini call
} catch (error) {
  console.error('Gemini Full Error:', JSON.stringify(error.response?.data || error.message));
}
```

---

## Code-Review Checkliste

Bitte im Backend-Code prüfen:

- [ ] Welcher Modellname wird verwendet? (`gemini-???`)
- [ ] Wie ist die API-URL aufgebaut?
- [ ] Wird der API-Key korrekt aus Environment gelesen?
- [ ] Gibt es Error-Handling das den vollen Error-Body loggt?
- [ ] Ist das Gemini-SDK/Library auf dem neuesten Stand?

---

## Empfohlene Lösung

Falls ihr das offizielle Google AI SDK für Node.js verwendet:

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Verwende einen aktuellen Modellnamen:
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const result = await model.generateContent("Your prompt here");
```

**Package aktualisieren:**
```bash
npm update @google/generative-ai
```

---

## Frontend-Status

**Hinweis:** Das Frontend zeigt aktuell nur 3 Modelle an:
- Claude
- GPT-4o Mini
- Perplexity

Falls Gemini als 4. Modell hinzugefügt werden soll, muss auch das Frontend angepasst werden (`model-battle.js`, Zeile 208).

---

## Nächste Schritte

1. Backend-Code lokalisieren wo Gemini aufgerufen wird
2. Modellname und API-URL verifizieren
3. API-Key in Google Cloud Console prüfen
4. Ggf. SDK-Version aktualisieren
5. Nach Fix: Frontend für Gemini-Anzeige erweitern

---

**Erstellt:** 2026-01-31
**Für:** Backend-Team
**Status:** Awaiting Investigation
