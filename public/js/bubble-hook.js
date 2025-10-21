/**
 * bubble-hook.js
 * Opens lightweight learning modal when a bubble-like element is clicked.
 * Doesn't create/animate bubbles; just listens for clicks on common selectors.
 */
(function(){
  function openGuide(){
    // Reuse modal-lite behavior if present
    if(typeof window.openTurboModal === "function"){ window.openTurboModal(); return; }
    // Fallback minimal modal (instant, not 20s)
    const b = document.createElement("div"); b.className = "modal-backdrop";
    const m = document.createElement("div"); m.className = "modal"; m.innerHTML = '<header><h2>KI‑Lern‑Turbo</h2><button class="btn" aria-label="Schließen">×</button></header><p class="lead">Starte mit einem 3‑Schritte‑Plan und einer Mini‑Übung.</p>';
    m.querySelector("button").addEventListener("click", ()=>{ b.remove(); m.remove(); });
    document.body.append(b,m);
  }
  document.addEventListener("click", (e)=>{
    const sel = ".bubble, .ai-bubble, [data-bubble], .orbit-item, .bubble-item";
    const node = e.target.closest(sel);
    if(node){ e.preventDefault(); openGuide(); }
  });
})();
