/* tips-data.js
 * Curated tips (Problem/Situation, Lösung, Prompt) ready for UI.
 * These are static; can be replaced by auto-generated tips later.
 */
window.TIPS_DATA = [
  {
    id: "prompt-basics",
    title: "AI Prompt Engineering Basics",
    category: "Praxis",
    problem: "Unklare Prompts liefern unzuverlässige Ergebnisse.",
    solution: "Nutze Rollen, Ziel, Format und Qualitätskriterien. Baue Beispiele ein und bitte um Selbstprüfung.",
    prompt: "Rolle: Du bist ein präziser technischer Redakteur.\nZiel: Erkläre [Thema] verständlich für Einsteiger.\nFormat: Überschrift, 3 Bulletpoints, 1 Beispiel.\nQualität: Korrigiere Fachfehler, nenne Quellenideen.\nBeispiel: ...\n\nAufgabe: Schreibe den Text.",
    tags: ["Prompting", "Best Practice"]
  },
  {
    id: "sonnet-best",
    title: "Claude 3.5 Sonnet Best Practices",
    category: "Effizienz",
    problem: "Sonnet liefert viel Text, aber nicht immer die gewünschte Struktur.",
    solution: "Definiere strukturierte Ausgaben (JSON/Markdown) und nutze Follow-up-Refinement in kurzen Iterationen.",
    prompt: "Du bist ein strukturierter KI-Analyst. Erzeuge eine Markdown-Checkliste zu [Aufgabe] mit: Ziel, Schritte, Risiken, Zeitbedarf. Kurze Sätze, klare Verben.",
    tags: ["Claude", "Struktur"]
  },
  {
    id: "web-perf",
    title: "Video Optimization for Web",
    category: "Performance",
    problem: "Hintergrundvideos sind dunkel oder groß – Performance leidet.",
    solution: "Nutze CSS-Filter für Look, modern codecs (H.265/AV1), und lazy/hardware-accelerated playback.",
    prompt: "Gib mir eine kurze Optimierungs-Checkliste für Web-Videos: Codec, Bitrate, Resolution ladders, CSS-Filter, Autoplay-Policies, Accessibility.",
    tags: ["Web", "Performance"]
  },
  {
    id: "gdpr",
    title: "DSGVO-konforme KI-Nutzung",
    category: "Rechtssicherheit",
    problem: "Unsicherheit bei personenbezogenen Daten in LLM-Prompts.",
    solution: "Datensparsamkeit, Pseudonymisierung, Model- und Anbieterwahl (EU), Logging ohne PII.",
    prompt: "Erstelle eine knappe Policy-Vorlage für DSGVO-konforme LLM-Nutzung im Unternehmen inkl. Do/Don't-Liste.",
    tags: ["Compliance", "Policy"]
  },
  {
    id: "eu-ai-act",
    title: "EU AI Act – Was Sie wissen müssen",
    category: "Compliance",
    problem: "Neue Pflichten für KI-Anbieter und -Nutzer sind unklar.",
    solution: "Stufe die eigenen Systeme ein (Risiko-Level), implementiere Transparenz & Human Oversight, dokumentiere Tests.",
    prompt: "Fasse die Pflichten für [Use Case] nach EU AI Act zusammen (5 Punkte), inkl. Risikostufe & To-do-Liste.",
    tags: ["Regulierung"]
  },
  {
    id: "copywriter",
    title: "Profi-Text mit Iterationen",
    category: "Produktivität",
    problem: "Entwürfe sind ok, aber nicht druckreif.",
    solution: "Arbeite in 2 Phasen: Ideenliste → Auswahl → Feinschliff mit Stil-Constraints & Faktencheck.",
    prompt: "Phase 1: 10 knackige Ideen zu [Thema].\nWähle 3 stärkste.\nPhase 2: Schreibe finalen Text (max. 220 Wörter) im Stil 'klar, modern, ohne Jargon'.",
    tags: ["Schreiben", "Qualität"]
  }
];
