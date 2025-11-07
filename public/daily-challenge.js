// ===================================================================
// DAILY CHALLENGE - JavaScript (OPTIMIZED v2.0)
// Features: API Integration, LocalStorage, Streak Tracking, Badge System
// Fixed: API_BASE duplication, DOM access timing, defensive checks
// ===================================================================

// State
let currentChallenge = null;
let selectedDifficulty = null;
let todayDate = null;

// DOM Elements (will be initialized in DOMContentLoaded)
let loadingState, challengeSelection, challengeActive, challengeResult, historySection;

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
    console.log('🎯 Loading Daily Challenge...');
    loadingState.style.display = 'block';
    challengeSelection.style.display = 'none';

    const API_BASE = getApiBase();
    const url = `${API_BASE}/api/daily-challenge`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response not OK:', errorText);
      throw new Error(`Failed to load challenge: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Challenge data received:', data);
    
    currentChallenge = data.challenge;

    // Display challenge
    displayChallengeSelection(currentChallenge);

    loadingState.style.display = 'none';
    challengeSelection.style.display = 'block';
    console.log('✨ Challenge displayed successfully!');

  } catch (error) {
    console.error('💥 Error loading challenge:', error);
    const API_BASE = getApiBase();
    loadingState.innerHTML = `
      <div class="loader"></div>
      <p style="color: #ef4444; margin-top: 20px;">❌ Fehler beim Laden der Challenge</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 10px;">
        ${error.message}<br>
        Backend: ${API_BASE}
      </p>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
        🔄 Neu versuchen
      </button>
    `;
  }
}

function displayChallengeSelection(challenge) {
  // Theme
  const themeEl = document.getElementById('challenge-theme');
  if (themeEl) themeEl.textContent = challenge.theme;

  // Difficulties
  ['beginner', 'intermediate', 'expert'].forEach(difficulty => {
    const data = challenge.challenges[difficulty];
    const titleEl = document.getElementById(`title-${difficulty}`);
    const descEl = document.getElementById(`desc-${difficulty}`);
    const timeEl = document.getElementById(`time-${difficulty}`);
    
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description;
    if (timeEl) timeEl.textContent = data.estimatedTime;
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
    const response = await fetch(`${API_BASE}/api/submit-challenge`, {
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
      throw new Error('Failed to submit challenge');
    }

    const data = await response.json();
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
    console.error('Error submitting answer:', error);
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
  if (positiveList) {
    positiveList.innerHTML = '';
    evaluation.feedback.positive.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      positiveList.appendChild(li);
    });
  }

  // Improvements
  const improvementsList = document.getElementById('feedback-improvements');
  if (improvementsList) {
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
