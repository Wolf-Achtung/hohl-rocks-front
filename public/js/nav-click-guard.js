/**
 * nav-click-guard.js
 * Ensures nav is clickable above background layers.
 */
(function () {
  const STYLE_ID = "nav-click-guard-styles";
  const CSS = `
  header, header nav, .top-nav, nav[role="navigation"] {
    position: relative;
    z-index: 9999 !important;
    pointer-events: auto !important;
  }
  video, .bg-video, .bg, .video-bg, #video-bg,
  .vignette, .overlay, .gradient, .gradient-overlay,
  .backdrop, .mask, .noise, .video-overlay {
    pointer-events: none !important;
  }`;
  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID; s.textContent = CSS; document.head.appendChild(s);
  }
  function init(){ injectStyle(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
})();
