/* hohl.rocks – v1.4.7 */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ===== Theme / Settings =====
  const defaults = {
    maxBubbles: 22,
    spawnEveryMs: 4200,
    speedScale: 0.7,
    sizeBuckets: [160, 240, 320, 420, 560],
    verySlowMode: false,
    huePrimary: 200,
    hueAccent: 320,
    neonStrength: 0.86
  };
  let settings = loadSettings(); applyThemeVars();

  function loadSettings() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('settings') || '{}') }; }
    catch { return { ...defaults }; }
  }
  function saveSettings(next) {
    settings = { ...settings, ...next };
    localStorage.setItem('settings', JSON.stringify(settings));
    applyThemeVars();
    field && field.applySettings && field.applySettings();
  }
  function applyThemeVars() {
    const r = document.documentElement.style;
    r.setProperty('--hue-primary', String(settings.huePrimary));
    r.setProperty('--hue-accent', String(settings.hueAccent));
    r.setProperty('--neon', String(settings.neonStrength));
  }

  // ===== Video optional =====
  (async function attachVideo(){
    try {
      const r = await fetch('/videos/road.mp4', { method: 'HEAD' });
      if (r.ok) {
        const v = $('#bg-video');
        v.innerHTML = '<source src="/videos/road.mp4" type="video/mp4">';
        v.load(); v.play().catch(() => {});
        v.classList.add('visible');
      }
    } catch {}
  })();

  // ===== Modal =====
  const modal = $('#modal');
  const panel = $('.modal__panel');
  const modalContent = $('#modal-content');
  const modalClose = $('#modal-close');
  let lastFocused = null;
  function openModal(html) {
    lastFocused = document.activeElement;
    modalContent.innerHTML = html;
    modal.setAttribute('aria-hidden', 'false');
    panel.focus();
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modalContent.innerHTML = '';
    modalClose.blur();
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modalClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  $('[data-copy="modal"]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#modal-content').innerText); } catch {}
  });

  // ===== Bubble engine =====
  class Bubble {
    constructor(x, y, r, color, label) {
      this.x = x; this.y = y; this.r = r;
      this.color = color; this.alpha = 0; this.label = label;
      const a = Math.random() * Math.PI * 2;
      const speed = (0.12 + Math.random() * 0.22) * settings.speedScale;
      this.vx = Math.cos(a) * speed;
      this.vy = Math.sin(a) * speed * 0.6;
      this.osc = Math.random() * Math.PI * 2;
      this.oscSpeed = 0.003 + Math.random() * 0.003;
      this.ttl = 26_000 + Math.random() * 18_000;
      if (settings.verySlowMode) { this.vx *= 0.5; this.vy *= 0.5; this.ttl *= 1.6; }
      this.created = performance.now();
      this.labelEl = null;
    }
    alive(now) { return now - this.created < this.ttl; }
    progress(now) { return Math.min(1, (now - this.created) / this.ttl); }
  }

  class BubbleField {
    constructor(canvas, labelLayer) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: true });
      this.labels = labelLayer; this.bubbles = []; this.running = false;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.spawn = this.spawn.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.floor(window.innerWidth * dpr);
      this.canvas.height = Math.floor(window.innerHeight * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this._spawnTimer = setInterval(this.spawn, settings.spawnEveryMs * (settings.verySlowMode ? 1.6 : 1));
      requestAnimationFrame(this.tick);
    }
    stop() { this.running = false; clearInterval(this._spawnTimer); }
    applySettings() {
      clearInterval(this._spawnTimer);
      this._spawnTimer = setInterval(this.spawn, settings.spawnEveryMs * (settings.verySlowMode ? 1.6 : 1));
    }
    spawn() {
      if (this.bubbles.length >= settings.maxBubbles) return;
      const r = pick(settings.sizeBuckets);
      let x=0,y=0,ok=false;
      // einfache Platzierung mit Mindestabstand
      const minSep = r * 0.9;
      for (let tries=0; tries<12 && !ok; tries++) {
        x = rand(r, window.innerWidth - r);
        y = rand(Math.max(80, r), window.innerHeight - r);
        ok = this.bubbles.every(b => dist(x,y,b.x,b.y) > Math.max(minSep, (b.r + r)*0.5));
      }
      if(!ok){ x = rand(r, window.innerWidth - r); y = rand(Math.max(80, r), window.innerHeight - r); }
      const color = neonHue();
      const prompt = pick(Math.random()<0.5?BUSINESS_PROMPTS:PROMPTS);
      const b = new Bubble(x, y, r, color, prompt.title);
      this.bubbles.push(b);
      // Label DOM
      const el = document.createElement('button');
      el.className = 'bubble-label'; el.type = 'button';
      el.textContent = prompt.title;
      el.style.left = `${x}px`; el.style.top = `${y}px`;
      el.addEventListener('click', () => openPrompt(prompt));
      this.labels.appendChild(el); b.labelEl = el;
      this.resolveLabelCollisions();
    }
    resolveLabelCollisions() {
      const els = $$('.bubble-label', this.labels);
      for (let i = 0; i < els.length; i += 1) {
        const a = els[i].getBoundingClientRect();
        for (let j = i + 1; j < els.length; j += 1) {
          const b = els[j].getBoundingClientRect();
          if (overlap(a, b)) {
            const tgt = els[j];
            tgt.style.transform = 'translate(calc(-50% + 10px), calc(-50% + 8px))';
          }
        }
      }
    }
    tick(now) {
      if (!this.running) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const alive = [];
      for (const b of this.bubbles) {
        if (!b.alive(now)) { if (b.labelEl) b.labelEl.remove(); continue; }
        const t = b.progress(now);
        b.alpha = t < 0.12 ? t / 0.12 : (t > 0.88 ? (1 - t) / 0.12 : 1);
        b.osc += b.oscSpeed;
        b.x += b.vx + Math.cos(b.osc) * 0.08;
        b.y += b.vy + Math.sin(b.osc * 0.7) * 0.05;

        // Wraparound
        if (b.x < -b.r) b.x = window.innerWidth + b.r;
        if (b.x > window.innerWidth + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = window.innerHeight + b.r;
        if (b.y > window.innerHeight + b.r) b.y = -b.r;

        // Zeichnen
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grd.addColorStop(0, `hsla(${b.color}, 100%, 65%, ${0.6*b.alpha})`);
        grd.addColorStop(0.6, `hsla(${b.color}, 100%, 50%, ${0.3*b.alpha})`);
        grd.addColorStop(1, `hsla(${b.color}, 100%, 35%, 0)`);
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();

        // Label positionieren
        if (b.labelEl) {
          b.labelEl.style.left = `${b.x}px`; b.labelEl.style.top = `${b.y}px`;
          b.labelEl.style.opacity = String(Math.max(0, Math.min(1, b.alpha)));
        }
        alive.push(b);
      }
      this.bubbles = alive;
      requestAnimationFrame(this.tick);
    }
  }

  // ===== Helpers =====
  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function neonHue(){
    return Math.random() < 0.6
      ? settings.huePrimary + rand(-20, 20)
      : settings.hueAccent + rand(-25, 25);
  }
  function overlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }
  function dist(x1,y1,x2,y2){ const dx=x1-x2, dy=y1-y2; return Math.hypot(dx,dy); }
  function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  // ===== Business Prompts (15) =====
  const BUSINESS_PROMPTS = [
    { title:"1‑Minute‑Briefing", body:`Du bist Chief of Staff. Fasse folgendes in 1 Minute zusammen: Ziel, 3 Kernfakten, 1 Risiko, Entscheidung für heute. Text: <EINFÜGEN>.`},
    { title:"Meeting‑Design", body:`Entwirf eine 30‑Minuten‑Agenda (Ziel, Vorbereitung, 3 Blöcke, Entscheidung, Nachlauf). Kontext: <EINFÜGEN>.`},
    { title:"Pitch‑Storyboard", body:`Erstelle ein 7‑Folien‑Storyboard (Hook, Problem, Lösung, Beweis, Nutzen, Plan, CTA). Produkt/Idee: <EINFÜGEN>.`},
    { title:"Brainstorm‑Sprint", body:`Leite einen 15‑Minuten‑Sprint: 3 Perspektiven, 10 Ideen, 3 Cluster, 1 Test. Thema: <EINFÜGEN>.`},
    { title:"Kontrast‑Paar", body:`Gib mir Lösung A konservativ vs. B radikal – jeweils mit 3 Kriterien: Zeit, Risiko, Wirkung. Thema: <EINFÜGEN>.`},
    { title:"Stakeholder‑Map", body:`Erstelle eine Map (Treiber, Blocker, Influencer, Nutzer). Für jeden: Motiv, Nutzwert, Win.`},
    { title:"Risiko‑PreMortem", body:`Tu so, als sei das Projekt gescheitert. Liste die 7 Gründe, Frühwarnsignale und Gegenmaßnahmen.`},
    { title:"Email‑Rewrite (klar)", body:`Schreibe diese Mail kürzer, präziser, freundlich‑klar. 3 Bullet‑Entscheidungen zuerst. Text: <EINFÜGEN>.`},
    { title:"Kundeninterview‑Leitfaden", body:`Baue 10 Fragen: Problemtiefe, Alternativen, Kaufkriterien, Budget, Nächste Schritte. Produkt: <EINFÜGEN>.`},
    { title:"Value Proposition", body:`Formuliere eine präzise Value Prop (Zielgruppe, Schmerz, Nutzen, Beweis). Produkt: <EINFÜGEN>.`},
    { title:"Landing‑Page‑Copy", body:`Schreibe Headline, Subline, 3 Nutzen, 1 Beweis, CTA. Ton: seriös‑optimistisch. Produkt: <EINFÜGEN>.`},
    { title:"Change‑Memo (1‑Pager)", body:`Erstelle ein 1‑Pager‑Memo: Warum jetzt? Was ändert sich? Was bleibt? 30‑Tage‑Plan.`},
    { title:"Entscheidungsmatrix", body:`Baue eine 2×2 oder gewichtete Matrix. Kriterien & Gewichte vorschlagen, dann Entscheidung.`},
    { title:"Roadmap‑Quartal", body:`Skizziere eine Q‑Roadmap: 3 Ziele, 6 Initiativen, Meilensteine, Risiken, KPIs.`},
    { title:"Post‑Mortem (konstruktiv)", body:`Schreibe ein blameless Post‑Mortem mit Ursachen, Learnings, 3 Prozess‑Fixes.`}
  ];

  // ===== Kreativ Prompts (30) =====
  const PROMPTS = [
    { title: "Zeitreise‑Tagebuch", body:`Du bist ein Zeitreise‑Editor...`},
    { title: "Rückwärts‑Zivilisation", body:`Beschreibe eine Zivilisation...`},
    { title: "Bewusstsein eines Gebäudes", body:`Erzähle aus der Perspektive...`},
    { title: "KI‑Philosophie‑Mentor", body:`Du bist ein altgriechischer Philosoph...`},
    { title: "Interdimensionaler Marktplatz", body:`Ich bin Besucher...`},
    { title: "Geheimes Leben eines NPCs", body:`Du bist ein NPC...`},
    { title: "Prompt‑Archäologe", body:`Analysiere einen Prompt...`},
    { title: "KI‑Träume", body:`Simuliere Träume einer KI...`},
    { title: "Recursive Story", body:`Geschichte über einen Autor...`},
    { title: "Xenobiologe 2157", body:`Stelle drei Lebensformen...`},
    { title: "Quantentagebuch", body:`Tagebuch eines Teilchens...`},
    { title: "Rückwärts‑Apokalypse", body:`Die Welt wird immer perfekter...`},
    { title: "Farbsynästhetiker", body:`Wandle Musik...`},
    { title: "Museum verlorener Träume", body:`Du bist Kurator...`},
    { title: "Zeitlupen‑Explosion", body:`Beschreibe eine Explosion...`},
    { title: "GPS des Bewusstseins", body:`Sei ein GPS...`},
    { title: "Biografie eines Pixels", body:`Lebensgeschichte eines Pixels...`},
    { title: "Rückwärts‑Detektiv", body:`Detektiv rückwärts...`},
    { title: "Internet als Bewusstsein", body:`Gespräch mit dem Internet...`},
    { title: "Emotions‑Alchemist", body:`Alchemie der Gefühle...`},
    { title: "Bibliothek ungelebter Leben", body:`Drei Bücher...`},
    { title: "Realitäts‑Debugger", body:`Bugs im Universum...`},
    { title: "Empathie‑Tutorial", body:`Interaktives Tutorial...`},
    { title: "Surrealismus‑Generator", body:`Alltagsgegenstände → surreal...`},
    { title: "Vintage‑Futurist", body:`Moderne Tech in den 1920ern...`},
    { title: "Synästhetisches Internet", body:`Internet für alle Sinne...`},
    { title: "Code‑Poet", body:`Code als Poesie...`},
    { title: "Kollektiv‑Gedankenrunde", body:`Moderation innerer Anteile...`},
    { title: "Paradox‑Werkstatt", body:`Paradoxien produktiv...`},
    { title: "Universums‑Übersetzer", body:`Übersetze Quantenphysik...`}
  ];

  function openPrompt(p) {
    openModal(`<h2>${p.title}</h2><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(p.body)}</pre>`);
  }

  // ===== API detection: prefer Netlify proxy first =====
  const META_API = (document.querySelector('meta[name="x-api-base"]')||{}).content || '';
  const API_CANDIDATES = ['/_api', META_API.replace(/\/$/,'')].filter(Boolean).concat(['/api']);
  let apiBaseWorking = localStorage.getItem('apiBaseWorking') || '';

  async function tryHealth(base){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), 4000);
    try{
      const r = await fetch(`${base}/healthz`, { method:'GET', mode:'cors', credentials:'omit', cache:'no-store', signal: ctrl.signal });
      return r.ok;
    }catch{ return false; } finally { clearTimeout(t); }
  }

  async function resolveApiBase(){
    const candidates = apiBaseWorking ? [apiBaseWorking].concat(API_CANDIDATES) : API_CANDIDATES;
    for(const base of candidates){
      if (!base) continue;
      const ok = await tryHealth(base);
      if (ok){ localStorage.setItem('apiBaseWorking', base); return base; }
    }
    throw new Error('no_api_base');
  }

  async function apiFetch(path) {
    const base = await resolveApiBase();
    const url = `${base}${path}`;
    const r = await fetch(url, { mode:'cors', credentials:'omit', cache:'no-store' });
    if (!r.ok) throw new Error(`api_status_${r.status}`);
    return await r.json();
  }

  // ===== News =====
  async function showNews() {
    const region = localStorage.getItem('newsRegion') || 'all';
    let usedBase = '';
    try {
      usedBase = await resolveApiBase();
      const data = await apiFetch(`/api/news/live?region=${encodeURIComponent(region)}`);
      const items = (data.items || []).slice(0, 12);
      const list = items.map(it => {
        const host = hostOf(it.url);
        const when = relTime(it.published);
        return `<li><a href="${it.url}" target="_blank" rel="noopener">${it.title || it.url}</a>
        ${host?`<small> · ${host}</small>`:''} ${when?`<small> · ${when}</small>`:''}
        ${it.snippet?`<p>${it.snippet}</p>`:''}</li>`;
      }).join('');
      const chip = (v,l) => `<button class="ui btn ${v===region?'active':''}" data-region="${v}">${l}</button>`;
      openModal(
        `<h2>EU AI Act & DACH-News</h2>
         <div class="filter-chips">${chip('all','Alle')}${chip('dach','DACH')}${chip('eu','EU')}</div>
         <div class="tabs">
           <span class="ui btn ghost">API: ${escapeHtml(usedBase)}</span>
           <a class="ui btn" href="${usedBase}/api/digest.svg?region=${region}" target="_blank" rel="noopener">Digest‑SVG</a>
           <a class="ui btn ghost" href="${usedBase}/healthz" target="_blank" rel="noopener">Health</a>
           <button class="ui btn ghost" id="news-reload">Neu laden</button>
         </div>
         <ul class="news">${list || '<li>Keine Einträge (API/Key?)</li>'}</ul>`
      );
      $('#news-reload').addEventListener('click', showNews);
      $('#modal').querySelectorAll('[data-region]').forEach(el => el.addEventListener('click', () => {
        localStorage.setItem('newsRegion', el.getAttribute('data-region')); showNews();
      }));
    } catch (e) {
      const hint = `API derzeit nicht erreichbar. Prüfe _redirects oder CORS. Base‑Kandidaten: ${API_CANDIDATES.join(', ')}`;
      const diagLinks = API_CANDIDATES.map(b => `<li><a class="ui btn" href="${b}/healthz" target="_blank" rel="noopener">${b}/healthz</a></li>`).join('');
      openModal(`<h2>News</h2><p>${escapeHtml(hint)}</p><ul class="news">${diagLinks}</ul>`);
    }
  }

  // ===== Prompts (Tabs) =====
  function showPrompts(category='business') {
    const set = category==='creative' ? PROMPTS : BUSINESS_PROMPTS;
    const items = set.map(p => `<li><button class="ui btn" data-p="${p.title}">${p.title}</button></li>`).join('');
    openModal(`<h2>Prompts</h2>
      <div class="tabs">
        <button class="ui btn ${category==='business'?'active':''}" data-tab="business">Büro‑Tauglich (15)</button>
        <button class="ui btn ${category==='creative'?'active':''}" data-tab="creative">Kreativ‑Eye‑Candy (30)</button>
      </div>
      <ul class="news">${items}</ul>`);
    $('#modal').querySelectorAll('[data-p]').forEach(b=>{
      const title=b.getAttribute('data-p'); const p=(set.find(x=>x.title===title));
      b.addEventListener('click',()=>openPrompt(p));
    });
    $('#modal').querySelectorAll('[data-tab]').forEach(t=>t.addEventListener('click',()=>showPrompts(t.getAttribute('data-tab'))));
  }

  function showProjekte() {
    openModal(`<h2>Projekte</h2>
      <p><strong>Mit TÜV-zertifizierter Sicherheit in die KI-Zukunft:</strong> Der erfolgreiche Einsatz von KI ist keine Raketenwissenschaft – sondern das Ergebnis unabhängiger Prüfung, fundierter Expertise und strukturierter Vorbereitung.</p>
      <p>Als TÜV-zertifizierter KI-Manager begleite ich Ihr Unternehmen dabei, sämtliche Anforderungen des EU AI Acts transparent, nachvollziehbar und rechtssicher umzusetzen.</p>
      <p><a class="ui btn" href="https://ki-sicherheit.jetzt/" target="_blank" rel="noopener">ki-sicherheit.jetzt</a></p>`);
  }
  function showImpressum() {
    openModal(`<h2>Rechtliches & Transparenz</h2>
      <p><strong>Verantwortlich für den Inhalt:</strong><br/>Wolf Hohl, Greifswalder Str. 224a, 10405 Berlin</p>
      <p>E-Mail: <a href="mailto:info@hohl.rocks">info@hohl.rocks</a></p>
      <p><strong>Haftungsausschluss:</strong> Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>
      <p><strong>Urheberrecht:</strong> Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.</p>
      <p><strong>Hinweis zum EU AI Act:</strong> Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>
      <p><strong>Datenschutzerklärung:</strong> Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.</p>
      <p><em>Kontakt:</em> Bei Kontakt per Formular oder E-Mail werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.</p>
      <p><em>Cookies:</em> Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.</p>
      <p><em>Ihre Rechte laut DSGVO:</em> Auskunft, Berichtigung oder Löschung Ihrer Daten; Datenübertragbarkeit; Widerruf erteilter Einwilligungen; Beschwerde bei der Datenschutzbehörde.</p>`);
  }
  function showAbout(){ openModal('<h2>Über</h2><p>hohl.rocks – KI-gestützte Web-Experience.</p>'); }
  function togglePad(){ /* optional */ }
  function toggleLocale(){ /* optional */ }

  // Settings
  function openSettings(){
    openModal(`
      <h2>Einstellungen</h2>
      <form class="settings">
        <label>Very-slow-mode <input type="checkbox" id="verySlow"></label>
        <label>Max. Bubbles <input type="range" id="mB" min="6" max="40" step="1" value="${settings.maxBubbles}"><output id="mBo">${settings.maxBubbles}</output></label>
        <label>Spawn-Intervall (ms) <input type="range" id="sp" min="1500" max="9000" step="100" value="${settings.spawnEveryMs}"><output id="spo">${settings.spawnEveryMs}</output></label>
      </form>`);
    $('#verySlow').checked = settings.verySlowMode;
    $('#verySlow').addEventListener('change', e => { saveSettings({ verySlowMode: e.target.checked }); });
    $('#mB').addEventListener('input', e => { $('#mBo').textContent = e.target.value; });
    $('#mB').addEventListener('change', e => { saveSettings({ maxBubbles: Number(e.target.value) }); });
    $('#sp').addEventListener('input', e => { $('#spo').textContent = e.target.value; });
    $('#sp').addEventListener('change', e => { saveSettings({ spawnEveryMs: Number(e.target.value) }); });
  }

  // Events
  $('.site-nav').addEventListener('click',(e)=>{
    const b=e.target.closest('[data-action]'); if(!b) return;
    const a=b.dataset.action;
    if(a==='news') return showNews();
    if(a==='prompts') return showPrompts('business');
    if(a==='projekte') return showProjekte();
    if(a==='impressum') return showImpressum();
    if(a==='about') return showAbout();
    if(a==='klang') return togglePad();
    if(a==='settings') return openSettings();
  });

  // Time & URL helpers
  function relTime(iso){
    if(!iso) return '';
    const t = new Date(iso).getTime(); if(!Number.isFinite(t)) return '';
    const s = Math.max(1, Math.floor((Date.now()-t)/1000));
    if (s < 60) return `vor ${s}s`;
    const m = Math.floor(s/60); if (m < 60) return `vor ${m}min`;
    const h = Math.floor(m/60); if (h < 24) return `vor ${h}h`;
    const d = Math.floor(h/24); return `vor ${d}d`;
  }
  function hostOf(u){ try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ''; } }

  // Start
  const field = new BubbleField($('#bubbles'), $('#labels'));
  field.start();
})();
