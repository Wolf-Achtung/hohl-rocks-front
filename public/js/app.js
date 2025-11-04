// public/js/app.js  — robuste Version (URL-Fixes + Guards)
import { $, el, fmtUrl, toast, copy, storage } from './utils.js';
import { api, selfCheck, streamRun, getJson } from './api.js';
import { initBubbleEngine } from './bubbleEngine.js';

/* ---------- Helpers ---------- */
// Macht aus beliebigen Eingaben eine brauchbare absolute URL + Hostname.
// Liefert { href: string|null, host: string }.
function normalizeLink(raw) {
  const fallbackHost = 'Quelle';
  if (!raw || typeof raw !== 'string') return { href: null, host: fallbackHost };
  let s = raw.trim();
  // Schema-relative -> https:
  if (/^\/\//.test(s)) s = 'https:' + s;
  // Nur Domain (ohne Protokoll, ohne Slash)
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(s) && !s.startsWith('/')) s = 'https://' + s;
  try {
    const u = new URL(s, location.origin);
    return { href: u.href, host: u.hostname.replace(/^www\./, '') || fallbackHost };
  } catch {
    // Versuche noch grob den Host zu extrahieren
    const m = s.match(/^(?:https?:)?\/\/([^/]+)/i) || s.match(/^([^/]+)(?:\/|$)/);
    return { href: null, host: (m ? m[1] : fallbackHost).replace(/^www\./, '') };
  }
}

/* ---------- EU toggle ---------- */
const pref = storage('prefs');
const prefs = pref.get() || { eu: false, lastNewsPrefetch: 0, lastTipsPrefetch: 0, layout: 'drift' };
const btnEU = $('#btn-eu');
function renderEU() {
  if (!btnEU) return;
  btnEU.setAttribute('aria-pressed', prefs.eu ? 'true' : 'false');
  btnEU.textContent = 'EU: ' + (prefs.eu ? 'an' : 'aus');
}
btnEU?.addEventListener('click', () => {
  prefs.eu = !prefs.eu;
  pref.set(prefs);
  renderEU();
  toast('EU‑only: ' + (prefs.eu ? 'an' : 'aus'));
});
renderEU();

/* ---------- Overlays ---------- */
const lastFocus = new Map();
function firstFocusable(root) {
  return root.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
}
function openOverlay(id) {
  const ov = $(id);
  if (!ov) return;
  lastFocus.set(id, document.activeElement);
  ov.dataset.open = '1';
  ov.setAttribute('aria-hidden', 'false');
  (ov.querySelector('.close') || firstFocusable(ov) || document.body)?.focus();
  const esc = (e) => {
    if (e.key === 'Escape') {
      closeOverlay(id);
      window.removeEventListener('keydown', esc);
    }
  };
  window.addEventListener('keydown', esc);
  ov.addEventListener('keydown', trapTab);
}
function closeOverlay(id) {
  const ov = $(id);
  if (!ov) return;
  ov.removeEventListener('keydown', trapTab);
  (ov.querySelector(':focus')?.blur?.());
  delete ov.dataset.open;
  ov.setAttribute('aria-hidden', 'true');
  (lastFocus.get(id) || document.querySelector('.site-nav .nav-btn'))?.focus?.();
}
function trapTab(e) {
  if (e.key !== 'Tab') return;
  const root = e.currentTarget;
  const f = Array.from(
    root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
  ).filter((el) => !el.hasAttribute('disabled'));
  if (!f.length) return;
  const first = f[0],
    last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}
document.addEventListener('click', (e) => {
  if (e.target?.matches('[data-close]')) {
    const p = e.target.closest('.overlay');
    if (p) closeOverlay('#' + p.id);
  }
  if (e.target?.matches('.overlay .backdrop')) {
    const p = e.target.closest('.overlay');
    if (p) closeOverlay('#' + p.id);
  }
});

/* ---------- NAV ---------- */
function onAction(action) {
  switch (action) {
    case 'tips':
      openOverlay('#ov-tips'); // Falls du Panels nutzt, kannst du hier auch #panel-tips einblenden.
      loadTips();
      break;
    case 'news':
      openOverlay('#ov-news');
      loadNews();
      break;
    case 'prompts':
      openOverlay('#ov-prompts');
      renderPrompts();
      break;
    case 'impressum':
      openOverlay('#ov-impressum');
      renderImpressum();
      break;
    case 'daily':
      openOverlay('#ov-daily');
      loadDaily();
      break;
    case 'projekte':
      toast('Projekte folgen');
      break;
    case 'settings':
      toast('Einstellungen folgen');
      break;
    case 'klang':
      if (window.AudioController) {
        try {
          const on = window.AudioController.toggle();
          toast(on ? 'Sound: an' : 'Sound: aus');
        } catch {
          toast('Audio-Fehler');
        }
      } else toast('Audio-Modul nicht geladen');
      break;
    case 'locale':
      toast('Sprachumschaltung folgt');
      break;
  }
}
document.addEventListener('click', (e) => {
  const act = e.target?.dataset?.action;
  if (act) {
    e.preventDefault();
    onAction(act);
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    onAction('tips');
  }
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    onAction('news');
  }
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    onAction('prompts');
  }
  if (e.key === 'o' || e.key === 'O') {
    e.preventDefault();
    prefs.layout = prefs.layout === 'drift' ? 'orbit' : 'drift';
    pref.set(prefs);
    window.dispatchEvent(new CustomEvent('layout:toggle', { detail: { layout: prefs.layout } }));
    toast('Layout: ' + (prefs.layout === 'orbit' ? 'Orbit' : 'Drift'));
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay[data-open="1"]').forEach((el) => closeOverlay('#' + el.id));
  }
});

