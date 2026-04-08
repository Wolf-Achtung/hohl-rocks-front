// ===================================================================
// PROMPT LIBRARY - JavaScript (OPTIMIZED v2.1 - IIFE)
// Features: API Integration, Search, Filter, Sort, Modal
// Fixed: API_BASE duplication, DOM access timing, defensive checks, scope conflicts
// ===================================================================

(function() {
'use strict';

// Safe debug functions with fallbacks (api-config.js may or may not be loaded)
const log = (...args) => (window.debugLog ? window.debugLog('Prompt Library', ...args) : console.log('[Prompt Library]', ...args));
const warn = (...args) => (window.debugWarn ? window.debugWarn('Prompt Library', ...args) : console.warn('[Prompt Library]', ...args));
const err = (...args) => (window.debugError ? window.debugError('Prompt Library', ...args) : console.error('[Prompt Library]', ...args));

// State
let allPrompts = [];
let filteredPrompts = [];
let currentCategory = 'all';
let currentSort = 'featured';

// Local data source — always works, no backend dependency
const LOCAL_PROMPTS_URL = '/data/prompts-library.json';

// DOM Elements (will be initialized in DOMContentLoaded)
let searchInput, filterButtons, sortSelect, promptsGrid, loadingState;
let resultsInfo, resultsCount, emptyState, modal, closeModalBtn, closeModalBtn2, toast;

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Page Detection - only initialize on prompt-library.html
  const isOnFeaturePage = window.location.pathname.includes('prompt-library.html');

  if (!isOnFeaturePage) {
    log('Not on feature page, skipping initialization');
    return;
  }

  log('Initializing...');

  // Initialize DOM elements safely
  searchInput = document.getElementById('search-input');
  filterButtons = document.querySelectorAll('.filter-btn');
  sortSelect = document.getElementById('sort-select');
  promptsGrid = document.getElementById('prompts-grid');
  loadingState = document.getElementById('loading-state');
  resultsInfo = document.getElementById('results-info');
  resultsCount = document.getElementById('results-count');
  emptyState = document.getElementById('empty-state');
  modal = document.getElementById('prompt-modal');
  closeModalBtn = document.getElementById('close-modal');
  closeModalBtn2 = document.getElementById('close-modal-btn');
  toast = document.getElementById('toast');

  // Validate critical DOM elements
  if (!loadingState || !promptsGrid) {
    err('Critical DOM elements not found!');
    return;
  }

  loadPrompts();
  setupEventListeners();

  log('Initialized successfully');
});

// ===================================================================
// API CALLS
// ===================================================================

async function loadPrompts() {
  if (!loadingState || !promptsGrid) {
    err('Required DOM elements not found');
    return;
  }

  try {
    loadingState.style.display = 'block';
    promptsGrid.style.display = 'none';
    if (resultsInfo) resultsInfo.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    // Load from local JSON file — no backend dependency
    const response = await fetch(LOCAL_PROMPTS_URL, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`Failed to load prompts: ${response.status}`);
    }

    const data = await response.json();
    allPrompts = Array.isArray(data) ? data : (data.prompts || []);
    filteredPrompts = [...allPrompts];

    updateCategoryCounts();
    sortPrompts();
    renderPrompts();

    loadingState.style.display = 'none';
    promptsGrid.style.display = 'grid';
    if (resultsInfo) resultsInfo.style.display = 'block';

  } catch (error) {
    err('Error loading prompts:', error);
    loadingState.innerHTML = `
      <p style="color: #ef4444;">❌ Fehler beim Laden der Prompts</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.5);">
        Bitte lade die Seite erneut.
      </p>
    `;
  }
}

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function setupEventListeners() {
  // Search
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Category Filter
  if (filterButtons) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => handleCategoryFilter(btn));
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSort);
  }

  // Modal Close
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  if (closeModalBtn2) {
    closeModalBtn2.addEventListener('click', closeModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closeModal();
    }
  });
}

// ===================================================================
// SEARCH
// ===================================================================

function handleSearch() {
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  filteredPrompts = allPrompts.filter(prompt => {
    // Category filter
    if (currentCategory !== 'all' && prompt.category !== currentCategory) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const title = (prompt.title || '').toLowerCase();
      const text = (prompt.prompt || '').toLowerCase();
      const desc = (prompt.desc || '').toLowerCase();
      const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
      const category = (prompt.category || '').toLowerCase();

      const matchTitle = title.includes(searchTerm);
      const matchPrompt = text.includes(searchTerm);
      const matchDesc = desc.includes(searchTerm);
      const matchTags = tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const matchCategory = category.includes(searchTerm);

      return matchTitle || matchPrompt || matchDesc || matchTags || matchCategory;
    }

    return true;
  });

  sortPrompts();
  renderPrompts();
}

// ===================================================================
// CATEGORY FILTER
// ===================================================================

function handleCategoryFilter(button) {
  if (!button || !filterButtons) return;
  
  // Update active state
  filterButtons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  // Update current category
  currentCategory = button.dataset.category;

  // Re-filter and render
  handleSearch();
}

function updateCategoryCounts() {
  const counts = {
    all: allPrompts.length,
    creative: allPrompts.filter(p => p.category === 'creative').length,
    business: allPrompts.filter(p => p.category === 'business').length,
    technical: allPrompts.filter(p => p.category === 'technical').length,
    marketing: allPrompts.filter(p => p.category === 'marketing').length,
    productivity: allPrompts.filter(p => p.category === 'productivity').length,
  };

  Object.keys(counts).forEach(category => {
    const countEl = document.getElementById(`count-${category}`);
    if (countEl) {
      countEl.textContent = counts[category];
    }
  });
}

// ===================================================================
// SORT
// ===================================================================

