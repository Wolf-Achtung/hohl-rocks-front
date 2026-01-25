# Daily Challenge: Neukonzeption

**Stand: Januar 2025**
**Status: Konzeptphase**

---

## AUSGANGSLAGE

### Aktueller Stand
- Feature existiert technisch (`/daily-challenge.html`)
- Nicht auf der Hauptseite verlinkt
- Grund unklar (bewusst entfernt oder vergessen?)

### Das Problem
Das aktuelle Konzept ist **generisch**:
- "Tägliche KI-Challenge" klingt wie ein Kurs
- Schwierigkeitsgrade (Beginner/Intermediate/Expert) wirken schulisch
- Gamification (Badges, Streaks) ist Standard

**Es fehlt:** Persönlichkeit, Überraschung, echter Mehrwert

---

## IDEE 1: "WOLFS TÄGLICHER IMPULS"

### Konzept
Statt einer "Challenge" ein **täglicher Denkanstoß** von Wolf persönlich.

### Format
```
Heute denke ich über...

[THEMA]

Meine Perspektive:
[KURZER TEXT VON WOLF]

Deine Aufgabe:
[INTERAKTIVE KOMPONENTE]

Was sagt die KI dazu?
[CLAUDE/GPT ANTWORT]
```

### Beispiel
```
Heute denke ich über...

Künstler und Maschinen

Jean-Michel Basquiat hat nie einen Computer benutzt.
Seine Bilder sind trotzdem relevanter als 90% der AI-Art auf Instagram.
Warum?

Deine Aufgabe:
Beschreibe ein Basquiat-Werk ohne es zu googeln.
Nur aus der Erinnerung. Nur deine Interpretation.

Was sagt Claude dazu?
[Button: Claude fragen]
```

### Vorteile
- Persönlich (von Wolf, nicht "vom System")
- Kulturelle Tiefe (Basquiat, Krausser, etc.)
- Echte Reflexion statt Quiz

---

## IDEE 2: "DAS UNERWARTETE"

### Konzept
Jeden Tag eine **überraschende Aufgabe**, die KI und Mensch verbindet.

### Kategorien (rotierend)
1. **Kochen + KI:** "Lass dir von Claude ein Rezept aus 3 Zutaten generieren, die du gerade zuhause hast. Koch es. Dokumentiere das Ergebnis."
2. **Kunst + KI:** "Beschreibe einem Blinden das berühmteste Gemälde, das du kennst. Nur mit Worten. Kein Bild."
3. **Fußball + KI:** "Erkläre einem Amerikaner, warum Freiburg wichtiger ist als Bayern München. Die KI darf helfen."
4. **Literatur + KI:** "Schreib den ersten Satz eines Romans, den Helmut Krausser schreiben würde. Claude schreibt den zweiten."
5. **Alltag + KI:** "Was hast du heute gelernt? Frag Claude, was es dazu zu sagen hat."

### Format
- Keine Punkte
- Keine Badges
- Nur: "Gemacht" oder "Nicht gemacht"
- Optional: Teilen (anonym)

### Vorteile
- Überraschend
- Persönlich (basiert auf Wolfs Interessen)
- Kein Leistungsdruck

---

## IDEE 3: "PROMPT DES TAGES"

### Konzept
Jeden Tag ein **kuratorierter Prompt** mit Kontext und Erklärung.

### Format
```
PROMPT DES TAGES

"Du bist ein Kunsthistoriker, der Basquiats Werk einem Kind erklären muss.
Verwende keine Fachbegriffe. Erkläre, warum die 'rohen' Linien Absicht sind."

WARUM DIESER PROMPT?
Wolf erklärt, warum dieser Prompt interessant ist und was er damit erreichen will.

PROBIER ES AUS
[Button: Im Model Battle testen]

WAS ANDERE DAMIT GEMACHT HABEN
[Anonyme Beispiele von Nutzern]
```

