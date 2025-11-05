/* -*- coding: utf-8 -*- */
/**
 * bubbles-init.js
 * Initialisiert die interaktiven Prompt-Bubbles aus bubble-content.json
 */
(async () => {
  'use strict';

  function domReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      queueMicrotask(fn);
    }
  }

  // Load bubble-content.json
  async function loadBubbleConfig() {
    try {
      const response = await fetch('/data/bubble-content.json');
      if (!response.ok) {
        console.warn('[Bubbles] Failed to load bubble-content.json, using fallback');
        return null;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.warn('[Bubbles] Error loading bubbles:', err);
      return null;
    }
  }

  // Convert bubble-content.json format to bubbleEngine format
  function convertBubblesData(data) {
    if (!data || !data.bubbles) return [];
    
    return data.bubbles
      .filter(b => b.enabled !== false)
      .map(bubble => ({
        id: bubble.id,
        title: bubble.text || bubble.title,
        desc: bubble.description || bubble.desc || '',
        run: bubble.prompt || bubble.userPrompt || '',
        size: bubble.maxSize || bubble.minSize || 140
      }));
  }

  // Initialize bubbles
  async function initBubbles() {
    // Check if bubbleEngine is available
    if (!window.initBubbleEngine) {
      console.warn('[Bubbles] bubbleEngine.js not loaded');
      return;
    }

    console.log('[Bubbles] Initializing interactive prompt bubbles...');

    // Load configuration
    const config = await loadBubbleConfig();
    const bubbles = config ? convertBubblesData(config) : [];

    if (bubbles.length === 0) {
      console.warn('[Bubbles] No bubbles to display');
      return;
    }

    console.log('[Bubbles] Loaded', bubbles.length, 'bubbles');

    // Initialize with default options
    const options = {
      container: '#bubbles',
      labels: '#bubble-labels'
    };

    try {
      window.initBubbleEngine(bubbles, options);
      console.log('[Bubbles] ✓ Bubbles initialized successfully');
      
      // Dispatch event for other modules
      document.dispatchEvent(new CustomEvent('bubbles:ready', { 
        detail: { count: bubbles.length } 
      }));
    } catch (err) {
      console.error('[Bubbles] Failed to initialize:', err);
    }
  }

  // Handle bubble clicks
  function handleBubbleClick(e) {
    const bubble = e.target.closest('[data-run]');
    if (!bubble) return;

    e.preventDefault();
    
    const prompt = bubble.dataset.run;
    const title = bubble.querySelector('.t')?.textContent || 'Prompt';
    
    console.log('[Bubbles] Clicked:', title);
    
    // Open prompt modal (if available)
    if (window.openPromptModal) {
      window.openPromptModal(title, prompt);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard?.writeText(prompt).then(() => {
        showToast('Prompt kopiert! 📋');
      }).catch(() => {
        console.log('[Bubbles] Prompt:', prompt);
        alert('Prompt: ' + prompt);
      });
    }
  }

  // Simple toast notification
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
      console.log('[Bubbles]', message);
      return;
    }
    
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  // Initialize on DOM ready
  domReady(async () => {
    // Wait a bit for other scripts to load
    setTimeout(async () => {
      await initBubbles();
      
      // Add click handler
      document.addEventListener('click', handleBubbleClick);
    }, 500);
  });

  // Export for console debugging
  window.reloadBubbles = initBubbles;
})();
