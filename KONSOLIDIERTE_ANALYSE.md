# Konsolidierte Analyse: Wolf Hohls Digitale Präsenz

**Datum:** 2026-01-17
**Analysiert:** hohl.rocks (Frontend) + ki-sicherheit.jetzt

---

## Gesamtübersicht

| Website | Gesamt | Stärken | Schwächen |
|---------|--------|---------|-----------|
| **hohl.rocks** | 7.1/10 | Design, Video, Model Battle | Zu technisch, fehlende Videos |
| **ki-sicherheit.jetzt** | 5.5/10 | TÜV-Badges, Performance | Keine Persönlichkeit, Bugs, UX |

---

## Die Kernprobleme beider Seiten

### Das gemeinsame Problem: **Keine klare Botschaft**

| Seite | Aktuell | Sollte sein |
|-------|---------|-------------|
| hohl.rocks | "KI-Tools für Techies" | "Wolf zeigt, was KI kann" |
| ki-sicherheit.jetzt | "Zertifiziert. Dokumentiert. KI-konform." | "Machen Sie Ihr Unternehmen KI-ready" |

### Wolf Hohl ist unsichtbar!

Auf beiden Seiten fehlt:
- Wer ist Wolf Hohl?
- 25 Jahre Medien-Erfahrung
- TÜV-Zertifizierung (nur klein auf ki-sicherheit.jetzt)
- Persönlichkeit, Vertrauen, Geschichte

---

## Kritische Bugs

### ki-sicherheit.jetzt - KRITISCH

| Bug | Datei | Problem |
|-----|-------|---------|
| DE showIf-Bug | formbuilder_de_SINGLE_FULL.js:283 | Prüft "solo", Wert ist "1" → Solo-Selbstständige sehen Folgefeld nie |
| EN Values falsch | Lines 269-272 | "solo", "team", "kmu" statt "1", "2–10", "11–100" |
| EN fehlt Branche | Line 265 | "gastronomie" nicht vorhanden |
| Typo | index.html:59 | "Rechereche" statt "Recherche" |

### hohl.rocks - KRITISCH

| Bug | Datei | Problem |
|-----|-------|---------|
| Video fehlt | model-battle.html, prompt-library.html | `/hohl-bg.mp4` existiert nicht (404) |
| API-Config fehlt | Feature-Seiten | Kein Meta-Tag, Console-Warnings |

---

## Priorisierter Aktionsplan

### 🔴 SOFORT (Diese Woche)

#### ki-sicherheit.jetzt
1. **Fragebogen-Bugs fixen** - Kritisch, verhindert Nutzung!
2. **Typo fixen** - "Rechereche" → "Recherche"
3. **TÜV-Badge nach oben** - Vertrauen sofort sichtbar
4. **Impressum/Datenschutz verlinken** - Rechtlich notwendig

#### hohl.rocks
1. **Video-Referenzen fixen** - 404-Fehler beheben
2. **API-Config in Feature-Seiten** - Console-Errors vermeiden

---

### 🟡 KURZFRISTIG (2 Wochen)

#### ki-sicherheit.jetzt - Relaunch
**Neue Startseiten-Struktur:**

```
┌────────────────────────────────────────────────────────┐
│ 1. HERO                                                │
│    "KI nutzen – aber sicher!"                          │
│    [TÜV-Badge] [EU AI Act Badge] [DSGVO Badge]        │
│    [CTA: Kostenlos Report anfordern]                   │
├────────────────────────────────────────────────────────┤
│ 2. PROBLEM                                             │
│    "EU AI Act kommt 2025. Ist Ihr Unternehmen bereit?" │
│    • Haftungsrisiken  • Bußgelder  • Compliance        │
├────────────────────────────────────────────────────────┤
│ 3. LÖSUNG: Der Readiness-Report                        │
│    • Was ist es? (5 Min Fragebogen → KI-Analyse)       │
│    • Was bekommt man? (PDF, Maßnahmenplan, Förderung)  │
│    • [Screenshot/Mockup des Reports]                   │
├────────────────────────────────────────────────────────┤
│ 4. ÜBER WOLF HOHL                                      │
│    [Foto] TÜV-zertifizierter KI-Manager                │
│    25 Jahre Geschäftsführer Medien-Branche             │
│    "Ich bringe KI sicher in Ihr Unternehmen"           │
├────────────────────────────────────────────────────────┤
│ 5. REFERENZEN / PROJEKTE                               │
│    • art-radar.berlin                                  │
│    • akut.jetzt                                        │
│    • achtung.jetzt                                     │
│    "So setze ich KI in der Praxis ein"                 │
├────────────────────────────────────────────────────────┤
│ 6. PREISE (transparent!)                               │
│    Basis: Kostenlos (Lead)                             │
│    Standard: X€ (detailliert)                          │
│    Premium: X€ (+ Beratung)                            │
├────────────────────────────────────────────────────────┤
│ 7. FAQ                                                 │
│    EU AI Act, DSGVO, Förderung, Ablauf                 │
├────────────────────────────────────────────────────────┤
│ 8. FOOTER                                              │
│    Kontakt | Impressum | Datenschutz                   │
└────────────────────────────────────────────────────────┘
```

