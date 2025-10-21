/**
 * modal-lite.js
 * Intercepts bubble clicks to show a lightweight modal:
 * - Text: "KI-Lern-Turbo wird aktiviert..." for ~20s
 * - Then display a ready-made instruction guide (no API needed for now)
 * Overlay keeps background visible (light shading).
 */
(function(){
  const WAIT_MS = 20000; // 20s as requested
  function $(sel, root=document){ return root.querySelector(sel); }
  function h(tag, attrs={}, kids=[]){
    const el = document.createElement(tag);
    for(const [k,v] of Object.entries(attrs)){ 
      if(k==="class") el.className = v;
      else if(k==="html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for(const c of [].concat(kids)) el.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
    return el;
  }
  function build(backdropOnly=false){
    const b = h("div", {class:"modal-backdrop", "data-role":"turbo-backdrop"});
    const m = h("div", {class:"modal", role:"dialog", "aria-modal":"true", "data-role":"turbo-modal"});
    return {b,m};
  }
  function guideHTML(){
    return (
`<h3>KI-Lern-Turbo (10-Minuten-Plan)</h3>
<ol>
  <li>Wähle ein kleines Ziel: „In 10 Minuten X verstehen“.</li>
  <li>Nutze die Rolle: <code>„Du bist mein Mentor für [Thema]“</code>.</li>
  <li>Bitte um einen 3‑Schritte‑Plan + Beispiel.</li>
  <li>Starte, dann frage gezielt nach: „Erkläre Schritt 2 mit Beispiel“. </li>
  <li>Schließe mit einer Mini‑Übung + Lösungs‑Check.</li>
</ol>
<div class="copy-box">
  <button class="btn copy" data-action="copy">Prompt kopieren</button>
  <pre>Du bist mein Mentor für [Thema].
Ziel: In 10 Minuten die Grundlagen verstehen.
Bitte gib mir:
1) 3‑Schritte‑Plan,
2) 1 greifbares Beispiel,
3) 1 Mini‑Übung mit Lösung,
4) 3 typische Fehler und wie ich sie vermeide.
Stil: klar, knapp, ohne Jargon.</pre>
</div>`
    );
  }
  function openTurbo(){
    const {b,m} = build();
    const close = ()=>{ b.remove(); m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e)=>{ if(e.key==="Escape") close(); };

    m.innerHTML = `<header><h2>Bitte warten…</h2><button class="btn" aria-label="Schließen">×</button></header>
    <p class="lead">🤖 KI‑Lern‑Turbo wird aktiviert...</p>`;

    m.querySelector("button").addEventListener("click", close);
    b.addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    document.body.append(b,m);
    setTimeout(()=>{
      m.innerHTML = `<header><h2>Fertig ✅</h2><button class="btn" aria-label="Schließen">×</button></header>
      <div class="lead">Hier ist deine kompakte Anleitung:</div>
      ${guideHTML()}
      <div class="actions"><button class="btn" data-action="close">Schließen</button></div>`;
      m.querySelector("button").addEventListener("click", close);
      m.querySelector("[data-action='close']").addEventListener("click", close);
      // copy handler
      m.addEventListener("click", (ev)=>{
        const c = ev.target.closest("[data-action='copy']");
        if(!c) return;
        const text = m.querySelector("pre")?.textContent || "";
        navigator.clipboard?.writeText(text).then(()=>{ c.textContent="Kopiert ✓"; setTimeout(()=> c.textContent="Prompt kopieren", 1200); });
      });
    }, WAIT_MS);
  }

  // Intercept bubble clicks (generic selectors)
  document.addEventListener("click", (e)=>{
    const bubble = e.target.closest(".bubble, .ai-bubble, [data-bubble], .orbit-item");
    if(!bubble) return;
    e.preventDefault();
    openTurbo();
  });
})();
