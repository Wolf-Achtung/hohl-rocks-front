// ========================================
// FEATURE #2: MODEL BATTLE ARENA
// Frontend Logic mit SSE Streaming
// ========================================

(function() {
  'use strict';

  const API_URL = 'https://hohl-rocks-back-production.up.railway.app';
  
  // DOM Elements
  const promptInput = document.getElementById('battle-prompt-input');
  const charCount = document.getElementById('battle-char-count');
  const startBtn = document.getElementById('battle-start-btn');
  const battleArena = document.getElementById('battle-arena');
  const leaderboardGrid = document.getElementById('leaderboard-grid');

  // Model Containers
  const models = {
    claude: {
      name: 'Claude Sonnet 4',
      icon: '🤖',
      subtitle: 'Anthropic',
      status: document.getElementById('claude-status'),
      statusText: document.getElementById('claude-status-text'),
      statusIndicator: document.getElementById('claude-status-indicator'),
      response: document.getElementById('claude-response'),
      speed: document.getElementById('claude-speed'),
      voteBtn: document.getElementById('claude-vote-btn'),
      card: document.getElementById('claude-card')
    },
    openai: {
      name: 'GPT-4o Mini',
      icon: '🧠',
      subtitle: 'OpenAI',
      status: document.getElementById('openai-status'),
      statusText: document.getElementById('openai-status-text'),
      statusIndicator: document.getElementById('openai-status-indicator'),
      response: document.getElementById('openai-response'),
      speed: document.getElementById('openai-speed'),
      voteBtn: document.getElementById('openai-vote-btn'),
      card: document.getElementById('openai-card')
    },
    perplexity: {
      name: 'Sonar Pro',
      icon: '🔮',
      subtitle: 'Perplexity',
      status: document.getElementById('perplexity-status'),
      statusText: document.getElementById('perplexity-status-text'),
      statusIndicator: document.getElementById('perplexity-status-indicator'),
      response: document.getElementById('perplexity-response'),
      speed: document.getElementById('perplexity-speed'),
      voteBtn: document.getElementById('perplexity-vote-btn'),
      card: document.getElementById('perplexity-card')
    }
  };

  // State
  let currentBattle = {
    active: false,
    responses: {},
    speeds: {},
    completed: 0
  };

  let votedThisBattle = false;

  // ========================================
  // Character Counter
  // ========================================
  promptInput.addEventListener('input', () => {
    const length = promptInput.value.length;
    charCount.textContent = `${length}/500`;
    
    if (length > 500) {
      charCount.style.color = '#ef4444';
    } else {
      charCount.style.color = 'rgba(255, 255, 255, 0.6)';
    }
  });

  // ========================================
  // Start Battle
  // ========================================
  startBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
      showToast('Bitte gib einen Prompt ein!', 'error');
      return;
    }

    if (prompt.length > 500) {
      showToast('Prompt zu lang (max 500 Zeichen)!', 'error');
      return;
    }

    // Reset state
    resetBattle();
    
    // Show arena
    battleArena.classList.add('active');
    startBtn.disabled = true;
    startBtn.textContent = '⚔️ Battle läuft...';
    votedThisBattle = false;

    // Scroll to arena
    battleArena.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Start SSE Stream
    try {
      await startBattleStream(prompt);
    } catch (error) {
      console.error('Battle error:', error);
      showToast('Battle konnte nicht gestartet werden', 'error');
      startBtn.disabled = false;
      startBtn.textContent = '⚔️ Battle Starten';
    }
  });

  // ========================================
  // SSE Battle Stream
  // ========================================
  async function startBattleStream(prompt) {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(
        `${API_URL}/api/model-battle?prompt=${encodeURIComponent(prompt)}`,
        { withCredentials: false }
      );

      // Handle incoming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStreamEvent(data);
        } catch (error) {
          console.error('Parse error:', error);
        }
      };

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        
        if (currentBattle.completed < 3) {
          showToast('Verbindung unterbrochen', 'error');
          reject(error);
        } else {
          resolve();
        }
        
        startBtn.disabled = false;
        startBtn.textContent = '⚔️ Neues Battle Starten';
      };

      // Auto-close after completion
      setTimeout(() => {
        if (currentBattle.completed === 3) {
          eventSource.close();
          resolve();
        }
      }, 60000); // 60s timeout
    });
  }

  // ========================================
  // Handle Stream Events
  // ========================================
  function handleStreamEvent(data) {
    const { type, model } = data;

    switch (type) {
      case 'status':
        updateStatus(model, data.message, 'thinking');
        break;

      case 'chunk':
        updateStatus(model, 'Schreibt...', 'writing');
        appendText(model, data.text);
        break;

      case 'complete':
        updateStatus(model, 'Fertig!', 'done');
        models[model].speed.textContent = `${data.speed}s`;
        currentBattle.speeds[model] = data.speed;
        currentBattle.responses[model] = data.text;
        currentBattle.completed++;
        
        // Remove typing cursor
        const cursor = models[model].response.querySelector('.typing-cursor');
        if (cursor) cursor.remove();

        // Show vote button
        setTimeout(() => {
          models[model].voteBtn.classList.add('show');
        }, 300);

        // Check if all done
        if (currentBattle.completed === 3) {
          battleComplete();
        }
        break;

      case 'error':
        updateStatus(model, data.error, 'error');
        currentBattle.completed++;
        
        if (currentBattle.completed === 3) {
          battleComplete();
        }
        break;

      case 'battle-complete':
        console.log('Battle complete!', data);
        break;
    }
  }

  // ========================================
  // Update Model Status
  // ========================================
  function updateStatus(model, text, state) {
    const m = models[model];
    if (!m) return;

    m.statusText.textContent = text;
    m.statusIndicator.className = `status-indicator ${state}`;
  }

  // ========================================
  // Append Text with Typing Effect
  // ========================================
  function appendText(model, text) {
    const m = models[model];
    if (!m || !m.response) return;

    // Remove old cursor
    let cursor = m.response.querySelector('.typing-cursor');
    if (cursor) cursor.remove();

    // Append text
    const textNode = document.createTextNode(text);
    m.response.appendChild(textNode);

    // Add new cursor
    cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    m.response.appendChild(cursor);

    // Auto-scroll
    m.response.scrollTop = m.response.scrollHeight;
  }

  // ========================================
  // Battle Complete
  // ========================================
  function battleComplete() {
    console.log('All models finished!');
    
    // Find fastest
    const speeds = currentBattle.speeds;
    let fastest = null;
    let fastestTime = Infinity;

    Object.entries(speeds).forEach(([model, time]) => {
      const timeFloat = parseFloat(time);
      if (timeFloat < fastestTime) {
        fastestTime = timeFloat;
        fastest = model;
      }
    });

    // Mark fastest with winner badge
    if (fastest) {
      const card = models[fastest].card;
      card.classList.add('winner');
      
      const badge = document.createElement('div');
      badge.className = 'winner-badge';
      badge.textContent = '🏆 Schnellster';
      card.style.position = 'relative';
      card.insertBefore(badge, card.firstChild);
    }

    // Re-enable start button
    startBtn.disabled = false;
    startBtn.textContent = '⚔️ Neues Battle Starten';

    showToast('Battle abgeschlossen! Wähle deinen Favoriten!', 'success');
  }

  // ========================================
  // Vote Handlers
  // ========================================
  Object.keys(models).forEach(modelKey => {
    const model = models[modelKey];
    
    model.voteBtn.addEventListener('click', async () => {
      if (votedThisBattle) {
        showToast('Du hast bereits abgestimmt!', 'warning');
        return;
      }

      // Disable all vote buttons
      Object.values(models).forEach(m => {
        m.voteBtn.disabled = true;
      });

      // Mark as voted
      model.voteBtn.classList.add('voted');
      model.voteBtn.textContent = '✓ Gewählt!';
      votedThisBattle = true;

      // Submit vote
      try {
        const modelNames = {
          claude: 'claude-sonnet-4',
          openai: 'gpt-4o-mini',
          perplexity: 'sonar-pro'
        };

        await submitVote(modelNames[modelKey], currentBattle.speeds);
        showToast(`Vote für ${model.name} gespeichert!`, 'success');
        
        // Reload leaderboard
        setTimeout(() => loadLeaderboard(), 500);
        
      } catch (error) {
        console.error('Vote error:', error);
        showToast('Vote konnte nicht gespeichert werden', 'error');
      }
    });
  });

  // ========================================
  // Submit Vote to Backend
  // ========================================
  async function submitVote(winner, speeds) {
    const response = await fetch(`${API_URL}/api/model-battle/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ winner, speeds })
    });

    if (!response.ok) {
      throw new Error('Vote failed');
    }

    return response.json();
  }

  // ========================================
  // Load Leaderboard
  // ========================================
  async function loadLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/api/model-battle/leaderboard`);
      const data = await response.json();

      if (data.success && data.leaderboard) {
        renderLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
    }
  }

  // ========================================
  // Render Leaderboard
  // ========================================
  function renderLeaderboard(leaderboard) {
    const modelNames = {
      'claude-sonnet-4': { name: 'Claude Sonnet 4', icon: '🤖' },
      'gpt-4o-mini': { name: 'GPT-4o Mini', icon: '🧠' },
      'sonar-pro': { name: 'Sonar Pro', icon: '🔮' }
    };

    leaderboardGrid.innerHTML = leaderboard.map((item, index) => {
      const modelInfo = modelNames[item.model] || { name: item.model, icon: '🤖' };
      const rank = index + 1;
      const isFirst = rank === 1;
      const rankClass = isFirst ? 'gold' : '';

      return `
        <div class="leaderboard-item ${isFirst ? 'first' : ''}">
          <div class="leaderboard-rank ${rankClass}">${rank}</div>
          <div class="leaderboard-model">
            ${modelInfo.icon} ${modelInfo.name}
          </div>
          <div class="leaderboard-stats">
            <div class="stat-row">
              <span>Siege:</span>
              <span class="stat-value">${item.wins}</span>
            </div>
            <div class="stat-row">
              <span>∅ Speed:</span>
              <span class="stat-value">${item.avgSpeed}s</span>
            </div>
            <div class="stat-row">
              <span>Battles:</span>
              <span class="stat-value">${item.battles}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================
  // Reset Battle
  // ========================================
  function resetBattle() {
    currentBattle = {
      active: true,
      responses: {},
      speeds: {},
      completed: 0
    };

    Object.values(models).forEach(model => {
      // Reset status
      model.statusText.textContent = 'Warte...';
      model.statusIndicator.className = 'status-indicator';
      
      // Clear response
      model.response.innerHTML = '';
      
      // Reset speed
      model.speed.textContent = '-';
      
      // Hide vote button
      model.voteBtn.classList.remove('show', 'voted');
      model.voteBtn.disabled = false;
      model.voteBtn.textContent = '👍 Bester Output!';
      
      // Remove winner class
      model.card.classList.remove('winner');
      
      // Remove winner badge
      const badge = model.card.querySelector('.winner-badge');
      if (badge) badge.remove();
    });
  }

  // ========================================
  // Toast Notification
  // ========================================
  function showToast(message, type = 'success') {
    const colors = {
      success: 'rgba(16, 185, 129, 0.95)',
      error: 'rgba(239, 68, 68, 0.95)',
      warning: 'rgba(251, 191, 36, 0.95)'
    };

    const toast = document.createElement('div');
    toast.className = 'battle-toast';
    toast.textContent = message;
    toast.style.background = colors[type] || colors.success;
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========================================
  // Initialize
  // ========================================
  function init() {
    console.log('🥊 Model Battle Arena initialized');
    loadLeaderboard();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
