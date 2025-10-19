// public/js/bubbleEngine.js
import { $, el, clamp, storage } from './utils.js';
import { openModal, modalHtmlForForm, toast } from './modal.js';
import { runBubble } from './api.js';

const container = $('#bubbles');

// Motion
const MAX_SPEED = 22, MIN_SPEED = 6, BREATHE = 0.24;
const MAX_ACTIVE = 12, TTL_MIN = 14000, TTL_MAX = 26000;
const SIZE_MAP = { s:110, m:160, l:210, xl:260 };

let layout = (storage('prefs').get() || {}).layout || 'drift';

const bubbles = [];
let itemsQueue = [], queueIdx = 0;
let running = true, rect = {w: window.innerWidth, h: window.innerHeight}, lastTs = 0;

const threadStore = (id) => storage('hohl.thread.'+id);
const getThread = (id) => threadStore(id).get() || [];
const setThread = (id, arr) => threadStore(id).set(arr.slice(-10));

const rand = (a,b)=> Math.random()*(b-a)+a;
const pick = (arr)=> arr[(Math.random()*arr.length)|0];
function computeRect(){ rect = { w: container.clientWidth || window.innerWidth, h: Math.max(container.clientHeight, window.innerHeight*0.62) }; }

function makeBubble(item){
  const size = pick(['s','m','l','xl']);
  const node = el('button', {class:'bubble', 'data-size':size, 'data-id': item.id, 'aria-label': item.question||item.title||'Bubble', style:'opacity:0'});
  node.style.setProperty('--h', String(Math.floor(rand(0,360))));
  node.style.setProperty('--alpha', '.32');
  node.append(el('span', {class:'bubble__title'}, item.question || item.title || ''));
  container.append(node);

  const baseSize = SIZE_MAP[size];
  const x = rand(0, rect.w - baseSize);
  const y = rand(0, rect.h - baseSize);
  const angle = rand(0, Math.PI*2);
  const speed = rand(MIN_SPEED, MAX_SPEED);
  const vx = Math.cos(angle)*speed;
  const vy = Math.sin(angle)*speed;
  const phase = rand(0, Math.PI*2);
  const ttl = rand(TTL_MIN, TTL_MAX);
  const born = performance.now();

  const obj = { node, id: item.id, title: item.question || item.title, base: baseSize, x, y, vx, vy, phase, born, ttl, fading:false, angle: rand(0, Math.PI*2), radius: rand(Math.min(rect.w,rect.h)*0.18, Math.min(rect.w,rect.h)*0.36), av: rand(0.15, 0.42) * (Math.random()<.5?-1:1), item };
  node.style.transform = `translate(${x}px, ${y}px) scale(0.92)`;
  node.style.transition = 'opacity .6s ease, transform .6s ease, box-shadow .2s ease, filter .2s ease';
  requestAnimationFrame(()=> node.style.opacity = '1');

  node.addEventListener('click', ()=> openItem(obj.item));
  bubbles.push(obj);
}

function removeBubble(b){
  if(b.fading) return;
  b.fading = true;
  b.node.style.opacity = '0';
  b.node.style.transform = `translate(${b.x}px, ${b.y}px) scale(0.88)`;
  setTimeout(()=>{
    b.node.remove();
    const i = bubbles.indexOf(b);
    if(i>=0) bubbles.splice(i,1);
    spawnNext();
  }, 480);
}

