/* === HOHL.ROCKS Front – robustes Modal & API-Guard ===
   - Verhindert „Unexpected token '<'“ bei HTML-Antworten
   - Modals zuverlässig schließbar (auch bei API-Fail)
   - Ambient-Sound mit Toggle
*/
const API_BASE = '/api';

const qs = (s) => document.querySelector(s);
const modalBackdrop = qs('#modalBackdrop');
const modalTitle     = qs('#modalTitle');
const modalBody      = qs('#modalBody');
const toastEl        = qs('#toast');

const btnTicker    = qs('#btnTicker');
const btnNews      = qs('#btnNews');
const btnPrompts   = qs('#btnPrompts');
const btnImpressum = qs('#btnImpressum');
const btnKlang     = qs('#btnKlang');

let lastCopy = '';

/* ---------- Ambient-Audio (dezent) ---------- */
const AudioMod = {
  ctx:null, enabled:false,
  async start(){
    try{
      if(!this.ctx){
        this.ctx = new (window.AudioContext||window.webkitAudioContext)();
        const master = this.ctx.createGain(); master.gain.value = 0.05;

        const filt = this.ctx.createBiquadFilter(); // sanfter Lowpass
        filt.type='lowpass'; filt.frequency.value=1200;

        const lfo = this.ctx.createOscillator();
        const lfoG = this.ctx.createGain();
        lfo.frequency.value = 0.06; lfoG.gain.value = 400;
        lfo.connect(lfoG).connect(filt.frequency);

        const o1 = this.ctx.createOscillator(); o1.type='sine'; o1.frequency.value=110;
        const o2 = this.ctx.createOscillator(); o2.type='sine'; o2.frequency.value=147;
        o1.connect(filt); o2.connect(filt); filt.connect(master).connect(this.ctx.destination);
        o1.start(); o2.start(); lfo.start();
      }
      if(this.ctx.state==='suspended') await this.ctx.resume();
      this.enabled = true;
      btnKlang?.setAttribute('aria-pressed','true');
    }catch{ /* ignore */ }
  },
  async stop(){
    if(!this.ctx) return;
    await this.ctx.suspend();
    this.enabled = false;
    btnKlang?.setAttribute('aria-pressed','false');
  },
  toggle(){ this.enabled ? this.stop() : this.start(); }
};
btnKlang?.addEventListener('click', ()=>AudioMod.toggle());
window.addEventListener('pointerdown', ()=>{ if(!AudioMod.enabled) AudioMod.start(); }, { once:true });

/* ---------- Modal Helpers ---------- */
function openModal(title, html, copyText){
  modalTitle && (modalTitle.textContent = title || 'Info');
  if(modalBody) modalBody.innerHTML = html || '';
  lastCopy = copyText || stripHtml(html || '');
  if(modalBackdrop) modalBackdrop.hidden = false;
}
function closeModal(){
  if(modalBackdrop) modalBackdrop.hidden = true;
}
qs('#btnClose')?.addEventListener('click', closeModal);
qs('#modalClose')?.addEventListener('click', closeModal);
document.addEventListener('keydown', (e)=>{
  if(!modalBackdrop?.hidden && e.key === 'Escape') closeModal();
});
qs('#btnCopy')?.addEventListener('click', async ()=>{
  try{ await navigator.clipboard.writeText(lastCopy||''); showToast('Kopiert ✓'); }
  catch{ showToast('Kopieren nicht möglich'); }
});

