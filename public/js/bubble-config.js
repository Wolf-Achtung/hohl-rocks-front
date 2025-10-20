// public/js/bubble-config.js
// Hier können Sie die Bubble-Inhalte zentral verwalten und anpassen

window.BUBBLE_CONFIG = [
  {
    id: 'briefing',
    text: 'Briefing-Assistent',
    size: 140,
    color: 'cyan', // Neon-Cyan
    description: 'Executive Briefings in Sekunden'
  },
  {
    id: 'agenda',
    text: 'Meeting-Agenda',
    size: 130,
    color: 'magenta', // Neon-Magenta
    description: 'Effiziente 30-Min Meetings'
  },
  {
    id: 'pitch',
    text: '60s Pitch',
    size: 120,
    color: 'yellow', // Neon-Gelb
    description: 'Überzeugende Elevator Pitches'
  },
  {
    id: 'risks',
    text: 'Risiko-Analyse',
    size: 135,
    color: 'orange', // Neon-Orange
    description: 'Professionelle Risikobewertung'
  },
  {
    id: 'excel',
    text: 'Excel-Formeln',
    size: 125,
    color: 'green', // Neon-Grün
    description: 'Excel-Probleme sofort gelöst'
  },
  {
    id: 'daily',
    text: 'Täglicher Fokus',
    size: 140,
    color: 'purple', // Neon-Lila
    description: 'Ihr perfekter Tagesplan'
  },
  // Neue Bubbles können hier einfach hinzugefügt werden:
  {
    id: 'email',
    text: 'E-Mail Assistent',
    size: 130,
    color: 'pink',
    description: 'Professionelle E-Mails in Sekunden'
  },
  {
    id: 'strategy',
    text: 'Strategie-Coach',
    size: 145,
    color: 'blue',
    description: 'SWOT-Analyse & Strategieplanung'
  },
  {
    id: 'data',
    text: 'Daten-Analyst',
    size: 125,
    color: 'teal',
    description: 'Datenanalyse & Visualisierung'
  },
  {
    id: 'creative',
    text: 'Kreativ-Booster',
    size: 135,
    color: 'coral',
    description: 'Kreative Ideen & Konzepte'
  }
];

// Erweiterte Konfiguration
window.BUBBLE_SETTINGS = {
  maxBubbles: 4,           // Maximal gleichzeitig sichtbare Bubbles
  minLifetime: 10000,      // Minimale Sichtbarkeitsdauer (10 Sekunden)
  maxLifetime: 15000,      // Maximale Sichtbarkeitsdauer (15 Sekunden)
  fadeInTime: 2000,        // Einblendzeit (2 Sekunden)
  fadeOutTime: 2000,       // Ausblendzeit (2 Sekunden)
  generationInterval: 3000, // Neue Bubble alle 3 Sekunden (wenn < maxBubbles)
  animationSpeed: 20       // Bewegungsgeschwindigkeit (Sekunden für eine Animation)
};

// Optional: Kontextuelle Prompts für bessere KI-Antworten
window.BUBBLE_PROMPTS = {
  briefing: {
    question: "Für welches Thema möchten Sie ein Executive Briefing?",
    placeholder: "z.B. KI-Strategie, Digitalisierung, Marktexpansion",
    skipable: true
  },
  agenda: {
    question: "Worum geht es in dem Meeting?",
    placeholder: "z.B. Projektplanung, Quartalsreview, Teambuilding",
    skipable: true
  },
  pitch: {
    question: "Was möchten Sie pitchen?",
    placeholder: "z.B. Neue App, Geschäftsidee, Projektvorschlag",
    skipable: true
  },
  risks: {
    question: "Welches Projekt/Vorhaben soll analysiert werden?",
    placeholder: "z.B. Cloud-Migration, Produktlaunch, Expansion",
    skipable: true
  },
  excel: {
    question: "Beschreiben Sie Ihr Excel-Problem:",
    placeholder: "z.B. Pivot-Tabelle, SVERWEIS, Datenanalyse",
    skipable: false
  },
  daily: {
    question: "Was ist heute Ihr Hauptfokus?",
    placeholder: "z.B. 3 Deadlines, Präsentation vorbereiten",
    skipable: true
  },
  email: {
    question: "Welche Art von E-Mail möchten Sie schreiben?",
    placeholder: "z.B. Angebot, Beschwerde, Einladung",
    skipable: false
  },
  strategy: {
    question: "Welche strategische Herausforderung haben Sie?",
    placeholder: "z.B. Markteinführung, Wettbewerbsanalyse",
    skipable: false
  },
  data: {
    question: "Welche Daten möchten Sie analysieren?",
    placeholder: "z.B. Verkaufszahlen, Kundenverhalten, Trends",
    skipable: false
  },
  creative: {
    question: "Wobei brauchen Sie kreative Unterstützung?",
    placeholder: "z.B. Kampagnen-Idee, Produktname, Content",
    skipable: false
  }
};