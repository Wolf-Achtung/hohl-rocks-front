// ===================================================================
// MODEL BATTLE ARENA - JavaScript (OPTIMIZED v2.1 - IIFE)
// Features: API Integration, Battle Logic, Voting, LocalStorage
// Fixed: API_BASE duplication, DOM access timing, defensive checks, scope conflicts
// ===================================================================

(function() {
'use strict';

// State
let currentBattleResults = null;
let votedModel = null;

// DOM Elements (will be initialized in DOMContentLoaded)
let promptInput, charCurrent, startBattleBtn, resultsSection, newBattleBtn, quickBtns, toast;

// API Base - use centralized API
const getApiBase = () => {
  if (window.API && typeof window.API.base === 'function') {
    return window.API.base();
  }
  // Fallback for development
  return 'https://hohl-rocks-back-production.up.railway.app';
};

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Page Detection - only initialize on model-battle.html
  const isOnFeaturePage = window.location.pathname.includes('model-battle.html');
  
  if (!isOnFeaturePage) {
    console.log('[Model Battle] Not on feature page, skipping initialization');
    return;
  }
  
  console.log('[Model Battle] Initializing...');
  
  // Initialize DOM elements safely
  promptInput = document.getElementById('battle-prompt');
  charCurrent = document.getElementById('char-current');
  startBattleBtn = document.getElementById('start-battle-btn');
  resultsSection = document.getElementById('results-section');
  newBattleBtn = document.getElementById('new-battle-btn');
  quickBtns = document.querySelectorAll('.quick-btn');
  toast = document.getElementById('toast');
  
  // Validate critical DOM elements
  if (!promptInput || !startBattleBtn) {
    console.error('[Model Battle] Critical DOM elements not found!');
    return;
  }
  
  setupEventListeners();
  loadStats();
  
  console.log('[Model Battle] Initialized successfully');
});

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function setupEventListeners() {
  // Input character counter
  if (promptInput && charCurrent && startBattleBtn) {
    promptInput.addEventListener('input', () => {
      const length = promptInput.value.length;
      charCurrent.textContent = length;
      startBattleBtn.disabled = length === 0;
    });
  }

  // Start battle
  if (startBattleBtn) {
    startBattleBtn.addEventListener('click', startBattle);
  }

  // Quick prompts
  if (quickBtns && promptInput && charCurrent && startBattleBtn) {
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        promptInput.value = prompt;
        charCurrent.textContent = prompt.length;
        startBattleBtn.disabled = false;
        promptInput.focus();
      });
    });
  }

  // New battle
  if (newBattleBtn) {
    newBattleBtn.addEventListener('click', resetBattle);
  }

  // Enter key to start battle
  if (promptInput && startBattleBtn) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey && !startBattleBtn.disabled) {
        startBattle();
      }
    });
  }
}

// ===================================================================
// BATTLE LOGIC
// ===================================================================

