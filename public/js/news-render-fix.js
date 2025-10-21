/**
 * news-render-fix.js
 * Fixes [object Object] in KI-News by re-fetching and rendering safely.
 * Renders: title (link), summary (short), source host.
 */
(function(){
  async function fetchJSON(url){
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  function hostOf(u){ try{ return new URL(u).host.replace(/^www\./,''); }catch{ return ""; } }
  function truncate(s, n=200){ s = String(s||""); return s.length>n ? s.slice(0,n-1)+"…" : s; }

  async function renderNews(){
    const ul = document.querySelector("#news, ul#news, .news-list");
    if(!ul) return;
    try{
      const data = await fetchJSON("/api/news");
      const items = Array.isArray(data?.items) ? data.items : [];
      ul.innerHTML = "";
      items.forEach(it=>{
        const li = document.createElement("li");
        li.className = "news-item";
        const a = document.createElement("a");
        a.href = it.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = it.title || hostOf(it.url) || "Link";
        const p = document.createElement("p");
        p.className = "summary";
        const summary = typeof it.summary === "string" ? it.summary : (it.summary?.text || it.description || "");
        p.textContent = truncate(summary, 260);
        const small = document.createElement("small");
        small.textContent = hostOf(it.url);
        li.append(a,p,small);
        ul.appendChild(li);
      });
    }catch(e){
      console.error("News render error", e);
    }
  }
  // Lazy run after UI opens the News overlay
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("button,a");
    if(btn && /KI-?News/i.test((btn.textContent||""))) setTimeout(renderNews, 10);
  });
  // Also try once after load
  if(document.readyState === "complete") setTimeout(renderNews, 1000);
  else window.addEventListener("load", ()=> setTimeout(renderNews, 700));
})();
