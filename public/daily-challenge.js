// ========================================
// FEATURE #4: DAILY AI CHALLENGE 🎮
// JavaScript Logic
// ========================================

// Config
const BACKEND_URL = 'https://hohl-rocks-back-production.up.railway.app';
const STORAGE_KEY = 'dailyChallenge';

// ========================================
// STATE MANAGEMENT
// ========================================

class ChallengeState {
  constructor() {
    this.load();
  }

  load() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      this.stats = parsed.stats || this.getDefaultStats();
      this.history = parsed.history || [];
    } else {
      this.stats = this.getDefaultStats();
      this.history = [];
    }
  }

  getDefaultStats() {
    return {
      totalChallenges: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalScore: 0,
      badges: {
        gold: 0,
        silver: 0,
        bronze: 0
      }
    };
  }

  save() {
    const data = {
      stats: this.stats,
      history: this.history
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  addSubmission(submission) {
    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    if (this.stats.lastCompletedDate === today) {
      // Already completed today - update instead
      const todayIndex = this.history.findIndex(h => h.date === today);
      if (todayIndex >= 0) {
        this.history[todayIndex] = submission;
      }
    } else {
      // New submission
      this.history.push(submission);
      this.stats.totalChallenges++;
      
      // Update streak
      this.updateStreak(today);
    }

    // Update score & badges
    this.stats.totalScore += submission.score;
    if (submission.badge === 'Gold') this.stats.badges.gold++;
    else if (submission.badge === 'Silver') this.stats.badges.silver++;
    else if (submission.badge === 'Bronze') this.stats.badges.bronze++;

    this.stats.lastCompletedDate = today;
    this.save();
  }

  updateStreak(today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (this.stats.lastCompletedDate === yesterdayStr) {
      // Streak continues
      this.stats.currentStreak++;
    } else if (this.stats.lastCompletedDate === today) {
      // Already done today, keep streak
    } else {
      // Streak broken, start new
      this.stats.currentStreak = 1;
    }

    // Update longest streak
    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }
  }

  getAverageScore() {
    if (this.stats.totalChallenges === 0) return 0;
    return Math.round(this.stats.totalScore / this.stats.totalChallenges);
  }
}

// Global State
const challengeState = new ChallengeState();

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
  // Challenge Info
  challengeDate: document.getElementById('challenge-date'),
  challengeNumber: document.getElementById('challenge-number'),
  challengeType: document.getElementById('challenge-type'),
  challengePrompt: document.getElementById('challenge-prompt'),
  difficultyBadge: document.getElementById('difficulty-badge'),
  categoryBadge: document.getElementById('category-badge'),
  tipsList: document.getElementById('tips-list'),
  
  // Submission
  submissionText: document.getElementById('submission-text'),
  charCount: document.getElementById('char-count'),
  submitBtn: document.getElementById('submit-solution-btn'),
  
  // Results
  resultsCard: document.getElementById('results-card'),
  scoreNumber: document.getElementById('score-number'),
  badgeEarned: document.getElementById('badge-earned'),
  feedbackText: document.getElementById('feedback-text'),
  strengthsList: document.getElementById('strengths-list'),
  improvementsList: document.getElementById('improvements-list'),
  
  // Actions
  newSubmissionBtn: document.getElementById('new-submission-btn'),
  shareResultBtn: document.getElementById('share-result-btn'),
  
  // Stats
  streakCount: document.getElementById('streak-count'),
  totalChallenges: document.getElementById('total-challenges'),
  avgScore: document.getElementById('avg-score'),
  goldBadges: document.getElementById('gold-badges'),
  silverBadges: document.getElementById('silver-badges'),
  bronzeBadges: document.getElementById('bronze-badges'),
  
  // Leaderboard
  leaderboardList: document.getElementById('leaderboard-list'),
  
  // Overlays
  loadingOverlay: document.getElementById('challenge-loading'),
  toast: document.getElementById('challenge-toast')
};

// ========================================
// INITIALIZE
// ========================================

async function initDailyChallenge() {
  console.log('Initializing Daily Challenge...');
  
  // Load current challenge
  await loadTodayChallenge();
  
  // Update stats display
  updateStatsDisplay();
  
  // Load leaderboard
  loadLeaderboard();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('Daily Challenge initialized!');
}

// ========================================
// LOAD TODAY'S CHALLENGE
// ========================================

