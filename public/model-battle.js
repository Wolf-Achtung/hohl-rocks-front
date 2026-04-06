// ===================================================================
// MODEL BATTLE ARENA - JavaScript (v3.0 - API v2.8.0)
// Features: 4 Models (Claude, GPT, Perplexity, Gemini),
//   Graceful Degradation, Rate Limiting, Voting, LocalStorage
// ===================================================================

(function() {
'use strict';

// Debug function fallbacks (in case api-config.js is not loaded)
if (typeof window.debugLog !== 'function') {
  window.debugLog = function() {};
}
if (typeof window.debugWarn !== 'function') {
  window.debugWarn = function() {};
}
if (typeof window.debugError !== 'function') {
  window.debugError = function(...args) { console.error(...args); };
}

// All 4 models
const MODELS = ['claude', 'gpt', 'perplexity', 'gemini'];

// State
let currentBattleResults = null;
let votedModel = null;
let rateLimitCooldown = 0;
let cooldownInterval = null;
let loadingTimer = null;

// DOM Elements (will be initialized in DOMContentLoaded)
let promptInput, charCurrent, startBattleBtn, resultsSection, newBattleBtn, quickBtns, toast;

// API Base - use centralized API with comprehensive fallbacks
const getApiBase = () => {
  if (window.API && typeof window.API.base === 'function') {
    return window.API.base();
  }

  debugError('Model Battle', 'api-config.js nicht geladen!');
  const metaTag = document.querySelector('meta[name="x-api-base"]');
  if (metaTag) {
    const base = metaTag.getAttribute('content');
    if (base) {
      debugLog('Model Battle', 'Using meta tag fallback:', base);
      return base;
    }
  }

  debugWarn('Model Battle', 'Using hardcoded production fallback');
  return 'https://hohl-rocks-back-production.up.railway.app';
};

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  const isOnFeaturePage = window.location.pathname.includes('model-battle.html');

  if (!isOnFeaturePage) {
    debugLog('Model Battle', 'Not on feature page, skipping initialization');
    return;
  }

  debugLog('Model Battle', 'Initializing...');

  promptInput = document.getElementById('battle-prompt');
  charCurrent = document.getElementById('char-current');
  startBattleBtn = document.getElementById('start-battle-btn');
  resultsSection = document.getElementById('results-section');
  newBattleBtn = document.getElementById('new-battle-btn');
  quickBtns = document.querySelectorAll('.quick-btn');
  toast = document.getElementById('toast');

  if (!promptInput || !startBattleBtn) {
    debugError('Model Battle', 'Critical DOM elements not found!');
    return;
  }

  setupEventListeners();
  loadStats();

  debugLog('Model Battle', 'Initialized successfully');
});

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function setupEventListeners() {
  if (promptInput && charCurrent && startBattleBtn) {
    promptInput.addEventListener('input', () => {
      const length = promptInput.value.length;
      charCurrent.textContent = length;
      startBattleBtn.disabled = length === 0 || rateLimitCooldown > 0;
    });
  }

  if (startBattleBtn) {
    startBattleBtn.addEventListener('click', startBattle);
  }

  if (quickBtns && promptInput && charCurrent && startBattleBtn) {
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        promptInput.value = prompt;
        charCurrent.textContent = prompt.length;
        startBattleBtn.disabled = rateLimitCooldown > 0;
        promptInput.focus();
      });
    });
  }

  if (newBattleBtn) {
    newBattleBtn.addEventListener('click', resetBattle);
  }

  if (promptInput && startBattleBtn) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey && !startBattleBtn.disabled) {
        startBattle();
      }
    });
  }
}

// ===================================================================
// RATE LIMIT HANDLING
// ===================================================================

function startCooldown(seconds) {
  rateLimitCooldown = seconds;
  if (startBattleBtn) {
    startBattleBtn.disabled = true;
  }

  if (cooldownInterval) clearInterval(cooldownInterval);

  cooldownInterval = setInterval(() => {
    rateLimitCooldown--;
    if (startBattleBtn) {
      startBattleBtn.textContent = `⏳ Warte ${rateLimitCooldown}s...`;
    }

    if (rateLimitCooldown <= 0) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
      rateLimitCooldown = 0;
      if (startBattleBtn) {
        startBattleBtn.disabled = !promptInput || promptInput.value.trim().length === 0;
        startBattleBtn.textContent = '⚔️ Battle starten';
      }
    }
  }, 1000);
}

// ===================================================================
// LOADING TIMER WITH HINTS
// ===================================================================

