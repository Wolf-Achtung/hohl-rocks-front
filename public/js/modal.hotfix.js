// hohl.rocks – modal.hotfix.js (v2.5.2)
// Patcht häufige Fixed/Transform/Overflow-Probleme bei Overlays.
// - Erzwingt Vollflächen-Overlay & zentrierten Dialog (via CSS-Klasse + !important)
// - Entfernt störende `transform`-Eigenschaften in Vorfahrenketten während Modal offen ist
// - ESC schließt, Body-Scroll wird gesperrt

(function(){
  'use strict';

  const MAX_WATCH = 3; // Sekunden
  const TRANSFORM_PROPS = ['transform','-webkit-transform','-ms-transform'];

  function hasTransform(el) {
    const cs = getComputedStyle(el);
    return TRANSFORM_PROPS.some(p => (cs.getPropertyValue(p) || 'none') !== 'none');
  }

  function stripTransforms(el, keep = []) {
    const changed = [];
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      if (!keep.includes(p) && hasTransform(p)) {
        const prev = p.getAttribute('style') || '';
        // Entferne nur transform-Eigenschaften aus dem style-Attribut (überschreibe nicht Klassen)
        const style = prev
          .replace(/(?:^|;)\s*-?webkit-transform\s*:[^;]*;?/gi, '')
          .replace(/(?:^|;)\s*-?ms-transform\s*:[^;]*;?/gi, '')
          .replace(/(?:^|;)\s*transform\s*:[^;]*;?/gi, '');
        p.setAttribute('data-prev-style', prev);
        p.setAttribute('style', style);
        changed.push(p);
      }
      p = p.parentElement;
    }
    return changed;
  }

  function restoreTransforms(list) {
    for (const el of list) {
      const prev = el.getAttribute('data-prev-style');
      if (prev !== null) {
        el.setAttribute('style', prev);
        el.removeAttribute('data-prev-style');
      }
    }
  }

  function lockScroll() {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }
  function unlockScroll() {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  function centerDialog(root) {
    // Falls kein bekannter Dialog-Container vorhanden ist, erzeugen wir keinen neuen,
    // sondern setzen generisch auf vorhandene .dialog oder Inhalt-Container.
    const dialog = root.querySelector('#bubble-modal-content,.dialog,.be-stream') || root;
    if (!dialog) return;
    // Defensive: Stelle sicher, dass das Element sichtbar ist
    dialog.style.display = 'block';
    dialog.setAttribute('role','document');
  }

  function onOpen(root) {
    lockScroll();
    const changed = stripTransforms(root);
    root.setAttribute('data-hotfix-changed', changed.length ? '1' : '0');
    centerDialog(root);
    // ESC schließt
    const onEsc = (ev) => {
      if (ev.key === 'Escape') { onClose(root); }
    };
    root.setAttribute('data-hotfix-esc','1');
    window.addEventListener('keydown', onEsc, { once: true });
    root.addEventListener('click', (e)=>{
      if (e.target === root) onClose(root);
    });
  }

  function onClose(root) {
    try {
      if (root && root.parentElement) {
        root.classList.add('hidden');
        root.style.display = 'none';
      }
    } catch{}
    unlockScroll();
    // Transformen zurücksetzen
    const changed = [];
    const nodes = document.querySelectorAll('[data-prev-style]');
    nodes.forEach(n => changed.push(n));
    restoreTransforms(changed);
  }

  // Beobachte DOM auf Modals/Overlays, die sichtbar werden
  const OBS_TARGETS = ['#bubble-modal','.modal','.overlay','[role="dialog"]','.modal-root'];
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      const nodes = [];
      OBS_TARGETS.forEach(sel => document.querySelectorAll(sel).forEach(n => nodes.push(n)));
      for (const node of nodes) {
        const isVisible = node && node.offsetParent !== null || (getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.clientHeight > 0);
        if (isVisible && !node.hasAttribute('data-hotfix-active')) {
          node.setAttribute('data-hotfix-active','1');
          onOpen(node);
        }
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style','class'] });

  // Sicherheit: Anfangs einmalig prüfen (falls Modal sofort geöffnet wurde)
  setTimeout(() => {
    OBS_TARGETS.forEach(sel => {
      document.querySelectorAll(sel).forEach(node => {
        const isVisible = node && (node.offsetParent !== null || (getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.clientHeight > 0));
        if (isVisible && !node.hasAttribute('data-hotfix-active')) {
          node.setAttribute('data-hotfix-active','1');
          onOpen(node);
        }
      });
    });
  }, 50);

  // Nach MAX_WATCH Sekunden schalten wir den aggressiven Observer auf "leicht"
  setTimeout(() => {
    obs.disconnect();
    // Leichter Poll alle 500ms
    setInterval(() => {
      OBS_TARGETS.forEach(sel => {
        document.querySelectorAll(sel).forEach(node => {
          const isVisible = node && (node.offsetParent !== null || (getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.clientHeight > 0));
          if (isVisible && !node.hasAttribute('data-hotfix-active')) {
            node.setAttribute('data-hotfix-active','1');
            onOpen(node);
          }
        });
      });
    }, 500);
  }, MAX_WATCH * 1000);
})();
