/**
 * tips-interact.js v3 - VERBESSERT
 * - Zuverlässige Behandlung von KI-Tipps Overlay
 * - 'Öffnen' öffnet Modal mit Problem/Lösung + Prompt (copy)
 * - 'Prompt kopieren' kopiert direkt
 * - Funktioniert mit statischen TIPS_DATA
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

  // Hilfsfunktion: Escape HTML
  function esc(s){ 
    return String(s||'')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;'); 
  }

  // Tip aus TIPS_DATA holen
  function getTip(idOrTitle){
    if(!window.TIPS_DATA) {
      console.warn('[tips-interact] TIPS_DATA not available');
      return null;
    }
    
    const norm = (idOrTitle||"").trim().toLowerCase();
    const tip = window.TIPS_DATA.find(t => 
      t.id === idOrTitle || 
      (t.title||"").trim().toLowerCase() === norm
    );
    
    if(!tip) {
      console.warn('[tips-interact] Tip not found:', idOrTitle);
    }
    
    return tip || null;
  }

  // Modal schließen
  let currentModal = null;
  let currentBackdrop = null;
  
  function closeModal(){
    if(currentBackdrop) currentBackdrop.remove();
    if(currentModal) currentModal.remove();
    currentBackdrop = null;
    currentModal = null;
    root.removeEventListener("keydown", onEscKey);
  }
  
  function onEscKey(e){
    if(e.key === "Escape") closeModal();
  }

  // Tip-Modal öffnen
  function openTipModal(tip){
    console.log('[tips-interact] Opening modal for:', tip.title);
    
    // Vorheriges Modal schließen
    closeModal();
    
    // Backdrop
    currentBackdrop = h("div", {class:"modal-backdrop"});
    
    // Modal
    currentModal = h("div", {
      class:"modal tip-modal", 
      role:"dialog", 
      "aria-modal":"true",
      "aria-labelledby":"tip-modal-title"
    });
    
    // Header
    const header = h("header", {}, [
      h("h2", {id:"tip-modal-title"}, [tip.title || "KI‑Tipp"]),
      h("button", {
        class:"btn close-btn", 
        "aria-label":"Schließen",
        "data-action":"close"
      }, ["×"])
    ]);
    
    // Kategorie/Tags
    const meta = h("div", {class:"tip-meta"}, [
      tip.category ? h("span", {class:"category-badge"}, [tip.category]) : null,
      tip.tags?.length ? h("span", {class:"tags"}, [tip.tags.join(', ')]) : null
    ].filter(Boolean));
    
    // Problem/Situation
    const problemSection = h("div", {class:"tip-section"}, [
      h("h3", {class:"section-title"}, ["Problem/Situation"]),
      h("p", {class:"section-text"}, [tip.problem || "—"])
    ]);
    
    // Lösung
    const solutionSection = h("div", {class:"tip-section"}, [
      h("h3", {class:"section-title"}, ["Lösung mit KI"]),
      h("p", {class:"section-text"}, [tip.solution || "—"])
    ]);
    
    // Prompt
    const promptSection = h("div", {class:"tip-section prompt-section"}, [
      h("h3", {class:"section-title"}, ["Prompt zum Kopieren"]),
      h("div", {class:"copy-box"}, [
        h("button", {
          class:"btn copy-btn", 
          "data-action":"copy",
          "aria-label":"Prompt in Zwischenablage kopieren"
        }, ["📋 Prompt kopieren"]),
        h("pre", {class:"prompt-code"}, [tip.prompt || ""])
      ])
    ]);
    
    // Footer Actions
    const footer = h("div", {class:"modal-actions"}, [
      h("button", {
        class:"btn secondary", 
        "data-action":"close"
      }, ["Schließen"])
    ]);
    
    // Zusammenbauen
    currentModal.append(header, meta, problemSection, solutionSection, promptSection, footer);
    
    // Event Handlers
    function bindEvents(){
      currentModal.addEventListener("click", (ev)=>{
        // Schließen
        if(ev.target.closest("[data-action='close']")){ 
          closeModal(); 
          return;
        }
        
        // Kopieren
        const copyBtn = ev.target.closest("[data-action='copy']");
        if(copyBtn){
          const text = currentModal.querySelector("pre")?.textContent || "";
          copyToClipboard(text, copyBtn);
        }
      }, { passive:true });
      
      // Escape Key
      root.addEventListener("keydown", onEscKey, { passive:true });
      
      // Backdrop Click
      currentBackdrop.addEventListener("click", closeModal, { passive:true });
    }
    
    // Zum DOM hinzufügen
    root.body.append(currentBackdrop, currentModal);
    bindEvents();
    
    // Focus Management
    setTimeout(()=> {
      const firstFocusable = currentModal.querySelector("button, a, input, [tabindex]:not([tabindex='-1'])");
      if(firstFocusable) firstFocusable.focus();
    }, 0);
  }

  // Clipboard Copy mit Fallback
  function copyToClipboard(text, button){
    const originalText = button.textContent;
    
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text)
        .then(()=>{
          button.textContent = "✓ Kopiert!";
          button.classList.add('success');
          setTimeout(()=> {
            button.textContent = originalText;
            button.classList.remove('success');
          }, 2000);
        })
        .catch(()=>{
          fallbackCopy(text, button, originalText);
        });
    } else {
      fallbackCopy(text, button, originalText);
    }
  }
  
  function fallbackCopy(text, button, originalText){
    const ta = h("textarea", {
      style:"position:fixed;left:-9999px;top:-9999px;"
    });
    ta.value = text;
    root.body.appendChild(ta);
    ta.select();
    
    try{
      root.execCommand("copy");
      button.textContent = "✓ Kopiert!";
      button.classList.add('success');
      setTimeout(()=> {
        button.textContent = originalText;
        button.classList.remove('success');
      }, 2000);
    } catch {
      button.textContent = "❌ Fehler";
      setTimeout(()=> button.textContent = originalText, 2000);
    }
    
    ta.remove();
  }

  // Card-Titel extrahieren
  function getTitleFromCard(card){
    const hEl = card.querySelector("h3, h2, h4, .title, [data-title]");
    return (hEl?.textContent || card.getAttribute("data-title") || "").trim();
  }

  // Globale Event Delegation für Tips Overlay
  root.addEventListener("click", (e)=>{
    const tipsOverlay = e.target.closest("#ov-tips, .tips-overlay");
    if(!tipsOverlay) return;

    const btn = e.target.closest("button, a");
    if(!btn) return;
    
    const action = btn.dataset.action;
    const text = (btn.textContent || "").trim().toLowerCase();
    
    console.log('[tips-interact] Click detected:', {action, text});

    // 'Öffnen' button oder data-action="open-tip"
    if(action === "open-tip" || text === "öffnen"){
      e.preventDefault();
      
      const tipId = btn.dataset.tipId;
      const card = btn.closest(".tip-card, .card, .tip, li, article, section") || tipsOverlay;
      const title = getTitleFromCard(card);
      
      const tip = getTip(tipId || title);
      
      if(tip){ 
        openTipModal(tip); 
      } else {
        console.error('[tips-interact] Tip not found for:', tipId || title);
        alert('Tipp nicht gefunden. Bitte TIPS_DATA prüfen.');
      }
      return;
    }

    // 'Prompt kopieren' oder data-action="copy-tip"
    if(action === "copy-tip" || text === "prompt kopieren" || text === "link kopieren"){
      e.preventDefault();
      
      const tipId = btn.dataset.tipId;
      const card = btn.closest(".tip-card, .card, .tip, li, article, section") || tipsOverlay;
      const title = getTitleFromCard(card);
      
      const tip = getTip(tipId || title);
      
      if(tip){
        copyToClipboard(tip.prompt || "", btn);
      } else {
        console.error('[tips-interact] Tip not found for copy:', tipId || title);
      }
      return;
    }
  }, { passive:false }); // passive:false wegen preventDefault

  // Overlay Visibility Watcher (optional für zusätzliche Init-Logik)
  function watchOverlay(){
    const ov = $("#ov-tips");
    if(!ov) return;
    
    const observer = new MutationObserver(()=>{
      const isVisible = ov.getAttribute("aria-hidden") === "false" || 
                        ov.style.display === "block" ||
                        ov.dataset.open === "1";
      
      if(isVisible) {
        console.log('[tips-interact] Tips overlay now visible');
        // Hier könnte zusätzliche Init-Logik stehen
      }
    });
    
    observer.observe(ov, { 
      attributes: true, 
      attributeFilter: ["aria-hidden", "style", "data-open"] 
    });
  }

  // Init
  if(document.readyState === "complete"){
    setTimeout(watchOverlay, 200);
  } else {
    window.addEventListener("load", ()=> setTimeout(watchOverlay, 200));
  }
  
  console.log('[tips-interact] Module loaded and ready');
})();
