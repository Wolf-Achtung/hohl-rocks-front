// ===================================================================
// PROMPT LIBRARY - JavaScript Logic
// ===================================================================

// Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080' 
  : 'https://hohl-rocks-back-production.up.railway.app';

// State
let allPrompts = [];
let filteredPrompts = [];
let currentCategory = 'all';
let currentView = 'featured'; // 'featured', 'community', 'my-prompts'
let searchQuery = '';

// LocalStorage Keys
const STORAGE_KEYS = {
  USER_PROMPTS: 'hohl_user_prompts',
  RATINGS: 'hohl_prompt_ratings'
};

// ===================================================================
// INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  attachEventListeners();
});

async function initializeApp() {
  showLoading();
  
  try {
    // Load featured prompts from backend
    await loadFeaturedPrompts();
    
    // Load user prompts from localStorage
    loadUserPrompts();
    
    // Initial render
    renderPrompts();
    updateStats();
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Fehler beim Laden der Prompts', 'error');
  } finally {
    hideLoading();
  }
}

// ===================================================================
// API CALLS
// ===================================================================

async function loadFeaturedPrompts() {
  try {
    const response = await fetch(`${API_URL}/api/prompts?featured=true`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.prompts) {
      // Store featured prompts
      allPrompts = data.prompts.map(p => ({
        ...p,
        source: 'featured'
      }));
    }
  } catch (error) {
    console.error('Error loading featured prompts:', error);
    
    // Fallback: Use mock data
    allPrompts = getMockPrompts();
    showToast('Offline Modus - Beispiel-Prompts geladen', 'warning');
  }
}

function getMockPrompts() {
  // Fallback mock data (3 examples)
  return [
    {
      id: 'mock-1',
      title: 'Story Architect',
      prompt: 'Du bist ein erfahrener Story-Architekt. Entwickle eine dreistufige Story-Struktur für [THEMA]...',
      category: 'creative',
      tags: ['storytelling', 'content'],
      rating: 4.8,
      uses: 1247,
      author: 'hohl.rocks',
      featured: true,
      source: 'featured'
    },
    {
      id: 'mock-2',
      title: 'Pitch Deck Strategist',
      prompt: 'Erstelle eine Pitch Deck Struktur (12 Slides) für [STARTUP/PRODUKT]...',
      category: 'business',
      tags: ['pitch', 'startup'],
      rating: 4.9,
      uses: 1891,
      author: 'hohl.rocks',
      featured: true,
      source: 'featured'
    },
    {
      id: 'mock-3',
      title: 'Code Review Assistant',
      prompt: 'Review folgenden Code-Block für [PROGRAMMIERSPRACHE]: [CODE]...',
      category: 'technical',
      tags: ['code', 'review'],
      rating: 4.7,
      uses: 2156,
      author: 'hohl.rocks',
      featured: true,
      source: 'featured'
    }
  ];
}

// ===================================================================
// LOCALSTORAGE FUNCTIONS
// ===================================================================

function loadUserPrompts() {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PROMPTS);
  if (stored) {
    try {
      const userPrompts = JSON.parse(stored);
      // Merge with existing prompts
      allPrompts = [...allPrompts, ...userPrompts];
    } catch (error) {
      console.error('Error parsing user prompts:', error);
    }
  }
}

function saveUserPrompt(prompt) {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PROMPTS);
  let userPrompts = [];
  
  if (stored) {
    try {
      userPrompts = JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored prompts:', error);
    }
  }
  
  userPrompts.push(prompt);
  localStorage.setItem(STORAGE_KEYS.USER_PROMPTS, JSON.stringify(userPrompts));
  
  // Add to all prompts
  allPrompts.push(prompt);
}

