// modal.a11y.js – ensures aria-hidden=false while modal is open
export function fixModalAria() {
  const sel = '.modal[role="dialog"], #bubble-modal[role="dialog"]';
  const setOpen = (el) => el.setAttribute('aria-hidden','false');
  const setClose = (el) => el.setAttribute('aria-hidden','true');

  const isVisible = (el) => !!el && (
    el.offsetParent !== null ||
    (getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden')
  );

  const sync = () => {
    document.querySelectorAll(sel).forEach(el => {
      if (isVisible(el)) setOpen(el); else setClose(el);
    });
  };

  const obs = new MutationObserver(sync);
  obs.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class','aria-hidden'] });

  // Initial pass
  setTimeout(sync, 0);
}
