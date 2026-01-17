# Briefing: Backend-Anpassung an neues Frontend

**Für:** Backend-Entwicklung (hohl-rocks-back)
**Von:** Frontend-Redesign (hohl-rocks-front)
**Datum:** 2026-01-17

---

## Kontext: Was hat sich im Frontend geändert?

Das hohl.rocks Frontend wurde komplett redesigned mit neuem Fokus:

### VORHER: Technische Tool-Sammlung
```
- Prompt Generator
- Prompt Optimizer
- Prompt Library
- Daily Challenge
- Model Battle
- KI-News
```

### NACHHER: Persönliche Marke + Projekt-Showcase
```
- 4 Projekte vorgestellt (ki-sicherheit, art-radar, akut, achtung)
- Model Battle Arena (HAUPTFEATURE)
- Über Wolf mit TÜV-Zertifizierung
- Links zu ki-sicherheit.jetzt für B2B
```

---

## Backend-Features: Neue Prioritäten

### KRITISCH (Wird aktiv genutzt)

| Feature | Endpoint | Status | Anmerkung |
|---------|----------|--------|-----------|
| **Model Battle** | `/api/model-battle` | Funktioniert | HAUPTFEATURE - muss stabil bleiben |
| **Health Check** | `/api/health` | Funktioniert | Für Monitoring |

### NIEDRIGE PRIORITÄT (Von Hauptseite entfernt)

| Feature | Endpoint | Status | Anmerkung |
|---------|----------|--------|-----------|
| Prompt Generator | `/api/prompt-generate` | Funktioniert | Nicht mehr verlinkt |
| Prompt Optimizer | `/api/prompt-optimize` | Funktioniert | Nicht mehr verlinkt |
| Prompt Library | `/api/prompts` | Funktioniert | Nicht mehr verlinkt |
| Daily Challenge | `/api/daily-challenge` | BUG | Nicht mehr verlinkt |
| KI-News | `/api/news` | Veraltet | Nicht mehr verlinkt |
| Spark of the Day | `/api/spark` | Funktioniert | Nicht mehr verlinkt |

**Wichtig:** Die Seiten `/prompt-library.html` und `/daily-challenge.html` existieren noch und sind erreichbar, aber nicht mehr von der Hauptseite verlinkt. Die Backend-Endpoints sollten weiterhin funktionieren, haben aber niedrigere Priorität.

---

## Empfohlene Backend-Änderungen

### 1. KRITISCH: Model Battle stabilisieren

Da Model Battle jetzt das Hauptfeature ist:

- [ ] **Rate-Limiting hinzufügen** für `/api/model-battle`
  - Vorschlag: Max 10 Requests/Minute pro IP
  - Verhindert Missbrauch und API-Kosten

- [ ] **Error-Handling verbessern**
  - Graceful Degradation wenn ein Model ausfällt
  - Timeout-Handling für langsame Responses

- [ ] **Caching erwägen**
  - Identische Prompts könnten gecached werden (kurz, 5 Min)

### 2. MITTEL: Veraltete Features aufräumen

**Option A: Beibehalten aber dokumentieren**
- Die nicht mehr verlinkten Features könnten später wieder genutzt werden
- API-Dokumentation aktualisieren

**Option B: Deprecation**
- Daily Challenge Bug fixen oder Endpoint entfernen
- KI-News aktualisieren oder Endpoint entfernen

### 3. NIEDRIG: Bekannte Bugs

| Bug | Priorität | Empfehlung |
|-----|-----------|------------|
| Daily Challenge nicht deterministisch | NIEDRIG | Nur fixen wenn Feature reaktiviert wird |
| Version-Inkonsistenz (2.0 vs 2.1) | NIEDRIG | Vereinheitlichen auf 2.1 |
| Improved Prompt Score +3 Manipulation | NIEDRIG | Entfernen oder dokumentieren |

---

## API-Endpoints Übersicht

### Aktiv genutzt vom neuen Frontend

```
GET  /api/health              - Health Check
POST /api/model-battle        - Model Battle (Claude vs GPT vs Perplexity)
```

### Nicht mehr aktiv verlinkt (aber funktionsfähig halten)

```
GET  /api/prompts             - Prompt Library
POST /api/prompt-generate     - Prompt Generator
POST /api/prompt-optimize     - Prompt Optimizer
GET  /api/daily-challenge     - Daily Challenge (BUG)
POST /api/daily-challenge     - Challenge Submission
GET  /api/news                - KI-News (veraltet)
GET  /api/spark               - Spark of the Day
GET  /api/self                - API Self-Description
```

---

## Sicherheitsempfehlungen

Da Model Battle jetzt prominenter ist:

1. **Rate-Limiting implementieren**
   ```
   /api/model-battle: 10 req/min/IP
   Andere Endpoints: 30 req/min/IP
   ```

2. **Input-Validierung verschärfen**
   - Max Prompt-Länge: 2000 Zeichen
   - Keine Scripts/HTML im Prompt
   - Sanitization vor API-Weiterleitung

3. **Monitoring hinzufügen**
   - Logging für Model Battle Usage
   - Alert bei ungewöhnlich hoher Last

---

## Neue Architektur-Empfehlung

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│                   hohl.rocks                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hauptseite (index.html)                          │   │
│  │ • Projekt-Showcase (statisch)                    │   │
│  │ • Über Wolf (statisch)                           │   │
│  │ • Link zu Model Battle                           │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Model Battle (model-battle.html)                 │   │
│  │ • API-Call zu /api/model-battle                  │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
└──────────────────────────│──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                               │
│           hohl-rocks-back (Railway)                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ PRIORITÄT HOCH                                   │   │
│  │ POST /api/model-battle  ← Rate-Limited           │   │
│  │ GET  /api/health                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ PRIORITÄT NIEDRIG (Legacy)                       │   │
│  │ GET  /api/prompts                                │   │
│  │ POST /api/prompt-generate                        │   │
│  │ POST /api/prompt-optimize                        │   │
│  │ GET  /api/daily-challenge                        │   │
│  │ GET  /api/news                                   │   │
│  │ GET  /api/spark                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Zusammenfassung

### Sofort umsetzen
1. Rate-Limiting für `/api/model-battle`
2. Besseres Error-Handling für Model Battle

### Kann warten
1. Daily Challenge Bug (nicht mehr verlinkt)
2. KI-News Update (nicht mehr verlinkt)
3. Version-Vereinheitlichung

### Nicht ändern
1. Prompt Library Endpoint (funktioniert, evtl. später wieder genutzt)
2. Prompt Generator/Optimizer (funktioniert, evtl. später wieder genutzt)

---

## Offene Fragen

1. **Sollen die Legacy-Endpoints langfristig entfernt werden?**
   - Aktuell: Behalten, aber niedrige Priorität

2. **Monitoring-Dashboard gewünscht?**
   - Model Battle Usage tracken?

3. **API-Key für externe Projekte?**
   - Falls ki-sicherheit.jetzt das Backend nutzen soll

---

*Briefing erstellt von Claude Code (Frontend-Redesign)*
