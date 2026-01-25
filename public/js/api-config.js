/* ═══════════════════════════════════════════════════════════════
 * HOHL.ROCKS - ZENTRALE API CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Version: 1.1
 * Purpose: Einheitliche API Base URL Detection für alle Features
 *
 * WICHTIG: Diese Datei MUSS als ERSTES Script geladen werden!
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // DEBUG MODE - Nur in Development aktiv
  // ═══════════════════════════════════════════════════════════════

  const IS_DEV = window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1' ||
                 window.location.search.includes('debug=true');

  // Global debug function - only logs in development
  window.debugLog = function(prefix, ...args) {
    if (IS_DEV) {
      console.log(`[${prefix}]`, ...args);
    }
  };

  window.debugWarn = function(prefix, ...args) {
    if (IS_DEV) {
      console.warn(`[${prefix}]`, ...args);
    }
  };

  window.debugError = function(prefix, ...args) {
    // Errors always log, even in production
    console.error(`[${prefix}]`, ...args);
  };

  // Expose IS_DEV globally
  window.IS_DEV = IS_DEV;

  // ═══════════════════════════════════════════════════════════════
  // API BASE DETECTION MIT FALLBACKS
  // ═══════════════════════════════════════════════════════════════
  
  function getMetaTag(name) {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : null;
  }

  function detectApiBase() {
    // Priority 1: Meta-Tag (Production & Development)
    const metaBase = getMetaTag('x-api-base');
    if (metaBase) {
      debugLog('API Config', 'Using API Base from meta tag:', metaBase);
      return metaBase;
    }

    // Priority 2: Development Mode (localhost detection)
    if (IS_DEV) {
      const devBase = 'http://localhost:8080';
      debugLog('API Config', 'Development mode detected, using:', devBase);
      return devBase;
    }

    // Priority 3: Production Fallback
    const prodBase = 'https://hohl-rocks-back-production.up.railway.app';
    debugLog('API Config', 'Using production fallback:', prodBase);
    return prodBase;
  }

  // ═══════════════════════════════════════════════════════════════
  // BACKEND HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════
  
  async function checkBackendHealth(baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        debugLog('API Config', '✅ Backend connection verified:', {
          status: data.status,
          environment: data.environment?.nodeEnv || 'unknown'
        });
        return true;
      } else {
        debugWarn('API Config', '⚠️ Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      // Only log in dev - connection errors are expected if backend is down
      debugWarn('API Config', '❌ Backend unreachable:', error.message);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // WINDOW.API OBJECT
  // ═══════════════════════════════════════════════════════════════

  const API_BASE = detectApiBase();

  // Globales API Object erstellen
  window.API = window.API || {};

  // base() Funktion hinzufügen (für Feature-Files)
  window.API.base = function() {
    return API_BASE;
  };

  // isReady() Funktion hinzufügen
  window.API.isReady = function() {
    return true;
  };

  // setBase() Funktion hinzufügen (für app.js)
  window.API.setBase = function(newBase) {
    // This will be overridden by api.js, but provide a stub for early access
    debugLog('API Config', 'setBase called before api.js loaded:', newBase);
  };

  // Proxy-Funktionen für API-Methoden (werden später von api.js überschrieben)
  // Diese stellen sicher, dass Aufrufe funktionieren, auch wenn api.js später lädt
  const createApiProxy = (methodName) => {
    return async function(...args) {
      // Warte auf die echte API-Instanz
      if (window.api && typeof window.api[methodName] === 'function') {
        return await window.api[methodName](...args);
      }
      throw new Error(`API method ${methodName} not yet initialized. Please wait for api.js to load.`);
    };
  };

  // Proxy für alle wichtigen API-Methoden
  window.API.self = createApiProxy('self');
  window.API.sparkToday = createApiProxy('getSparkOfTheDay');
  window.API.health = createApiProxy('health');
  window.API.generatePrompt = createApiProxy('generatePrompt');
  window.API.optimizePrompt = createApiProxy('optimizePrompt');
  window.API.getPrompts = createApiProxy('getPrompts');
  window.API.modelBattle = createApiProxy('modelBattle');
  window.API.getDailyChallenge = createApiProxy('getDailyChallenge');
  window.API.submitChallenge = createApiProxy('submitChallenge');
  window.API.getNews = createApiProxy('getNews');

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION & CONSOLE OUTPUT
  // ═══════════════════════════════════════════════════════════════

  if (IS_DEV) {
    console.log(`
╔════════════════════════════════════════╗
║   HOHL.ROCKS API Configuration Ready   ║
╚════════════════════════════════════════╝
API Base URL: ${API_BASE}
Environment: Development
Ready: ${window.API.isReady()}
    `);
  }

  // Backend Health Check (non-blocking)
  checkBackendHealth(API_BASE).then(healthy => {
    if (healthy) {
      window.API.healthy = true;
    } else {
      window.API.healthy = false;
      debugWarn('API Config', '⚠️ Backend health check failed - Features may not work properly');
    }
  });

  // Custom Event dispatchen für andere Scripts
  document.dispatchEvent(new CustomEvent('api:config:ready', { 
    detail: { baseUrl: API_BASE }
  }));

})();
