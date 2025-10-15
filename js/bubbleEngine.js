// js/bubbleEngine.js
import { $, el, clamp, storage } from './utils.js';
import { openModal, modalHtmlForForm, toast } from './modal.js';
import { runBubble } from './api.js';

const container = $('#bubbles');

// Motion + life cycle
const MAX_SPEED = 22;       // px/s
const MIN_SPEED = 6;
const BREATHE   = 0.24;     // size oscillation
const MAX_ACTIVE = 12;      // simultaneously visible bubbles
const TTL_MIN = 14000;      // min lifetime (ms)
const TTL_MAX = 26000;      // max lifetime (ms)

const bubbles = [];
let itemsQueue = [];
let queueIdx = 0;
let running = true, rect = {w: window.innerWidth, h: window.innerHeight}, lastTs = 0;

const threadStore = (id) => storage('hohl.thread.'+id);
function getThread(id){ return threadStore(id).get() || []; }
function setThread(id, arr){ threadStore(id).set(arr.slice(-10)); }

function rand(a,b){ return Math.random()*(b-a)+a; }
function pick(arr){ return arr[(Math.random()*arr.length)|0]; }
function computeRect(){
  rect = { w: container.clientWidth || window.innerWidth, h: Math.max(container.clientHeight, window.innerHeight*0.62) };
}

function makeBubble(item){
  const size = pick(['s','m','l','xl']);
  const node = el('button', {class:'bubble', 'data-size':size, 'data-id': item.id, 'aria-label': item.title, style:'opacity:0'});
  node.style.setProperty('--h', String(Math.floor(rand(180,330))));
  node.append(el('span', {class:'bubble__title'}, item.title));
  container.append(node);

  const sMap = {s:140, m:200, l:280, xl:360};
  const baseSize = sMap[size];
  const x = rand(0, rect.w - baseSize);
  const y = rand(0, rect.h - baseSize);
  const angle = rand(0, Math.PI*2);
  const speed = rand(MIN_SPEED, MAX_SPEED);
  const vx = Math.cos(angle)*speed;
  const vy = Math.sin(angle)*speed;
  const phase = rand(0, Math.PI*2);
  const ttl = rand(TTL_MIN, TTL_MAX);
  const born = performance.now();

  const obj = { node, id: item.id, title: item.title, base: baseSize, x, y, vx, vy, phase, born, ttl, fading:false };
  node.style.transform = `translate(${x}px, ${y}px) scale(0.92)`;
  node.style.transition = 'opacity .6s ease, transform .6s ease, box-shadow .2s ease, filter .2s ease';
  requestAnimationFrame(()=> node.style.opacity = '1');

  node.addEventListener('click', ()=> openItem(item));
  bubbles.push(obj);
}

function removeBubble(b){
  if(b.fading) return;
  b.fading = true;
  b.node.style.opacity = '0';
  b.node.style.transform = `translate(${b.x}px, ${b.y}px) scale(0.8)`;
  setTimeout(()=>{
    b.node.remove();
    const i = bubbles.indexOf(b);
    if(i>=0) bubbles.splice(i,1);
    spawnNext();
  }, 600);
}

function openItem(item){
  const html = modalHtmlForForm(item) + `<div class="form-row"><button class="ui btn ghost" id="reset-thread">Kontext zurücksetzen</button></div>`;
  openModal({title: item.title, html});
  const form = document.querySelector('[data-form="'+item.id+'"]');
  const resultBox = document.querySelector('.modal .result');
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
    const entries = Array.from(fd.entries());
    for (const [k,v] of entries){
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
    if(!b.fading && (tNow - b.born) > b.ttl){
      removeBubble(b);
      continue;
    }
    b.phase += dt*0.001;
    const breathe = 1 + Math.sin(b.phase*BREATHE)*0.05;
    const px = clamp(b.x + b.vx*speedFactor, 0, rect.w - b.base*breathe);
    const py = clamp(b.y + b.vy*speedFactor, 0, rect.h - b.base*breathe);

    if(px===0 || px===rect.w - b.base*breathe) b.vx *= -1;
    if(py===0 || py===rect.h - b.base*breathe) b.vy *= -1;

    b.x = px; b.y = py;
    b.node.style.transform = `translate(${px}px, ${py}px) scale(${breathe})`;
  }

  // Keep population
  while(bubbles.length < Math.min(MAX_ACTIVE, itemsQueue.length)){
    spawnNext();
  }
}

function spawnNext(){
  if(!itemsQueue.length) return;
  const item = itemsQueue[queueIdx % itemsQueue.length];
  queueIdx++;
  makeBubble(item);
}

function raf(ts){
  if(!running){ lastTs = ts; return requestAnimationFrame(raf); }
  if(!lastTs) lastTs = ts;
  const dt = Math.min(48, ts - lastTs);
  lastTs = ts;
  step(dt);
  requestAnimationFrame(raf);
}

export async function initBubbleEngine(items){
  computeRect();
  // shuffle for variety
  itemsQueue = items.slice();
  for(let i=itemsQueue.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [itemsQueue[i],itemsQueue[j]] = [itemsQueue[j],itemsQueue[i]]; }
  // initial population
  for(let i=0; i<Math.min(MAX_ACTIVE, itemsQueue.length); i++) spawnNext();
  requestAnimationFrame(raf);
}

window.addEventListener('resize', ()=>{ computeRect(); });
document.addEventListener('visibilitychange', ()=>{
  running = document.visibilityState === 'visible';
  if(running) lastTs = 0;
});
