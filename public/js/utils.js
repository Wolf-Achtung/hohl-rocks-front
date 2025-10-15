export const $ = (s, c=document) => c.querySelector(s);
export const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
export const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));

export function el(tag, attrs={}, ...children){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') node.className = v;
    else if(k==='style' && typeof v === 'object') Object.assign(node.style, v);
    else if(k.startsWith('on') && typeof v === 'function'){ node.addEventListener(k.slice(2), v); }
    else if(v!==false && v!=null) node.setAttribute(k, String(v));
  });
  for(const ch of children){
    if(ch==null) continue;
    node.append(ch.nodeType ? ch : document.createTextNode(String(ch)));
  }
  return node;
}

export function escapeHtml(t){
  const d=document.createElement('div'); d.textContent=t; return d.innerHTML;
}

export function formatTime(ts){
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleString(undefined, {hour:'2-digit',minute:'2-digit', day:'2-digit', month:'2-digit'});
}

export function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

export function focusTrap(container){
  const FOCUSABLE = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
  const els = $$(FOCUSABLE, container);
  if(!els.length) return ()=>{};
  const first = els[0], last = els[els.length-1];
  function onKey(e){
    if(e.key!=='Tab') return;
    if(e.shiftKey && document.activeElement===first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement===last){ first.focus(); e.preventDefault(); }
  }
  container.addEventListener('keydown', onKey);
  return ()=> container.removeEventListener('keydown', onKey);
}

export function withTimeout(promise, ms, err='Zeitüberschreitung'){
  let to; const timer = new Promise((_,rej)=> to=setTimeout(()=>rej(new Error(err)), ms));
  return Promise.race([promise.finally(()=>clearTimeout(to)), timer]);
}

export function storage(key){
  return {
    get: ()=>{ try{ const raw=localStorage.getItem(key); return raw? JSON.parse(raw): null; }catch{ return null } },
    set: (val)=>{ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} },
    del: ()=>{ try{ localStorage.removeItem(key); }catch{} }
  }
}
