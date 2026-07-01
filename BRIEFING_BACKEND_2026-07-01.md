# Briefing für Backend-Repo (hohl-rocks-back): Frontend-Review + ENV-Validierung

**Datum:** 2026-07-01
**Für:** Backend-Entwicklung (`hohl-rocks-back`)
**Von:** Frontend-Review (`hohl-rocks-front`), Runde 2 nach `FRONTEND_BRIEFING.md` (Backend v2.8.0)

> Dieses Dokument ersetzt/aktualisiert die älteren `BACKEND-BRIEFING.md` / `BRIEFING_BACKEND.md`
> Stände (Jan/Feb 2026) für die aktuelle Optimierungsrunde. Es fasst zusammen: (1) bestätigte
> Frontend-Bugs aus der Code-Review, (2) den Abgleich der bereitgestellten Railway-ENV-Liste
> gegen den tatsächlichen Frontend-Code, und (3) daraus resultierende offene Fragen/To-dos
> für's Backend.

---

## 1. Wichtigster Fund: CORS ist korrekt konfiguriert, das Cookie-Problem bleibt trotzdem bestehen

`ALLOWED_ORIGINS="https://hohl.rocks,https://www.hohl.rocks"` beantwortet die offene Frage aus
der letzten Frontend-Review: Ja, die Produktions-Domain ist korrekt in der CORS-Allowlist.

**Aber:** CORS und `SameSite` sind zwei unabhängige Mechanismen. Das Frontend ruft die meisten
Endpoints (Chat, Model Battle, Self-Check) **direkt** gegen
`https://hohl-rocks-back-production.up.railway.app` auf (siehe Frontend-Befund F1), nicht über
den same-origin Netlify-Proxy `/api/*`. Das ist aus Browsersicht ein **cross-site** Request
(anderes eTLD+1: `hohl.rocks` vs. `railway.app`). Selbst mit korrektem CORS und
`credentials:'include'` auf Frontend-Seite wird ein Cookie mit `SameSite=Lax` (laut eurem
Befund #8) oder `SameSite=Strict` (so im Entwurf `BACKEND-CONVERSATION-LOGGING.md:90` in diesem
Repo) **nicht mitgeschickt**.

**Frage ans Backend-Team:** Ist die Conversation-Logging-Funktion aus
`BACKEND-CONVERSATION-LOGGING.md` bereits so deployed? Falls ja: Mit welchem `sameSite`-Wert
läuft `chat_session` tatsächlich in Produktion — `lax` (wie im ursprünglichen Backend-Briefing
angegeben) oder `strict` (wie im hiesigen Entwurfsdokument)? Das ist entscheidend, um
einzuschätzen, ob Session-Kontinuität im Chat aktuell überhaupt funktioniert.

**Zwei mögliche Fixes** (bitte gemeinsam entscheiden, nicht beide parallel umsetzen):
- **Frontend-seitig** (bevorzugt, kein Backend-Change nötig): alle Calls auf relative
  `/api/...`-Pfade umstellen, sodass sie über den bestehenden Netlify-Redirect laufen und aus
  Browsersicht same-origin sind (so wie es `news-render-fix.js` bereits richtig macht).
- **Backend-seitig** (nur falls Frontend zwingend direkt gegen Railway sprechen soll):
  `sameSite: 'none'` + `secure: true` setzen — dann funktioniert das Cookie auch cross-site,
  erfordert aber, dass jede aufrufende Origin sauber in CORS gelistet ist (siehe Punkt 2).

---

## 2. Zwei verschiedene Origin-Allowlist-Variablen — welche wird tatsächlich verwendet?

In der ENV-Liste stehen **zwei** Variablen mit überlappendem Zweck:

```
ALLOWED_ORIGINS="https://hohl.rocks,https://www.hohl.rocks"
CORS_ALLOWLIST="https://hohl.rocks,https://www.hohl.rocks,https://steady-pixie-8f36d7.netlify.app"
```

- `CORS_ALLOWLIST` enthält zusätzlich die konkrete Netlify-Preview-Domain
  (`steady-pixie-8f36d7.netlify.app`), `ALLOWED_ORIGINS` nicht.
- Falls im Code nur eine der beiden Variablen tatsächlich gelesen wird (die andere wäre totes
  Config), sollte das bereinigt werden — sonst driften beide irgendwann auseinander und es ist
  unklar, welche Liste im Zweifel greift.

**Frage:** Welche der beiden Variablen liest der aktuelle Code wirklich? Falls beide an
unterschiedlichen Stellen genutzt werden (z. B. eine für CORS-Header, eine für einen anderen
Zweck) — bitte kurz dokumentieren, wofür `ALLOWED_ORIGINS` sonst noch verwendet wird.

