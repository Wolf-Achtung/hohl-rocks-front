// js/api.js
import { withTimeout, storage } from './utils.js';

const META = document.querySelector('meta[name="x-api-base"]');
let API_BASE = (META?.content || '/_api').replace(/\/+$/,'');

const cacheNews = storage('hohl.news');
const cacheDaily = storage('hohl.daily');

async function discoverBase(){
  const cached = storage('api.base').get();
  if(cached && (Date.now()-cached.ts)<24*60*60*1000){ API_BASE=cached.base; return API_BASE; }
  const cands = [API_BASE, '/_api', 'https://hohl-rocks-back-production.up.railway.app'];
  for(const b of cands){
    try{ const r = await fetch(`${b}/healthz`, {mode:'cors'}); if(r.ok){ API_BASE=b; storage('api.base').set({base:b, ts:Date.now()}); return b; } }catch{}
  }
  return API_BASE;
}

async function getJson(path){
  await discoverBase();
  const res = await withTimeout(fetch(`${API_BASE}${path}`, {headers: {'Accept':'application/json'}}), 20000);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function healthz(){
  try{
    await discoverBase();
    const res = await withTimeout(fetch(`${API_BASE}/healthz`), 5000);
    return res.ok;
  }catch{ return false; }
}

export async function news(force=false){
  const cached = cacheNews.get();
  if(!force && cached && (Date.now()-cached.ts) < 12*60*60*1000) return cached.data;
  const data = await getJson('/api/news');
  cacheNews.set({ts: Date.now(), data});
  return data;
}

export async function daily(force=false){
  const cached = cacheDaily.get();
  if(!force && cached && (Date.now()-cached.ts) < 12*60*60*1000) return cached.data;
  const data = await getJson('/api/news/daily');
  cacheDaily.set({ts: Date.now(), data});
  return data;
}

export async function topPrompts(){
  try{ return await getJson('/api/news/top'); }
  catch{ return []; }
}

export async function runBubble(id, payload, {signal, onToken, thread} = {}){
  await discoverBase();
  const url = `${API_BASE}/api/run`;
  const body = JSON.stringify({ id, input: payload, thread });
  const res = await withTimeout(fetch(url, { method:'POST', headers: {'Accept':'text/event-stream', 'Content-Type':'application/json'}, body, signal }), 60000);
  if(res.headers.get('content-type')?.includes('text/event-stream')){
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while(true){
      const {value, done} = await reader.read();
      if(done) break;
      buffer += decoder.decode(value, {stream:true});
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for(const part of parts){
        const line = part.split('\n').find(l=>l.startsWith('data:'));
        if(!line) continue;
        const text = line.slice(5).trim();
        if(text==='[DONE]') return;
        try{
          const data = JSON.parse(text);
          if(data.delta && onToken) onToken(data.delta);
          if(data.done) return data.result;
        }catch{
          if(onToken) onToken(text);
        }
      }
    }
    return;
  } else {
    const j = await res.json();
    return j;
  }
}