function handleSort() {
  if (!sortSelect) return;
  
  currentSort = sortSelect.value;
  sortPrompts();
  renderPrompts();
}

function sortPrompts() {
  const r = (p) => (typeof p.rating === 'number' ? p.rating : 0);
  const u = (p) => (typeof p.uses === 'number' ? p.uses : 0);
  const i = (p) => (typeof p.id === 'number' ? p.id : 0);

  switch (currentSort) {
    case 'rating':
      filteredPrompts.sort((a, b) => r(b) - r(a));
      break;
    case 'uses':
      filteredPrompts.sort((a, b) => u(b) - u(a));
      break;
    case 'newest':
      filteredPrompts.sort((a, b) => i(b) - i(a));
      break;
    case 'featured':
    default:
      filteredPrompts.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return r(b) - r(a);
      });
  }
}

// ===================================================================
// RENDER
// ===================================================================

function renderPrompts() {
  if (!promptsGrid) return;
  
  // Update results count
  if (resultsCount) {
    resultsCount.textContent = filteredPrompts.length;
  }

  // Show empty state if no results
  if (filteredPrompts.length === 0) {
    promptsGrid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  // Hide empty state
  if (emptyState) emptyState.style.display = 'none';
  promptsGrid.style.display = 'grid';

  // Render cards
  promptsGrid.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('');

  // Add click listeners
  document.querySelectorAll('.prompt-card').forEach((card, index) => {
    card.addEventListener('click', () => openModal(filteredPrompts[index]));
  });
}

function createPromptCard(prompt) {
  const categoryEmojis = {
    creative: '🎨',
    business: '💼',
    technical: '💻',
    marketing: '📢',
    productivity: '⚡'
  };

  // Use desc as short summary on the card, fallback to truncated prompt
  const summary = prompt.desc || (prompt.prompt || '').slice(0, 180);
  const rating = typeof prompt.rating === 'number' ? prompt.rating.toFixed(1) : '5.0';
  const uses = typeof prompt.uses === 'number' ? prompt.uses : 0;
  const tags = Array.isArray(prompt.tags) ? prompt.tags : [];

  return `
    <div class="prompt-card" data-id="${escapeHtml(String(prompt.id || ''))}">
      ${prompt.featured ? '<div class="featured-badge">★ Featured</div>' : ''}

      <div class="card-header">
        <h3 class="card-title">${escapeHtml(prompt.title)}</h3>
        <span class="card-category">
          ${categoryEmojis[prompt.category] || ''} ${capitalizeFirst(escapeHtml(prompt.category || ''))}
        </span>
      </div>

      <p class="card-prompt">${escapeHtml(summary)}</p>

      <div class="card-tags">
        ${tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>

      <div class="card-footer">
        <span class="card-rating">⭐ ${rating}</span>
        <span class="card-uses">${formatNumber(uses)} Uses</span>
      </div>
    </div>
  `;
}

// ===================================================================
// MODAL
// ===================================================================

function openModal(prompt) {
  if (!modal) return;

  // Populate modal with defensive checks
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) modalTitle.textContent = prompt.title || '';

  const modalCategory = document.getElementById('modal-category');
  if (modalCategory) modalCategory.textContent = capitalizeFirst(prompt.category || '');

  const modalRating = document.getElementById('modal-rating');
  const rating = typeof prompt.rating === 'number' ? prompt.rating.toFixed(1) : '5.0';
  if (modalRating) modalRating.textContent = `⭐ ${rating}`;

  const modalPrompt = document.getElementById('modal-prompt');
  if (modalPrompt) modalPrompt.textContent = prompt.prompt || '';

  const modalUses = document.getElementById('modal-uses');
  if (modalUses) modalUses.textContent = formatNumber(prompt.uses || 0);

  const modalAuthor = document.getElementById('modal-author');
  if (modalAuthor) modalAuthor.textContent = prompt.author || 'hohl.rocks';

  // Tags (with XSS protection)
  const modalTags = document.getElementById('modal-tags');
  if (modalTags) {
    const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
    modalTags.innerHTML = tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
  }

  // Copy button
  const copyBtn = document.getElementById('copy-prompt-btn');
  if (copyBtn) {
    copyBtn.textContent = '📋 Kopieren';
    copyBtn.classList.remove('copied');
    copyBtn.onclick = () => copyPrompt(prompt.prompt, copyBtn);
  }

  // Use prompt button
  const useBtn = document.getElementById('use-prompt-btn');
  if (useBtn) {
    useBtn.onclick = () => usePrompt(prompt);
  }

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) return;
  
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ===================================================================
// ACTIONS
// ===================================================================

async function copyPrompt(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    
    // Update button
    if (button) {
      button.textContent = '✅ Kopiert!';
      button.classList.add('copied');
    }

    // Show toast
    showToast('Prompt in Zwischenablage kopiert! 📋');

    // Reset button after 2s
    if (button) {
      setTimeout(() => {
        button.textContent = '📋 Kopieren';
        button.classList.remove('copied');
      }, 2000);
    }

  } catch (error) {
    err('Copy failed:', error);
    showToast('Fehler beim Kopieren ❌', 'error');
  }
}

function usePrompt(prompt) {
  // Copy prompt
  navigator.clipboard.writeText(prompt.prompt);
  
  // Show toast
  showToast('Prompt kopiert! Nutze ihn in deinem AI Tool 🚀');
  
  // Close modal after short delay
  setTimeout(() => {
    closeModal();
  }, 1500);
}

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
// UTILITIES
// ===================================================================

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// XSS Protection - escape HTML entities
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// ===================================================================
// ERROR HANDLING
// ===================================================================

window.addEventListener('error', (e) => {
  err('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  err('Unhandled promise rejection:', e.reason);
});

})(); // End IIFE
