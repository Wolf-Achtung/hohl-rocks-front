// ===================================================================
// DAILY CHALLENGE - JavaScript (OPTIMIZED v2.2 - FULLY FIXED)
// Features: API Integration, LocalStorage, Streak Tracking, Badge System
// Fixed: API_BASE duplication, DOM access timing, defensive checks, scope conflicts
// Added: Better error handling, null checks, fallback messages
// ===================================================================

(function() {
'use strict';

// State
let currentChallenge = null;
let selectedDifficulty = null;
let todayDate = null;

// DOM Elements (will be initialized in DOMContentLoaded)
let loadingState, challengeSelection, challengeActive, challengeResult, historySection;

// API Base - use centralized API with comprehensive fallbacks
const getApiBase = () => {
  // Priority 1: window.API.base() (from api-config.js)
  if (window.API && typeof window.API.base === 'function') {
    const base = window.API.base();
    console.log('[Daily Challenge] Using API.base():', base);
    return base;
  }
  
  // Priority 2: window.api instance
  if (window.api && typeof window.api.getBaseUrl === 'function') {
    const base = window.api.getBaseUrl();
    console.log('[Daily Challenge] Using api.getBaseUrl():', base);
    return base;
  }
  
  // Priority 3: Meta tag fallback
  console.warn('[Daily Challenge] api-config.js nicht geladen, using fallbacks');
  const metaTag = document.querySelector('meta[name="x-api-base"]');
  if (metaTag) {
    const base = metaTag.getAttribute('content');
    if (base) {
      console.log('[Daily Challenge] Using meta tag fallback:', base);
      return base;
    }
  }
  
  // Priority 4: Production fallback
  console.warn('[Daily Challenge] Using hardcoded production fallback');
  return 'https://hohl-rocks-back-production.up.railway.app';
};

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Page Detection - only initialize on daily-challenge.html
  const isOnFeaturePage = window.location.pathname.includes('daily-challenge.html');
  
  if (!isOnFeaturePage) {
    console.log('[Daily Challenge] Not on feature page, skipping initialization');
    return;
  }
  
  console.log('[Daily Challenge] Initializing...');
  
  // Initialize DOM elements safely
  loadingState = document.getElementById('loading-state');
  challengeSelection = document.getElementById('challenge-selection');
  challengeActive = document.getElementById('challenge-active');
  challengeResult = document.getElementById('challenge-result');
  historySection = document.getElementById('history-section');
  
  // Validate critical DOM elements
  if (!loadingState || !challengeSelection) {
    console.error('[Daily Challenge] Critical DOM elements not found!');
    return;
  }
  
  todayDate = getTodayDate();
  loadStats();
  checkIfCompletedToday();
  loadChallenge();
  setupEventListeners();
  
  console.log('[Daily Challenge] Initialized successfully');
});

// ===================================================================
// DATE UTILITIES
// ===================================================================

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ===================================================================
// LOCAL STORAGE MANAGEMENT
// ===================================================================

function getLocalData() {
  try {
    return JSON.parse(localStorage.getItem('dailyChallengeData') || '{}');
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return {};
  }
}