function getUserRating(promptId) {
  const stored = localStorage.getItem(STORAGE_KEYS.RATINGS);
  if (stored) {
    try {
      const ratings = JSON.parse(stored);
      return ratings[promptId] || null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

function saveUserRating(promptId, rating) {
  const stored = localStorage.getItem(STORAGE_KEYS.RATINGS);
  let ratings = {};
  
  if (stored) {
    try {
      ratings = JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing ratings:', error);
    }
  }
  
  ratings[promptId] = rating;
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
}

// ===================================================================
// FILTERING & SEARCH
// ===================================================================

function filterPrompts() {
  filteredPrompts = allPrompts.filter(prompt => {
    // View filter
    let viewMatch = true;
    if (currentView === 'featured') {
      viewMatch = prompt.featured === true;
    } else if (currentView === 'community') {
      viewMatch = prompt.source === 'community';
    } else if (currentView === 'my-prompts') {
      viewMatch = prompt.source === 'user';
    }
    
    // Category filter
    const categoryMatch = currentCategory === 'all' || prompt.category === currentCategory;
    
    // Search filter
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = 
        prompt.title.toLowerCase().includes(query) ||
        prompt.prompt.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query));
    }
    
    return viewMatch && categoryMatch && searchMatch;
  });
  
  renderPrompts();
  updateStats();
}

// ===================================================================
// RENDERING
// ===================================================================

function renderPrompts() {
  const grid = document.getElementById('prompts-grid');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredPrompts.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  grid.innerHTML = filteredPrompts.map(prompt => createPromptCard(prompt)).join('');
  
  // Attach event listeners to cards
  document.querySelectorAll('.prompt-card').forEach(card => {
    const promptId = card.dataset.promptId;
    const prompt = filteredPrompts.find(p => String(p.id) === String(promptId));
    
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking action button
      if (e.target.closest('.action-btn')) return;
      openPromptModal(prompt);
    });
    
    // Copy button
    const copyBtn = card.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(prompt.prompt);
      });
    }
  });
}

function createPromptCard(prompt) {
  const preview = prompt.prompt.length > 150 
    ? prompt.prompt.substring(0, 150) + '...' 
    : prompt.prompt;
  
  return `
    <div class="prompt-card ${prompt.featured ? 'featured' : ''}" data-prompt-id="${prompt.id}">
      <div class="prompt-header">
        <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
        ${prompt.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
      </div>
      
      <div class="prompt-preview">${escapeHtml(preview)}</div>
      
      <div class="prompt-meta">
        <span class="category-badge">${getCategoryIcon(prompt.category)} ${getCategoryName(prompt.category)}</span>
        <span class="rating">${prompt.rating.toFixed(1)}</span>
        <span class="uses">${formatNumber(prompt.uses)}</span>
      </div>
      
      <div class="tags">
        ${prompt.tags.slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>
      
      <div class="prompt-actions">
        <button class="action-btn copy-btn">📋 Kopieren</button>
        <button class="action-btn primary">👁️ Details</button>
      </div>
    </div>
  `;
}

function updateStats() {
  const totalPrompts = allPrompts.length;
  const categories = [...new Set(allPrompts.map(p => p.category))].length;
  const totalUses = allPrompts.reduce((sum, p) => sum + (p.uses || 0), 0);
  
  document.getElementById('total-prompts').textContent = totalPrompts;
  document.getElementById('total-categories').textContent = categories;
  document.getElementById('total-uses').textContent = formatNumber(totalUses) + '+';
}

// ===================================================================
// MODAL
// ===================================================================

function openPromptModal(prompt) {
  const modal = document.getElementById('prompt-modal');
  
  // Populate modal
  document.getElementById('modal-title').textContent = prompt.title;
  document.getElementById('modal-category').textContent = `${getCategoryIcon(prompt.category)} ${getCategoryName(prompt.category)}`;
  document.getElementById('modal-rating').textContent = `⭐ ${prompt.rating.toFixed(1)}`;
  document.getElementById('modal-uses').textContent = `🔥 ${formatNumber(prompt.uses)} uses`;
  document.getElementById('modal-prompt').textContent = prompt.prompt;
  
  const tagsContainer = document.getElementById('modal-tags');
  tagsContainer.innerHTML = prompt.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
  
  // Show modal
  modal.classList.add('active');
  
  // Copy button
  const copyBtn = document.getElementById('copy-modal-prompt');
  copyBtn.onclick = () => copyToClipboard(prompt.prompt);
  
  // Use in generator button (optional - for future integration)
  const useBtn = document.getElementById('use-modal-prompt');
  useBtn.onclick = () => {
    copyToClipboard(prompt.prompt);
    showToast('Prompt kopiert! Öffne den Prompt Generator um ihn zu nutzen.', 'success');
    closePromptModal();
  };
}

