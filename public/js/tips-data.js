// ═══════════════════════════════════════════════════════════════
// HOHL.ROCKS - TIPS DATA
// Tooltip-Daten für die Navigation und Features
// ═══════════════════════════════════════════════════════════════

window.TIPS_DATA = {
  // Navigation Tips
  navigation: {
    home: {
      title: "Startseite",
      description: "Zurück zur Hauptseite von hohl.rocks"
    },
    promptGenerator: {
      title: "Prompt Generator",
      description: "Erstelle professionelle AI-Prompts in 5 verschiedenen Stilen"
    },
    promptOptimizer: {
      title: "Prompt Optimizer",
      description: "Verbessere deine bestehenden Prompts mit KI-Analyse"
    },
    promptLibrary: {
      title: "Prompt Library",
      description: "Durchsuche 30+ kuratierte Premium-Prompts"
    },
    modelBattle: {
      title: "Model Battle Arena",
      description: "Vergleiche Claude, GPT-4 und Perplexity direkt"
    },
    dailyChallenge: {
      title: "Daily AI Challenge",
      description: "Löse tägliche Prompt-Challenges und sammle Punkte"
    },
    news: {
      title: "KI-News",
      description: "Die wichtigsten AI-News des Tages"
    },
    spark: {
      title: "Spark of the Day",
      description: "Tägliche Inspiration für KI-Prompt-Engineering"
    }
  },

  // Feature Tips
  features: {
    generator: {
      taskInput: "Beschreibe deine Aufgabe oder dein Ziel",
      styleSelect: "Wähle einen Prompt-Stil",
      contextInput: "Gib zusätzlichen Kontext für bessere Ergebnisse",
      generateButton: "Generiere deinen optimierten Prompt"
    },
    optimizer: {
      promptInput: "Füge deinen bestehenden Prompt hier ein",
      analyzeButton: "Lasse deinen Prompt analysieren",
      improvements: "Erhalte konkrete Verbesserungsvorschläge"
    },
    library: {
      search: "Suche nach Prompts nach Kategorie oder Keyword",
      categories: "Filtere nach Creative, Business, Technical oder Learning",
      featured: "Zeige nur Featured Prompts",
      copy: "Kopiere Prompts direkt in die Zwischenablage"
    },
    battle: {
      promptInput: "Gib deinen Prompt ein",
      startBattle: "Starte den Vergleich zwischen allen 3 Modellen",
      results: "Vergleiche die Antworten direkt nebeneinander"
    },
    challenge: {
      daily: "Jeden Tag eine neue Prompt-Challenge",
      submit: "Reiche deine Lösung ein",
      feedback: "Erhalte sofortiges Feedback von Claude"
    }
  },

  // Onboarding Tips
  onboarding: {
    welcome: {
      title: "Willkommen bei hohl.rocks!",
      description: "Deine Plattform für professionelles AI-Prompt-Engineering"
    },
    quickStart: {
      title: "Quick Start",
      steps: [
        "Wähle ein Feature aus der Navigation",
        "Probiere den Prompt Generator für einen ersten Test",
        "Erkunde die Prompt Library für Inspiration",
        "Nimm an der Daily Challenge teil"
      ]
    },
    tips: {
      title: "Pro Tips",
      items: [
        "Je spezifischer dein Input, desto besser das Ergebnis",
        "Nutze den Optimizer um bestehende Prompts zu verbessern",
        "Model Battle zeigt dir welches KI-Modell für deinen Use Case am besten ist",
        "Die Daily Challenge hilft dir deine Prompt-Skills zu verbessern"
      ]
    }
  },

  // Status Messages
  status: {
    loading: "Lädt...",
    success: "Erfolgreich!",
    error: "Ein Fehler ist aufgetreten",
    offline: "Backend nicht erreichbar - Offline Modus",
    ready: "Bereit",
    processing: "Verarbeite..."
  },

  // Error Messages
  errors: {
    network: "Netzwerkfehler - Bitte prüfe deine Internetverbindung",
    api: "API-Fehler - Bitte versuche es später erneut",
    validation: "Ungültige Eingabe - Bitte prüfe deine Daten",
    timeout: "Zeitüberschreitung - Der Server antwortet nicht",
    unknown: "Unbekannter Fehler - Bitte kontaktiere den Support"
  }
};

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.TIPS_DATA;
}

console.log('[Tips] TIPS_DATA loaded successfully');