function openItem(item){
  const html = modalHtmlForForm(item) + `<div class="form-row"><button class="ui btn ghost" id="reset-thread">Kontext zurücksetzen</button></div>`;
  openModal({title: item.question || item.title, html});
  const form = document.querySelector('[data-form="'+item.id+'"]');
  const resultBox = document.querySelector('#modal .result');
  const resetBtn = document.getElementById('reset-thread');
  const old = getThread(item.id);
  if(old.length){
    const prev = document.createElement('div'); prev.className='result';
    prev.innerHTML = `<p><em>Vorheriger Kontext geladen (${old.length} Einträge).</em></p>`;
    resultBox.before(prev);
  }
  resetBtn?.addEventListener('click', ()=>{ setThread(item.id, []); toast('Kontext gelöscht'); });

  if(!form || !resultBox) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    resultBox.innerHTML = '<p>⏳ Läuft…</p>';
    const fd = new FormData(form);
    const payload = {};
    for (const [k,v] of fd.entries()){
      if(v instanceof File){
        if(v.size===0){ payload[k] = null; continue; }
        const data = await new Promise((resolve,reject)=>{
          const fr = new FileReader();
          fr.onload = ()=> resolve({ name: v.name, type: v.type, data: fr.result });
          fr.onerror = reject;
          fr.readAsDataURL(v);
        });
        payload[k] = data;
      } else {
        payload[k] = v;
      }
    }
    const textBox = document.createElement('div');
    textBox.className = 'stream';
    resultBox.innerHTML = ''; resultBox.append(textBox);

    let acc = '';
    try{
      await runBubble(item.id, payload, {
        thread: getThread(item.id),
        onToken: (tok)=>{
          acc += tok;
          textBox.innerHTML = acc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        }
      });
      if(!acc) textBox.textContent = 'Fertig.';
      const th = getThread(item.id);
      th.push({role:'user', content: JSON.stringify(payload)});
      th.push({role:'assistant', content: acc});
      setThread(item.id, th);
    }catch(err){
      console.error(err);
      resultBox.innerHTML = `<p>Fehler: ${err.message||err}</p>`;
      toast('Fehler bei der Ausführung');
    }
  }, {once:true});
}

function step(dt){
  const tNow = performance.now();
  const speedFactor = dt/1000;

  for(const b of [...bubbles]){
    if(!b.fading && (tNow - b.born) > b.ttl){ removeBubble(b); continue; }
    b.phase += dt*0.001;
    const breathe = 1 + Math.sin(b.phase*BREATHE)*0.05;

    if (layout === 'orbit'){
      b.angle += b.av * speedFactor;
      const cx = rect.w/2, cy = rect.h*0.55;
      const px = cx + Math.cos(b.angle)*b.radius - b.base/2;
      const py = cy + Math.sin(b.angle)*b.radius - b.base/2;
      b.x = clamp(px, 0, rect.w - b.base*breathe);
      b.y = clamp(py, 0, rect.h - b.base*breathe);
    } else {
      const px = clamp(b.x + b.vx*speedFactor, 0, rect.w - b.base*breathe);
      const py = clamp(b.y + b.vy*speedFactor, 0, rect.h - b.base*breathe);
      if(px===0 || px===rect.w - b.base*breathe) b.vx *= -1;
      if(py===0 || py===rect.h - b.base*breathe) b.vy *= -1;
      b.x = px; b.y = py;
    }

    b.node.style.transform = `translate(${b.x}px, ${b.y}px) scale(${breathe})`;
  }

  while(bubbles.length < Math.min(MAX_ACTIVE, itemsQueue.length)){ spawnNext(); }
}

function spawnNext(){ if(!itemsQueue.length) return; const item = itemsQueue[queueIdx % itemsQueue.length]; queueIdx++; makeBubble(item); }
function raf(ts){ if(!running){ lastTs = ts; return requestAnimationFrame(raf); } if(!lastTs) lastTs = ts; const dt = Math.min(48, ts - lastTs); lastTs = ts; step(dt); requestAnimationFrame(raf); }

export async function initBubbleEngine(items){
  // ensure ids
  itemsQueue = (items||[]).map((it, idx)=> ({ id: it.id!=null? it.id : idx+1, ...it }));
  computeRect();
  for(let i=itemsQueue.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [itemsQueue[i],itemsQueue[j]] = [itemsQueue[j],itemsQueue[i]]; }
  for(let i=0; i<Math.min(MAX_ACTIVE, itemsQueue.length); i++) spawnNext();
  requestAnimationFrame(raf);
}

window.addEventListener('resize', ()=> computeRect());
document.addEventListener('visibilitychange', ()=>{ running = document.visibilityState === 'visible'; if(running) lastTs = 0; });
window.addEventListener('layout:toggle', (e)=>{ layout = e.detail?.layout || 'drift'; });
