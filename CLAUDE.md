# Steckbrief hohl-rocks-front

**Letzter Wartungsdurchgang:** 2026-08-19
**Version:** 2.1.0 · **Deploy:** Netlify · **Build:** keiner

Dieser Steckbrief hält fest, was verfällt: Laufzeit, Modellnamen, Routing.
Prüfe ihn bei jedem Wartungsdurchgang gegen den Code. Trage danach das neue
Datum ein.

---

## Laufzeit

`package.json` → `engines.node`: **`>=22.0.0`** (Node 22, Maintenance LTS
bis 2027-04-30). Vorher stand hier `>=18.17`; Node 18 ist seit 2025-04-30
End-of-Life.

Netlify baut nichts: `netlify.toml` nennt nur `publish = "public"`, kein
`command`. Die Angabe wirkt deshalb heute nur lokal — für
`scripts/build-en.mjs`. Sobald jemand einen Build ergänzt, ist sie die
Untergrenze, die Netlify heranzieht.

---

## Aufbau

Statische Seite. Kein Framework, kein Bundler.

| Pfad | Rolle |
|---|---|
| `public/index.html` | Hauptseite, deutsch. Enthält Chat, Modellvergleich, Goodies. |
| `public/en/index.html` | Englische Fassung. **Generiert** — siehe unten. |
| `public/model-battle.html` | Eigenständige Vergleichsseite. Verlinkt aus beiden Fußzeilen, steht in `sitemap.xml`. |
| `public/model-battle.js` | Logik dieser Seite. Ruft `/api/model-battle` ohne Streaming. |
| `public/js/api-config.js` | Ermittelt die API-Basis. Muss vor allen Feature-Skripten laden. |

**Zwei Vergleichs-Oberflächen:** `index.html` bringt eine eigene mit
(Streaming, Leitplanken-Modus, zweisprachig). `model-battle.html` ist die
ältere, eigenständige Seite. Sie ist erreichbar und indexiert, wird aber
seltener angefasst — Änderungen am Backend-Vertrag hier immer mitprüfen.

---

## Englische Fassung

`public/en/index.html` wird aus `public/index.html` und
`translations/en.json` erzeugt. Nicht von Hand bearbeiten.

```bash
npm run check:en   # prüft, ob Wörterbuch und Seite zusammenpassen
npm run build:en   # erzeugt public/en/index.html neu
```

---

## Modellnamen

Die Seite nennt die Modelle **ohne Versionsnummer**: „Claude", „GPT",
„Perplexity", „Gemini". Das ist Absicht. Das Backend wechselt Modelle per
Umgebungsvariable; eine Versionsnummer im HTML veraltet still.

Bis 2026-08-19 stand in `model-battle.html` „Claude Sonnet 4",
„GPT-4o Mini" und „Gemini 2.0 Flash" — drei Namen, von denen keiner mehr
stimmte. Zwei davon nannten Modelle, die es nicht mehr gibt.

**Regel:** Keine Modellversion ins HTML. Wer sie doch braucht, holt sie aus
`/api/self` oder aus der Antwort des Backends (`responses[].name`).

---

## Backend-Vertrag

Alle `/api/*`-Aufrufe gehen über die Weiterleitung in `netlify.toml` an
`hohl-rocks-back-production.up.railway.app`. Gleiche Herkunft, kein
Cross-Site.

Drei Antwortformen kommen von `/api/model-battle` — alle mit HTTP 200:

| Fall | Kennzeichen | Was die Seite zeigt |
|---|---|---|
| Erfolg | `responses[]` | Die Antworten |
| Teilausfall | `responses[]`, `partialFailure: true` | Antworten plus Fehlergrund je Modell |
| Abgefangen | `blocked: true`, **kein** `responses` | Die Leitplanken-Meldung |

**Der dritte Fall ist die Falle.** Er kommt als HTTP 200 und hat kein
`responses`-Array. Wer blind `data.responses` liest, bekommt einen
TypeError und meldet dem Besucher einen technischen Fehler — obwohl die
Leitplanke genau das getan hat, wofür sie da ist. Beide Oberflächen
behandeln den Fall seit 2026-08-19.

---

## Prüfen

```bash
npm run check:en
npm run lint       # htmlhint, bricht nie ab
npx serve public   # lokal ansehen
```

Es gibt keine automatischen Tests. Änderungen am Vergleich gegen ein
laufendes Backend prüfen — auch den abgefangenen Fall.