### Vorteile
- Bildend (man lernt Prompting)
- Verbunden mit Model Battle (bestehendes Feature)
- Community-Element möglich

---

## IDEE 4: "DIE FRAGE"

### Konzept
Jeden Tag **eine einzige Frage**. Keine Aufgabe, keine Challenge.

### Format
```
Die Frage für heute:

"Wenn du einem 10-Jährigen erklären müsstest,
warum KI manchmal halluziniert –
wie würdest du anfangen?"

[Deine Antwort schreiben]
[Was Claude sagt]
[Was andere geschrieben haben]
```

### Beispielfragen
- "Was wäre der erste Satz, den du einem Außerirdischen über Menschen sagen würdest?"
- "Welches Problem löst KI, das du vorher nicht als Problem erkannt hast?"
- "Beschreibe das beste Essen deines Lebens. Nur mit drei Adjektiven."
- "Wenn Basquiat heute leben würde – würde er AI-Art machen?"
- "Was ist der Unterschied zwischen 'schlau' und 'weise'?"

### Vorteile
- Minimalistisch
- Tiefgründig
- Keine Gamification
- Lädt zur Reflexion ein

---

## EMPFEHLUNG

### Beste Option: Idee 4 "Die Frage"

**Warum:**
1. **Einfach** – Kein komplexes Backend nötig
2. **Persönlich** – Die Fragen können Wolfs Interessen widerspiegeln
3. **Tiefgründig** – Echte Reflexion statt Quiz
4. **Skalierbar** – Neue Fragen sind schnell erstellt
5. **Unterscheidet sich** – Kein anderes KI-Tool macht das so

### Umsetzungsvorschlag

**Phase 1: MVP**
- Eine statische Seite mit der Frage des Tages
- Textfeld für die eigene Antwort
- Button: "Was sagt Claude?"
- Kein Login, keine Speicherung

**Phase 2: Community**
- Anonyme Antworten anderer anzeigen
- "Gefällt mir" für besonders gute Antworten
- Keine Punkte, keine Rankings

**Phase 3: Wolfs Kommentar**
- Wolf schreibt gelegentlich einen kurzen Kommentar zur Frage
- "Meine Gedanken dazu..."
- Macht es persönlicher

---

## TECHNISCHE UMSETZUNG

### Einfachste Version (kein neues Backend)

```javascript
// Fragen als JSON
const questions = [
  {
    date: "2025-01-25",
    question: "Wenn Basquiat heute leben würde – würde er AI-Art machen?",
    context: "Jean-Michel Basquiat hat mit seinen rohen, expressiven Werken die Kunstwelt verändert.",
    wolf_note: "Ich denke: Nein. Aber aus anderen Gründen, als du vielleicht denkst."
  },
  // ...
];

// Tägliche Frage basierend auf Datum
function getTodaysQuestion() {
  const today = new Date().toISOString().split('T')[0];
  return questions.find(q => q.date === today) ||
         questions[Math.floor(Math.random() * questions.length)];
}
```

### Mit Backend (später)

```
GET /api/question-of-the-day
POST /api/question-of-the-day/answer
GET /api/question-of-the-day/answers (anonymisiert)
```

---

## NÄCHSTE SCHRITTE

1. **Entscheidung:** Welches Konzept?
2. **Content:** 30 Fragen für den ersten Monat
3. **Design:** Minimalistische Seite
4. **Implementation:** MVP ohne Backend
5. **Launch:** Auf Hauptseite verlinken

---

## FRAGEN AN WOLF

1. Welches Konzept spricht dich am meisten an?
2. Willst du die Fragen selbst schreiben oder soll ich Vorschläge machen?
3. Soll es einen Community-Aspekt geben (andere Antworten sehen)?
4. Wie viel Zeit willst du wöchentlich für Content-Erstellung aufwenden?

---

*Dokument erstellt: Januar 2025*
