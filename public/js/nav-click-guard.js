/**
 * nav-click-guard.js v2
 * Ensures top navigation is clickable without breaking in-app overlays/dialogs.
 * - Only background visuals are click-through.
 * - Overlays with role=dialog or inside .overlay remain interactive.
 */
(function () {
  const STYLE_ID = "nav-click-guard-styles-v2";
  const CSS = `
  header, header nav, .top-nav, nav[role="navigation"] {
    position: relative;
    z-index: 9999 !important;
    pointer-events: auto !important;
  }
  /* Click-through for background visuals ONLY */
  video.bg, video#video-bg, .bg-video, .video-bg, .hero-video,
  .visual-overlay, .vignette-visual, .gradient-visual, .noise-visual {
    pointer-events: none !important;
  }
  /* DO NOT touch functional overlays/dialogs */
  .overlay, [role="dialog"], .modal, .panel { 
    pointer-events: auto !important;
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