function startLoadingHints() {
  const startTime = Date.now();
  if (loadingTimer) clearInterval(loadingTimer);

  loadingTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    MODELS.forEach(model => {
      const loadingEl = document.getElementById(`loading-${model}`);
      if (loadingEl && loadingEl.style.display !== 'none') {
        const hintEl = loadingEl.querySelector('p');
        if (hintEl) {
          if (elapsed >= 50) {
            hintEl.textContent = `Timeout fuer langsame Modelle, Ergebnisse werden geladen... (${elapsed}s)`;
          } else if (elapsed >= 25) {
            hintEl.textContent = `Einige Modelle brauchen etwas laenger... (${elapsed}s)`;
          } else {
            hintEl.textContent = `Denkt nach... (${elapsed}s)`;
          }
        }
      }
    });
  }, 1000);
}

function stopLoadingHints() {
  if (loadingTimer) {
    clearInterval(loadingTimer);
    loadingTimer = null;
  }
}

// ===================================================================
// BATTLE LOGIC
// ===================================================================

async function startBattle() {
  if (!promptInput || !startBattleBtn || !resultsSection) {
    debugError('Model Battle', 'Required DOM elements not found');
    return;
  }

  if (rateLimitCooldown > 0) {
    showToast(`Bitte warte noch ${rateLimitCooldown} Sekunden`, 'error');
    return;
  }

  const prompt = promptInput.value.trim();

  if (!prompt) {
    showToast('Bitte gib einen Prompt ein', 'error');
    return;
  }

  try {
    startBattleBtn.disabled = true;
    startBattleBtn.textContent = '⚔️ Battle laeuft...';

    resultsSection.style.display = 'block';

    resetResponseCards();
    votedModel = null;

    startLoadingHints();

    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const API_BASE = getApiBase();
    const response = await fetch(`${API_BASE}/api/model-battle`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    stopLoadingHints();

    // Handle rate limiting
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      const retryAfter = errorData.retryAfter || 60;
      startCooldown(retryAfter);
      showToast(`Rate-Limit erreicht. Bitte warte ${retryAfter} Sekunden.`, 'error');
      return;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    currentBattleResults = data;

    displayResults(data);
    saveBattleToHistory(prompt, data);

    if (data.partialFailure) {
      const successful = data.meta?.successfulModels || 0;
      const total = data.meta?.totalModels || 4;
      showToast(`Battle abgeschlossen (${successful}/${total} Modelle erfolgreich)`);
    } else {
      showToast('Battle abgeschlossen! 🎉');
    }

  } catch (error) {
    stopLoadingHints();
    debugError('Model Battle', 'Battle error:', error);
    showToast('Fehler beim Battle. Bitte versuche es erneut.', 'error');
  } finally {
    if (startBattleBtn && rateLimitCooldown <= 0) {
      startBattleBtn.disabled = false;
      startBattleBtn.textContent = '⚔️ Battle starten';
    }
  }
}

function resetResponseCards() {
  MODELS.forEach(model => {
    const loadingEl = document.getElementById(`loading-${model}`);
    const responseEl = document.getElementById(`response-${model}`);

    if (loadingEl) {
      loadingEl.style.display = 'flex';
      // Reset hint text
      const hintEl = loadingEl.querySelector('p');
      if (hintEl) hintEl.textContent = 'Denkt nach...';
    }
    if (responseEl) {
      responseEl.style.display = 'none';
      responseEl.classList.remove('error-response');
    }

    const timeEl = document.getElementById(`time-${model}`);
    if (timeEl) {
      timeEl.textContent = '-';
      timeEl.style.background = '';
      timeEl.style.color = '';
    }

    const card = document.querySelector(`.response-card[data-model="${model}"]`);
    if (card) {
      card.classList.remove('winner', 'model-error');
    }

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
  });

  const fastestEl = document.getElementById('fastest-model');
  const favoriteEl = document.getElementById('favorite-model');
  const avgTimeEl = document.getElementById('avg-response-time');
  const modelCountEl = document.getElementById('successful-models');

  if (fastestEl) fastestEl.textContent = '-';
  if (favoriteEl) favoriteEl.textContent = 'Noch nicht gewaehlt';
  if (avgTimeEl) avgTimeEl.textContent = '-';
  if (modelCountEl) modelCountEl.textContent = '-';
}

function displayResults(data) {
  const { responses, meta } = data;

  // Find fastest successful model
  const successfulResponses = responses.filter(r => r.success);
  const fastestModel = successfulResponses.length > 0
    ? successfulResponses.reduce((fastest, current) =>
        current.responseTime < fastest.responseTime ? current : fastest
      )
    : null;

  const fastestEl = document.getElementById('fastest-model');
  if (fastestEl) fastestEl.textContent = fastestModel ? fastestModel.name : '-';

  // Display meta stats
  if (meta) {
    const avgTimeEl = document.getElementById('avg-response-time');
    const modelCountEl = document.getElementById('successful-models');
    if (avgTimeEl) avgTimeEl.textContent = `${(meta.avgResponseTime / 1000).toFixed(1)}s`;
    if (modelCountEl) modelCountEl.textContent = `${meta.successfulModels}/${meta.totalModels}`;
  }

  // Display each response
  responses.forEach(result => {
    const modelKey = result.model;

    const loadingEl = document.getElementById(`loading-${modelKey}`);
    if (loadingEl) loadingEl.style.display = 'none';

    const responseEl = document.getElementById(`response-${modelKey}`);
    const card = document.querySelector(`.response-card[data-model="${modelKey}"]`);

    if (result.success) {
      // Successful response
      if (responseEl) {
        responseEl.textContent = result.response;
        responseEl.style.display = 'block';
      }
    } else {
      // Failed model - show error state
      if (responseEl) {
        responseEl.innerHTML = `<div class="model-error-message"><span class="error-icon">⚠️</span><strong>Fehler</strong><p>${result.error || 'Unbekannter Fehler'}</p></div>`;
        responseEl.style.display = 'block';
        responseEl.classList.add('error-response');
      }
      if (card) card.classList.add('model-error');
    }

    // Update time
    const timeEl = document.getElementById(`time-${modelKey}`);
    if (timeEl) {
      if (result.success) {
        timeEl.textContent = `${(result.responseTime / 1000).toFixed(2)}s`;
        // Highlight fastest
        if (fastestModel && result.model === fastestModel.model) {
          timeEl.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
          timeEl.style.color = '#fff';
        }
      } else {
        timeEl.textContent = 'Fehler';
        timeEl.style.background = 'rgba(239, 68, 68, 0.15)';
        timeEl.style.color = '#ef4444';
      }
    }

    // Enable buttons only for successful responses
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

  if (startBattleBtn && rateLimitCooldown <= 0) {
    startBattleBtn.disabled = false;
    startBattleBtn.textContent = '⚔️ Battle starten';
  }
}

// ===================================================================
// VOTING SYSTEM
// ===================================================================

function voteForModel(model, modelName) {
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.classList.remove('voted');
    btn.textContent = '👍 Vote';
  });

  document.querySelectorAll('.response-card').forEach(card => {
    card.classList.remove('winner');
  });

  const voteBtn = document.querySelector(`[data-model="${model}"].vote-btn`);
  if (voteBtn) {
    voteBtn.classList.add('voted');
    voteBtn.textContent = '✅ Gewaehlt';
  }

  const card = document.querySelector(`.response-card[data-model="${model}"]`);
  if (card) {
    card.classList.add('winner');
  }

  votedModel = model;

  const favoriteEl = document.getElementById('favorite-model');
  if (favoriteEl) favoriteEl.textContent = modelName;

  saveVote(model);
  showToast(`${modelName} gewaehlt! 🏆`);
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
    debugError('Model Battle', 'Copy failed:', error);
    showToast('Fehler beim Kopieren', 'error');
  }
}

