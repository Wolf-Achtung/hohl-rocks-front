export const $ = (sel, root=document) => (root || document).querySelector(sel);
export const $$ = (sel, root=document) => Array.from((root || document).querySelectorAll(sel));
export function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})){
    if (k === "style" && v && typeof v === "object") { Object.assign(n.style, v); continue; }
    if (v === false || v == null) continue;
    if (k === "class") n.className = String(v);
    else n.setAttribute(k, String(v));
  }
  for (const c of children){ if (c == null) continue; n.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return n;
}
export function storage(ns){ const key = `hr.${ns}`; return { get(){ try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }, set(v){ localStorage.setItem(key, JSON.stringify(v)); }, del(){ localStorage.removeItem(key); } }; }
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function toast(msg, ms=1800){ const t = document.getElementById('toast'); if(!t) return; t.textContent = msg; t.dataset.show = "1"; setTimeout(()=>{ delete t.dataset.show; }, ms); }
export function fmtUrl(u){ try { return new URL(u).hostname.replace(/^www\./,""); } catch { return u; } }
export async function copy(text){ try { await navigator.clipboard.writeText(text); toast('Kopiert'); } catch { toast('Kopieren fehlgeschlagen'); } }
export function formatTime(ms){ if (!Number.isFinite(ms)) return '00:00'; let s = Math.max(0, Math.floor(ms/1000)); const h = Math.floor(s/3600); s -= h*3600; const m = Math.floor(s/60); s -= m*60; const pad = (n)=> String(n).padStart(2,'0'); return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`; }
