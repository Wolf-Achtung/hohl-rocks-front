// ===================================================================
// Englische Fassung erzeugen
// ===================================================================
// Die deutsche public/index.html ist die einzige Quelle. Dieses Skript
// tauscht ihre Texte gegen die Eintraege aus translations/en.json und
// schreibt public/en/index.html.
//
//   node scripts/build-en.mjs          erzeugt die Seite
//   node scripts/build-en.mjs --pruefe meldet nur, was fehlt oder alt ist
//   node scripts/build-en.mjs --sammle schreibt fehlende Stellen als
//                                      Geruest nach translations/fehlt.json
//
// Absichtlich ohne Abhaengigkeiten und ohne Netlify-Bauschritt: Netlify
// kopiert weiter nur Dateien. Wer die deutsche Seite aendert, laesst das
// Skript laufen und legt die erzeugte Datei mit in den Commit.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const QUELLE = join(wurzel, "public/index.html");
const ZIEL = join(wurzel, "public/en/index.html");
const WOERTERBUCH = join(wurzel, "translations/en.json");

const nurPruefen = process.argv.includes("--pruefe");
const sammeln = process.argv.includes("--sammle");

const woerterbuch = JSON.parse(readFileSync(WOERTERBUCH, "utf8"));
const html = readFileSync(QUELLE, "utf8");

