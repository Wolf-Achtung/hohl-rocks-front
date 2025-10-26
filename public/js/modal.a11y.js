// modal.a11y.js – ensures aria-hidden=false while modal is open
export function fixModalAria() {
  const sel = '.modal[role="dialog"], #bubble-modal[role="dialog"]';
  const setOpen = (el) => el.setAttribute('aria-hidden','false');
  const setClose = (el) => el.setAttribute('aria-hidden','true');

  const obs = new MutationObserver(() => {
    document.querySelectorAll(sel).forEach(el => {
      const visible = el && (el.offsetParent !== null || (getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'));
      if (visible) setOpen(el);
    });
  });
  obs.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class','aria-hidden'] });

  // Initial pass
  setTimeout(() => {
    document.querySelectorAll(sel).forEach(el => {
      const visible = el && (el.offsetParent !== null || (getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'));
      if (visible) setOpen(el); else setClose(el);
    });
  }, 0);
}
