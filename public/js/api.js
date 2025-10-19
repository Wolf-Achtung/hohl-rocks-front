import { toast } from './utils.js';
const META = document.querySelector('meta[name="x-api-base"]');
let API_BASE = (META?.content || '/api').replace(/\/+$/,'');

export async function getJson(path){
  const url = `${API_BASE}${path.startsWith('/') ? path : '/'+path}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}
export async function postJson(path, body){
  const url = `${API_BASE}${path.startsWith('/') ? path : '/'+path}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json','Accept':'application/json' }, body: JSON.stringify(body||{}) });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}
export const api = {
  async health(){ try { const r = await fetch('/healthz'); if(!r.ok) return false; const j = await r.json(); return j?.ok !== false; } catch { return false; } },
  async news(){ return getJson('/news'); },
  async daily(){ return getJson('/daily'); },
  async run(input){ return postJson('/run', { input }); }
};
export function apiBase(){ return API_BASE; }
export function setApiBase(b){ API_BASE = (b||'/api').replace(/\/+$/,''); }

/** Non-streaming helper compatible with bubbleEngine's API */
export async function runBubble(bubbleId, payload, opts={}){
  const input = `[Bubble ${bubbleId}]\n` + JSON.stringify(payload, null, 2);
  const j = await api.run(input);
  const text = j?.result || '';
  if (typeof opts.onToken === 'function') opts.onToken(text);
  return text;
}

export async function selfCheck(){ const ok = await api.health(); if(!ok) toast('Backend nicht erreichbar'); return ok; }