/* ---------- Tags ---------- */
const tagApi = $('#tag-api'),
  tagNews = $('#tag-news'),
  tagTips = $('#tag-tips');
function mark(el, ok) {
  if (!el) return;
  el.className = 'tag ' + (ok ? 'ok' : '');
  el.textContent = (el.textContent.split(' ')[0] || '') + ' ' + (ok ? '✓' : '');
}

/* ---------- KI‑Tipps ---------- */
const tipsGrid = $('#tips-grid'); // in deiner alten index.html fehlt dieses Element – deshalb hatte es vorher gekracht. :contentReference[oaicite:8]{index=8}
async function loadTips() {
  try {
    const j = await api.tips();
    const items = Array.isArray(j?.items) ? j.items : [];
    if (!tipsGrid) return; // Guard für alte HTML-Struktur
    tipsGrid.innerHTML = '';
    if (!items.length) {
      tipsGrid.innerHTML = '<p>Keine Ergebnisse.</p>';
      mark(tagTips, true);
      return;
    }
    for (const it of items.slice(0, 20)) {
      const { href, host } = normalizeLink(it.url || it.link || it.href);
      const aAttrs = href
        ? { href, target: '_blank', rel: 'noopener noreferrer' }
        : { href: '#', 'aria-disabled': 'true' };
      const copyAttr = href ? href : (it.url || '');
      const card = el(
        'article',
        { class: 'tip' },
        el('h3', {}, it.title || host || 'Tipp'),
        el('div', { class: 'meta' }, el('span', { class: 'why' }, it.why || 'Praxis'), el('span', { class: 'host' }, host || '')),
        el('div', { class: 'actions' }, el('a', aAttrs, 'Öffnen'), el('button', { type: 'button', 'data-copy': copyAttr }, 'Link kopieren'))
      );
      tipsGrid.append(card);
    }
    mark(tagTips, true);
  } catch (e) {
    console.error(e);
    toast('Tipps-Fehler');
    mark(tagTips, false);
  }
}

/* ---------- KI‑News ---------- */
const ulNews = $('#news');
async function loadNews(searchTerm = '') {
  try {
    const j = searchTerm ? await api.searchNews(searchTerm) : await api.news();
    const items = Array.isArray(j?.items) ? j.items : [];
    if (!ulNews) return; // Guard
    ulNews.innerHTML = '';
    if (!items.length) {
      ulNews.append(el('li', {}, 'Keine Ergebnisse.'));
      mark(tagNews, true);
      return;
    }
    for (const it of items.slice(0, 20)) {
      const { href, host } = normalizeLink(it.url || it.link || it.href);
      const a = el(
        'a',
        { href: href || '#', target: href ? '_blank' : null, rel: href ? 'noopener noreferrer' : null },
        it.title || href || 'Link'
      );
      a.addEventListener('click', () => href && api.metrics('news_click', { url: href }));
      ulNews.append(el('li', {}, a, el('div', {}, el('small', { class: 'small' }, host || ''))));
    }
    mark(tagNews, true);
  } catch (e) {
    console.error(e);
    toast('News-Fehler');
    mark(tagNews, false);
  }
}
// Live-Suche
const newsSearchBox = document.getElementById('news-search');
newsSearchBox?.addEventListener('input', () => {
  const q = newsSearchBox.value.trim();
  q ? loadNews(q) : loadNews();
});

