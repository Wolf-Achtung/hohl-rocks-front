/**
 * prompts-interact.js
 * Normalizes the Prompt-Galerie UX:
 * - Rewrites "Im Run öffnen" buttons to "Öffnen".
 * - "Öffnen" shows a modal with the full prompt (copyable).
 * - "Kopieren" copies directly.
 * No API calls are made.
 */
(function(){
  const root = document;

  function $(sel, ctx=root){ return ctx.querySelector(sel); }
  function $$(sel, ctx=root){ return Array.from(ctx.querySelectorAll(sel)); }
  function h(tag, attrs={}, kids=[]){
    const el = root.createElement(tag);
    for(const [k,v] of Object.entries(attrs||{})){
      if(v==null) continue;
      if(k==="class") el.className = v;
      else if(k==="html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for(const c of [].concat(kids||[])){
      if(c==null) continue;
      el.appendChild(typeof c === "string" ? root.createTextNode(c) : c);
    }
    return el;
  }

  function getPromptFromCard(card){
    // Assumes each card contains a hidden <pre data-prompt> or data-prompt attribute;
    // if not present, we synthesize a best-effort prompt from title+subtitle.
    const pre = card.querySelector("pre[data-prompt]");
    if(pre && pre.textContent.trim()) return pre.textContent.trim();
    const title = (card.querySelector("h3,h2,h4")?.textContent || card.getAttribute("data-title") || "").trim();
    const subtitle = (card.querySelector("p, .subtitle, .desc")?.textContent || "").trim();
    if(!title) return "";
    return `Rolle: Du bist ein hilfreicher Assistent.\nZiel: ${title}.\nHinweise: ${subtitle || "liefere klare, umsetzbare Schritte."}\nFormat: Liste mit Schritten + 1 Beispiel.`;
  }

  function openPromptModal(title, promptText){
    const b = h("div", {class:"modal-backdrop"});
    const m = h("div", {class:"modal", role:"dialog", "aria-modal":"true"});
    m.append(
      h("header", {}, [h("h2",{html:title||"Prompt"},[]), h("button",{class:"btn","aria-label":"Schließen"},["×"])]),
      h("p",{class:"lead"},["Direkt einsetzbarer Prompt – kopieren und in ChatGPT/Claude einfügen."]),
      h("div",{class:"copy-box"},[h("button",{class:"btn copy","data-action":"copy"},["Prompt kopieren"]), h("pre",{},[promptText||""])]),
      h("div",{class:"actions"},[h("button",{class:"btn secondary","data-action":"close"},["Schließen"])])
    );
    function close(){ b.remove(); m.remove(); root.removeEventListener("keydown",onKey); }
    function onKey(e){ if(e.key==="Escape") close(); }
    m.addEventListener("click", (ev)=>{
      if(ev.target.closest("[data-action='close']")) return close();
      const cp = ev.target.closest("[data-action='copy']");
      if(cp){
        const text = m.querySelector("pre")?.textContent || "";
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(()=>{ cp.textContent="Kopiert ✓"; setTimeout(()=> cp.textContent="Prompt kopieren", 1200); })
          .catch(()=>{ cp.textContent="Kopieren fehlgeschlagen"; setTimeout(()=> cp.textContent="Prompt kopieren", 1400); });
      }
    }, { passive:true });
    m.querySelector("button")?.addEventListener("click", close);
    root.addEventListener("keydown", onKey, { passive:true });
    root.body.append(b,m);
    setTimeout(()=> m.querySelector("button")?.focus(), 0);
  }

  function normalizeRunButtons(){
    const ov = $("#ov-prompts");
    if(!ov) return;
    $$("button, a", ov).forEach(el=>{
      const txt = (el.textContent || "").trim().toLowerCase();
      if(txt === "im run öffnen" || txt === "run öffnen" || txt === "run"){
        el.textContent = "Öffnen";
      }
    });
  }

  function handleClicks(e){
    const ov = e.target.closest("#ov-prompts");
    if(!ov) return;
    const btn = e.target.closest("button,a"); if(!btn) return;
    const txt = (btn.textContent||"").trim().toLowerCase();
    if(txt === "kopieren"){
      e.preventDefault();
      const card = btn.closest(".prompt-card, .card, li, article, section") || ov;
      const prompt = getPromptFromCard(card);
      (navigator.clipboard ? navigator.clipboard.writeText(prompt) : Promise.reject())
        .then(()=>{ btn.textContent="Kopiert ✓"; setTimeout(()=> btn.textContent="Kopieren", 1200); })
        .catch(()=>{ btn.textContent="Fehlgeschlagen"; setTimeout(()=> btn.textContent="Kopieren", 1400); });
      return;
    }
    if(txt === "öffnen"){
      e.preventDefault();
      const card = btn.closest(".prompt-card, .card, li, article, section") || ov;
      const title = (card.querySelector("h3,h2,h4")?.textContent || "Prompt").trim();
      const prompt = getPromptFromCard(card);
      openPromptModal(title, prompt);
      return;
    }
  }

  // Observe overlay becoming visible, then normalize labels
  function watchOverlay(){
    const ov = $("#ov-prompts");
    if(!ov) return;
    const mo = new MutationObserver(()=>{
      const visible = ov.getAttribute("aria-hidden") === "false" || ov.style.display === "block";
      if(visible) normalizeRunButtons();
    });
    mo.observe(ov, { attributes:true, attributeFilter:["aria-hidden","style"] });
  }

  root.addEventListener("click", handleClicks, { passive:true });

  if(document.readyState === "complete") setTimeout(watchOverlay, 200);
  else window.addEventListener("load", ()=> setTimeout(watchOverlay, 200));
})();