// Texte, die in beiden Sprachen gleich sind: Namen, Domains, Zeichen.
const gleich = /^[\s\d.,:;·×—–\-—+/|()[\]{}&@#*"'`´!?%€$…«»„“”‹›]*$/;

// "value" fehlt bewusst: dort stehen Formularschluessel (Netlify Forms)
// und Optionswerte. Der sichtbare Text einer Option ist ihr Textknoten
// und wird ohnehin erfasst.
const ATTRIBUTE = ["content", "alt", "title", "aria-label", "placeholder"];

const fehlt = new Map();
const benutzt = new Set();

function uebersetze(text, herkunft) {
  const schluessel = text.replace(/\s+/g, " ").trim();
  if (!schluessel || gleich.test(schluessel)) return null;
  if (Object.prototype.hasOwnProperty.call(woerterbuch, schluessel)) {
    benutzt.add(schluessel);
    return woerterbuch[schluessel];
  }
  if (!fehlt.has(schluessel)) fehlt.set(schluessel, herkunft);
  return null;
}

// -------------------------------------------------------------------
// 1. Textknoten. Der Zerleger laeuft einmal durch die Datei.
// -------------------------------------------------------------------
let ergebnis = "";
let rest = html;

while (rest.length) {
  const spitz = rest.indexOf("<");

  if (spitz === -1) {
    ergebnis += textErsetzen(rest);
    break;
  }

  if (spitz > 0) {
    ergebnis += textErsetzen(rest.slice(0, spitz));
    rest = rest.slice(spitz);
  }

  if (rest.startsWith("<!--")) {
    const ende = rest.indexOf("-->");
    const schnitt = ende === -1 ? rest.length : ende + 3;
    ergebnis += rest.slice(0, schnitt);
    rest = rest.slice(schnitt);
    continue;
  }

  const ende = rest.indexOf(">");
  const schnitt = ende === -1 ? rest.length : ende + 1;
  const tag = rest.slice(0, schnitt);
  rest = rest.slice(schnitt);

  const name = (tag.match(/^<([a-zA-Z0-9-]+)/) || [])[1];
  ergebnis += attributeErsetzen(tag);

  // In <script> und <style> steht kein Markup. Ein "<" darin ist ein
  // Vergleich oder eine Vorlage - wer dort weiter nach Tags sucht,
  // verschluckt sich am ersten "i < laenge" und haelt den Rest der Datei
  // fuer Skript. Deshalb wird von hier bis zum schliessenden Tag alles
  // unveraendert uebernommen, so wie es auch ein Browser tut.
  if (name === "script" || name === "style") {
    const schluss = new RegExp(`</${name}\\s*>`, "i").exec(rest);
    const bis = schluss ? schluss.index : rest.length;
    ergebnis += rest.slice(0, bis);
    rest = rest.slice(bis);
  }
}

function textErsetzen(stueck) {
  // Fuehrende und schliessende Leerzeichen bleiben stehen: sie tragen im
  // HTML die Wortabstaende zwischen Elementen.
  const treffer = stueck.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const [, vorn, kern, hinten] = treffer;
  if (!kern) return stueck;
  const neu = uebersetze(kern, "Text");
  return neu === null ? stueck : vorn + neu + hinten;
}

function attributeErsetzen(tag) {
  // Meta-Angaben mit technischem Inhalt bleiben unangetastet.
  if (/<meta[^>]+(charset|property="og:(type|url|image|locale)"|name="(viewport|theme-color|color-scheme|robots|x-api-base|twitter:card|twitter:image|apple-mobile-web-app-capable|apple-mobile-web-app-status-bar-style|format-detection|mobile-web-app-capable)")/i.test(tag)) {
    return tag;
  }
  return tag.replace(
    new RegExp(`\\b(${ATTRIBUTE.join("|")})="([^"]*)"`, "g"),
    (ganz, attribut, wert) => {
      const neu = uebersetze(wert, `Attribut ${attribut}`);
      return neu === null ? ganz : `${attribut}="${neu}"`;
    }
  );
}

// -------------------------------------------------------------------
// 2. Deutsche Zeichenketten im eingebetteten Skript. Sie stehen in einer
//    eigenen Liste, damit kein Suchen-und-Ersetzen versehentlich Code
//    trifft.
// -------------------------------------------------------------------
const skriptTexte = woerterbuch.__skript || {};
for (const [de, en] of Object.entries(skriptTexte)) {
  const vorher = ergebnis;
  ergebnis = ergebnis.split(de).join(en);
  if (vorher === ergebnis) fehlt.set(de, "Skript (nicht gefunden)");
}

// -------------------------------------------------------------------
// 3. Kopfbereich: Sprache, kanonische Adresse, Verweise zwischen den
//    Fassungen.
// -------------------------------------------------------------------
ergebnis = ergebnis
  .replace(/<html lang="de"/, '<html lang="en"')
  .replace(/<link rel="canonical" href="https:\/\/hohl\.rocks\/"\s*\/?>/,
    '<link rel="canonical" href="https://hohl.rocks/en/" />\n'
    + '    <link rel="alternate" hreflang="de" href="https://hohl.rocks/" />\n'
    + '    <link rel="alternate" hreflang="en" href="https://hohl.rocks/en/" />\n'
    + '    <link rel="alternate" hreflang="x-default" href="https://hohl.rocks/" />')
  .replace(/<meta property="og:url" content="https:\/\/hohl\.rocks\/"/,
    '<meta property="og:url" content="https://hohl.rocks/en/"')
  .replace(/<meta property="og:locale" content="de_DE"/,
    '<meta property="og:locale" content="en_GB"')
  .replace(/href="\/manifest\.json"/, 'href="/en/manifest.json"')
  // Die Markierung im Sprachumschalter wandert von DE auf EN.
  .replace(/(<a href="\/" hreflang="de" lang="de" class="sprache-option") aria-current="true"/,
    "$1")
  .replace(/(<a href="\/en\/" hreflang="en" lang="en" class="sprache-option")/,
    '$1 aria-current="true"')
  // Die Goodies liegen in beiden Sprachen vor.
  .replace(/href="\/downloads\/klartext-standard\.md"/g,
    'href="/downloads/plain-language-standard.md"')
  .replace(/href="\/downloads\/schwere-mails\.md"/g,
    'href="/downloads/five-hard-emails.md"')
  .replace(/href="\/downloads\/ki-hausordnung\.md"/g,
    'href="/downloads/ai-house-rules.md"');

// -------------------------------------------------------------------
// 4. Bericht und Ausgabe
// -------------------------------------------------------------------
const ungenutzt = Object.keys(woerterbuch)
  .filter((k) => !k.startsWith("__") && !benutzt.has(k));

if (fehlt.size) {
  console.log(`\n${fehlt.size} Stellen ohne Übersetzung:\n`);
  for (const [text, herkunft] of fehlt) {
    console.log(`  [${herkunft}] ${text.slice(0, 90)}`);
  }
}
if (ungenutzt.length) {
  console.log(`\n${ungenutzt.length} Einträge im Wörterbuch ohne Fundstelle `
    + `(deutscher Text geändert?):\n`);
  for (const text of ungenutzt) console.log(`  ${text.slice(0, 90)}`);
}

if (sammeln) {
  const geruest = {};
  for (const text of fehlt.keys()) geruest[text] = "";
  writeFileSync(join(wurzel, "translations/fehlt.json"),
    JSON.stringify(geruest, null, 2) + "\n", "utf8");
  console.log(`\ntranslations/fehlt.json geschrieben (${fehlt.size} Einträge).`);
}

if (nurPruefen) {
  const sauber = fehlt.size === 0 && ungenutzt.length === 0;
  console.log(sauber
    ? "\nWörterbuch und Seite passen zusammen."
    : "\nWörterbuch und Seite passen NICHT zusammen.");
  process.exit(sauber ? 0 : 1);
}

mkdirSync(dirname(ZIEL), { recursive: true });
writeFileSync(ZIEL, ergebnis, "utf8");

// Manifest der englischen Fassung gleich mit erzeugen.
const manifest = JSON.parse(readFileSync(join(wurzel, "public/manifest.json"), "utf8"));
const manifestTexte = woerterbuch.__manifest || {};
for (const feld of ["name", "short_name", "description"]) {
  if (manifestTexte[feld]) manifest[feld] = manifestTexte[feld];
}
manifest.lang = "en";
manifest.start_url = "/en/";
if (Array.isArray(manifest.screenshots)) {
  manifest.screenshots = manifest.screenshots.map((s) => ({
    ...s,
    label: manifestTexte[s.label] || s.label
  }));
}
writeFileSync(join(wurzel, "public/en/manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n", "utf8");

const gesamt = Object.keys(woerterbuch).filter((k) => !k.startsWith("__")).length;
console.log(`\npublic/en/index.html geschrieben – ${benutzt.size} von ${gesamt} `
  + `Einträgen verwendet, ${fehlt.size} Stellen offen.`);
