/* hohl.rocks – v1.4.3
   - Fix: SyntaxError beseitigt (Canvas startete nicht)
   - Bubbles: 5 Größen, very-slow-mode, organische Drift
   - Label-Layer bleibt lesbar trotz Überlappungen (sanfte Abstoßung)
   - Top-Navigation only; Modal mit Fokus-Management
   - News via Netlify-Proxy "/_api" → Railway-API
*/
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // --- App State / Settings ---
  const defaults = {
    maxBubbles: 18,
    spawnEveryMs: 3800,
    speedScale: 0.85,
    sizeBuckets: [120, 180, 240, 320, 420],
    verySlowMode: false,
    huePrimary: 200,
    hueAccent: 320,
    neonStrength: 0.65
  };
  let settings = loadSettings();
  applyThemeVars();

  function loadSettings() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem('settings') || '{}') };
    } catch {
      return { ...defaults };
    }
  }
  function saveSettings(next) {
    settings = { ...settings, ...next };
    localStorage.setItem('settings', JSON.stringify(settings));
    applyThemeVars();
  }
  function applyThemeVars() {
    const r = document.documentElement.style;
    r.setProperty('--hue-primary', String(settings.huePrimary));
    r.setProperty('--hue-accent', String(settings.hueAccent));
    r.setProperty('--neon', String(settings.neonStrength));
  }

  // --- Modal (A11y) ---
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

  // --- Bubbles Field ---
  class Bubble {
    constructor(x, y, r, color, label) {
      this.x = x; this.y = y; this.r = r;
      this.color = color;
      this.alpha = 0;               // fade-in
      this.life = 0;                // 0..1
      this.label = label;
      const a = Math.random() * Math.PI * 2;
      const speed = (0.12 + Math.random() * 0.22) * settings.speedScale;
      this.vx = Math.cos(a) * speed;
      this.vy = Math.sin(a) * speed * 0.6;
      this.osc = Math.random() * Math.PI * 2;
      this.oscSpeed = 0.003 + Math.random() * 0.003;
      this.ttl = 22_000 + Math.random() * 16_000; // ms
      if (settings.verySlowMode) {
        this.vx *= 0.5; this.vy *= 0.5; this.ttl *= 1.6;
      }
      this.created = performance.now();
      this.labelEl = null;
    }
    alive(now) { return now - this.created < this.ttl; }
    progress(now) { return Math.min(1, (now - this.created) / this.ttl); }
  }

  class BubbleField {
    constructor(canvas, labelLayer) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: true });
      this.labels = labelLayer;
      this.bubbles = [];
      this.running = false;
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
    stop() {
      this.running = false;
      clearInterval(this._spawnTimer);
    }
    applySettings() {
      clearInterval(this._spawnTimer);
      this._spawnTimer = setInterval(this.spawn, settings.spawnEveryMs * (settings.verySlowMode ? 1.6 : 1));
    }
    spawn() {
      if (this.bubbles.length >= settings.maxBubbles) return;
      const r = randomFrom(settings.sizeBuckets);
      const x = rand(r, window.innerWidth - r);
      const y = rand(r, window.innerHeight - r);
      const color = neonHue();
      const prompt = randomFrom(PROMPTS);
      const b = new Bubble(x, y, r, color, prompt.title);
      this.bubbles.push(b);
      // Label DOM
      const el = document.createElement('button');
      el.className = 'bubble-label';
      el.type = 'button';
      el.textContent = prompt.title;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.addEventListener('click', () => openPrompt(prompt));
      this.labels.appendChild(el);
      b.labelEl = el;
      this.resolveLabelCollisions(); // sanfte Entschärfung
    }
    resolveLabelCollisions() {
      const els = $$('.bubble-label', this.labels);
      for (let i = 0; i < els.length; i += 1) {
        const a = els[i].getBoundingClientRect();
        for (let j = i + 1; j < els.length; j += 1) {
          const b = els[j].getBoundingClientRect();
          if (overlap(a, b)) {
            // schiebe das zweite leicht nach unten rechts
            const tgt = els[j];
            tgt.style.transform = 'translate(calc(-50% + 8px), calc(-50% + 6px))';
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
        if (!b.alive(now)) {
          if (b.labelEl) b.labelEl.remove();
          continue;
        }
        const t = b.progress(now);
        // Fade-in/out
        b.alpha = t < 0.15 ? t / 0.15 : (t > 0.85 ? (1 - t) / 0.15 : 1);

        // Drift + leichte Oszillation
        b.osc += b.oscSpeed;
        b.x += b.vx + Math.cos(b.osc) * 0.08;
        b.y += b.vy + Math.sin(b.osc * 0.7) * 0.05;

        // Ränder umrunden
        if (b.x < -b.r) b.x = window.innerWidth + b.r;
        if (b.x > window.innerWidth + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = window.innerHeight + b.r;
        if (b.y > window.innerHeight + b.r) b.y = -b.r;

        // Zeichnen
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grd.addColorStop(0, `hsla(${b.color}, 100%, 65%, ${0.55*b.alpha})`);
        grd.addColorStop(0.6, `hsla(${b.color}, 100%, 50%, ${0.25*b.alpha})`);
        grd.addColorStop(1, `hsla(${b.color}, 100%, 35%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();

        // Label positionieren
        if (b.labelEl) {
          b.labelEl.style.left = `${b.x}px`;
          b.labelEl.style.top = `${b.y}px`;
          b.labelEl.style.opacity = String(Math.max(0, Math.min(1, b.alpha)));
        }
        alive.push(b);
      }
      this.bubbles = alive;
      requestAnimationFrame(this.tick);
    }
  }

  // --- Helpers ---
  function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
  function randomFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function neonHue(){
    // verteilt um zwei Hues (primary/accent)
    return Math.random() < 0.6
      ? settings.huePrimary + rand(-20, 20)
      : settings.hueAccent + rand(-25, 25);
  }
  function overlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  // --- Prompts (15 Büro-tauglich) ---
  const PROMPTS = [
    { title: "One-Minute-Plan", body:
`Ziel: In 60 Sekunden Klarheit schaffen.
1) Aufgabe in 1 Satz:
2) Stakeholder & „Done“-Kriterium:
3) Nächster kleinstmöglicher Schritt:
4) Blocker & Annahmen:
Antwort in 80 Wörtern. Ton: pragmatisch.`},
    { title: "Meeting-Destillat", body:
`Rolle: Meeting-Protokollant:in.
Eingabe: Rohnotizen (Stichworte).
Aufgabe: verdichte zu 5 Bulletpoints + 3 Entscheidungen + 3 Todos mit Owner und Termin.`},
    { title: "Pitch-Gliederung 5/5/5", body:
`Thema: <…>
Erzeuge: 5 Folien, je 5 Wörter Überschrift + 5 Stichpunkte (max 8 Wörter).
Schließe mit „Next Steps“ in 3 Punkten.`},
    { title: "Brainstorming Divergent", body:
`Ziel: 12 unkonventionelle Ideen in 3 Clustern.
Regeln: kein „das geht nicht“, Fokus Überraschung & Machbarkeit grob schätzen (€ / Aufwand / Risiko).`},
    { title: "Kontrast-Paar", body:
`Vergleiche Lösung A (konservativ) vs. B (radikal) anhand 3 Kriterien:
Zeit, Budget, Risiko. Schließe mit Empfehlung + kurzer Begründung.`},
    { title: "GIST→FACT→CITE", body:
`Gib zuerst die Kernaussage (GIST) in 15 Wörtern,
dann 3 belegbare Fakten (FACT) und
zum Schluss 2 Quellen (CITE, sauber formatiert).`},
    { title: "RAG-Memo Mini", body:
`Kontext: <Text/Snippets>.
Aufgabe: Antworte nur mit Zitaten + Kurzkommentar (max 2 Sätze je Zitat).
Keine Spekulation ohne Quelle.`},
    { title: "Varianten 4×", body:
`Erzeuge vier Stil-Varianten (tonal): nüchtern, inspirierend, provokant, herzlich.
Für jede: 2 Sätze + 1 Hook.`},
    { title: "Story-Chop", body:
`Teile langen Text in 6 logisch benannte Abschnitte.
Für jeden: 1 Aussage, 1 Beleg, 1 offene Frage.`},
    { title: "E-Mail-Klartext", body:
`Konvertiere Draft in 3 Abschnitte:
Anliegen (1 Satz), Details (3 Bullets), Bitte/Nächster Schritt (1 Satz). Ton freundlich-sachlich.`},
    { title: "Retro Kurz", body:
`Team-Retro in 5 Minuten.
Liste: 3x gut, 3x schwierig, 3x nächster Sprint. Ohne Schuldzuweisungen.`},
    { title: "Entscheidungsmatrix 3x3", body:
`Vergleiche 3 Optionen anhand: Wirkung, Aufwand, Risiko (1-5).
Liefere Tabelle + kurze Empfehlung.`},
    { title: "Prompt-Linter", body:
`Analysiere Prompt auf Klarheit, Rollen, Constraints, Output-Format.
Gib 5 Verbesserungsvorschläge + eine optimierte Version.`},
    { title: "Cage-Match", body:
`Lass zwei Modelle (A/B) gegeneinander argumentieren, danach Schiedsspruch mit Begründung (3 Kriterien).`},
    { title: "Research-Agent", body:
`Frage präzisieren → 5 Quellen DACH/EU → 3 Key-Facts je Quelle → 1 Absatz Synthese mit Risiken & Grenzen.`}
  ];

  function openPrompt(p) {
    openModal(`<h2>${p.title}</h2><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(p.body)}</pre>`);
  }
  function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  // --- Navigation ---
  const API_BASE = '/_api';
  function api(path){ return `${API_BASE}${path}`; }

  async function showNews() {
    const region = localStorage.getItem('newsRegion') || 'all';
    try {
      const r = await fetch(api(`/api/news/live?region=${encodeURIComponent(region)}`));
      const data = await r.json();
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
         <div style="display:flex;gap:8px;margin-bottom:8px;">
           <a class="ui btn" href="${api('/api/digest.svg')}?region=${region}" target="_blank" rel="noopener">Digest-Karte (SVG)</a>
           <button class="ui btn ghost" id="news-reload">Neu laden</button>
         </div>
         <ul class="news">${list || '<li>Keine Einträge (API-Key oder API-Service fehlt?)</li>'}</ul>`
      );
      $('#news-reload').addEventListener('click', showNews);
      $('#modal').querySelectorAll('[data-region]').forEach(el => el.addEventListener('click', () => {
        localStorage.setItem('newsRegion', el.getAttribute('data-region')); showNews();
      }));
    } catch {
      openModal('<h2>News</h2><p>API derzeit nicht erreichbar.</p>');
    }
  }
  function showPrompts() {
    const items = PROMPTS.map(p => `<li><button class="ui btn" data-p="${p.title}">${p.title}</button></li>`).join('');
    openModal(`<h2>Prompts</h2><ul class="news">${items}</ul>`);
    $('#modal').querySelectorAll('[data-p]').forEach(b=>{
      const title=b.getAttribute('data-p'); const p=PROMPTS.find(x=>x.title===title);
      b.addEventListener('click',()=>openPrompt(p));
    });
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
  function togglePad(){ /* optionaler Ambient-Sound – hier neutral */ }
  function toggleLocale(){ /* Platzhalter DE/EN – Texte aktuell auf DE */ }

  // Settings-UI
  function openSettings(){
    openModal(`
      <h2>Einstellungen</h2>
      <form class="settings">
        <label>Very-slow-mode <input type="checkbox" id="verySlow"></label>
        <label>Max. Bubbles <input type="range" id="mB" min="6" max="40" step="1" value="${settings.maxBubbles}"><output id="mBo">${settings.maxBubbles}</output></label>
        <label>Spawn-Intervall (ms) <input type="range" id="sp" min="1500" max="8000" step="100" value="${settings.spawnEveryMs}"><output id="spo">${settings.spawnEveryMs}</output></label>
      </form>`);
    $('#verySlow').checked = settings.verySlowMode;
    $('#verySlow').addEventListener('change', e => { saveSettings({ verySlowMode: e.target.checked }); field.applySettings(); });
    $('#mB').addEventListener('input', e => { $('#mBo').textContent = e.target.value; });
    $('#mB').addEventListener('change', e => { saveSettings({ maxBubbles: Number(e.target.value) }); });
    $('#sp').addEventListener('input', e => { $('#spo').textContent = e.target.value; });
    $('#sp').addEventListener('change', e => { saveSettings({ spawnEveryMs: Number(e.target.value) }); field.applySettings(); });
  }

  // Events
  $('.site-nav').addEventListener('click',(e)=>{
    const b=e.target.closest('[data-action]'); if(!b) return;
    const a=b.dataset.action;
    if(a==='news') return showNews();
    if(a==='prompts') return showPrompts();
    if(a==='projekte') return showProjekte();
    if(a==='impressum') return showImpressum();
    if(a==='about') return showAbout();
    if(a==='klang') return togglePad();
    if(a==='settings') return openSettings();
  });

  // Utilities News time
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