Zur Bestätigung: `steady-pixie-8f36d7.netlify.app` ist die tatsächliche Netlify-Site-ID des
Frontend-Repos — das deckt sich mit Backend-Befund #9 (automatisches Erlauben von
`*.netlify.app`-Previews).

---

## 3. Konfigurierte, aber im Frontend nirgends genutzte kostenpflichtige Provider

Folgende ENV-Variablen deuten auf Backend-Fähigkeiten hin, für die **keine einzige Aufrufstelle**
im Frontend-Code existiert (vollständig durchsucht: kein `fetch`, kein API-Wrapper-Aufruf,
keine UI):

| ENV-Var | Vermutete Funktion | Frontend-Nutzung |
|---|---|---|
| `REPLICATE_API_TOKEN`, `REPLICATE_MODEL_VERSION` (flux-1.1-pro) | Bildgenerierung | keine |
| `REPLICATE_LLAVA_VERSION` | Vision/Bildanalyse | keine |
| `REPLICATE_MUSICGEN_VERSION` | Musikgenerierung | keine |
| `TAVILY_API_KEY`, `RESEARCH_MODEL`, `RESEARCH_ALLOW`, `RESEARCH_BLOCK` | Web-Recherche-Feature | keine |
| `OPENROUTER_API_KEY` | Zusätzlicher Modell-Provider | keine (Model Battle nutzt nur `claude`/`gpt`/`perplexity`/`gemini`) |

Das sind potenziell **laufende Kosten ohne Gegenwert**, falls diese Keys aktiv nutzbare
Endpoints befeuern, die schlicht nicht verlinkt sind. Drei Möglichkeiten:
1. Es sind **geplante, noch nicht gebaute Frontend-Features** — dann bräuchten wir vom
   Backend die zugehörigen Endpoint-Namen/Contracts, um sie einzuplanen.
2. Es sind **Altlasten** aus früheren Experimenten — dann könnten die Keys/Endpoints entfernt
   werden, um Angriffsfläche und Kosten zu reduzieren.
3. Es gibt einen **anderen Consumer** außerhalb dieses Frontend-Repos (Admin-Tool, Skript,
   zweites Frontend) — dann bitte kurz bestätigen, damit wir es nicht fälschlich als "tot"
   einstufen.

**Frage ans Backend-Team:** Welcher der drei Fälle trifft zu, pro Provider?

---

## 4. Daily Challenge: `STORAGE_KEY="dailyChallenge"` bestätigt unvollendeten Feature-Zustand

Der Frontend-Review hatte bereits festgestellt, dass `getDailyChallenge()`/`submitChallenge()`
im API-Client definiert, aber nirgends aufgerufen werden (kein UI-Trigger). Die ENV-Variable
`STORAGE_KEY="dailyChallenge"` legt nahe, dass ein `localStorage`-Schlüssel für dieses Feature
bereits vom Backend-Team antizipiert wurde — das Feature scheint also **halb angelegt, nie zu
Ende gebaut** worden zu sein, statt komplett neu zu sein.

**Konsequenz für Backend-Befund #2** (kein Caching bei `/api/daily-challenge`, Live-Claude-Call
pro Request): Das Kostenrisiko ist aktuell **nicht akut**, weil der Endpoint vom Frontend gar
nicht aufgerufen wird. Trotzdem sollte das Caching nachgezogen werden, **bevor** das Feature
im Frontend fertiggestellt wird — sonst wiederholt sich das gleiche Muster wie bei
Model Battle (erst UI, dann Kostenüberraschung).

**Frage:** Soll Daily Challenge in dieser Runde fertig gebaut werden (dann bitte Endpoint-
Contract + gewünschtes `localStorage`-Schema bestätigen), oder zurückgestellt/entfernt werden?

---

## 5. Modell-Konfiguration vs. hartkodierte UI-Labels