/* ---------- UI Utils ---------- */
function showToast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  setTimeout(()=> toastEl.hidden = true, 1200);
}
function stripHtml(s){ const d=document.createElement('div'); d.innerHTML=s; return d.textContent||''; }
function escapeHTML(s){ return (s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------- API Guard: parse JSON nur bei content-type ---------- */
async function apiJSON(path){
  try{
    const r = await fetch(API_BASE+path, { headers:{ 'x-proxy':'netlify' } });
    if(!r.ok) throw 0;
    const ct = (r.headers.get('content-type')||'').toLowerCase();
    if(!ct.includes('application/json')) return null; // HTML? -> kein JSON
    return await r.json();
  }catch{
    return null;
  }
}

/* ---------- News ---------- */
btnNews?.addEventListener('click', async ()=>{
  openModal('News','<p>Lade…</p>');
  const j = await apiJSON('/news');
  if(!j || !j.items){
    openModal('News','<p>News-Service nicht erreichbar.</p>');
    return;
  }
  const lis = j.items.map(i=>`<li><a href="${i.url}" target="_blank" rel="noopener">${escapeHTML(i.title)}</a></li>`).join('');
  openModal('News', `<ul class="news-list">${lis}</ul>`, j.items.map(i=>i.url).join('\n'));
});

/* ---------- Ticker (Heute neu) ---------- */
async function initTicker(){
  if(!btnTicker) return;
  const j = await apiJSON('/daily');
  if(!j || !j.items || !j.items.length){
    btnTicker.textContent = 'Heute neu – offline';
    return;
  }
  let i = 0;
  const tick = ()=>{
    btnTicker.textContent = 'Heute neu – ' + j.items[i % j.items.length].title;
    i++;
  };
  tick();
  setInterval(tick, 6000);
}
initTicker();

/* ---------- Prompts (Büroalltag) ---------- */
btnPrompts?.addEventListener('click', ()=>{
  const cards = officePrompts().map(p=>`
    <div class="prompt-card">
      <div class="prompt-title">${escapeHTML(p.title)}</div>
      <div class="prompt-desc">${escapeHTML(p.desc)}</div>
      <div class="prompt-actions">
        <button class="copy-btn" data-id="${p.id}">Kopieren</button>
      </div>
    </div>`).join('');

  openModal('Prompts (Büroalltag)', `<div class="prompts-grid">${cards}</div>`, '');

  // Delegation für Copy-Buttons
  modalBody?.addEventListener('click', (e)=>{
    const b = e.target.closest('.copy-btn');
    if(!b) return;
    const p = officePrompts().find(x=>x.id===b.dataset.id);
    if(p){
      navigator.clipboard.writeText(p.prompt).then(()=>showToast('Kopiert ✓'));
    }
  }, { once:true });
});

btnImpressum?.addEventListener('click', ()=>{
  openModal(
    'Impressum',
    '<p><strong>Verantwortlich:</strong> Wolf Hohl · Greifswalder Str. 224a · 10405 Berlin</p>' +
    '<p>Diese Website dient ausschließlich der Information. Keine Haftung für externe Links. '+
    'Alle Inhalte unterliegen dem deutschen Urheberrecht; Bilder teils KI-generiert. '+
    'Keine Tracking-Cookies; Kontaktanfragen werden zur Bearbeitung gespeichert (bis zu 6 Monate).</p>'+
    '<p><strong>EU AI Act / DSGVO:</strong> Hinweise ohne Rechtsberatung.</p>'
  );
});

/* ---------- Prompt-Vorlagen ---------- */
function officePrompts(){
  return [
    {id:'mail-klartext', title:'E‑Mail Klartext', desc:'Lange Mail → 5 klare Sätze, 3 Stile.',
     prompt:'Formuliere die folgende Mail jeweils in 5 Sätzen, in drei Varianten: diplomatisch, direkt, motivierend. Text:\\n<<<TEXT>>>\\n'},
    {id:'agenda-30', title:'Meeting‑Agenda 30 min', desc:'3 Blöcke, Timebox, Entscheidung.',
     prompt:'Erstelle eine Agenda für ein 30-Minuten-Meeting mit 3 Blöcken, Timebox, Ziel und Entscheidungsfrage.'},
    {id:'protokoll-stichpunkte', title:'Protokoll aus Stichpunkten', desc:'Stichpunkte → Aufgabenprotokoll.',
     prompt:'Wandle Stichpunkte in ein kompaktes Protokoll mit Aufgabenliste (Wer? Bis wann?).'},
    {id:'status-exec', title:'Status Update wie Exec', desc:'120 Wörter, 3 KPIs + Ampel.',
     prompt:'Verdichte die Infos in 120 Wörtern im Executive-Ton, mit 3 KPIs und Ampelstatus.'},
    {id:'okr-feinschliff', title:'OKR‑Feinschliff', desc:'Metriken schärfen, Outcome‑Fokus.',
     prompt:'Überarbeite die OKRs: klare Metriken, Outcome-Fokus, max. 5 Key Results.'},
    {id:'pr-statement', title:'PR‑Statement', desc:'Kurz, neutral, ohne Superlative.',
     prompt:'Schreibe ein kurzes neutrales Pressestatement (max. 120 Wörter).'},
    {id:'social-copy', title:'Social Copy ×3', desc:'3 LinkedIn‑Posts je 280 Zeichen.',
     prompt:'Erzeuge 3 LinkedIn-Posts à 280 Zeichen (Hook, Nutzen, 1 Hashtag).'},
    {id:'kundenmail', title:'Kundenmail heikel', desc:'Höflich deeskalieren + Next Step.',
     prompt:'Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation + nächster Schritt.'},
    {id:'sales-pitch', title:'Sales‑Pitch 90s', desc:'Nutzen + 2 Belege + CTA.',
     prompt:'Erstelle einen 90-Sekunden-Pitch mit Nutzen, zwei Belegen und CTA.'},
    {id:'swot', title:'SWOT in 8 Punkten', desc:'Je 2 Punkte pro Quadrant.',
     prompt:'SWOT zu [THEMA] – je Quadrant zwei prägnante Punkte.'},
  ];
}

/* ---------- Run (SSE/Stream) für Bubble-Klick ---------- */
window.app = {
  openRunModal(item){
    openModal(item.title || 'Modul', '<p class="small">Starte …</p>');
    fetchRun(item.id);
  }
};

async function fetchRun(id){
  let res = null;
  try{
    res = await fetch(API_BASE+'/run', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ id })
    });
  }catch{
    res = null;
  }
  if(!res || !res.ok){
    openModal('Fehler','<p>Service nicht erreichbar.</p>');
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = '';
  if(modalBody) modalBody.textContent = '';
  while(true){
    const { value, done } = await reader.read();
    if(done) break;
    acc += dec.decode(value, { stream:true });
    if(modalBody) modalBody.textContent = acc;
    lastCopy = acc;
  }
}
