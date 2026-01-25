# Manifest & Visuelle Brüche: Implementierungskonzept

**Stand: Januar 2025**
**Für: hohl.rocks Redesign**

---

## TEIL 1: DAS MANIFEST

### 1.1 Der Text (Deutsch)

```
Ich war 25 Jahre im Film.
Kino-Trailer für die ganze Welt.

Dann kam KI.
Und ich dachte: Das ist die nächste Revolution.

Aber ich wollte nicht einfach mitlaufen.
Ich wollte verstehen.
Ich wollte selbst bauen.
Und ich wollte sicherstellen, dass wir das richtig machen.

Deshalb bin ich jetzt hier.

Mit 4 Projekten.
Mit einer TÜV-Zertifizierung.
Und mit der Überzeugung, dass Technologie nur dann gut ist,
wenn sie von Menschen gemacht wird, die wissen, was Mensch-Sein bedeutet.

Das heißt für mich:
Sonntagsbraten nach Omas Rezept kochen.
SC Freiburg gucken, auch wenn sie verlieren.
Mit dem Hund durch den Park.
Basquiat in der Galerie.
Krausser im Bett.

Und dann zurück an den Rechner
und das Beste bauen, was ich kann.
```

### 1.2 Alternative Version (kürzer)

```
25 Jahre Film.
Dann KI.

Nicht mitlaufen – verstehen.
Nicht konsumieren – bauen.
Nicht Technik um der Technik willen –
sondern Technologie, die dem Menschen dient.

4 Projekte. TÜV-zertifiziert.
Und ein Sonntagsbraten nach altem Rezept.

Das eine hat mit dem anderen zu tun.
Versprochen.
```

### 1.3 Englische Version (falls gewünscht)

```
25 years in film.
Movie trailers for the whole world.

Then came AI.
And I thought: This is the next revolution.

But I didn't want to just follow along.
I wanted to understand.
I wanted to build.
And I wanted to make sure we do this right.

That's why I'm here now.

With 4 projects.
With a TÜV certification.
And with the conviction that technology is only good
when it's made by people who know what being human means.

For me, that means:
Cooking Sunday roast from grandma's recipe.
Watching SC Freiburg, even when they lose.
Walking through the park with the dog.
Basquiat in the gallery.
Krausser in bed.

And then back to the computer
to build the best I can.
```

---

## TEIL 2: PLATZIERUNG DES MANIFESTS

### 2.1 Option A: Eigene Section

**Vorschlag:** Neue Section zwischen Hero und Projekten

```html
<section id="manifest" class="manifest-section">
  <div class="manifest-container">
    <div class="manifest-text">
      <!-- Manifest Text hier -->
    </div>
    <div class="manifest-visual">
      <!-- Foto oder Illustration -->
    </div>
  </div>
</section>
```

**Vorteile:**
- Klare Trennung von Hero und Projekten
- Gibt dem Manifest Raum zum Atmen
- Persönlicher Einstieg vor dem "Portfolio"

### 2.2 Option B: Im Hero integriert

**Vorschlag:** Manifest als scrollbare Erweiterung des Hero

Der Hero bleibt, aber beim Scrollen erscheint der Manifest-Text
in einer animierten Reveal-Animation.

### 2.3 Option C: Als Modal/Overlay

**Vorschlag:** Ein "Über mich"-Button im Hero öffnet das Manifest als Overlay

**Nachteil:** Versteckt die Persönlichkeit, statt sie zu zeigen

### Empfehlung: Option A

Das Manifest verdient seinen eigenen Raum. Es sollte **vor** den Projekten erscheinen,
damit Besucher zuerst den Menschen kennenlernen, bevor sie die Arbeit sehen.

---

## TEIL 3: VISUELLE BRÜCHE

### 3.1 Das Problem

Aktuell ist alles:
- Dunkel (schwarz/sehr dunkel)
- Blau (Yves Klein Blau)
- Perfekt ausgerichtet (Grid)
- Gleich behandelt (alle Karten gleich)

Das ist technisch sauber, aber **emotional flach**.

### 3.2 Die Lösung: Kontrollierte Unordnung

**Prinzip:** Basquiat-Inspiration
- Rohheit zwischen Perfektion
- Handschriftliche Elemente zwischen digitaler Typografie
- Warme Akzente zwischen kühlem Blau
- Asymmetrie zwischen Grid

### 3.3 Konkrete Implementierungen

#### A) Typografischer Bruch

**Aktuell:** Alles Inter

**Neu:**
- Headlines: Inter (bleibt)
- Manifest-Text: Handschrift-Font oder Slab-Serif
- Randnotizen: Handschrift-Font

