// ═══════════════════════════════════════════════════════════════
// HOHL.ROCKS - API CLIENT
// All endpoints with /api/ prefix - API v2.8.0 compatible
// Version: 3.0
// ═══════════════════════════════════════════════════════════════

class HohlRocksAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.API?.base() || 'https://hohl-rocks-back-production.up.railway.app';
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERNAL: Unified fetch with credentials
  // ═══════════════════════════════════════════════════════════════

  async _fetch(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...options.headers
      }
    });

    // Handle rate limiting globally
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const error = new Error(data.message || 'Rate limit exceeded');
      error.status = 429;
      error.retryAfter = data.retryAfter || 60;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & STATUS
  // ═══════════════════════════════════════════════════════════════

  async health() {
    try {
      return await this._fetch(`${this.baseUrl}/health`);
    } catch (error) {
      console.error('[API] Health check error:', error);
      throw error;
    }
  }

  async self() {
    try {
      return await this._fetch(`${this.baseUrl}/api/self`);
    } catch (error) {
      console.error('[API] Self check error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHAT
  // ═══════════════════════════════════════════════════════════════

  async chat(data) {
    try {
      return await this._fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[API] Chat error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMPT GENERATOR
  // ═══════════════════════════════════════════════════════════════

  async generatePrompt(data) {
    try {
      return await this._fetch(`${this.baseUrl}/api/prompt-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[API] Generate prompt error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMPT OPTIMIZER
  // ═══════════════════════════════════════════════════════════════

  async optimizePrompt(data) {
    try {
      return await this._fetch(`${this.baseUrl}/api/prompt-optimizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[API] Optimize prompt error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MODEL BATTLE
  // ═══════════════════════════════════════════════════════════════

  async modelBattle(data) {
    try {
      return await this._fetch(`${this.baseUrl}/api/model-battle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[API] Model battle error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DAILY CHALLENGE
  // ═══════════════════════════════════════════════════════════════

  async getDailyChallenge() {
    try {
      return await this._fetch(`${this.baseUrl}/api/daily-challenge`);
    } catch (error) {
      console.error('[API] Get daily challenge error:', error);
      throw error;
    }
  }

  async submitChallenge(data) {
    try {
      return await this._fetch(`${this.baseUrl}/api/submit-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[API] Submit challenge error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NEWS
  // ═══════════════════════════════════════════════════════════════

  async getNews(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const url = `${this.baseUrl}/api/news${params.toString() ? '?' + params.toString() : ''}`;
      return await this._fetch(url);
    } catch (error) {
      console.error('[API] Get news error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SPARK OF THE DAY
  // ═══════════════════════════════════════════════════════════════

  async getSparkOfTheDay() {
    try {
      return await this._fetch(`${this.baseUrl}/api/spark/today`);
    } catch (error) {
      console.error('[API] Get spark of the day error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GDPR / USER DATA
  // ═══════════════════════════════════════════════════════════════

  async getMyData() {
    try {
      return await this._fetch(`${this.baseUrl}/api/my-data`);
    } catch (error) {
      console.error('[API] Get my data error:', error);
      throw error;
    }
  }

  async deleteMyData() {
    try {
      return await this._fetch(`${this.baseUrl}/api/my-data`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('[API] Delete my data error:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  async testConnection() {
    try {
      const health = await this.health();
      return health && health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setBaseUrl(newBaseUrl) {
    this.baseUrl = newBaseUrl;
    console.log('[API] Base URL updated:', newBaseUrl);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT & GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.HohlRocksAPI = HohlRocksAPI;

  const apiInstance = window.API && typeof window.API.base === 'function'
    ? new HohlRocksAPI(window.API.base())
    : new HohlRocksAPI();

  window.api = apiInstance;

  if (window.API) {
    const configMethods = {
      base: window.API.base,
      isReady: window.API.isReady,
      setBase: window.API.setBase
    };

    Object.getOwnPropertyNames(Object.getPrototypeOf(apiInstance)).forEach(method => {
      if (method !== 'constructor' && method !== '_fetch' && typeof apiInstance[method] === 'function') {
        window.API[method] = apiInstance[method].bind(apiInstance);
      }
    });

    Object.assign(window.API, configMethods);

    window.API.sparkToday = apiInstance.getSparkOfTheDay.bind(apiInstance);

    window.API.setBase = function(newBase) {
      apiInstance.setBaseUrl(newBase);
      console.log('[API] Base URL updated via setBase:', newBase);
    };

    console.log('[API] Initialized with base:', window.API.base());
    console.log('[API] Available as window.api and window.API');
  } else {
    console.log('[API] Initialized with fallback base');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HohlRocksAPI;
}
