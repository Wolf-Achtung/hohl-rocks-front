/* -*- coding: utf-8 -*- */
/**
 * App-Bootstrap: Self-Check, UI-Flags setzen, Events feuern.
 * Robuste Fallbacks, falls utils.js nicht vorher geladen wurde.
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

  domReady(async () => {
    // API-Basis ggf. aus <meta name="x-api-base"> übernehmen
    const meta = document.querySelector('meta[name="x-api-base"]');
    if (meta && meta.content && window.API?.setBase) {
      window.API.setBase(meta.content);
    }

    // Self-Check
    try {
      if (!window.API?.self) throw new Error('API not initialized');
      const info = await window.API.self();

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
    } catch (err) {
      document.documentElement.dataset.apiOk = '0';
      console.warn('[API] self-check failed:', err?.message || err);
      document.dispatchEvent(new CustomEvent('api:error', { detail: err }));
    }
  });
})();