#### hohl.rocks - Fokus-Shift

**Entfernen:**
- Daily Challenge (zu nischig)
- Tips-Seiten (kaum Inhalt)
- Prompt Library (zu technisch)

**Behalten & Prominent:**
- Video-Hintergrund ✓
- Model Battle (USP!)

**Neu hinzufügen:**
```
┌────────────────────────────────────────────────────────┐
│ HERO                                                   │
│ "Wolf Hohl – TÜV-zertifizierter KI-Manager"           │
│ "Ich zeige dir, was KI wirklich kann"                 │
├────────────────────────────────────────────────────────┤
│ MEINE PROJEKTE (NEU!)                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ki-sicher │ │art-radar │ │  akut    │ │ achtung  │   │
│ │heit.jetzt│ │.berlin   │ │ .jetzt   │ │ .jetzt   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│ "KI für      "KI für      "KI für      "KI für        │
│  Business"   Kultur"      Notfälle"    Sicherheit"    │
├────────────────────────────────────────────────────────┤
│ KI AUSPROBIEREN                                        │
│ [Model Battle] - Vergleiche ChatGPT, Claude, etc.     │
│ [Einfacher Prompt-Helfer]                              │
├────────────────────────────────────────────────────────┤
│ ÜBER WOLF                                              │
│ Vom Kino-Trailer zur KI                                │
│ → Link zu ki-sicherheit.jetzt für B2B                 │
└────────────────────────────────────────────────────────┘
```

---

### 🟢 MITTELFRISTIG (1 Monat)

1. **Readiness-Report Monetarisierung klären**
   - Pricing testen (Basis kostenlos als Lead-Magnet)
   - White-Label Konzept für Partner

2. **achtung.jetzt aktualisieren**
   - Bug-Fixes
   - Auf hohl.rocks verlinken

3. **Einheitliches Branding**
   - Alle Projekte mit "Ein Wolf Hohl Projekt" Footer
   - Konsistente Farben/Fonts

4. **Analytics einrichten**
   - Conversion-Tracking für Readiness-Report

---

## Die neue Positionierung

### Wolf Hohl - Der KI-Übersetzer

**Tagline-Vorschläge:**
- "Ich bringe KI in Ihr Unternehmen – sicher und verständlich"
- "Vom Kino-Trailer zur KI: 25 Jahre Erfahrung, neu gedacht"
- "TÜV-zertifiziert. Praxiserprobt. Verständlich erklärt."

### Unique Selling Points (USPs)

| USP | Beweis |
|-----|--------|
| TÜV-zertifiziert | Zertifikat TÜV Austria |
| Praxiserfahrung | 25 Jahre Geschäftsführer |
| Echte Projekte | 4 funktionierende KI-Apps |
| Verständlich | Erklärt für Nicht-Techniker |

---

## Vergleich: Vorher → Nachher

### ki-sicherheit.jetzt

| Vorher | Nachher |
|--------|---------|
| "Zertifiziert. Dokumentiert. KI-konform." | "Machen Sie Ihr Unternehmen KI-ready" |
| Sofort Login-Zwang | Erst informieren, dann Login |
| Wolf unsichtbar | Wolf prominent mit Foto |
| Preis unklar | Transparente Pakete |
| TÜV-Badge unten | TÜV-Badge ganz oben |

### hohl.rocks

| Vorher | Nachher |
|--------|---------|
| Technische Tools für Entwickler | "Wolf zeigt was KI kann" |
| Keine Projekte sichtbar | Projekt-Showcase prominent |
| Unklar wer das ist | TÜV-KI-Manager mit Geschichte |
| Viele Features, kein Fokus | Model Battle + Projekte |

---

## Entscheidungsfragen für Wolf

1. **Readiness-Report Preis?**
   - Kostenlos (Lead) → Standard (149-299€) → Premium (499€+)?
   - Oder alles kostenlos und Beratung verkaufen?

2. **White-Label Priorität?**
   - Erst Direktverkauf testen, dann Partner?
   - Oder parallel?

3. **hohl.rocks Umfang?**
   - Minimaler Umbau (nur Projekt-Showcase hinzufügen)?
   - Oder kompletter Relaunch?

4. **Foto vorhanden?**
   - Professionelles Foto für beide Seiten?

---

## Zusammenfassung

**Das Fundament ist da:**
- Solide technische Basis
- Gute Produkte (Readiness-Report, Model Battle)
- TÜV-Zertifizierung als Vertrauens-Asset

**Was fehlt:**
- Wolf Hohl als Person/Marke
- Klare Botschaften
- User-Journey statt Login-Zwang

**Quick Wins (heute machbar):**
1. Fragebogen-Bugs fixen
2. TÜV-Badge nach oben
3. Video-404 beheben
4. Typo fixen

**Der größte Hebel:**
> Wolf Hohl sichtbar machen. Menschen kaufen von Menschen.

---

*Konsolidierte Analyse von Claude Code*
