// ===================================================================
// PROMPT LIBRARY - JavaScript (OPTIMIZED v2.0)
// Features: API Integration, Search, Filter, Sort, Modal
// Fixed: API_BASE duplication, DOM access timing, defensive checks
// ===================================================================

// State
let allPrompts = [];
let filteredPrompts = [];
let currentCategory = 'all';
let currentSort = 'featured';

// DOM Elements (will be initialized in DOMContentLoaded)
let searchInput, filterButtons, sortSelect, promptsGrid, loadingState;
let resultsInfo, resultsCount, emptyState, modal, closeModalBtn, closeModalBtn2, toast;

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
  console.log('[Prompt Library] Initializing...');
  
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
    console.error('[Prompt Library] Critical DOM elements not found!');
    return;
  }
  
  loadPrompts();
  setupEventListeners();
  
  console.log('[Prompt Library] Initialized successfully');
});

// ===================================================================
// API CALLS
// ===================================================================

async function loadPrompts() {
  if (!loadingState || !promptsGrid) {
    console.error('[Prompt Library] Required DOM elements not found');
    return;
  }
  
  try {
    loadingState.style.display = 'block';
    promptsGrid.style.display = 'none';
    if (resultsInfo) resultsInfo.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    const API_BASE = getApiBase();
    const response = await fetch(`${API_BASE}/api/prompts`);
    
    if (!response.ok) {
      throw new Error('Failed to load prompts');
    }

    const data = await response.json();
    allPrompts = data.prompts || [];
    filteredPrompts = [...allPrompts];

    updateCategoryCounts();
    renderPrompts();
    
    loadingState.style.display = 'none';
    promptsGrid.style.display = 'grid';
    if (resultsInfo) resultsInfo.style.display = 'block';

  } catch (error) {
    console.error('[Prompt Library] Error loading prompts:', error);
    const API_BASE = getApiBase();
    loadingState.innerHTML = `
      <p style="color: #ef4444;">❌ Fehler beim Laden der Prompts</p>
      <p style="font-size: 14px; color: rgba(255,255,255,0.5);">
        Bitte versuche es später erneut<br>
        Backend: ${API_BASE}
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
      const matchTitle = prompt.title.toLowerCase().includes(searchTerm);
      const matchPrompt = prompt.prompt.toLowerCase().includes(searchTerm);
      const matchTags = prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const matchCategory = prompt.category.toLowerCase().includes(searchTerm);
      
      return matchTitle || matchPrompt || matchTags || matchCategory;
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
  switch (currentSort) {
    case 'rating':
      filteredPrompts.sort((a, b) => b.rating - a.rating);
      break;
    case 'uses':
      filteredPrompts.sort((a, b) => b.uses - a.uses);
      break;
    case 'newest':
      filteredPrompts.sort((a, b) => b.id - a.id);
      break;
    case 'featured':
    default:
      filteredPrompts.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.rating - a.rating;
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

  return `
    <div class="prompt-card" data-id="${prompt.id}">
      ${prompt.featured ? '<div class="featured-badge">Featured</div>' : ''}
      
      <div class="card-header">
        <h3 class="card-title">${prompt.title}</h3>
        <span class="card-category">
          ${categoryEmojis[prompt.category] || ''} ${capitalizeFirst(prompt.category)}
        </span>
      </div>

      <p class="card-prompt">${prompt.prompt}</p>

      <div class="card-tags">
        ${prompt.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
      </div>

      <div class="card-footer">
        <span class="card-rating">⭐ ${prompt.rating.toFixed(1)}</span>
        <span class="card-uses">${formatNumber(prompt.uses)} Uses</span>
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
  if (modalTitle) modalTitle.textContent = prompt.title;
  
  const modalCategory = document.getElementById('modal-category');
  if (modalCategory) modalCategory.textContent = capitalizeFirst(prompt.category);
  
  const modalRating = document.getElementById('modal-rating');
  if (modalRating) modalRating.textContent = `⭐ ${prompt.rating.toFixed(1)}`;
  
  const modalPrompt = document.getElementById('modal-prompt');
  if (modalPrompt) modalPrompt.textContent = prompt.prompt;
  
  const modalUses = document.getElementById('modal-uses');
  if (modalUses) modalUses.textContent = formatNumber(prompt.uses);
  
  const modalAuthor = document.getElementById('modal-author');
  if (modalAuthor) modalAuthor.textContent = prompt.author || 'hohl.rocks';

  // Tags
  const modalTags = document.getElementById('modal-tags');
  if (modalTags) {
    modalTags.innerHTML = prompt.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
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
    console.error('[Prompt Library] Copy failed:', error);
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
  console.error('[Prompt Library] Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Prompt Library] Unhandled promise rejection:', e.reason);
});
