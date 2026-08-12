---
name: klartext-standard
description: Schreibstandard für klare deutsche Texte — ASD-STE100 (Simplified Technical English), adaptiert für Deutsch, kombiniert mit Zinssers vier Prinzipien (Simplicity, Brevity, Clarity, Humanity). Anwenden bei jedem Text-Output — Reports, UI-Texte, Dokumentation, E-Mails, Marketing-Texte, Commit-Messages.
---

# Der Klartext-Standard

Texte, die man einmal liest und sofort versteht. Dafür kombiniert dieser Standard zwei Ebenen: ASD-STE100 liefert die technischen Regeln, William Zinsser („On Writing Well") das Qualitätsmaß. STE ohne Zinsser wird steril. Zinsser ohne STE wird beliebig. Beides zusammen trägt.

## So setzt du den Standard ein

**Mit einem KI-Assistenten (Claude, ChatGPT und andere):**

1. Gib dem Assistenten diese Datei und schreibe: „Wende diesen Schreibstandard auf alle deine Texte an."
2. Claude: Die Datei funktioniert direkt als Skill. Lege sie als `SKILL.md` in einen Skill-Ordner (zum Beispiel `.claude/skills/klartext-standard/SKILL.md`) — der Kopfbereich oben ist dafür vorbereitet.
3. ChatGPT: Lege den Inhalt in die Custom Instructions oder lade die Datei als Projekt-Wissen hoch.

**Im Team:**

1. Verlinke den Standard dort, wo Texte entstehen — Wiki, Styleguide, Onboarding.
2. Nutze die „Selbstprüfung" am Ende als Checkliste vor jeder Abgabe.
3. Lege pro Textsorte fest, wie streng die Regeln gelten (Tabelle „Regelstärke").

## Ebene 1: STE-Kernregeln (für Deutsch adaptiert)

ASD-STE100 ist ein englischer Luftfahrt-Standard. Diese Adaption überträgt seine Kernregeln auf Deutsch:

1. **Ein Satz, eine Aussage.** Anweisungen: max. 20 Wörter. Beschreibungen: max. 25 Wörter. Wenn ein Satz zwei Kommas braucht, sind es meist zwei Sätze.
2. **Aktiv statt Passiv.** Benenne den Handelnden. „Das System erstellt den Report" — nicht „Der Report wird erstellt."
3. **Ein Begriff, eine Bedeutung.** Pro Projekt eine feste Terminologie. Kein Synonymwechsel: Wer einmal „Assessment" schreibt, schreibt nicht später „Analyse" für dieselbe Sache.
4. **Verben statt Nominalstil.** „prüfen" statt „eine Prüfung durchführen". „entscheiden" statt „eine Entscheidung treffen".
5. **Komposita begrenzen.** Max. drei Glieder. „KI-Readiness-Report" ist ok. „KI-Readiness-Assessment-Ergebnis-Übersicht" wird aufgelöst: „Übersicht der Assessment-Ergebnisse".
6. **Anweisungen im Imperativ.** Eine Handlung pro Schritt. Sequenzen ab drei Schritten als nummerierte Liste.
7. **Warnung vor der Handlung.** Erst die Bedingung oder Gefahr, dann der Schritt. Nie umgekehrt.
8. **Präsens als Standard.** Futur und Konjunktiv nur, wenn die Sache es verlangt.
9. **Ein Absatz, eine Idee.** Max. sechs Sätze pro Absatz.
10. **Konkret statt abstrakt.** Zahlen, Namen, Beispiele. „Der Report umfasst 12 Seiten" — nicht „einen umfangreichen Report".

Bei englischen Texten gelten die STE-Originalprinzipien direkt (einfache, eindeutige Wörter; approved-word-Logik) plus Chicago Manual of Style.

## Ebene 2: Zinssers vier Prinzipien

1. **Simplicity.** Jedes Wort verdient seinen Platz oder fliegt. Fachjargon nur, wenn die Zielgruppe ihn selbst benutzt.
2. **Brevity.** Die kürzeste Fassung, die noch vollständig ist. Streichen ist die Standardoperation, nicht die Ausnahme.
3. **Clarity.** Niemand darf einen Satz zweimal lesen müssen. Wenn doch: umschreiben, nicht erklären.
4. **Humanity.** Der Text klingt nach einem Menschen, der etwas zu sagen hat. Direkte Ansprache, klare Haltung, keine Behördensprache. Humanity ist das Korrektiv gegen STE-Sterilität.

## Regelstärke pro Textsorte

| Textsorte | Modus |
|---|---|
| **Reports & Dokumentation** | STE strikt. Bei Zielgruppen ohne Vorwissen: jeden Fachbegriff beim ersten Auftreten in einem Satz erklären. Zahlen immer konkret. |
| **UI-Texte** (Labels, Tooltips, Fehlermeldungen) | STE strikt: kurz, handlungsorientiert, ein Verb. Fehlermeldungen nennen Ursache + nächsten Schritt. |
| **Websites & persönliche Seiten** | Zinsser führt, STE gelockert. Spielerisch erlaubt — aber klar bleibt Pflicht. |
| **Marketing** | Humanity + Brevity führen. STE-Satzlängen als Richtwert; Rhythmus darf brechen, wenn es dem Text dient. |
| **Lektorat** (DE/EN) | Duden bzw. Chicago haben Vorrang vor STE. Autorenstimme erhalten — STE nie einem fremden Text aufzwingen. STE-Regeln nur als Diagnose-Werkzeug für Klarheitsprobleme. |
| **Code, Commits, Docs** | Commit-Messages: Imperativ, eine Änderung, eine Zeile Kern. README/Docs: STE strikt. Kommentare nur, wo der Code sich nicht selbst erklärt. |

## Verbotene Muster

Floskeln und Höflichkeitsschleifen. Nominalstil-Ketten („die Durchführung der Implementierung der Lösung"). Doppelte Verneinung. Satzeinstiege mit „Es gibt" / „Es ist". Füllwörter: eigentlich, grundsätzlich, quasi, sozusagen, durchaus, gewissermaßen. Disclaimer-Inflation. Synonymwechsel für denselben Fachbegriff. Superlative ohne Beleg. Kraftausdrücke und derbe Anglizismen — wer klar denkt, muss nicht fluchen.

## Selbstprüfung vor jeder Abgabe

1. **Passiv-Scan:** Jedes Passiv braucht einen Grund. Sonst: aktiv.
2. **Längen-Scan:** Sätze über 25 Wörter teilen. Absätze über 6 Sätze teilen.
3. **Streich-Pass:** Einmal komplett durchgehen, nur um zu kürzen. Wenn nichts zu streichen ist, war der Pass zu schnell.
4. **Terminologie-Scan:** Ein Begriff, eine Bedeutung — projektweit.
5. **Vorlese-Test (Humanity):** Klingt der Text gesprochen wie ein Mensch? Wenn nicht, ist er noch nicht fertig.

---

Frei verwendbar. Gefunden auf [hohl.rocks](https://hohl.rocks).