function saveLocalData(data) {
  try {
    localStorage.setItem('dailyChallengeData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function checkIfCompletedToday() {
  const data = getLocalData();
  const today = getTodayDate();
  
  if (data.lastCompletedDate === today) {
    // Already completed today!
    const completedSection = document.getElementById('completed-today');
    if (completedSection) {
      const todayBadge = document.getElementById('today-badge');
      const todayScore = document.getElementById('today-score');
      
      if (todayBadge) todayBadge.textContent = getBadgeEmoji(data.lastBadge);
      if (todayScore) todayScore.textContent = `${data.lastScore}%`;
      
      completedSection.style.display = 'block';
    }
    return true;
  }
  return false;
}

function getBadgeEmoji(badge) {
  const badges = {
    'gold': '🥇 Gold',
    'silver': '🥈 Silver',
    'bronze': '🥉 Bronze'
  };
  return badges[badge] || '🏆';
}

// ===================================================================
// STATS MANAGEMENT
// ===================================================================

function loadStats() {
  const data = getLocalData();
  
  // Calculate streak
  const streak = calculateStreak(data);
  const streakEl = document.getElementById('streak-count');
  if (streakEl) streakEl.textContent = streak;
  
  // Total badges
  const totalBadges = (data.history || []).length;
  const totalBadgesEl = document.getElementById('total-badges');
  if (totalBadgesEl) totalBadgesEl.textContent = totalBadges;
  
  // Completed count
  const completedEl = document.getElementById('completed-count');
  if (completedEl) completedEl.textContent = totalBadges;
}

function calculateStreak(data) {
  if (!data.history || data.history.length === 0) return 0;
  
  const today = new Date(getTodayDate());
  let streak = 0;
  let checkDate = new Date(today);
  
  // Sort history by date descending
  const sortedHistory = [...data.history].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Check consecutive days
  for (const entry of sortedHistory) {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((checkDate - entryDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      checkDate = entryDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function updateStats(badge, score) {
  const data = getLocalData();
  
  // Update last completion
  data.lastCompletedDate = getTodayDate();
  data.lastBadge = badge;
  data.lastScore = score;
  
  // Add to history
  if (!data.history) data.history = [];
  data.history.push({
    date: getTodayDate(),
    difficulty: selectedDifficulty,
    badge: badge,
    score: score,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 90 days
  if (data.history.length > 90) {
    data.history = data.history.slice(-90);
  }
  
  saveLocalData(data);
  loadStats();
}

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function setupEventListeners() {
  // Difficulty selection
  document.querySelectorAll('.btn-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const difficulty = btn.dataset.difficulty;
      startChallenge(difficulty);
    });
  });

  // Back to selection
  const backBtn = document.getElementById('back-to-selection');
  if (backBtn && challengeActive && challengeSelection) {
    backBtn.addEventListener('click', () => {
      challengeActive.style.display = 'none';
      challengeSelection.style.display = 'block';
      selectedDifficulty = null;
    });
  }

  // Answer input
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer-btn');
  const charCount = document.getElementById('answer-chars');

  if (answerInput && submitBtn && charCount) {
    answerInput.addEventListener('input', () => {
      const length = answerInput.value.length;
      charCount.textContent = length;
      submitBtn.disabled = length < 20;
    });
  }

  // Submit answer
  if (submitBtn) {
    submitBtn.addEventListener('click', submitAnswer);
  }

  // View history
  const viewHistoryBtn = document.getElementById('view-history-btn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', showHistory);
  }
  
  // Close history
  const closeHistoryBtn = document.getElementById('close-history-btn');
  if (closeHistoryBtn && historySection) {
    closeHistoryBtn.addEventListener('click', () => {
      historySection.style.display = 'none';
    });
  }

  // New challenge tomorrow
  const newChallengeBtn = document.getElementById('new-challenge-tomorrow-btn');
  if (newChallengeBtn) {
    newChallengeBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

// ===================================================================
// LOAD CHALLENGE
// ===================================================================

async function loadChallenge() {
  if (!loadingState || !challengeSelection) {
    console.error('[Daily Challenge] Required DOM elements not found');
    return;
  }
  
  try {
    console.log('🎯 [Daily Challenge] Loading...');
    loadingState.style.display = 'block';
    challengeSelection.style.display = 'none';

    const API_BASE = getApiBase();
    
    // ✅ WICHTIG: Validiere API Base
    if (!API_BASE) {
      throw new Error('API Base URL not available');
    }
    
    const url = `${API_BASE}/api/daily-challenge`;
    console.log('📡 [Daily Challenge] Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 [Daily Challenge] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error('❌ [Daily Challenge] Response not OK:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [Daily Challenge] Data received:', data);
    
    // ✅ WICHTIG: Validiere Response Format
    if (!data) {
      throw new Error('Empty response from API');
    }
    
    if (!data.challenge) {
      throw new Error('No challenge data in response');
    }
    
    currentChallenge = data.challenge;

    // Display challenge
    displayChallengeSelection(currentChallenge);

    loadingState.style.display = 'none';
    challengeSelection.style.display = 'block';
    console.log('✨ [Daily Challenge] Displayed successfully!');

  } catch (error) {
    console.error('💥 [Daily Challenge] Load error:', error);
    const API_BASE = getApiBase();
    
    // ✅ BESSERE Fehlermeldung mit mehr Details
    loadingState.innerHTML = `
      <div class="error-container" style="text-align: center; padding: 40px;">
        <div class="error-icon" style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
        <h3 style="color: #ef4444; margin-bottom: 10px;">Fehler beim Laden der Challenge</h3>
        <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 20px;">
          ${error.message}
        </p>
        <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 30px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div>Backend URL: ${API_BASE}</div>
          <div>Endpoint: /api/daily-challenge</div>
          <div>Zeit: ${new Date().toLocaleTimeString('de-DE')}</div>
        </div>
        <button onclick="location.reload()" style="padding: 12px 24px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          🔄 Neu versuchen
        </button>
        <div style="margin-top: 30px; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
          <h4 style="color: #3b82f6; margin-bottom: 10px;">💡 Mögliche Lösungen:</h4>
          <ul style="text-align: left; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.8;">
            <li>Prüfe deine Internetverbindung</li>
            <li>Das Backend könnte gerade neu starten (2-3 Min warten)</li>
            <li>Browser-Cache leeren (Ctrl+Shift+R)</li>
            <li>In 5 Minuten nochmal versuchen</li>
          </ul>
        </div>
      </div>
    `;
  }
}

function displayChallengeSelection(challenge) {
  // ✅ Validiere Challenge Daten
  if (!challenge) {
    console.error('[Daily Challenge] Challenge data is null');
    return;
  }
  
  // Theme
  const themeEl = document.getElementById('challenge-theme');
  if (themeEl && challenge.theme) {
    themeEl.textContent = challenge.theme;
  }

  // Difficulties
  ['beginner', 'intermediate', 'expert'].forEach(difficulty => {
    if (!challenge.challenges || !challenge.challenges[difficulty]) {
      console.warn(`[Daily Challenge] Missing data for difficulty: ${difficulty}`);
      return;
    }
    
    const data = challenge.challenges[difficulty];
    const titleEl = document.getElementById(`title-${difficulty}`);
    const descEl = document.getElementById(`desc-${difficulty}`);
    const timeEl = document.getElementById(`time-${difficulty}`);
    
    if (titleEl && data.title) titleEl.textContent = data.title;
    if (descEl && data.description) descEl.textContent = data.description;
    if (timeEl && data.estimatedTime) timeEl.textContent = data.estimatedTime;
  });
}

// ===================================================================
// START CHALLENGE
// ===================================================================

function startChallenge(difficulty) {
  if (!challengeSelection || !challengeActive) {
    console.error('[Daily Challenge] Required DOM elements not found for startChallenge');
    return;
  }
  
  if (!currentChallenge || !currentChallenge.challenges || !currentChallenge.challenges[difficulty]) {
    console.error('[Daily Challenge] Invalid challenge data');
    showToast('Challenge-Daten nicht verfügbar', 'error');
    return;
  }
  
  selectedDifficulty = difficulty;
  const challengeData = currentChallenge.challenges[difficulty];

  // Update UI
  challengeSelection.style.display = 'none';
  challengeActive.style.display = 'block';

  // Set difficulty badge styling
  const difficultyBadge = document.getElementById('active-difficulty');
  if (difficultyBadge) {
    difficultyBadge.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    difficultyBadge.className = `difficulty-badge ${difficulty}`;
  }

  // Set challenge content
  const titleEl = document.getElementById('active-title');
  const taskEl = document.getElementById('active-task');
  const hintEl = document.getElementById('active-hint');
  
  if (titleEl) titleEl.textContent = challengeData.title;
  if (taskEl) taskEl.textContent = challengeData.task;
  if (hintEl) hintEl.textContent = challengeData.hint;

  // Clear answer
  const answerInput = document.getElementById('answer-input');
  const answerChars = document.getElementById('answer-chars');
  const submitBtn = document.getElementById('submit-answer-btn');
  
  if (answerInput) answerInput.value = '';
  if (answerChars) answerChars.textContent = '0';
  if (submitBtn) submitBtn.disabled = true;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================================
// SUBMIT ANSWER
// ===================================================================

async function submitAnswer() {
  const answerInput = document.getElementById('answer-input');
  if (!answerInput) return;
  
  const answer = answerInput.value.trim();
  
  if (!currentChallenge || !currentChallenge.challenges || !currentChallenge.challenges[selectedDifficulty]) {
    showToast('Challenge-Daten nicht verfügbar', 'error');
    return;
  }
  
  const task = currentChallenge.challenges[selectedDifficulty].task;

  if (answer.length < 20) {
    showToast('Antwort zu kurz (min. 20 Zeichen)', 'error');
    return;
  }

  try {
    // Disable button
    const submitBtn = document.getElementById('submit-answer-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Bewerte...';
    }

    // Call API
    const API_BASE = getApiBase();
    const url = `${API_BASE}/api/submit-challenge`;
    
    console.log('[Daily Challenge] Submitting to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        difficulty: selectedDifficulty,
        task: task,
        answer: answer
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.evaluation) {
      throw new Error('Invalid evaluation response');
    }
    
    const evaluation = data.evaluation;

    // Update stats
    updateStats(evaluation.badge, evaluation.score);

    // Show result
    displayResult(evaluation);

    // Hide active challenge
    if (challengeActive) challengeActive.style.display = 'none';
    if (challengeResult) challengeResult.style.display = 'block';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error('[Daily Challenge] Submit error:', error);
    showToast('Fehler beim Einreichen. Bitte versuche es erneut.', 'error');
    
    // Re-enable button
    const submitBtn = document.getElementById('submit-answer-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Antwort einreichen';
    }
  }
}

// ===================================================================
// DISPLAY RESULT
// ===================================================================

function displayResult(evaluation) {
  // Badge icon and name
  const badgeIcons = {
    'gold': '🥇',
    'silver': '🥈',
    'bronze': '🥉'
  };

  const badgeIconEl = document.getElementById('result-badge-icon');
  if (badgeIconEl) badgeIconEl.textContent = badgeIcons[evaluation.badge];
  
  const badgeName = document.getElementById('result-badge-name');
  if (badgeName) {
    badgeName.textContent = evaluation.badge.charAt(0).toUpperCase() + evaluation.badge.slice(1);
    badgeName.className = `badge-name ${evaluation.badge}`;
  }

  // Score
  const scoreEl = document.getElementById('result-score-value');
  if (scoreEl) scoreEl.textContent = evaluation.score;

  // Summary
  const summaryEl = document.getElementById('result-summary-text');
  if (summaryEl) summaryEl.textContent = evaluation.summary;

  // Positive feedback
  const positiveList = document.getElementById('feedback-positive');
  if (positiveList && evaluation.feedback && evaluation.feedback.positive) {
    positiveList.innerHTML = '';
    evaluation.feedback.positive.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      positiveList.appendChild(li);
    });
  }

  // Improvements
  const improvementsList = document.getElementById('feedback-improvements');
  if (improvementsList && evaluation.feedback && evaluation.feedback.improvements) {
    improvementsList.innerHTML = '';
    evaluation.feedback.improvements.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      improvementsList.appendChild(li);
    });
  }

  // Show toast
  showToast(`${badgeIcons[evaluation.badge]} ${evaluation.badge.toUpperCase()} Badge verdient!`);
}

// ===================================================================
// HISTORY
// ===================================================================

function showHistory() {
  if (!challengeResult || !historySection) return;
  
  const data = getLocalData();
  const history = data.history || [];

  // Hide result, show history
  challengeResult.style.display = 'none';
  historySection.style.display = 'block';

  // Count badges
  const badgeCounts = { gold: 0, silver: 0, bronze: 0 };
  history.forEach(entry => {
    if (badgeCounts[entry.badge] !== undefined) {
      badgeCounts[entry.badge]++;
    }
  });

  const goldEl = document.getElementById('gold-count');
  const silverEl = document.getElementById('silver-count');
  const bronzeEl = document.getElementById('bronze-count');
  
  if (goldEl) goldEl.textContent = badgeCounts.gold;
  if (silverEl) silverEl.textContent = badgeCounts.silver;
  if (bronzeEl) bronzeEl.textContent = badgeCounts.bronze;

  // Render history list
  const historyList = document.getElementById('history-list');
  if (!historyList) return;
  
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
        Noch keine Challenges gelöst. Zeit zu starten! 🚀
      </div>
    `;
    return;
  }

  // Sort by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  sortedHistory.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const badgeEmojis = {
      'gold': '🥇',
      'silver': '🥈',
      'bronze': '🥉'
    };

    item.innerHTML = `
      <div class="history-item-info">
        <div class="history-date">${formatDate(entry.date)}</div>
        <div class="history-difficulty">${entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}</div>
      </div>
      <div class="history-item-badge">
        <span class="history-badge-icon">${badgeEmojis[entry.badge]}</span>
        <span class="history-score">${entry.score}%</span>
      </div>
    `;
    
    historyList.appendChild(item);
  });
}

// ===================================================================
// TOAST NOTIFICATION
// ===================================================================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;

  if (type === 'error') {
    toast.style.background = 'rgba(239, 68, 68, 0.95)';
  } else {
    toast.style.background = 'rgba(16, 185, 129, 0.95)';
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
  console.error('[Daily Challenge] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Daily Challenge] Unhandled promise rejection:', e.reason);
});

})(); // End IIFE
