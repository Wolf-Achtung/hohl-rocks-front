/* ═══════════════════════════════════════════════════════════════
 * HOHL.ROCKS - ZENTRALE API CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Version: 1.2
 * Purpose: Einheitliche API Base URL Detection für alle Features
 *
 * WICHTIG: Diese Datei MUSS vor Feature-Skripten geladen werden,
 * die window.API.base() nutzen (z. B. model-battle.js).
 *
 * v1.2: Tote Proxy-Methoden entfernt - sie warteten auf ein api.js,
 * das nicht existiert, und warfen bei jedem Aufruf. Verbraucher
 * nutzen ausschließlich API.base() bzw. lesen das Meta-Tag direkt.
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
    // Priority 1: Meta-Tag (Production & Development). An empty-string
    // content means "same origin" - checked with !== null (not truthiness)
    // so that case is respected instead of falling through to Priority 3.
    const metaBase = getMetaTag('x-api-base');
    if (metaBase !== null) {
      debugLog('API Config', 'Using API Base from meta tag:', metaBase || '(same-origin)');
      return metaBase;
    }

    // Priority 2: Development Mode (localhost detection)
    if (IS_DEV) {
      const devBase = 'http://localhost:8080';
      debugLog('API Config', 'Development mode detected, using:', devBase);
      return devBase;
    }

    // Priority 3: Production fallback - same-origin, routed through the
    // Netlify proxy (netlify.toml) rather than calling the Railway backend
    // directly cross-site. A direct cross-site fallback here previously
    // bypassed the proxy and defeated its same-origin protections.
    debugLog('API Config', 'Using production fallback: same-origin');
    return '';
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
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        debugLog('API Config', '✅ Backend connection verified:', {
          status: data.status,
          environment: data.environment?.nodeEnv || 'unknown'
        });
        return true;
      }
      debugWarn('API Config', '⚠️ Backend health check failed:', response.status);
      return false;
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

  window.API = window.API || {};

  // base() Funktion (für Feature-Files wie model-battle.js)
  window.API.base = function() {
    return API_BASE;
  };

  window.API.isReady = function() {
    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  // Backend Health Check (non-blocking; wärmt nebenbei das Railway-Backend auf)
  checkBackendHealth(API_BASE).then(healthy => {
    window.API.healthy = healthy;
    if (!healthy) {
      debugWarn('API Config', '⚠️ Backend health check failed - Features may not work properly');
    }
  });

  // Custom Event dispatchen für andere Scripts
  document.dispatchEvent(new CustomEvent('api:config:ready', {
    detail: { baseUrl: API_BASE }
  }));

})();
