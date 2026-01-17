# REDESIGN-PLAN: hohl.rocks

**Datum:** 2026-01-17
**Status:** In Umsetzung

---

## Aktuelle vs. Neue Struktur

### VORHER

```
┌─────────────────────────────────────────┐
│ HERO: "Wolf Hohl"                       │
│ Taglines: TÜV-zertifiziert, 30 Jahre... │
├─────────────────────────────────────────┤
│ PROJEKTE: "Aktuelle Experimente"        │
│ • KI-Sicherheit.jetzt                   │
│ • Model Battle Arena                    │
│ • Prompt Library ❌                      │
│ • Daily AI Challenge ❌                  │
├─────────────────────────────────────────┤
│ WERKZEUGE: "Meine Werkzeuge"            │
│ • Prompt Generator ❌                    │
│ • Prompt Optimizer ❌                    │
│ • Model Battle                          │
│ • Daily Challenge ❌                     │
├─────────────────────────────────────────┤
│ TIMELINE: "Mein Weg mit KI"             │
│ (kurze Liste)                           │
├─────────────────────────────────────────┤
│ FOOTER                                  │
└─────────────────────────────────────────┘
```

### NACHHER

```
┌─────────────────────────────────────────┐
│ HERO: "Wolf Hohl"                       │
│ Taglines: TÜV-zertifiziert, 25 Jahre... │
│ + TÜV-Badge sichtbar                    │
├─────────────────────────────────────────┤
│ PROJEKT-SHOWCASE: "Meine Projekte" ✨    │
│ • ki-sicherheit.jetzt (B2B)             │
│ • art-radar.berlin (Kultur)             │
│ • akut.jetzt (Notfall)                  │
│ • achtung.jetzt (Sicherheit)            │
├─────────────────────────────────────────┤
│ KI AUSPROBIEREN ✨                       │
│ • Model Battle Arena (Hauptfeature)     │
│ • "Frag die KI" (einfacher Einstieg)    │
├─────────────────────────────────────────┤
│ ÜBER WOLF ✨ (erweitert)                 │
│ • TÜV-Zertifizierung prominent          │
│ • 25 Jahre Post-Produktion/Kino         │
│ • Vom Trailer zur KI                    │
│ • Warum KI?                             │
├─────────────────────────────────────────┤
│ FOOTER                                  │
│ + Link zu allen Projekten               │
└─────────────────────────────────────────┘
```

---

## Konkrete Änderungen

### 1. HERO Section
- [x] "30 Jahre Marketing" → "25 Jahre Medien & Post-Produktion"
- [ ] TÜV-Badge unter dem Namen hinzufügen
- [x] Taglines aktualisieren

### 2. PROJEKTE Section → "Meine Projekte"
**Entfernen:**
- Prompt Library
- Daily AI Challenge

**Behalten:**
- KI-Sicherheit.jetzt (anpassen)
- Model Battle Arena (bleibt)

**Neu hinzufügen:**
- art-radar.berlin
- akut.jetzt
- achtung.jetzt

### 3. WERKZEUGE Section → "KI ausprobieren"
**Entfernen:**
- Prompt Generator
- Prompt Optimizer
- Daily Challenge (doppelt)

**Behalten:**
- Model Battle (als Hauptfeature)

**Neu:**
- "Frag die KI" - einfacher Chat-Link

### 4. TIMELINE Section → "Über Wolf"
**Erweitern:**
- TÜV-Zertifikat prominent
- 25 Jahre Trailerhaus GmbH
- Mitgesellschafter heute
- Story: Vom Kino zur KI

### 5. Video-Bug Fix
- model-battle.html: `/hohl-bg.mp4` → `/videos/road_720p_bg.mp4`
- prompt-library.html: `/hohl-bg.mp4` → `/videos/road_720p_bg.mp4`

---

## Neue Projekt-Beschreibungen

### ki-sicherheit.jetzt
- **Icon:** 🎯
- **Titel:** KI-Sicherheit.jetzt
- **Beschreibung:** KI-Readiness-Beratung für Unternehmen. EU AI Act konform. Mit TÜV-Zertifizierung.
- **Label:** B2B / Beratung

### art-radar.berlin
- **Icon:** 🎨
- **Titel:** art-radar.berlin
- **Beschreibung:** Dein KI-Kunstguide für Berlin. Automatisch aktualisierte Ausstellungen und Vernissagen.
- **Label:** Kultur / App

### akut.jetzt
- **Icon:** 🆘
- **Titel:** akut.jetzt
- **Beschreibung:** Notfall-App mit KI-Unterstützung. Funktioniert auch offline. Versteckter Notruf durch Schütteln.
- **Label:** Sicherheit / App

### achtung.jetzt
- **Icon:** 🔒
- **Titel:** achtung.jetzt
- **Beschreibung:** Bevor du sendest: KI checkt deine Texte auf sensible Daten und kritische Informationen.
- **Label:** Datenschutz / Tool

---

## Neue Taglines

1. `TÜV-zertifizierter KI-Manager` (behalten)
2. `25 Jahre Medien & Film` (aktualisiert)
3. `KI-Entwickler & Berater` (neu)
4. `Baut heute, was andere morgen verstehen` (behalten)

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `public/index.html` | Komplettes Redesign |
| `public/model-battle.html` | Video-Bug fix |
| `public/prompt-library.html` | Video-Bug fix, evtl. entfernen |
| `public/daily-challenge.html` | Entfernen oder verstecken |

---

## Nicht löschen, nur ausblenden

Die folgenden Dateien werden NICHT gelöscht, nur von der Hauptseite entfernt:
- `/daily-challenge.html` - bleibt erreichbar, aber nicht verlinkt
- `/prompt-library.html` - bleibt erreichbar, aber nicht verlinkt
- `/tips/*` - bleiben erreichbar, aber nicht verlinkt

So geht nichts verloren, falls du sie später wieder nutzen möchtest.

---

*Redesign-Plan erstellt von Claude Code*
