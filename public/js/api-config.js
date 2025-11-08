/* ═══════════════════════════════════════════════════════════════
 * HOHL.ROCKS - ZENTRALE API CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Version: 1.0
 * Purpose: Einheitliche API Base URL Detection für alle Features
 * 
 * WICHTIG: Diese Datei MUSS als ERSTES Script geladen werden!
 * ═══════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

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
      console.log('[API Config] Using API Base from meta tag:', metaBase);
      return metaBase;
    }

    // Priority 2: Development Mode (localhost detection)
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      const devBase = 'http://localhost:8080';
      console.log('[API Config] Development mode detected, using:', devBase);
      return devBase;
    }

    // Priority 3: Production Fallback
    const prodBase = 'https://hohl-rocks-back-production.up.railway.app';
    console.log('[API Config] Using production fallback:', prodBase);
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
        console.log('✅ Backend connection verified:', {
          status: data.status,
          environment: data.environment?.nodeEnv || 'unknown'
        });
        return true;
      } else {
        console.warn('⚠️ Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend unreachable:', error.message);
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

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION & CONSOLE OUTPUT
  // ═══════════════════════════════════════════════════════════════
  
  console.log(`
╔════════════════════════════════════════╗
║   HOHL.ROCKS API Configuration Ready   ║
╚════════════════════════════════════════╝
API Base URL: ${API_BASE}
Environment: ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}
Ready: ${window.API.isReady()}
  `);

  // Backend Health Check (non-blocking)
  checkBackendHealth(API_BASE).then(healthy => {
    if (healthy) {
      window.API.healthy = true;
    } else {
      window.API.healthy = false;
      console.warn('⚠️ Backend health check failed - Features may not work properly');
    }
  });

  // Custom Event dispatchen für andere Scripts
  document.dispatchEvent(new CustomEvent('api:config:ready', { 
    detail: { baseUrl: API_BASE }
  }));

})();
