/* -*- coding: utf-8 -*- */
/**
 * "Spark" Bubble: lädt /api/spark/today und rendert Titel + Text.
 * Fällt ohne Fehler sauber zurück („Heute kein Spotlight verfügbar.“).
 */
(() => {
  'use strict';

  // Fallbacks, falls utils.js später geladen wird
  const setText = (el, txt) => { if (el) el.textContent = (txt ?? ''); };
  function domReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      queueMicrotask(fn);
    }
  }

  function findContainer() {
    return document.querySelector('[data-spark]') ||
           document.querySelector('#spark-bubble') ||
           document.querySelector('.spark-bubble') ||
           document;
  }

  function renderSpark(data) {
    const container = findContainer();
    const titleEl = container.querySelector('[data-spark-title], #spark-title, .spark-title') || container;
    const textEl  = container.querySelector('[data-spark-text],  #spark-text,  .spark-text')  || container;

    const title = data?.title || 'Spotlight';
    const text  = data?.text ?? 'Heute kein Spotlight verfügbar.';

    setText(titleEl, title);
    setText(textEl, text);

    if (container && container !== document) {
      container.dataset.loaded = '1';
    }
  }

  domReady(async () => {
    try {
      if (!window.API?.sparkToday) throw new Error('API not initialized');
      const data = await window.API.sparkToday();
      renderSpark(data);
    } catch (err) {
      console.warn('[Spark] failed:', err?.message || err);
      renderSpark(null);
    }
  });
})();
