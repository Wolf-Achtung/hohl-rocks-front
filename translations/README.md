# Englische Fassung

Die deutsche `public/index.html` ist die einzige Quelle. Die englische Seite
unter `public/en/index.html` wird daraus erzeugt und liegt fertig im Repo –
Netlify kopiert weiter nur Dateien und braucht keinen Bauschritt.

## Nach jeder Textänderung an der deutschen Seite

```
npm run build:en
```

Das Skript meldet zwei Dinge:

- **Stellen ohne Übersetzung** – neuer oder geänderter deutscher Text. Trag
  ihn in `en.json` nach.
- **Einträge ohne Fundstelle** – der deutsche Text dazu wurde geändert oder
  gelöscht. Alten Eintrag anpassen oder entfernen.

Neue Stellen als Gerüst herausschreiben:

```
node scripts/build-en.mjs --sammle   # schreibt translations/fehlt.json
```

Nur prüfen, ohne zu schreiben (Rückgabewert 1, wenn etwas fehlt):

```
npm run check:en
```

## Aufbau von en.json

Flache Zuordnung: deutscher Text → englischer Text. Der Schlüssel ist der
deutsche Text mit zusammengefassten Leerzeichen.

Zwei Sonderschlüssel:

- `__skript` – deutsche Zeichenketten im eingebetteten JavaScript. Sie
  stehen in einer eigenen Liste, damit kein Suchen-und-Ersetzen
  versehentlich Code trifft.
- `__manifest` – Felder für `public/en/manifest.json`.

## Was das Skript selbst erledigt

`lang`, `canonical`, `hreflang`, `og:locale`, den Verweis aufs eigene
Manifest, den Sprachwechsel in der Fußzeile und den Verweis auf das
englische Goodie.

## Was nicht erzeugt wird

- `public/model-battle.html` – eigene Seite, bisher nur auf Deutsch.
- Die Antworten von Chat und Modellvergleich kommen aus dem Backend. Die
  Seite schickt `lang` mit; das Backend antwortet in der Sprache der Seite.