**Font-Vorschläge:**
- `Caveat` - Handschrift, lesbar
- `Patrick Hand` - Natürlich, warm
- `Kalam` - Persönlich, lebendig
- `Libre Baskerville` - Slab-Serif, literarisch

**CSS:**
```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');

.manifest-text {
  font-family: 'Caveat', cursive;
  font-size: 1.5rem;
  line-height: 1.8;
}

.side-note {
  font-family: 'Caveat', cursive;
  font-size: 1rem;
  color: var(--color-warm);
}
```

#### B) Farbbruch

**Aktuell:** Nur Yves Klein Blau (#002FA7)

**Neu:** Warme Sekundärfarbe für persönliche Elemente

```css
:root {
  /* Bestehende Farben */
  --accent-primary: #002FA7;    /* Yves Klein Blau - Tech/Projekte */

  /* Neue warme Farben */
  --color-warm: #E07A5F;        /* Terracotta - Persönlichkeit */
  --color-warm-light: #F2CC8F;  /* Sanftes Gold */
  --color-sage: #81B29A;        /* Sage Grün - Ruhe */
}

/* Anwendung */
.manifest-section {
  background: linear-gradient(180deg,
    var(--bg-dark) 0%,
    rgba(224, 122, 95, 0.05) 100%
  );
}

.manifest-highlight {
  color: var(--color-warm);
}
```

#### C) Layout-Bruch

**Aktuell:** Perfekt zentriertes Grid

**Neu:** Asymmetrische Elemente in der Manifest-Section

```css
.manifest-container {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 4rem;
  position: relative;
}

.manifest-text {
  /* Leicht nach links versetzt */
  transform: translateX(-2rem);
}

.manifest-visual {
  /* Schräg gestellt */
  transform: rotate(-2deg);
}

/* Handschriftliche Randnotiz */
.side-note {
  position: absolute;
  right: -3rem;
  top: 20%;
  transform: rotate(3deg);
  writing-mode: vertical-rl;
  font-family: 'Caveat', cursive;
  color: var(--color-warm);
  opacity: 0.7;
}
```

#### D) Dekorative Elemente

**Idee 1: Handgezeichnete Unterstreichungen**

```css
.manifest-highlight {
  position: relative;
  display: inline;
}

.manifest-highlight::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 8px;
  background: url('/assets/underline-hand.svg') no-repeat;
  background-size: contain;
  opacity: 0.7;
}
```

**Idee 2: Textur-Overlay**

```css
.manifest-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/assets/paper-texture.png');
  opacity: 0.03;
  pointer-events: none;
}
```

**Idee 3: Basquiat-inspirierte Kronen/Symbole**

Kleine SVG-Icons (Krone, Stern, Pfeil) als dekorative Elemente
um das Manifest herum, leicht schräg und in warmen Farben.

---

## TEIL 4: RANDNOTIZEN FEATURE

### 4.1 Konzept

Kleine, wechselnde persönliche Notizen am Rand der Seite.
Sie erscheinen nach dem Laden der Seite mit einer sanften Animation.

### 4.2 Beispiel-Inhalte

```javascript
const sideNotes = [
  "Gerade gelesen: Helmut Krausser, UC",
  "Letztes Spiel: SC Freiburg 2:1",
  "Am Wochenende: Basquiat im Bode-Museum",
  "Heute gekocht: Königsberger Klopse",
  "Der Hund schläft unter dem Schreibtisch",
  "Jörg Juretzka wiederlesen",
  "Yoga am Morgen, Code am Nachmittag",
  "Die weite Hose ist die beste Erfindung"
];
```

### 4.3 Implementation

```html
<div class="side-notes-container">
  <div class="side-note" data-position="top-right"></div>
  <div class="side-note" data-position="mid-left"></div>
</div>
```

```css
.side-notes-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.side-note {
  position: absolute;
  font-family: 'Caveat', cursive;
  font-size: 1rem;
  color: var(--color-warm);
  opacity: 0;
  transform: rotate(var(--rotate, 3deg));
  transition: opacity 0.5s ease;
}

.side-note[data-position="top-right"] {
  top: 20%;
  right: 2rem;
  --rotate: 5deg;
}

.side-note[data-position="mid-left"] {
  top: 50%;
  left: 2rem;
  --rotate: -3deg;
}

.side-note.visible {
  opacity: 0.7;
}

/* Mobile: Verstecken */
@media (max-width: 1200px) {
  .side-notes-container {
    display: none;
  }
}
```

```javascript
// Randnotizen Feature
function initSideNotes() {
  const notes = [
    "Gerade gelesen: Helmut Krausser",
    "SC Freiburg 2:1 am Wochenende",
    "Heute: Königsberger Klopse"
  ];

  const noteElements = document.querySelectorAll('.side-note');
  if (noteElements.length === 0) return;

  // Zufällige Notiz für jede Position
  noteElements.forEach(el => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    el.textContent = randomNote;

    // Mit Verzögerung einblenden
    setTimeout(() => {
      el.classList.add('visible');
    }, 2000 + Math.random() * 2000);
  });

  // Alle 30 Sekunden wechseln
  setInterval(() => {
    noteElements.forEach(el => {
      el.classList.remove('visible');
      setTimeout(() => {
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        el.textContent = randomNote;
        el.classList.add('visible');
      }, 500);
    });
  }, 30000);
}

document.addEventListener('DOMContentLoaded', initSideNotes);
```

---

## TEIL 5: PROJEKTE ZURÜCKSTUFEN

### 5.1 Aktuelle Reihenfolge

1. Hero
2. Projekte (zu dominant!)
3. KI ausprobieren
4. Über mich (Timeline)
5. Footer

### 5.2 Neue Reihenfolge

1. Hero
2. **Manifest** (NEU)
3. KI ausprobieren (interaktiv)
4. Projekte (dezenter)
5. Über mich (neu gestaltet)
6. Footer

### 5.3 Projekte-Section Redesign

**Aktuell:** 4 große Karten, alle gleich behandelt

**Neu:** Kleinere Karten, Story-Fokus

```css
/* Projekte dezenter */
.projects-section {
  padding: 4rem 0;
}

.project-card {
  /* Kleiner als vorher */
  max-width: 280px;
  padding: 1.5rem;

  /* Weniger dramatisch */
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.project-card:hover {
  /* Sanfterer Hover */
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-4px);
}

/* Story-Text unter jeder Karte */
.project-story {
  font-style: italic;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}
```

**Projekt-Stories:**
- **ki-sicherheit.jetzt:** "Weil ich gesehen habe, wie Firmen KI falsch einsetzen."
- **art-radar.berlin:** "Weil ich selbst ständig Ausstellungen verpasse."
- **akut.jetzt:** "Weil Sicherheit nicht verhandelbar ist."
- **achtung.jetzt:** "Weil Datenschutz kein Luxus sein sollte."

---

## TEIL 6: IMPLEMENTIERUNGSPLAN

### Phase 1: Manifest Section (Priorität HOCH)

1. [ ] Manifest-Text finalisieren
2. [ ] Neue Section in index.html einfügen
3. [ ] CSS für Manifest-Section schreiben
4. [ ] Handschrift-Font laden (Caveat)
5. [ ] Warme Sekundärfarbe einführen

### Phase 2: Visuelle Brüche (Priorität MITTEL)

6. [ ] Typografischen Kontrast implementieren
7. [ ] Asymmetrische Layouts für Manifest
8. [ ] Dekorative SVG-Elemente erstellen
9. [ ] Textur-Overlay hinzufügen

### Phase 3: Randnotizen (Priorität NIEDRIG)

10. [ ] Randnotizen-Feature implementieren
11. [ ] Notiz-Inhalte definieren
12. [ ] Mobile-Verhalten testen

### Phase 4: Projekte zurückstufen (Priorität MITTEL)

13. [ ] Reihenfolge der Sections ändern
14. [ ] Projekt-Karten verkleinern
15. [ ] Story-Texte hinzufügen

---

## TEIL 7: MOODBOARD (Textbeschreibung)

### Visuelle Referenzen

1. **Basquiat-Stil:**
   - Rohe Linien
   - Kronen und Symbole
   - Handschrift neben gedrucktem Text
   - Bewusste "Fehler"

2. **Literatur-Referenz (Krausser/Fauser):**
   - Schreibmaschinenästhetik
   - Marginalbemerkungen
   - Durchgestrichene Wörter (visuell)

3. **SC Freiburg:**
   - Rot/Weiß als versteckter Akzent
   - Vereinswappen als Easter Egg?

4. **Yoga/Pilates:**
   - Ruhe
   - Weißraum
   - Atem-Rhythm in Animationen

---

## TEIL 8: TECHNISCHE ASSETS (zu erstellen)

1. **Fonts:**
   - Caveat (Google Fonts)
   - Oder: Patrick Hand, Kalam

2. **SVGs:**
   - `underline-hand.svg` - Handgezeichnete Unterstreichung
   - `crown.svg` - Basquiat-Krone
   - `arrow-hand.svg` - Handgezeichneter Pfeil

3. **Texturen:**
   - `paper-texture.png` - Subtile Papierstruktur
   - `noise.png` - Feines Rauschen

4. **Fotos (optional):**
   - Authentisches Foto von Wolf
   - Oder: Illustration im Basquiat-Stil

---

*Dokument erstellt: Januar 2025*
*Für Rückfragen: Einfach weitermachen in dieser Conversation*