- `CLAUDE_MODEL="claude-sonnet-4-20250514"` — aktuell deckt sich das zufällig mit dem im
  Model-Battle-Response hartkodierten Label `"Claude Sonnet 4"` (Backend-Befund #4). Das ist
  aber Zufall, kein robuster Zustand: Sobald `CLAUDE_MODEL` geändert wird (z. B. auf eine neuere
  Version), zeigt die UI weiterhin den alten Namen. Bestätigt: Fix ist **rein backend-seitig**
  (Modellname aus der tatsächlichen API-Response ableiten statt hartkodieren) — das Frontend
  zeigt bereits unverändert an, was `result.name` liefert.
- `RESEARCH_MODEL="claude-3-5-sonnet-20241022"` ist ein **anderes** Modell als `CLAUDE_MODEL`.
  Falls das Research-Feature (Punkt 3) je eine UI bekommt, bitte von Anfang an das Modell-Label
  dynamisch aus der Response ziehen statt erneut hartzukodieren.

---

## 6. News-Feature: TTL bestätigt, aber Caching-Kette nicht Ende-zu-Ende verifiziert

`NEWS_TTL_HOURS="24"` und `NEWS_FEEDS_JSON=""` (leer) bestätigen Backend-Befund #12: Es gibt
keine echte Live-Feed-Quelle, sondern eine rotierende Auswahl aus `NEWS_DOMAINS`, 24h serverseitig
gecacht. Frontend (`news-render-fix.js`) fetcht relativ (`/api/news`, same-origin über den
Netlify-Proxy) und verlässt sich rein auf den Browser-HTTP-Cache (`Cache-Control`-Header) —
es gibt kein zusätzliches Client-Caching, aber auch kein automatisches Polling (nur bei
Overlay-Öffnen/Klick).

**Offene Frage:** Kommt der `Cache-Control`-Header vom Backend tatsächlich unverändert durch
den Netlify-Redirect (`force=true`, Status 200) beim Endnutzer an, oder wird er durch den Proxy
gestrippt/überschrieben? Das lässt sich nur mit einem echten Request gegen die Produktions-URL
verifizieren (`curl -I https://hohl.rocks/api/news`) — bitte das gemeinsam einmal prüfen, bevor
wir die 24h-TTL-Annahme als "safe" abhaken.

---

## 7. Konsistenz-Check: was im Frontend tatsächlich mit den ENV-gesteuerten `/api/self`-Flags passiert

Zur Bestätigung (kein Bug): `LIFE_EXTEND_CLICK`, `MAX_EXTENDS`, `UI_MODAL_SHADE`,
`UI_REMOVE_NAV_SOUND` werden alle korrekt in `app.js` aus `/api/self` gelesen und als
`data-*`-Attribute gesetzt. `data-extend-click`/`data-max-extends` werden aktuell aber
**nirgends sonst im Frontend-Code konsumiert** (kein CSS-Selektor, kein weiterer JS-Zugriff) —
vermutlich ein unfertiges/entferntes UI-Feature. Niedrige Priorität, nur zur Vollständigkeit
erwähnt, keine Backend-Aktion nötig.

---

## 8. Zusammengeführte Prioritätenliste für Runde "Konsistenz" (Backend + Frontend gemeinsam)

1. **Cookie/SameSite-Klärung** (Abschnitt 1) — blockiert Session-Kontinuität, betrifft Kernfunktion Chat.
2. **Origin-Allowlist-Duplikat bereinigen** (Abschnitt 2) — Drift-Risiko.
3. **Kostentreiber-Provider klären** (Abschnitt 3) — potenziell laufende Kosten ohne Nutzung.
4. **Daily-Challenge-Entscheidung** (Abschnitt 4) — fertigbauen oder zurückstellen, vor Caching-Fix.
5. **Modell-Label dynamisch** (Abschnitt 5) — bereits als Backend-Fix bekannt, hier nur neu bestätigt.
6. **News-Cache-Header End-to-End-Test** (Abschnitt 6) — schnell verifizierbar, klärt Restrisiko.
7. **Error-Format-Vereinheitlichung** (aus Backend-Befund #10) — Frontend hat dafür aktuell
   keinen zentralen Parser (`api.js` liest bei Nicht-429-Fehlern den Response-Body gar nicht),
   das wird parallel im Frontend-Repo gefixt (siehe dortige Findings-Liste F2) — bitte
   Fehlerformat serverseitig auf **ein** Schema vereinheitlichen, dann wird der Frontend-Fix
   einfacher.

---

## 9. Sicherheitshinweis zu diesem Dokument

Die vom Repo-Owner bereitgestellte ENV-Liste enthielt reale Secret-Werte, die hier bewusst
**nicht** übernommen wurden — nur Variablennamen und die bereits vom Owner selbst redigierten
("xxx") bzw. nicht-sensiblen Werte (Domains, Modell-IDs, TTLs, Feature-Flags) sind in diesem
Dokument enthalten. Bitte beim Commit/Push dieses Repos sicherstellen, dass an keiner Stelle
echte API-Keys oder die volle `DATABASE_URL` (inkl. Passwort) in Klartext landen.