function closePromptModal() {
  const modal = document.getElementById('prompt-modal');
  modal.classList.remove('active');
}

// ===================================================================
// FORM SUBMISSION
// ===================================================================

function handleFormSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('prompt-title').value.trim();
  const promptText = document.getElementById('prompt-text').value.trim();
  const category = document.getElementById('prompt-category').value;
  const tagsInput = document.getElementById('prompt-tags').value.trim();
  
  if (!title || !promptText || !category) {
    showToast('Bitte fülle alle Pflichtfelder aus', 'error');
    return;
  }
  
  // Parse tags
  const tags = tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  // Create new prompt
  const newPrompt = {
    id: `user-${Date.now()}`,
    title,
    prompt: promptText,
    category,
    tags: tags.length > 0 ? tags : ['user-generated'],
    rating: 0,
    uses: 0,
    author: 'Du',
    featured: false,
    source: 'user',
    createdAt: new Date().toISOString()
  };
  
  // Save to localStorage
  saveUserPrompt(newPrompt);
  
  // Switch to "Meine Prompts" view
  currentView = 'my-prompts';
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.id === 'my-prompts-view') {
      btn.classList.add('active');
    }
  });
  
  // Reset form
  e.target.reset();
  
  // Show success
  showToast('✅ Prompt erfolgreich gespeichert!', 'success');
  
  // Scroll to top and refresh
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    filterPrompts();
  }, 500);
}

// ===================================================================
// EVENT LISTENERS
// ===================================================================

function attachEventListeners() {
  // Search input
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    filterPrompts();
  });
  
  // Category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      filterPrompts();
    });
  });
  
  // View toggle
  document.getElementById('featured-view').addEventListener('click', () => {
    switchView('featured');
  });
  
  document.getElementById('community-view').addEventListener('click', () => {
    switchView('community');
  });
  
  document.getElementById('my-prompts-view').addEventListener('click', () => {
    switchView('my-prompts');
  });
  
  // Submit form
  const submitForm = document.getElementById('submit-form');
  submitForm.addEventListener('submit', handleFormSubmit);
  
  // Modal close
  document.querySelector('.modal-close').addEventListener('click', closePromptModal);
  
  // Close modal on background click
  document.getElementById('prompt-modal').addEventListener('click', (e) => {
    if (e.target.id === 'prompt-modal') {
      closePromptModal();
    }
  });
  
  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePromptModal();
    }
  });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');
  filterPrompts();
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 In Zwischenablage kopiert!', 'success');
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('Kopieren fehlgeschlagen', 'error');
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading() {
  document.getElementById('loading-state').style.display = 'block';
  document.getElementById('prompts-grid').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('prompts-grid').style.display = 'grid';
}

function getCategoryIcon(category) {
  const icons = {
    creative: '🎨',
    business: '💼',
    technical: '⚙️',
    education: '📚',
    writing: '✍️',
    ai: '🤖',
    communication: '💬',
    data: '📊',
    marketing: '🎯',
    productivity: '🚀',
    design: '🎨',
    innovation: '💡'
  };
  return icons[category] || '📝';
}

function getCategoryName(category) {
  const names = {
    creative: 'Creative',
    business: 'Business',
    technical: 'Technical',
    education: 'Education',
    writing: 'Writing',
    ai: 'AI',
    communication: 'Communication',
    data: 'Data',
    marketing: 'Marketing',
    productivity: 'Productivity',
    design: 'Design',
    innovation: 'Innovation'
  };
  return names[category] || category;
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================================================================
// EXPORT FOR POTENTIAL INTEGRATION
// ===================================================================

window.PromptLibrary = {
  getPromptById: (id) => allPrompts.find(p => p.id === id),
  getAllPrompts: () => allPrompts,
  searchPrompts: (query) => {
    searchQuery = query;
    filterPrompts();
  }
};
