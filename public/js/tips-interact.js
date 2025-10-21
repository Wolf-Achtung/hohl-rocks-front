/**
 * tips-interact.js
 * - Makes KI-Tipps cards interactive.
 * - On click 'Öffnen', shows Problem/Situation + Lösung + copyable Prompt.
 * - Provides a global 'showTipModal(idOrTitle)' function for manual calls.
 */
(function(){
  function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function $(sel, root=document){ return root.querySelector(sel); }
  function h(tag, attrs={}, children=[]){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(v==null) return;
      if(k==="class") el.className = v;
      else if(k==="html") el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    for(const c of [].concat(children)) if(c!=null){
      if(typeof c === "string") el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    }
    return el;
  }
  function getTipByTitleOrId(txt){
    if(!window.TIPS_DATA) return null;
    const norm = (txt||"").trim().toLowerCase();
    return window.TIPS_DATA.find(t => t.id===txt || (t.title||"").trim().toLowerCase()===norm) || null;
  }
  function buildModal(tip){
    const backdrop = h("div", {class:"modal-backdrop", role:"presentation"});
    const modal = h("div", {class:"modal", role:"dialog", "aria-modal":"true"});
    const header = h("header", {}, [
      h("h2", {html: tip.title}),
      h("button", {class:"btn", "aria-label":"Schließen", title:"Schließen"}, ["×"])
    ]);
    const lead = h("p", {class:"lead"}, [`Problem/Situation: `, tip.problem || "—"]);
    const body = h("div", {class:"body"}, [
      h("p", {}, [h("strong", {}, ["Lösung mit KI: "]), tip.solution || "—"]),
      h("div", {class:"copy-box", "data-tip-id":tip.id}, [
        h("button", {class:"btn copy", "data-action":"copy-prompt", title:"Prompt kopieren"}, ["Link kopieren"]),
        h("pre", {}, [tip.prompt || ""])
      ])
    ]);
    const actions = h("div", {class:"actions"}, [
      h("button", {class:"btn secondary", "data-action":"close"}, ["Schließen"])
    ]);
    modal.append(header, lead, body, actions);
    function close(){ backdrop.remove(); modal.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e){ if(e.key==="Escape") close(); }
    header.querySelector("button").addEventListener("click", close);
    actions.querySelector("[data-action='close']").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.append(backdrop, modal);
    // Focus trap start
    setTimeout(()=> { modal.querySelector("button")?.focus(); }, 0);
    // Copy handler
    modal.addEventListener("click", (ev)=>{
      const btn = ev.target.closest("[data-action='copy-prompt']");
      if(!btn) return;
      const text = tip.prompt || "";
      navigator.clipboard?.writeText(text).then(()=>{
        btn.textContent = "Kopiert ✓";
        setTimeout(()=> btn.textContent="Link kopieren", 1200);
      }).catch(()=>{
        // fallback
        const ta = h("textarea", {style:"position:fixed;left:-9999px;top:-9999px;"}); 
        ta.value = text; document.body.appendChild(ta); ta.select();
        try{ document.execCommand("copy"); btn.textContent="Kopiert ✓"; }catch{ btn.textContent="Kopieren fehlgeschlagen"; }
        ta.remove(); setTimeout(()=> btn.textContent="Link kopieren", 1400);
      });
    });
  }
  function showTipModal(idOrTitle){
    const tip = getTipByTitleOrId(idOrTitle);
    if(!tip){ console.warn("Tip nicht gefunden:", idOrTitle); return; }
    buildModal(tip);
  }
  // Expose for other modules
  window.showTipModal = showTipModal;

  function findTipTitleFromCard(el){
    // Heuristics: first heading in card
    const hEl = el.querySelector("h3,h2,h4,.title,[data-title]");
    return hEl?.textContent?.trim() || el.getAttribute("data-title") || "";
    }

  function onGlobalClick(e){
    // Open via 'Öffnen' buttons in tips area
    const openBtn = e.target.closest("button,a");
    if(openBtn && /^(öffnen)$/i.test((openBtn.textContent||'').trim())){
      const card = openBtn.closest(".tip-card, .card, li, article, section");
      if(card){
        const title = findTipTitleFromCard(card);
        if(title) { e.preventDefault(); showTipModal(title); return; }
      }
    }
  }
  document.addEventListener("click", onGlobalClick);
})();
