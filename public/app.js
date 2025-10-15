// app.js (module)
import { $, $$, storage } from './js/utils.js';
import { setupToggle } from './js/audio.js';
import { initBubbleEngine } from './js/bubbleEngine.js';
import { openModal, closeModal } from './js/modal.js';
import { showNews, showPrompts, showProjects, showImpressum, close as closeOverlay } from './js/overlay.js';

const consent = $('#consent');
const consentStore = storage('hohl.consent');
if(!consentStore.get()){
  consent.setAttribute('aria-hidden','false');
  $('#consent-accept').addEventListener('click', ()=>{
    consentStore.set({ts: Date.now()});
    consent.setAttribute('aria-hidden','true');
  }, {once:true});
}

setupToggle($('#toggle-audio'));

$('#toggle-lang').addEventListener('click', ()=> alert('EN in Vorbereitung – Fokus: DE.'));

document.addEventListener('click', (e)=>{
  const target = e.target.closest('.chip[data-open]');
  if(!target) return;
  const what = target.getAttribute('data-open');
  if(what==='news') showNews();
  else if(what==='prompts') showPrompts();
  else if(what==='projects') showProjects();
  else if(what==='impressum') showImpressum();
});

addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    closeModal();
    closeOverlay();
  }
});

async function loadBubbles(){
  try{
    const res = await fetch('/data/bubbles.json');
    const items = await res.json();
    await initBubbleEngine(items);
  }catch(err){
    console.error(err);
    const b = $('#bubbles');
    b.innerHTML = `<p>Fehler beim Laden der Micro‑Apps. Bitte neu laden.</p>`;
  }
}
loadBubbles();
