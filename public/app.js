(function(){
  const API_BASE = ''; // relative -> Netlify proxy handles to Railway

  const modalEl = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const btnCopy = document.getElementById('btn-copy');
  const btnClose = document.getElementById('btn-close');
  const toast = document.getElementById('toast');

  const chipNews = document.getElementById('chip-news');
  const chipPrompts = document.getElementById('chip-prompts');
  const chipImpressum = document.getElementById('chip-impressum');
  const chipTicker = document.getElementById('chip-ticker');
  const chipSound = document.getElementById('chip-sound');
  const tickerLabel = document.getElementById('ticker-label');

  // Focus trap
  let lastActive = null;
  function openModal(title, html, copyText){
    lastActive = document.activeElement;
    modalTitle.textContent = title || 'Info';
    modalBody.innerHTML = html || '';
    modalEl.hidden = false;
    modalEl.setAttribute('data-copy', copyText || '');
    setTimeout(()=>{
      modalClose.focus();
    }, 0);
  }
  function closeModal(){
    modalEl.hidden = true;
    modalEl.removeAttribute('data-copy');
    if(lastActive && lastActive.focus) lastActive.focus();
  }
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-close').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e)=>{
    if(e.target.hasAttribute('data-close')) closeModal();
  });
  window.addEventListener('keydown', (e)=>{
    if(!modalEl.hidden && e.key === 'Escape') closeModal();
  });
  btnCopy.addEventListener('click', async ()=>{
    const txt = modalEl.getAttribute('data-copy') || '';
    if(!txt) return;
    try{
      await navigator.clipboard.writeText(txt);
      showToast('✓ Kopiert');
      incTelemetry('copy');
    }catch(err){
      console.error(err);
      showToast('⚠️ Kopieren nicht möglich');
    }
  });

  function showToast(msg){
    toast.textContent = msg;
    toast.hidden = false;
    setTimeout(()=> toast.hidden = true, 1200);
  }

  function errorCard(message){
    return `<div class="card muted">${message}</div>`;
  }

  function incTelemetry(key){
    try{
      const k = 'telemetry:'+key;
      const n = Number(localStorage.getItem(k) || '0') + 1;
      localStorage.setItem(k, String(n));
    }catch{}
  }

  // News
  chipNews.addEventListener('click', async ()=>{
    openModal('News', '<p>Lade…</p>');
    try{
      const data = await fetchJSON('/api/news');
      if(!data || !data.items) throw new Error('invalid');
      const links = data.items.map(it=>`<li><a href="${it.url}" target="_blank" rel="noopener">${escapeHTML(it.title)}</a></li>`).join('');
      modalBody.innerHTML = `<ul class="list">${links}</ul>`;
      modalEl.setAttribute('data-copy', data.items.map(x=>x.url).join('\n'));
    }catch(e){
      modalBody.innerHTML = errorCard('News‑Service nicht erreichbar.');
    }
  });

  // Prompts (office)
  const OFFICE = [
    { title:'E‑Mail‑Klartext', hint:'3 Varianten respektvoll & klar, je 5 Sätze', prompt:'Formuliere diese zu lange E‑Mail respektvoll, klar und in 5 Sätzen. Gib 3 Varianten (direkt, diplomatisch, motivierend):\n\n[TEXT]' },
    { title:'Meeting‑Agenda 30 Min', hint:'3 Blöcke, Timebox, Fragen', prompt:'Erstelle für ein 30‑Minuten‑Meeting eine Agenda mit Ziel, 3 Blöcken, Timebox je Block und klugen Entscheidungsfragen am Ende.' },
    { title:'Protokoll kurz', hint:'Stichpunkte + Aufgaben', prompt:'Wandle diese Stichpunkte in ein prägnantes, nummeriertes Protokoll mit Aufgaben (Wer? Bis wann?):\n\n[STICHWORTE]' },
    { title:'OKR‑Feinschliff', hint:'Metriken & Outcome', prompt:'Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aktivitäten. Max. 5 Key Results je Objective.\n\n[OKRS]' },
    { title:'PR‑Statement', hint:'neutral, faktisch', prompt:'Schreibe ein kurzes Pressestatement, neutral und faktenbasiert, ohne Superlative, 100 Wörter.' },
    { title:'Social Copy x3', hint:'3x LinkedIn 280 Zeichen', prompt:'Erzeuge 3 LinkedIn‑Posts zu [THEMA], je 280 Zeichen, mit Hook, Nutzen, 1 Hashtag.' },
    { title:'Kundendienst heikel', hint:'höflich, deeskalierend', prompt:'Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation, Lösungsweg + nächster Schritt.' },
    { title:'Sales‑Pitch 90s', hint:'Nutzen + 3 Belege', prompt:'Erstelle einen 90‑Sekunden‑Pitch mit Nutzen, 3 konkreten Belegen, CTA; Zielgruppe: Entscheider.' },
    { title:'SWOT in 8 Punkten', hint:'kompakt, je Quadrant', prompt:'Liste SWOT zu [THEMA] – je Quadrant 2 komprimierte Aussagen. Knappe Bulletpoints.' },
    { title:'Onboarding‑Plan 30 Tage', hint:'Woche 1‑4', prompt:'Erstelle einen kompakten 30‑Tage‑Plan für neue Mitarbeitende (Woche 1‑4: Lernziele, Shadowing, erste Deliverables).' }
  ];

  document.getElementById('chip-prompts').addEventListener('click', ()=>{
    const html = '<div class="grid">'+OFFICE.map(p=>`
      <article class="card">
        <h3>${escapeHTML(p.title)}</h3>
        <p class="muted">${escapeHTML(p.hint)}</p>
        <div class="right"><button class="btn btn-ghost" data-copy="${encodeURIComponent(p.prompt)}">Kopieren</button></div>
      </article>
    `).join('')+'</div>';
    openModal('Prompts (Büroalltag)', html);
    modalBody.querySelectorAll('button[data-copy]').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const txt = decodeURIComponent(e.currentTarget.getAttribute('data-copy'));
        try{ await navigator.clipboard.writeText(txt); showToast('✓ Kopiert'); incTelemetry('copy'); }catch{ showToast('⚠️ Kopieren nicht möglich');}
      });
    });
  });

  // Impressum
  document.getElementById('chip-impressum').addEventListener('click', ()=>{
    openModal('Impressum', `
      <p><strong>Verantwortlich:</strong><br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin<br><a href="mailto:info@hohl.rocks">E‑Mail schreiben</a></p>
      <p><strong>Haftungsausschluss:</strong> Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung keine Haftung für Inhalte externer Links.</p>
      <p><strong>Urheberrecht:</strong> Inhalte unterliegen deutschem Urheberrecht. Bilder via KI erzeugt.</p>
      <p><strong>EU AI Act:</strong> Hinweise zu Pflichten & Risiken beim KI‑Einsatz. Keine Rechtsberatung.</p>
      <p><strong>Datenschutz:</strong> Keine Tracking‑Cookies. Bei Kontakt per Mail werden Angaben zwecks Bearbeitung gespeichert (6 Monate). Rechte gemäß DSGVO: Auskunft, Berichtigung, Löschung, Widerruf, Beschwerde.</p>
    `);
  });

  // Bubble handling
  window.addEventListener('bubble:open', (ev)=>{
    const { id, label } = ev.detail;
    incTelemetry('bubble');
    // For demo: show a short description + provide a ready-to-run prompt copied on demand.
    const prompt = `Du bist das Tool "${label}". Arbeite prägnant, strukturiert, mit Zwischenüberschriften. Beginne mit einer kompakten Zusammenfassung (max. 3 Sätze).`;
    openModal(label, `<p class="muted">Service wird gestartet …</p>`, prompt);
    runLLM(label, prompt).catch(()=>{
      modalBody.innerHTML = '<p class="muted">Service nicht erreichbar.</p>';
    });
  });

  async function runLLM(title, prompt){
    // call /api/run (SSE-like). We chunk-append to the modal body.
    const res = await fetch('/api/run', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ title, prompt })
    });
    if(!res.ok) throw new Error('http '+res.status);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    modalBody.innerHTML = '<div id="stream" class="stream"></div>';
    const streamEl = document.getElementById('stream');
    let buf='';
    while(true){
      const {value, done} = await reader.read();
      if(done) break;
      buf += decoder.decode(value, {stream:true});
      streamEl.innerHTML = mdToHTML(buf);
      streamEl.scrollTop = streamEl.scrollHeight;
    }
  }

  // Ticker
  async function initTicker(){
    try{
      const data = await fetchJSON('/api/daily');
      const items = data.items || [];
      if(items.length === 0) throw 0;
      let i=0;
      function show(){ tickerLabel.textContent = items[i % items.length].title; i++; }
      show(); setInterval(show, 6000);
    }catch{
      tickerLabel.textContent = 'Heute neu – offline';
    }
  }
  initTicker();

  // Sound layer
  let audioCtx = null, master=null, oscA=null, oscB=null, lfo=null, filter=null;
  function initSound(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain(); master.gain.value = 0.05;
    filter = audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=1200;
    lfo = audioCtx.createOscillator(); lfo.frequency.value=0.08;
    const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 600;
    lfo.connect(lfoGain).connect(filter.frequency);
    oscA = audioCtx.createOscillator(); oscA.type='sine'; oscA.frequency.value=110;
    oscB = audioCtx.createOscillator(); oscB.type='sine'; oscB.frequency.value=147;
    oscA.connect(filter); oscB.connect(filter);
    filter.connect(master).connect(audioCtx.destination);
    lfo.start(); oscA.start(); oscB.start();
  }
  chipSound.addEventListener('click', async ()=>{
    initSound();
    await audioCtx.resume();
    showToast('Klang aktiv');
  });
  window.addEventListener('pointerdown', ()=>{
    if(!audioCtx) initSound();
  }, {once:true});

  // Utilities
  async function fetchJSON(path){
    const res = await fetch(path, { headers:{ 'x-api-base':'' } });
    if(!res.ok) throw new Error('http '+res.status);
    return res.json();
  }
  function escapeHTML(s){ return s.replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function mdToHTML(md){
    // very tiny markdown subset (bold, italic, code, br)
    return escapeHTML(md)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }
})();
