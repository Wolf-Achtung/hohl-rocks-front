/* -*- coding: utf-8 -*- */
/**
 * Zentrale API-Schicht:
 * - API Base Detection (Query ?api=..., LocalStorage, <meta name="x-api-base">, Fallback /api)
 * - fetchJson() mit Timeout, Retry (bei Netz/Timeout), ETag-Cache (304)
 * - Stabile JSON-Parsing-Fehlerbehandlung
 * - Back-Compat: window.getJson alias
 */
(() => {
  'use strict';

  // ---- Helpers (ohne Abhängigkeit von utils.js) ----
  const LS_KEY = 'hr.api.base';
  function sanitizeBase(u) { return (u || '').replace(/\/+$/,''); }
  function joinUrl(base, path) {
    base = (base || '').replace(/\/+$/, '');
    path = (path || '').replace(/^\/+/, '');
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}/${path}`;
  }
  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return (el && el.content ? el.content.trim() : '');
  }
  function parseQuery() { return Object.fromEntries(new URLSearchParams(location.search).entries()); }
  function getStoredBase(){ try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; } }
  function setStoredBase(v){ try { localStorage.setItem(LS_KEY, v); } catch {} }

  function detectApiBase() {
    const q = parseQuery().api;
    if (q) { const b = sanitizeBase(q); setStoredBase(b); return b; }
    const fromLS = getStoredBase(); if (fromLS) return sanitizeBase(fromLS);
    if (window.__API_BASE__) return sanitizeBase(window.__API_BASE__);
    const meta = getMeta('x-api-base'); if (meta) return sanitizeBase(meta);
    return '/api';
  }

  let API_BASE = detectApiBase();
  function setApiBase(next) {
    const b = sanitizeBase(next);
    if (b) {
      API_BASE = b; setStoredBase(b);
      document.dispatchEvent(new CustomEvent('api:base-changed', { detail: b }));
    }
    return API_BASE;
  }

  // ---- Fetch mit Timeout/Retry/ETag ----
  const etags = new Map();

  async function fetchJson(path, { method='GET', headers={}, body, timeout=10_000, retry=1 } = {}) {
    const url = joinUrl(API_BASE, path);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);

    const hdrs = new Headers({ 'Accept': 'application/json; charset=utf-8' });
    if (body && method !== 'GET') hdrs.set('Content-Type', 'application/json; charset=utf-8');
    if (etags.has(url)) hdrs.set('If-None-Match', etags.get(url));
    for (const [k,v] of Object.entries(headers)) hdrs.set(k, v);

    try {
      const res = await fetch(url, {
        method,
        headers: hdrs,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
        credentials: 'omit',
        cache: 'no-store',
        mode: 'cors'
      });

      clearTimeout(timer);

      if (res.status === 304 && etags.has(url)) {
        return JSON.parse(sessionStorage.getItem(url) || 'null') || { ok: true };
      }

      const et = res.headers.get('ETag'); if (et) etags.set(url, et);

      const txt = await res.text();
      let data = null;
      try { data = txt ? JSON.parse(txt) : null; }
      catch (parseErr) {
        const err = new Error(`Invalid JSON from ${url}`);
        err.cause = parseErr; err.status = res.status;
        throw err;
      }

      if (!res.ok) {
        const err = new Error((data && data.error) || `HTTP ${res.status}`);
        err.status = res.status; err.data = data;
        throw err;
      }

      try { sessionStorage.setItem(url, JSON.stringify(data)); } catch {}
      return data;
    } catch (err) {
      clearTimeout(timer);
      const msg = (err && err.message) ? err.message : String(err);
      if (retry > 0 && (err.name === 'AbortError' || /Network/i.test(msg))) {
        await new Promise(r => setTimeout(r, 150 * (2 - retry)));
        return fetchJson(path, { method, headers, body, timeout, retry: retry - 1 });
      }
      throw err;
    }
  }

  // ---- API Endpunkte ----
  async function self()          { return fetchJson('/self'); }
  async function sparkToday()    { return fetchJson('/spark/today'); }
  async function news(params={}) { const s = new URLSearchParams(params); return fetchJson('/news' + (s.toString()?`?${s}`:'')); }
  async function tips()          { return fetchJson('/tips'); }

  const API = Object.freeze({
    base: () => API_BASE,
    setBase: setApiBase,
    fetchJson, getJson: fetchJson, // Back-Compat
    self, sparkToday, news, tips
  });

  window.API = API;
  window.getJson = fetchJson; // Back-Compat für bestehendes Frontend
})();
