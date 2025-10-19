import { toast } from './utils.js';
const META = document.querySelector('meta[name="x-api-base"]');
let API_BASE = (META?.content || '/api').replace(/\/+$/,'');

async function getJsonWithTimeout(url, { timeout=10000 } = {}){
  const ctrl = new AbortController(); const id = setTimeout(()=> ctrl.abort('timeout'), timeout);
  try{ const res = await fetch(url, { headers:{'Accept':'application/json'}, signal: ctrl.signal }); clearTimeout(id); if(!res.ok) throw new Error(String(res.status)); return res.json(); }
  finally{ clearTimeout(id); }
}
async function dualJson(path){
  const rel = path.startsWith('/') ? path : '/'+path;
  try{ return await getJsonWithTimeout(`${API_BASE}${rel}`); }
  catch{ try{ return await getJsonWithTimeout(`/_api${rel}`); } catch{ throw new Error(`GET ${rel} failed`); } }
}
export async function getJson(path){ return dualJson(path); }
export async function postJson(path, body){
  const rel = path.startsWith('/') ? path : '/'+path;
  try{
    const res = await fetch(`${API_BASE}${rel}`, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify(body||{}) });
    if(!res.ok) throw new Error(String(res.status)); return res.json();
  } catch {
    const res = await fetch(`/_api${rel}`, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body: JSON.stringify(body||{}) });
    if(!res.ok) throw new Error(String(res.status)); return res.json();
  }
}

export const news  = async () => getJson('/news');
export const daily = async () => getJson('/daily');
export const run   = async (input, { eu } = {}) => postJson(`/run?eu=${eu?'1':'0'}`, { input });
export const health = async () => { try { const r = await fetch('/healthz'); if(!r.ok) return false; const j = await r.json(); return j?.ok !== false; } catch { return false; } };
export const metrics = async (type, meta={}) => { try { await postJson('/metrics', { type, meta }); } catch {} };
export const api = { health, news, daily, run, metrics };
export function apiBase(){ return API_BASE; } export function setApiBase(b){ API_BASE = (b||'/api').replace(/\/+$/,''); }

export function streamRun(input, { onToken, onDone, onError, eu } = {}){
  const mk = (base)=> `${base}/run/stream?q=${encodeURIComponent(input)}&eu=${eu?'1':'0'}`;
  let es = new EventSource(mk(API_BASE)); let switched = false;
  function failover(){
    if (switched) return onError?.(new Error('stream_error'));
    switched = true; try{ es.close(); }catch{}; es = new EventSource(mk('/_api'));
    es.onmessage = handler; es.onerror = (e)=>{ onError?.(e); es.close(); };
  }
  function handler(ev){
    if (ev.data === '[DONE]'){ try{ onDone?.(); } finally { es.close(); } }
    else if (ev.data === '[ERROR]'){ failover(); }
    else onToken?.(ev.data);
  }
  es.onmessage = handler;
  es.onerror = (e)=> failover();
  return () => { try{ es.close(); } catch {} };
}
export async function runBubble(bubbleId, payload, { thread=[], onToken, eu } = {}){
  const header = `[Bubble ${bubbleId} | ${new Date().toISOString()}]`; const input = header + "\n" + JSON.stringify({ payload, thread }, null, 2);
  if (typeof onToken === 'function'){ return new Promise((resolve,reject)=>{ const stop = streamRun(input, { eu, onToken: (t)=> onToken(t), onDone: ()=> resolve(), onError: (e)=> reject(e||new Error('stream_error')) }); }); }
  else { const j = await run(input, { eu }); return j?.result || ''; }
}
export async function selfCheck(){ const ok = await health(); if(!ok) toast('Backend nicht erreichbar'); return ok; }