async function loadTodayChallenge() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/daily-challenge/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayChallenge(data.challenge);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Failed to load challenge:', error);
    showToast('❌ Fehler beim Laden der Challenge', 'error');
    
    // Display fallback challenge
    displayFallbackChallenge();
  }
}

function displayChallenge(challenge) {
  // Date & Number
  const date = new Date(challenge.date);
  elements.challengeDate.textContent = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  elements.challengeNumber.textContent = `#${challenge.challengeNumber}`;
  
  // Challenge Info
  elements.challengeType.textContent = challenge.type;
  elements.challengePrompt.textContent = challenge.prompt;
  elements.difficultyBadge.textContent = challenge.difficulty;
  elements.categoryBadge.textContent = challenge.category;
  
  // Tips
  elements.tipsList.innerHTML = '';
  challenge.tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    elements.tipsList.appendChild(li);
  });

  // Store current challenge for submission
  window.currentChallenge = challenge;
}

function displayFallbackChallenge() {
  const fallback = {
    date: new Date().toISOString().split('T')[0],
    challengeNumber: 1,
    type: 'Quick Writing',
    prompt: 'Schreibe eine kurze, kreative Antwort auf die Frage: Was würdest du tun, wenn du für einen Tag unbegrenzte Ressourcen hättest?',
    category: 'Creative',
    difficulty: 'Easy',
    tips: [
      'Sei kreativ und denke groß',
      'Beschreibe konkrete Aktionen',
      'Zeige Persönlichkeit'
    ]
  };
  
  displayChallenge(fallback);
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Character Counter
  elements.submissionText.addEventListener('input', () => {
    const length = elements.submissionText.value.length;
    elements.charCount.textContent = length;
  });
  
  // Submit Solution
  elements.submitBtn.addEventListener('click', handleSubmitSolution);
  
  // New Submission
  elements.newSubmissionBtn.addEventListener('click', () => {
    elements.resultsCard.classList.add('hidden');
    elements.submissionText.value = '';
    elements.charCount.textContent = '0';
    elements.submissionText.focus();
  });
  
  // Share Result
  elements.shareResultBtn.addEventListener('click', handleShareResult);
}

// ========================================
// SUBMIT SOLUTION
// ========================================

async function handleSubmitSolution() {
  const submission = elements.submissionText.value.trim();
  
  // Validation
  if (submission.length < 10) {
    showToast('❌ Lösung zu kurz (min. 10 Zeichen)', 'error');
    return;
  }
  
  if (!window.currentChallenge) {
    showToast('❌ Keine Challenge geladen', 'error');
    return;
  }
  
  // Disable button
  elements.submitBtn.disabled = true;
  elements.submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Wird bewertet...</span>';
  
  // Show loading overlay
  elements.loadingOverlay.classList.remove('hidden');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/daily-challenge/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        submission: submission,
        challengeType: window.currentChallenge.type,
        challengePrompt: window.currentChallenge.prompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayResults(data.evaluation, data.submission);
      
      // Save to state
      challengeState.addSubmission({
        date: window.currentChallenge.date,
        challengeType: window.currentChallenge.type,
        submission: submission,
        score: data.evaluation.score,
        badge: data.evaluation.badge,
        timestamp: new Date().toISOString()
      });
      
      // Update stats display
      updateStatsDisplay();
      
      showToast('✅ Lösung erfolgreich bewertet!', 'success');
    } else {
      throw new Error(data.error || 'Evaluation failed');
    }
    
  } catch (error) {
    console.error('Submission error:', error);
    showToast('❌ Fehler bei der Bewertung', 'error');
    
    // Display fallback result
    displayFallbackResult(submission);
    
  } finally {
    // Hide loading overlay
    elements.loadingOverlay.classList.add('hidden');
    
    // Re-enable button
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Lösung Einreichen & Bewerten</span>';
  }
}

// ========================================
// DISPLAY RESULTS
// ========================================

