/* -*- coding: utf-8 -*- */
/**
 * Kleine, solide Utils – bewusst ohne Framework.
 * UTF‑8 safe, keine Browser-APIs überschrieben.
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

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function escapeHtml(s) {
    if (s == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s).replace(/[&<>"']/g, (ch) => map[ch]);
  }

  function setText(el, txt) { if (el) el.textContent = (txt ?? ''); }
  function setHTML(el, html) { if (el) el.innerHTML = (html ?? ''); }

  function joinUrl(base, path) {
    base = (base || '').replace(/\/+$/, '');
    path = (path || '').replace(/^\/+/, '');
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}/${path}`;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Export
  window.$u = Object.freeze({
    domReady, qs, qsa, escapeHtml, setText, setHTML, joinUrl, prefersReducedMotion
  });
})();
