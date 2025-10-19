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

// Named exports (compat for legacy overlay.js)
export const news  = async () => getJson('/news');
export const daily = async () => getJson('/daily');
export const run   = async (input) => postJson('/run', { input });
export const health = async () => { try { const r = await fetch('/healthz'); if(!r.ok) return false; const j = await r.json(); return j?.ok !== false; } catch { return false; } };

// Aggregated API object
export const api = { health, news, daily, run };

export function apiBase(){ return API_BASE; }
export function setApiBase(b){ API_BASE = (b||'/api').replace(/\/+$/,''); }

// SSE streaming client using EventSource (GET)
export function streamRun(input, { onToken, onDone, onError } = {}){
  const url = `${API_BASE}/run/stream?q=${encodeURIComponent(input)}`;
  const es = new EventSource(url);
  es.onmessage = (ev)=>{
    if (ev.data === '[DONE]'){ try{ onDone?.(); } finally { es.close(); } }
    else if (ev.data === '[ERROR]'){ onError?.(new Error('stream_error')); es.close(); }
    else onToken?.(ev.data);
  };
  es.onerror = (e)=>{ onError?.(e); es.close(); };
  return () => es.close();
}

export async function selfCheck(){ const ok = await health(); if(!ok) toast('Backend nicht erreichbar'); return ok; }