/* ---------- Prompt‑Galerie ---------- */
let PROMPTS = [];
async function loadPrompts() {
  if (PROMPTS.length) return PROMPTS;
  const r = await fetch('./data/prompts.json', { cache: 'no-store' });
  PROMPTS = r.ok ? await r.json() : [];
  return PROMPTS;
}
const grid = $('#prompt-grid');
const searchBox = $('#prompt-search');
let currentFilter = 'Alle';
function renderPrompts() {
  loadPrompts().then(() => {
    if (!grid) return;
    const q = (searchBox?.value || '').toLowerCase().trim();
    const list = PROMPTS.filter(
      (p) =>
        (currentFilter === 'Alle' || (p.tags || []).includes(currentFilter)) &&
        (p.question.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q))
    );
    grid.innerHTML = '';
    for (const it of list) {
      const card = el(
        'div',
        { class: 'card' },
        el('h3', {}, it.question),
        el('p', {}, it.desc || ''),
        el(
          'div',
          { class: 'actions' },
          el('button', { type: 'button', 'data-copy': it.prompt }, 'Kopieren'),
          el('button', { type: 'button', 'data-run': it.prompt }, 'Im Run öffnen')
        )
      );
      grid.append(card);
    }
  });
}
document.addEventListener('click', async (e) => {
  const dc = e.target?.dataset?.copy;
  if (dc) {
    if (dc === 'modal') {
      const p =
        document.querySelector('#ov-run #run-input')?.value?.trim() ||
        document.querySelector('#modal .prompt-text')?.innerText?.trim();
      if (p) {
        await copy(p);
        toast('Prompt kopiert');
      }
    } else {
      await copy(dc);
      toast('Kopiert');
    }
  }
  const run = e.target?.dataset?.run;
  if (run) {
    openOverlay('#ov-run');
    const box = $('#run-input');
    if (box) {
      box.value = run;
      box.focus();
    }
    api.metrics('prompt_run', {});
  }
});
document.addEventListener('click', (e) => {
  const f = e.target?.dataset?.filter;
  if (!f) return;
  currentFilter = f;
  document.querySelectorAll('.tools .chip').forEach((ch) => ch.toggleAttribute('data-active', ch.dataset.filter === f));
  renderPrompts();
});
searchBox?.addEventListener('input', () => renderPrompts());

/* ---------- Impressum ---------- */
const IMPRESSUM = `Rechtliches & Transparenz
Impressum
Verantwortlich für den Inhalt:
Wolf Hohl
Greifswalder Str. 224a
10405 Berlin

E-Mail schreiben
Haftungsausschluss:
Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.

Urheberrecht:
Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.

Hinweis zum EU AI Act:
Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.

Datenschutzerklärung
Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.

Kontakt mit mir
Wenn Sie per Formular oder E-Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.

Cookies
Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.

Ihre Rechte laut DSGVO
Auskunft, Berichtigung oder Löschung Ihrer Daten
Datenübertragbarkeit
Widerruf erteilter Einwilligungen
Beschwerde bei der Datenschutzbehörde`;
function renderImpressum() {
  const elHost = $('#impressum-body');
  if (!elHost) return;
  elHost.innerHTML = IMPRESSUM.split('\n\n')
    .map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
    .join('');
}

/* ---------- Spotlight (optional) ---------- */
const dailyBody = $('#daily-body');
const esc = (s) => (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function loadDaily() {
  if (!dailyBody) return;
  try {
    const base = document.querySelector('meta[name="x-api-base"]')?.content || '/api';
    const res = await fetch(base.replace(/\/$/, '') + '/spark/today', { cache: 'no-store' });
    if (!res.ok) {
      dailyBody.innerHTML = '<p>Heute kein Spotlight verfügbar.</p>';
      return;
    }
    const data = await res.json().catch(() => null);
    if (!data) {
      dailyBody.innerHTML = '<p>Heute kein Spotlight verfügbar.</p>';
      return;
    }
    dailyBody.innerHTML = `<h3>${esc(data.title || 'Today’s Spark')}</h3>${data.text ? `<p>${esc(data.text)}</p>` : ''}`;
  } catch (e) {
    dailyBody.innerHTML = '<p>Offline – später erneut versuchen.</p>';
  }
}

/* ---------- Init ---------- */
(async function init() {
  const ok = await selfCheck();
  if (tagApi) mark(tagApi, ok);
  // Prefetch 1× täglich (SWR)
  const now = Date.now();
  if (!prefs.lastNewsPrefetch || now - prefs.lastNewsPrefetch > 23 * 60 * 60 * 1000) {
    prefs.lastNewsPrefetch = now;
    pref.set(prefs);
    try {
      await getJson('/news?prefetch=1');
    } catch {}
  }
  if (!prefs.lastTipsPrefetch || now - prefs.lastTipsPrefetch > 23 * 60 * 60 * 1000) {
    prefs.lastTipsPrefetch = now;
    pref.set(prefs);
    try {
      await getJson('/tips?prefetch=1');
    } catch {}
  }
  // Bubbles (Prompts-Galerie)
  try {
    const r = await fetch('./data/prompts.json', { cache: 'no-store' });
    const items = r.ok ? await r.json() : [];
    await initBubbleEngine(items);
  } catch (err) {
    console.warn('bubbles init failed', err);
  }
})();

// Aufräumen alter Overlay-Zustände nach initialem Load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.overlay[data-open]').forEach((el) => {
    el.removeAttribute('data-open');
    el.setAttribute('aria-hidden', 'true');
  });
});
