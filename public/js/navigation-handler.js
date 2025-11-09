/* -*- coding: utf-8 -*- */
/**
 * navigation-handler.js
 * Behandelt alle Navigation-Button Clicks (data-action)
 * FIXED: API calls, error handling, null checks
 */
(() => {
  'use strict';

  function domReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      queueMicrotask(fn);
    }
  }

  function openOverlay(id) {
    const overlay = document.getElementById(id);
    if (!overlay) {
      console.warn('[Nav] Overlay not found:', id);
      return;
    }
    
    overlay.dataset.open = '1';
    overlay.setAttribute('aria-hidden', 'false');
    
    // Focus first interactive element
    setTimeout(() => {
      const firstFocusable = overlay.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 100);
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    
    delete overlay.dataset.open;
    overlay.setAttribute('aria-hidden', 'true');
  }

  function closeAllOverlays() {
    document.querySelectorAll('.overlay[data-open="1"]').forEach(closeOverlay);
  }

  // Load Tips
  async function loadTips() {
    const grid = document.getElementById('tips-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p>Lade KI-Tipps...</p>';
    
    try {
      const tips = window.TIPS_DATA || [];
      
      if (tips.length === 0) {
        grid.innerHTML = '<p>Keine Tipps verfügbar.</p>';
        return;
      }
      
      grid.innerHTML = '';
      
      tips.forEach(tip => {
        const card = document.createElement('div');
        card.className = 'tip tip-card';
        card.innerHTML = `
          <h3>${escapeHtml(tip.title)}</h3>
          <div class="meta">
            ${tip.category ? `<span class="category-badge">${escapeHtml(tip.category)}</span>` : ''}
            ${tip.tags ? `<span class="tags">${escapeHtml(tip.tags.join(', '))}</span>` : ''}
          </div>
          <p class="problem">${escapeHtml(tip.problem || '')}</p>
          <div class="actions">
            <button class="btn" data-action="open-tip" data-tip-id="${escapeHtml(tip.id)}">Öffnen</button>
            <button class="btn" data-action="copy-tip" data-tip-id="${escapeHtml(tip.id)}">Prompt kopieren</button>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      console.error('[Nav] Error loading tips:', err);
      grid.innerHTML = '<p>Fehler beim Laden der Tipps.</p>';
    }
  }

  // Load News - trigger external renderer
  function loadNews() {
    // news-render-fix.js handles the actual rendering
    console.log('[Nav] Triggering news load');
  }

  // Load Daily Spotlight
  async function loadDaily() {
    const body = document.getElementById('daily-body');
    if (!body) {
      console.error('[Nav] Daily body element not found');
      return;
    }
    
    body.innerHTML = '<p>Lade Spotlight...</p>';
    
    try {
      // ✅ FIX: Verwende window.api (lowercase!) mit getSparkOfTheDay Methode
      if (!window.api || typeof window.api.getSparkOfTheDay !== 'function') {
        throw new Error('API not initialized or getSparkOfTheDay method not available');
      }
      
      console.log('[Nav] Calling api.getSparkOfTheDay()');
      const data = await window.api.getSparkOfTheDay();
      console.log('[Nav] Spark data received:', data);
      
      // ✅ FIX: Bessere Daten-Validierung
      if (!data || !data.spark) {
        throw new Error('Invalid response format - no spark data');
      }
      
      const sparkText = data.spark || 'Heute kein Spotlight verfügbar.';
      const sparkAuthor = data.author || 'hohl.rocks';
      const sparkCategory = data.category || '';
      
      body.innerHTML = `
        <div class="spark-content">
          <div class="spark-icon">✨</div>
          <blockquote class="spark-text">${escapeHtml(sparkText)}</blockquote>
          <div class="spark-meta">
            <span class="spark-author">— ${escapeHtml(sparkAuthor)}</span>
            ${sparkCategory ? `<span class="spark-category">${escapeHtml(sparkCategory)}</span>` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('[Nav] Error loading daily spark:', err);
      
      // ✅ FIX: Bessere Fehlermeldung mit Fallback
      body.innerHTML = `
        <div class="error-message">
          <p style="color: #ef4444;">⚠️ Fehler beim Laden des Spark of the Day</p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 10px;">
            ${escapeHtml(err.message)}
          </p>
          <div class="spark-fallback" style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <p style="font-style: italic; color: rgba(255,255,255,0.8);">
              "Die Kunst des Promptens: Konkret genug für Relevanz, offen genug für Kreativität."
            </p>
            <p style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.5);">
              — hohl.rocks (Offline Fallback)
            </p>
          </div>
        </div>
      `;
    }
  }

  // Escape HTML
  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // Handle navigation clicks
  function handleNavClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    
    console.log('[Nav] Action clicked:', action);
    
    switch (action) {
      case 'tips':
        openOverlay('ov-tips');
        loadTips();
        break;
        
      case 'news':
        openOverlay('ov-news');
        loadNews();
        break;
        
      case 'daily':
        openOverlay('ov-daily');
        loadDaily();
        break;
        
      case 'impressum':
        openOverlay('ov-impressum');
        break;
        
      default:
        console.warn('[Nav] Unknown action:', action);
    }
  }

  // Handle overlay close clicks
  function handleOverlayClick(e) {
    // Close button
    if (e.target.closest('[data-close]')) {
      const overlay = e.target.closest('.overlay');
      closeOverlay(overlay);
      return;
    }
    
    // Backdrop click
    if (e.target.classList.contains('backdrop')) {
      const overlay = e.target.closest('.overlay');
      closeOverlay(overlay);
      return;
    }
  }

  // ESC key handler
  function handleEscKey(e) {
    if (e.key === 'Escape') {
      closeAllOverlays();
    }
  }

  // Initialize
  domReady(() => {
    console.log('[Nav] Navigation handler initialized');
    
    // ✅ FIX: Warte kurz auf API Initialisierung
    setTimeout(() => {
      if (window.api) {
        console.log('[Nav] API available:', typeof window.api);
      } else {
        console.warn('[Nav] window.api not available yet');
      }
    }, 100);
    
    // Navigation clicks
    document.addEventListener('click', handleNavClick);
    
    // Overlay closes
    document.addEventListener('click', handleOverlayClick);
    
    // ESC key
    document.addEventListener('keydown', handleEscKey);
    
    // Load TIPS_DATA if not available
    if (!window.TIPS_DATA) {
      console.warn('[Nav] TIPS_DATA not found, loading from tips-data.js');
      const script = document.createElement('script');
      script.src = '/js/tips-data.js';
      script.onload = () => console.log('[Nav] tips-data.js loaded');
      script.onerror = () => console.error('[Nav] Failed to load tips-data.js');
      document.head.appendChild(script);
    } else {
      console.log('[Nav] TIPS_DATA already loaded');
    }
  });
})();
