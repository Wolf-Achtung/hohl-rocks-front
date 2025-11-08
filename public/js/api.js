// ═══════════════════════════════════════════════════════════════
// HOHL.ROCKS - API CLIENT (KOMPLETT KORRIGIERT)
// Alle Endpoints mit /api/ Prefix - Ready to Deploy
// Version: 2.1 - Final Fix
// ═══════════════════════════════════════════════════════════════

class HohlRocksAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.API?.base() || 'https://hohl-rocks-back-production.up.railway.app';
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & STATUS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Health Check - Backend Status
   * @returns {Promise<Object>}
   */
  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Health check error:', error);
      throw error;
    }
  }

  /**
   * Self Check - Backend Self-Test
   * ✅ KORRIGIERT: /self → /api/self
   * @returns {Promise<Object>}
   */
  async self() {
    try {
      const response = await fetch(`${this.baseUrl}/api/self`);
      if (!response.ok) throw new Error(`Self check failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Self check error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMPT GENERATOR
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate Prompt
   * @param {Object} data - { task, style, context }
   * @returns {Promise<Object>}
   */
  async generatePrompt(data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/prompt-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Generate failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Generate prompt error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMPT OPTIMIZER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Optimize Prompt
   * @param {Object} data - { prompt }
   * @returns {Promise<Object>}
   */
  async optimizePrompt(data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/prompt-optimizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Optimize failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Optimize prompt error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMPT LIBRARY
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get All Prompts
   * @param {Object} filters - { category, featured, search }
   * @returns {Promise<Object>}
   */
  async getPrompts(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const url = `${this.baseUrl}/api/prompts${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Get prompts failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Get prompts error:', error);
      throw error;
    }
  }

  /**
   * Get Single Prompt by ID
   * @param {number} id - Prompt ID
   * @returns {Promise<Object>}
   */
  async getPrompt(id) {
    try {
      const response = await fetch(`${this.baseUrl}/api/prompts/${id}`);
      if (!response.ok) throw new Error(`Get prompt failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Get prompt error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MODEL BATTLE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start Model Battle
   * @param {Object} data - { prompt }
   * @returns {Promise<Object>}
   */
  async modelBattle(data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/model-battle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Battle failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Model battle error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DAILY CHALLENGE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get Daily Challenge
   * @returns {Promise<Object>}
   */
  async getDailyChallenge() {
    try {
      const response = await fetch(`${this.baseUrl}/api/daily-challenge`);
      if (!response.ok) throw new Error(`Get challenge failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Get daily challenge error:', error);
      throw error;
    }
  }

  /**
   * Submit Challenge Solution
   * @param {Object} data - { solution }
   * @returns {Promise<Object>}
   */
  async submitChallenge(data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/submit-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`Submit failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Submit challenge error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NEWS (NEU!)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get AI News
   * ✅ NEU: News Endpoint
   * @returns {Promise<Object>}
   */
  async getNews() {
    try {
      const response = await fetch(`${this.baseUrl}/api/news`);
      if (!response.ok) throw new Error(`Get news failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Get news error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SPARK OF THE DAY (NEU!)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get Spark of the Day
   * ✅ KORRIGIERT: /spark/today → /api/spark/today
   * @returns {Promise<Object>}
   */
  async getSparkOfTheDay() {
    try {
      const response = await fetch(`${this.baseUrl}/api/spark/today`);
      if (!response.ok) throw new Error(`Get spark failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[API] Get spark of the day error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Test Backend Connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const health = await this.health();
      return health && health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API Base URL
   * @returns {string}
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Update API Base URL
   * @param {string} newBaseUrl
   */
  setBaseUrl(newBaseUrl) {
    this.baseUrl = newBaseUrl;
    console.log('[API] Base URL updated:', newBaseUrl);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT & GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════

// Create global instance
if (typeof window !== 'undefined') {
  window.HohlRocksAPI = HohlRocksAPI;
  
  // Auto-initialize with correct base URL
  if (window.API && typeof window.API.base === 'function') {
    window.api = new HohlRocksAPI(window.API.base());
    console.log('[API] Initialized with base:', window.API.base());
  } else {
    window.api = new HohlRocksAPI();
    console.log('[API] Initialized with fallback base');
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HohlRocksAPI;
}

// ═══════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════

/*

// Health Check
const health = await api.health();
console.log('Backend healthy:', health.status === 'healthy');

// Self Check
const self = await api.self();
console.log('Self check:', self);

// Generate Prompt
const generated = await api.generatePrompt({
  task: 'Marketing campaign',
  style: 'professional',
  context: 'B2B tech startup'
});
console.log('Generated:', generated);

// Get All Prompts
const prompts = await api.getPrompts({ category: 'creative', featured: true });
console.log('Prompts:', prompts);

// Model Battle
const battle = await api.modelBattle({ prompt: 'Explain quantum computing' });
console.log('Battle results:', battle);

// Daily Challenge
const challenge = await api.getDailyChallenge();
console.log('Today\'s challenge:', challenge);

// Get News (NEU!)
const news = await api.getNews();
console.log('AI News:', news);

// Get Spark of the Day (NEU!)
const spark = await api.getSparkOfTheDay();
console.log('Spark:', spark);

// Test Connection
const isConnected = await api.testConnection();
console.log('Backend connected:', isConnected);

*/
