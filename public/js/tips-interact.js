/**
 * tips-interact.js v2
 * - Reliable handling of KI-Tipps overlay:
 *   - Buttons 'Öffnen' öffnen Modal mit Problem/Situation + Lösung + Prompt (copy).
 *   - 'Link kopieren' kopiert Prompt-Text sofort (Fallback inklusive).
 */
(function(){
  const root = document;

  function $$(sel, ctx=root){ return Array.from(ctx.querySelectorAll(sel)); }
  function $(sel, ctx=root){ return ctx.querySelector(sel); }
  function h(tag, attrs={}, children=[]){
    const el = root.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})){
      if(v==null) continue;
      if(k==="class") el.className = v;
      else if(k==="html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for (const c of [].concat(children||[])){
      if(c==null) continue;
      el.appendChild(typeof c === "string" ? root.createTextNode(c) : c);
    }
    return el;
  }

  function getTip(titleOrId){
    if(!window.TIPS_DATA) return null;
    const norm = (titleOrId||"").trim().toLowerCase();
    return window.TIPS_DATA.find(t => t.id===titleOrId || (t.title||"").trim().toLowerCase() === norm) || null;
  }

  function closeModal(b,m){
    b?.remove(); m?.remove();
    root.removeEventListener("keydown", onKey);
  }
  function onKey(e){
    if(e.key === "Escape"){
      const b = $(".modal-backdrop"); const m = $(".modal");
      closeModal(b,m);
    }
  }

  function openTipModal(tip){
    const backdrop = h("div", {class:"modal-backdrop"});
    const modal = h("div", {class:"modal", role:"dialog", "aria-modal":"true"});
    const header = h("header", {}, [
      h("h2", {html: tip.title || "KI‑Tipp"}),
      h("button", {class:"btn", "aria-label":"Schließen"}, ["×"])
    ]);
    const lead = h("p", {class:"lead"}, ["Problem/Situation: ", tip.problem || "—"]);
    const content = h("div", {}, [
      h("p", {}, [h("strong", {}, ["Lösung mit KI: "]), tip.solution || "—"]),
      h("div", {class:"copy-box"}, [
        h("button", {class:"btn copy", "data-action":"copy"}, ["Prompt kopieren"]),
        h("pre", {}, [tip.prompt || ""])
      ])
    ]);
    const actions = h("div", {class:"actions"}, [
      h("button", {class:"btn secondary", "data-action":"close"}, ["Schließen"])
    ]);
    modal.append(header, lead, content, actions);
    function bind(){
      modal.addEventListener("click", (ev)=>{
        if(ev.target.closest("[data-action='close']")){ closeModal(backdrop,modal); }
        const cp = ev.target.closest("[data-action='copy']");
        if(cp){
          const text = modal.querySelector("pre")?.textContent || "";
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
            .then(()=>{ cp.textContent="Kopiert ✓"; setTimeout(()=> cp.textContent="Prompt kopieren", 1200); })
            .catch(()=>{
              const ta = h("textarea",{style:"position:fixed;left:-9999px;top:-9999px;"}); ta.value = text; root.body.appendChild(ta); ta.select();
              try{ root.execCommand("copy"); cp.textContent="Kopiert ✓"; } catch { cp.textContent="Kopieren fehlgeschlagen"; }
              ta.remove(); setTimeout(()=> cp.textContent="Prompt kopieren", 1400);
            });
        }
      }, { passive:true });
      header.querySelector("button").addEventListener("click", ()=> closeModal(backdrop,modal), { passive:true });
      root.addEventListener("keydown", onKey, { passive:true });
    }
    root.body.append(backdrop, modal);
    bind();
    setTimeout(()=> modal.querySelector("button")?.focus(), 0);
  }

  function titleFromCard(card){
    // Heuristics for the tips grid cards
    const hEl = card.querySelector("h3,h2,h4,.title,[data-title]");
    return (hEl?.textContent || card.getAttribute("data-title") || "").trim();
  }

  // Global delegation for Tips overlay
  root.addEventListener("click", (e)=>{
    const ov = e.target.closest("#ov-tips, .tips-overlay");
    if(!ov) return;

    // 'Öffnen' button
    const openBtn = e.target.closest("button,a");
    const text = (openBtn?.textContent || "").trim().toLowerCase();
    if(text === "öffnen"){
      const card = openBtn.closest(".tip-card, .card, li, article, section") || ov;
      const title = titleFromCard(card);
      const tip = getTip(title) || getTip(card?.dataset?.id || "");
      if(tip){ e.preventDefault(); openTipModal(tip); }
      return;
    }

    // 'Link kopieren' in grid -> copy prompt directly
    if(text === "link kopieren"){
      const card = openBtn.closest(".tip-card, .card, li, article, section") || ov;
      const title = titleFromCard(card);
      const tip = getTip(title) || getTip(card?.dataset?.id || "");
      if(tip){
        e.preventDefault();
        (navigator.clipboard ? navigator.clipboard.writeText(tip.prompt || "") : Promise.reject())
          .then(()=>{ openBtn.textContent="Kopiert ✓"; setTimeout(()=> openBtn.textContent="Link kopieren", 1200); })
          .catch(()=>{ openBtn.textContent="Kopieren fehlgeschlagen"; setTimeout(()=> openBtn.textContent="Link kopieren", 1400); });
      }
      return;
    }
  });
})();
