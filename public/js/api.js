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

export const news  = async () => getJson('/news');
export const daily = async () => getJson('/daily');
export const run   = async (input, { eu } = {}) => postJson(`/run?eu=${eu?'1':'0'}`, { input });
export const health = async () => { try { const r = await fetch('/healthz'); if(!r.ok) return false; const j = await r.json(); return j?.ok !== false; } catch { return false; } };
export const metrics = async (type, meta={}) => { try { await postJson('/metrics', { type, meta }); } catch {} };

export const api = { health, news, daily, run, metrics };

export function apiBase(){ return API_BASE; }
export function setApiBase(b){ API_BASE = (b||'/api').replace(/\/+$/,''); }

export function streamRun(input, { onToken, onDone, onError, eu } = {}){
  const url = `${API_BASE}/run/stream?q=${encodeURIComponent(input)}&eu=${eu?'1':'0'}`;
  let es = new EventSource(url);
  es.onmessage = (ev)=>{
    if (ev.data === '[DONE]'){ try{ onDone?.(); } finally { es.close(); } }
    else if (ev.data === '[ERROR]'){ onError?.(new Error('stream_error')); es.close(); }
    else onToken?.(ev.data);
  };
  es.onerror = (e)=>{ onError?.(e); es.close(); };
  return () => { try{ es.close(); } catch {} };
}

/** Streaming helper consumed by bubbleEngine.js */
export async function runBubble(bubbleId, payload, { thread=[], onToken, eu } = {}){
  const header = `[Bubble ${bubbleId} | ${new Date().toISOString()}]`;
  const input = header + "\n" + JSON.stringify({ payload, thread }, null, 2);
  if (typeof onToken === 'function'){
    // stream
    return new Promise((resolve,reject)=>{
      const stop = streamRun(input, {
        eu,
        onToken: (t)=> onToken(t),
        onDone: ()=> resolve(),
        onError: (e)=> reject(e||new Error('stream_error'))
      });
      // allow caller to cancel by returning stop? not needed for now
    });
  } else {
    const j = await run(input, { eu });
    return j?.result || '';
  }
}

export async function selfCheck(){ const ok = await health(); if(!ok) toast('Backend nicht erreichbar'); return ok; }