// ===================================================================
// RESET BATTLE
// ===================================================================

function resetBattle() {
  if (!promptInput || !charCurrent || !startBattleBtn || !resultsSection) return;

  promptInput.value = '';
  charCurrent.textContent = '0';
  startBattleBtn.disabled = rateLimitCooldown > 0;
  startBattleBtn.textContent = rateLimitCooldown > 0
    ? `⏳ Warte ${rateLimitCooldown}s...`
    : '⚔️ Battle starten';

  resultsSection.style.display = 'none';

  currentBattleResults = null;
  votedModel = null;

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

    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem('battleHistory', JSON.stringify(history));
  } catch (error) {
    debugError('Model Battle', 'Error saving to history:', error);
  }
}

function saveVote(model) {
  try {
    const stats = JSON.parse(localStorage.getItem('battleStats') || '{}');

    if (!stats.votes) {
      stats.votes = { claude: 0, gpt: 0, perplexity: 0, gemini: 0 };
    }

    stats.votes[model] = (stats.votes[model] || 0) + 1;
    stats.totalBattles = (stats.totalBattles || 0) + 1;
    stats.lastUpdated = new Date().toISOString();

    localStorage.setItem('battleStats', JSON.stringify(stats));
  } catch (error) {
    debugError('Model Battle', 'Error saving vote:', error);
  }
}

function loadStats() {
  try {
    const stats = JSON.parse(localStorage.getItem('battleStats') || '{}');
    debugLog('Model Battle', 'Stats:', stats);
  } catch (error) {
    debugError('Model Battle', 'Error loading stats:', error);
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
  debugError('Model Battle', 'Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  debugError('Model Battle', 'Unhandled promise rejection:', e.reason);
});

})(); // End IIFE
