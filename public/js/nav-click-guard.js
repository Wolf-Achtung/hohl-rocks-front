/**
 * nav-click-guard.js
 * Fixes non-clickable top navigation by ensuring background layers don't capture pointer events
 * and the nav sits at a higher z-index.
 *
 * Drop-in script: safe to include anywhere after <body>. No external deps.
 */
(function () {
  const STYLE_ID = "nav-click-guard-styles";
  const CSS = `
  /* Ensure nav is on top and clickable */
  header, header nav, .top-nav, nav[role="navigation"] {
    position: relative;
    z-index: 9999 !important;
    pointer-events: auto !important;
  }
  /* Background video and visual overlays should be click-through */
  video, .bg-video, .bg, .video-bg, #video-bg,
  .vignette, .overlay, .gradient, .gradient-overlay,
  .backdrop, .mask, .noise, .video-overlay {
    pointer-events: none !important;
  }
  /* Generic full-screen layers often used for visual effects */
  .fullscreen, .full-bleed, .hero::before, .hero::after {
    pointer-events: none !important;
  }`;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Defensive sweep: demote likely blockers above the nav
  function sweepBlockers() {
    const blockers = Array.from(document.querySelectorAll(
      [
        "video", ".bg-video", ".bg", ".video-bg", "#video-bg",
        ".vignette", ".overlay", ".gradient", ".gradient-overlay",
        ".backdrop", ".mask", ".noise", ".video-overlay",
        ".fullscreen", ".full-bleed"
      ].join(",")
    ));
    blockers.forEach(el => {
      const ds = getComputedStyle(el);
      // Only adjust if element spans a large portion of the viewport or is fixed
      const rect = el.getBoundingClientRect();
      const coversViewport = rect.width > innerWidth * 0.7 && rect.height > innerHeight * 0.3;
      const isFixed = ds.position === "fixed" || ds.position === "sticky";
      if (coversViewport || isFixed) {
        // Respect explicit opt-out
        if (el.hasAttribute("data-allow-interact")) return;
        el.style.pointerEvents = "none";
      }
    });
    // Promote nav/header if needed
    const navs = document.querySelectorAll("header, header nav, .top-nav, nav[role='navigation']");
    navs.forEach(n => {
      n.style.zIndex = "9999";
      n.style.pointerEvents = "auto";
      if (getComputedStyle(n).position === "static") {
        n.style.position = "relative";
      }
    });
  }

  function init() {
    injectStyle();
    sweepBlockers();
    // Watch DOM for late-added overlays
    const mo = new MutationObserver(() => sweepBlockers());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    // Also re-run after resize (layout shifts may move elements)
    window.addEventListener("resize", () => requestAnimationFrame(sweepBlockers), { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