function displayResults(evaluation, submission) {
  // Score
  elements.scoreNumber.textContent = evaluation.score;
  
  // Badge
  const badgeIcon = evaluation.badge === 'Gold' ? '🥇' : 
                    evaluation.badge === 'Silver' ? '🥈' : '🥉';
  elements.badgeEarned.querySelector('.badge-icon').textContent = badgeIcon;
  elements.badgeEarned.querySelector('.badge-name').textContent = evaluation.badge;
  
  // Update score circle color based on badge
  const scoreCircle = document.getElementById('score-circle');
  if (evaluation.badge === 'Gold') {
    scoreCircle.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
  } else if (evaluation.badge === 'Silver') {
    scoreCircle.style.background = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
  } else {
    scoreCircle.style.background = 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)';
  }
  
  // Feedback
  elements.feedbackText.textContent = evaluation.feedback;
  
  // Strengths
  elements.strengthsList.innerHTML = '';
  evaluation.strengths.forEach(strength => {
    const li = document.createElement('li');
    li.textContent = strength;
    elements.strengthsList.appendChild(li);
  });
  
  // Improvements
  elements.improvementsList.innerHTML = '';
  evaluation.improvements.forEach(improvement => {
    const li = document.createElement('li');
    li.textContent = improvement;
    elements.improvementsList.appendChild(li);
  });
  
  // Show results card
  elements.resultsCard.classList.remove('hidden');
  
  // Scroll to results
  setTimeout(() => {
    elements.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function displayFallbackResult(submission) {
  const fallbackEval = {
    score: 60,
    badge: 'Silver',
    feedback: 'Technischer Fehler bei der Bewertung, aber deine Teilnahme zählt!',
    strengths: [
      'Du hast teilgenommen',
      'Das ist der wichtigste Schritt'
    ],
    improvements: [
      'Versuche es morgen wieder'
    ]
  };
  
  displayResults(fallbackEval, { text: submission });
}

// ========================================
// UPDATE STATS DISPLAY
// ========================================

function updateStatsDisplay() {
  elements.streakCount.textContent = challengeState.stats.currentStreak;
  elements.totalChallenges.textContent = challengeState.stats.totalChallenges;
  elements.avgScore.textContent = challengeState.getAverageScore();
  elements.goldBadges.textContent = challengeState.stats.badges.gold;
  elements.silverBadges.textContent = challengeState.stats.badges.silver;
  elements.bronzeBadges.textContent = challengeState.stats.badges.bronze;
}

// ========================================
// LEADERBOARD
// ========================================

async function loadLeaderboard() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/daily-challenge/leaderboard`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayLeaderboard(data.leaderboard);
    } else {
      throw new Error(data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
    displayMockLeaderboard();
  }
}

function displayLeaderboard(leaderboard) {
  elements.leaderboardList.innerHTML = '';
  
  leaderboard.forEach(player => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <span class="rank">#${player.rank}</span>
      <span class="username">${player.username}</span>
      <span class="player-score">${player.score}</span>
    `;
    elements.leaderboardList.appendChild(item);
  });
}

function displayMockLeaderboard() {
  const mockData = [
    { rank: 1, username: 'PromptMaster_42', score: 950 },
    { rank: 2, username: 'AI_Enthusiast', score: 890 },
    { rank: 3, username: 'CreativeWriter', score: 850 },
    { rank: 4, username: 'TechGuru', score: 820 },
    { rank: 5, username: 'StartupFounder', score: 780 }
  ];
  
  displayLeaderboard(mockData);
}

// ========================================
// SHARE RESULT
// ========================================

function handleShareResult() {
  const score = elements.scoreNumber.textContent;
  const badge = elements.badgeEarned.querySelector('.badge-name').textContent;
  const challengeType = window.currentChallenge?.type || 'Challenge';
  
  const shareText = `🎮 Daily AI Challenge\n${challengeType}\n\n🏆 Score: ${score}/100\n⭐ Badge: ${badge}\n\n#DailyAIChallenge #hohl.rocks`;
  
  // Try native share API
  if (navigator.share) {
    navigator.share({
      title: 'Daily AI Challenge Result',
      text: shareText
    }).then(() => {
      showToast('✅ Geteilt!', 'success');
    }).catch(err => {
      console.error('Share failed:', err);
      copyToClipboard(shareText);
    });
  } else {
    // Fallback: Copy to clipboard
    copyToClipboard(shareText);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 In Zwischenablage kopiert!', 'success');
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('❌ Kopieren fehlgeschlagen', 'error');
  });
}

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(message, type = 'success') {
  const toast = elements.toast;
  const icon = type === 'success' ? '✅' : '❌';
  
  toast.querySelector('.toast-icon').textContent = icon;
  toast.querySelector('.toast-message').textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ========================================
// INITIALIZE ON DOM READY
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDailyChallenge);
} else {
  initDailyChallenge();
}

// ========================================
// Export for debugging
// ========================================
window.DailyChallenge = {
  state: challengeState,
  reload: loadTodayChallenge,
  resetStats: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};

console.log('Daily Challenge script loaded ✅');