async function startBattle() {
  if (!promptInput || !startBattleBtn || !resultsSection) {
    console.error('[Model Battle] Required DOM elements not found');
    return;
  }
  
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showToast('Bitte gib einen Prompt ein', 'error');
    return;
  }

  try {
    // Disable button
    startBattleBtn.disabled = true;
    startBattleBtn.textContent = '⚔️ Battle läuft...';

    // Show results section
    resultsSection.style.display = 'block';
    
    // Reset previous results
    resetResponseCards();
    votedModel = null;

    // Scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Call API
    const API_BASE = getApiBase();
    const response = await fetch(`${API_BASE}/api/model-battle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    currentBattleResults = data;

    // Display results
    displayResults(data);

    // Save to history
    saveBattleToHistory(prompt, data);

    // Show toast
    showToast('Battle abgeschlossen! 🎉');

  } catch (error) {
    console.error('[Model Battle] Battle error:', error);
    showToast('Fehler beim Battle. Bitte versuche es erneut.', 'error');
    
    // Re-enable button
    if (startBattleBtn) {
      startBattleBtn.disabled = false;
      startBattleBtn.textContent = '⚔️ Battle starten';
    }
  }
}

function resetResponseCards() {
  const models = ['claude', 'gpt', 'perplexity'];

  models.forEach(model => {
    // Reset loading state
    const loadingEl = document.getElementById(`loading-${model}`);
    const responseEl = document.getElementById(`response-${model}`);
    
    if (loadingEl) loadingEl.style.display = 'flex';
    if (responseEl) responseEl.style.display = 'none';

    // Reset time
    const timeEl = document.getElementById(`time-${model}`);
    if (timeEl) timeEl.textContent = '-';

    // Reset buttons
    const voteBtn = document.querySelector(`[data-model="${model}"].vote-btn`);
    const copyBtn = document.querySelector(`[data-model="${model}"].copy-btn`);
    
    if (voteBtn) {
      voteBtn.disabled = true;
      voteBtn.classList.remove('voted');
      voteBtn.textContent = '👍 Vote';
    }
    
    if (copyBtn) {
      copyBtn.disabled = true;
      copyBtn.classList.remove('copied');
      copyBtn.textContent = '📋 Kopieren';
    }

    // Reset winner badge
    const card = document.querySelector(`[data-model="${model}"].response-card`);
    if (card) card.classList.remove('winner');
  });

  // Reset stats
  const fastestEl = document.getElementById('fastest-model');
  const favoriteEl = document.getElementById('favorite-model');
  
  if (fastestEl) fastestEl.textContent = '-';
  if (favoriteEl) favoriteEl.textContent = 'Noch nicht gewählt';
}

function displayResults(data) {
  const { responses } = data;

  // Find fastest model
  const fastestModel = responses.reduce((fastest, current) => 
    current.responseTime < fastest.responseTime ? current : fastest
  );

  const fastestEl = document.getElementById('fastest-model');
  if (fastestEl) fastestEl.textContent = fastestModel.name;

  // Display each response
  responses.forEach(result => {
    const modelKey = result.model;
    
    // Hide loading
    const loadingEl = document.getElementById(`loading-${modelKey}`);
    if (loadingEl) loadingEl.style.display = 'none';

    // Show response
    const responseEl = document.getElementById(`response-${modelKey}`);
    if (responseEl) {
      responseEl.textContent = result.response;
      responseEl.style.display = 'block';
    }

    // Update time
    const timeEl = document.getElementById(`time-${modelKey}`);
    if (timeEl) {
      timeEl.textContent = `${(result.responseTime / 1000).toFixed(2)}s`;
      
      // Highlight fastest
      if (result.model === fastestModel.model) {
        timeEl.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        timeEl.style.color = '#fff';
      }
    }

    // Enable buttons
    const voteBtn = document.querySelector(`[data-model="${modelKey}"].vote-btn`);
    const copyBtn = document.querySelector(`[data-model="${modelKey}"].copy-btn`);
    
    if (voteBtn && result.success) {
      voteBtn.disabled = false;
      voteBtn.onclick = () => voteForModel(modelKey, result.name);
    }
    
    if (copyBtn && result.success) {
      copyBtn.disabled = false;
      copyBtn.onclick = () => copyResponse(modelKey, result.response);
    }
  });

  // Re-enable start button
  if (startBattleBtn) {
    startBattleBtn.disabled = false;
    startBattleBtn.textContent = '⚔️ Battle starten';
  }
}

// ===================================================================
// VOTING SYSTEM
// ===================================================================

function voteForModel(model, modelName) {
  // Remove previous vote
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.classList.remove('voted');
    btn.textContent = '👍 Vote';
  });

  document.querySelectorAll('.response-card').forEach(card => {
    card.classList.remove('winner');
  });

  // Set new vote
  const voteBtn = document.querySelector(`[data-model="${model}"].vote-btn`);
  if (voteBtn) {
    voteBtn.classList.add('voted');
    voteBtn.textContent = '✅ Gewählt';
  }

  const card = document.querySelector(`[data-model="${model}"].response-card`);
  if (card) {
    card.classList.add('winner');
  }

  votedModel = model;
  
  const favoriteEl = document.getElementById('favorite-model');
  if (favoriteEl) favoriteEl.textContent = modelName;

  // Save vote to stats
  saveVote(model);

  // Show toast
  showToast(`${modelName} gewählt! 🏆`);
}

// ===================================================================
// COPY FUNCTIONALITY
// ===================================================================

async function copyResponse(model, text) {
  try {
    await navigator.clipboard.writeText(text);
    
    const copyBtn = document.querySelector(`[data-model="${model}"].copy-btn`);
    if (copyBtn) {
      copyBtn.textContent = '✅ Kopiert!';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyBtn.textContent = '📋 Kopieren';
        copyBtn.classList.remove('copied');
      }, 2000);
    }

    showToast('Antwort kopiert! 📋');

  } catch (error) {
    console.error('[Model Battle] Copy failed:', error);
    showToast('Fehler beim Kopieren', 'error');
  }
}

// ===================================================================
// RESET BATTLE
// ===================================================================

function resetBattle() {
  if (!promptInput || !charCurrent || !startBattleBtn || !resultsSection) return;
  
  // Clear input
  promptInput.value = '';
  charCurrent.textContent = '0';
  startBattleBtn.disabled = true;
  startBattleBtn.textContent = '⚔️ Battle starten';

  // Hide results
  resultsSection.style.display = 'none';

  // Reset state
  currentBattleResults = null;
  votedModel = null;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================================
// LOCAL STORAGE - Battle History & Stats
// ===================================================================

function saveBattleToHistory(prompt, results) {
  try {
    const history = JSON.parse(localStorage.getItem('battleHistory') || '[]');
    
    history.unshift({
      prompt,
      results,
      timestamp: new Date().toISOString(),
      voted: votedModel
    });

    // Keep only last 50 battles
    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem('battleHistory', JSON.stringify(history));
  } catch (error) {
    console.error('[Model Battle] Error saving to history:', error);
  }
}

function saveVote(model) {
  try {
    const stats = JSON.parse(localStorage.getItem('battleStats') || '{}');
    
    if (!stats.votes) {
      stats.votes = { claude: 0, gpt: 0, perplexity: 0 };
    }

    stats.votes[model] = (stats.votes[model] || 0) + 1;
    stats.totalBattles = (stats.totalBattles || 0) + 1;
    stats.lastUpdated = new Date().toISOString();

    localStorage.setItem('battleStats', JSON.stringify(stats));
  } catch (error) {
    console.error('[Model Battle] Error saving vote:', error);
  }
}

function loadStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('battleStats') || '{}');
    console.log('[Model Battle] Stats:', stats);
    
    // Could be used to display stats in UI later
  } catch (error) {
    console.error('[Model Battle] Error loading stats:', error);
  }
}

// ===================================================================
// TOAST NOTIFICATION
// ===================================================================

function showToast(message, type = 'success') {
  if (!toast) return;
  
  const toastMessage = document.getElementById('toast-message');
  if (!toastMessage) return;
  
  toastMessage.textContent = message;

  if (type === 'error') {
    toast.style.background = 'rgba(239, 68, 68, 0.95)';
  } else {
    toast.style.background = 'rgba(34, 197, 94, 0.95)';
  }

  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ===================================================================
// ERROR HANDLING
// ===================================================================

window.addEventListener('error', (e) => {
  console.error('[Model Battle] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Model Battle] Unhandled promise rejection:', e.reason);
});

})(); // End IIFE
