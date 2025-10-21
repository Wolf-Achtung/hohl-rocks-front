/**
 * news-render-fix.js v2
 * - Renders news when the overlay opens or on demand.
 * - Handles empty states gracefully.
 */
(function(){
  async function fetchJSON(url){
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  function host(u){ try{ return new URL(u).host.replace(/^www\./,''); }catch{ return ""; } }
  function truncate(s, n=200){ s = String(s||""); return s.length>n ? s.slice(0,n-1)+"…" : s; }

  async function renderNews(){
    const ul = document.querySelector("#news, ul#news, .news-list");
    if(!ul) return;
    ul.innerHTML = "<li class='news-item'>Lade KI‑News…</li>";
    try{
      const data = await fetchJSON("/api/news");
      const items = Array.isArray(data?.items) ? data.items : [];
      ul.innerHTML = "";
      if(items.length === 0){
        ul.innerHTML = "<li class='news-item'>Keine News gefunden. Prüfe Feeds/ENV oder versuche es später erneut.</li>";
        return;
      }
      items.forEach(it=>{
        const li = document.createElement("li"); li.className = "news-item";
        const a = document.createElement("a"); a.href = it.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = it.title || host(it.url) || "Link";
        const p = document.createElement("p"); p.className = "summary";
        const summary = typeof it.summary === "string" ? it.summary : (it.summary?.text || it.description || "");
        p.textContent = truncate(summary, 260);
        const small = document.createElement("small"); small.textContent = host(it.url);
        li.append(a,p,small); ul.appendChild(li);
      });
    }catch(e){
      console.error("News render error", e);
      ul.innerHTML = "<li class='news-item'>Fehler beim Laden der News.</li>";
    }
  }

  function watchOverlay(){
    const ov = document.querySelector("#ov-news");
    if(!ov) return;
    const mo = new MutationObserver(()=>{
      const visible = ov.getAttribute("aria-hidden") === "false" || ov.style.display === "block";
      if(visible) renderNews();
    });
    mo.observe(ov, { attributes:true, attributeFilter:["aria-hidden","style"] });
  }

  // Nav buttons (text contains 'KI-News')
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("button,a");
    if(btn && /KI-?News/i.test((btn.textContent||""))) setTimeout(renderNews, 20);
  });

  // init
  if(document.readyState === "complete") setTimeout(()=>{ watchOverlay(); }, 300);
  else window.addEventListener("load", ()=> setTimeout(watchOverlay, 300));
})();
