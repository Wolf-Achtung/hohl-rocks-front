/**
 * nav-prune.js
 * Removes 'Klang' and the adjacent settings icon from the top navigation.
 * Also assigns aria-labels to remaining items if missing.
 */
(function(){
  function removeByText(root, txt){
    const items = root.querySelectorAll("a,button,li,div,span");
    for(const el of items){
      const t = (el.textContent||"").trim().toLowerCase();
      if(t === txt.toLowerCase()){
        const li = el.closest("li,button,a,div") || el;
        li.classList.add("nav-item-sound");
        li.remove();
      }
    }
  }
  function removeSettingsIcon(root){
    // Try by title/aria/role/innerText glyph
    const cand = Array.from(root.querySelectorAll("[aria-label*=einstell],[title*=einstell], [aria-label*=settings], [title*=settings]")).concat(
      Array.from(root.querySelectorAll("button, a")).filter(b => (b.textContent||"").match(/[⚙️🛠️]/))
    );
    if(cand[0]){
      cand[0].classList.add("nav-item-settings");
      cand[0].remove();
    }
  }
  function addAriaLabels(root){
    root.querySelectorAll("nav a, nav button").forEach((el)=>{
      if(!el.getAttribute("aria-label")){
        const label = (el.textContent||"").trim();
        if(label) el.setAttribute("aria-label", label);
      }
    });
  }
  function init(){
    const nav = document.querySelector("nav, header nav, .top-nav");
    if(!nav) return;
    removeByText(nav, "Klang");
    removeSettingsIcon(nav);
    addAriaLabels(nav);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
