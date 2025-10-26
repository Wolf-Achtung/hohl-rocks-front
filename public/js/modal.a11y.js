// public/js/modal.a11y.js
//
// This utility patches aria-hidden attributes on modal and tour overlays.  Some themes or third party scripts
// set `aria-hidden="true"` on these containers by default.  When a modal opens and focus moves inside,
// screen readers and browsers may warn if the ancestor remains hidden.  The fixModalAria function observes
// attribute changes and ensures that any open dialog has aria-hidden removed.  It runs immediately on load.

export function fixModalAria() {
  const selectors = ['#modal', '.modal', '.tour'];
  const targets = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
  targets.forEach(el => {
    // Remove aria-hidden on load if the element is already open
    if (el.dataset.open) {
      el.removeAttribute('aria-hidden');
    }
  });
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'data-open') {
        const el = m.target;
        if (el.dataset.open) {
          el.removeAttribute('aria-hidden');
        }
      }
    }
  });
  targets.forEach(el => observer.observe(el, { attributes: true }));
}

// Invoke immediately so that the patch is active as soon as the module is imported.
fixModalAria();