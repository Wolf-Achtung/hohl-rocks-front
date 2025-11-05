/* -*- coding: utf-8 -*- */
/**
 * App-Bootstrap: Self-Check, UI-Flags setzen, Events feuern.
 * Robuste Fallbacks, falls Backend nicht verfügbar ist.
 */
(() => {
  'use strict';

  // Fallback domReady (unabhängig von utils.js)
  function domReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      queueMicrotask(fn);
    }
  }
  
  // Show user-friendly notification
  function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
      console.log(`[App] ${type.toUpperCase()}: ${message}`);
      return;
    }
    
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
      toast.style.display = 'none';
    }, type === 'error' ? 8000 : 5000);
  }

  domReady(async () => {
    console.log('[App] Starting initialization...');
    
    // API-Basis ggf. aus <meta name="x-api-base"> übernehmen
    const meta = document.querySelector('meta[name="x-api-base"]');
    if (meta && meta.content && window.API?.setBase) {
      window.API.setBase(meta.content);
      console.log('[App] API base set from meta tag:', meta.content);
    }

    // Self-Check
    try {
      if (!window.API?.self) {
        throw new Error('API not initialized');
      }
      
      console.log('[App] Calling API.self()...');
      const info = await window.API.self();

      if (info && info.ok !== false) {
        console.log('[App] API available, info:', info);
        document.documentElement.dataset.apiOk = '1';
        
        // UI-Flags aus /api/self (kommen aus ENV)
        if (info?.ui?.modalShade != null) {
          document.documentElement.style.setProperty('--modal-shade', String(info.ui.modalShade));
        }
        if (info?.ui?.removeNavSound) {
          document.documentElement.dataset.navSound = 'off';
        }
        if (info?.life?.extendClick) {
          document.documentElement.dataset.extendClick = String(info.life.extendClick);
        }
        if (Number.isFinite(info?.life?.maxExtends)) {
          document.documentElement.dataset.maxExtends = String(info.life.maxExtends);
        }

        document.dispatchEvent(new CustomEvent('api:ready', { detail: { info } }));
        
      } else {
        // Backend returned but indicated it's not ok
        console.warn('[App] Backend not fully available');
        document.documentElement.dataset.apiOk = '0';
        document.documentElement.dataset.offlineMode = '1';
        
        showNotification(
          '⚠️ Backend läuft im reduzierten Modus. Einige Features sind eingeschränkt.',
          'warning'
        );
        
        document.dispatchEvent(new CustomEvent('api:offline', { detail: { info } }));
      }
      
    } catch (err) {
      console.warn('[App] API self-check failed:', err?.message || err);
      document.documentElement.dataset.apiOk = '0';
      document.documentElement.dataset.offlineMode = '1';
      
      // Check if it's a network error vs backend not deployed
      const isNetworkError = err?.message?.includes('fetch') || 
                             err?.message?.includes('Network') ||
                             err?.message?.includes('Failed to fetch');
      
      if (isNetworkError) {
        showNotification(
          '🌐 Keine Verbindung zum Backend. Prüfe deine Internetverbindung.',
          'error'
        );
      } else {
        showNotification(
          '⚠️ Backend nicht erreichbar. Die Seite läuft im Offline-Modus.',
          'warning'
        );
      }
      
      document.dispatchEvent(new CustomEvent('api:error', { detail: err }));
    }
    
    console.log('[App] Initialization complete');
  });
  
  // Add some helpful CSS for offline mode
  const style = document.createElement('style');
  style.textContent = `
    [data-offline-mode="1"] .hero-sub::after {
      content: " (Offline-Modus)";
      opacity: 0.6;
      font-size: 0.85em;
    }
    
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.95);
      color: #e5e7eb;
      border: 1px solid rgba(148, 163, 184, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      z-index: 9999;
      max-width: 400px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      display: none;
      animation: slideIn 0.3s ease-out;
    }
    
    .toast-warning {
      border-color: rgba(251, 191, 36, 0.5);
      background: rgba(124, 58, 237, 0.1);
    }
    
    .toast-error {
      border-color: rgba(239, 68, 68, 0.5);
      background: rgba(220, 38, 38, 0.1);
    }
    
    .toast-info {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(37, 99, 235, 0.1);
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
})();
