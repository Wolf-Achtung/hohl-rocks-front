export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
export function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})){
    if (k === "style" && v && typeof v === "object") { Object.assign(n.style, v); continue; }
    if (v === false || v == null) continue;
    if (k === "class") n.className = String(v);
    else n.setAttribute(k, String(v));
  }
  for (const c of children){
    if (c == null) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
export function storage(ns){
  const key = `hr.${ns}`;
  return {
    get(){ try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
    set(v){ localStorage.setItem(key, JSON.stringify(v)); },
    del(){ localStorage.removeItem(key); }
  };
}
export function toast(msg, ms=1800){
  const t = $("#toast"); t.textContent = msg; t.dataset.show = "1";
  setTimeout(()=> { delete t.dataset.show; }, ms);
}
export function fmtUrl(u){ try { return new URL(u).hostname.replace(/^www\./,""); } catch { return u; } }
export const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));
export function safeHtml(s=""){ return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
