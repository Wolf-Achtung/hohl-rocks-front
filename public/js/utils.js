// js/utils.js
export const $ = (sel, root=document)=> root.querySelector(sel);
export const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
export function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k==='style' && typeof v==='object'){ Object.assign(n.style, v); continue; }
    if(v===false || v===null || v===undefined) continue;
    n.setAttribute(k, String(v));
  }
  for(const c of children){
    if(c==null) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
export function clamp(x, a, b){ return Math.min(Math.max(x,a), b); }
export function storage(ns){
  const key = 'hr.'+ns;
  return {
    get(){ try{ return JSON.parse(localStorage.getItem(key)||'null'); }catch{ return null; } },
    set(v){ localStorage.setItem(key, JSON.stringify(v)); },
    del(){ localStorage.removeItem(key); }
  };
}
export function withTimeout(promise, ms){
  const t = new Promise((_,rej)=> setTimeout(()=> rej(new Error('timeout')), ms));
  return Promise.race([promise, t]);
}
export function formatTime(ts){
  const d = new Date(ts); return d.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
}
