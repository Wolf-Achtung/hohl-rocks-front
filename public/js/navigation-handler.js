/* -*- coding: utf-8 -*- */
/**
 * navigation-handler.js
 * Behandelt alle Navigation-Button Clicks (data-action)
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
    if (!body) return;
    
    body.innerHTML = '<p>Lade Spotlight...</p>';
    
    try {
      if (!window.API?.sparkToday) {
        throw new Error('API not initialized');
      }
      
      const data = await window.API.sparkToday();
      
      const title = data?.title || 'Spotlight';
      const text = data?.text || 'Heute kein Spotlight verfügbar.';
      
      body.innerHTML = `
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      `;
    } catch (err) {
      console.error('[Nav] Error loading daily:', err);
      body.innerHTML = '<p>Fehler beim Laden des Spotlight.</p>';
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
      document.head.appendChild(script);
    }
  });
})();
