const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ---- Modal with focus management ----
const modal = $('#modal');
const panel = $('.modal__panel');
const modalClose = $('.modal__close');
const modalContent = $('#modal-content');
let lastFocused = null;

function openModal(html) {
  lastFocused = document.activeElement;
  modalContent.innerHTML = html || '';
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
panel.querySelector('[data-copy="modal"]').addEventListener('click', async () => {
  const text = $('#modal-content').innerText;
  try { await navigator.clipboard.writeText(text); } catch {}
});

// ---- Settings (persisted) ----
const defaults = {
  maxBubbles: 18,
  spawnEveryMs: 3800,
  speedScale: 0.85,
  sizeMin: 100,
  sizeMax: 260,
  huePrimary: 200,
  hueAccent: 320,
  neonStrength: 0.65,
  padPreset: 'hell', // 'aus' | 'hell' | 'dunkel'
  padAutoPulse: true,
  verySlowMode: false
};
function loadSettings(){
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('settings') || '{}') }; }
  catch { return { ...defaults }; }
}
function saveSettings(s){
  localStorage.setItem('settings', JSON.stringify(s));
  document.documentElement.style.setProperty('--hue-primary', String(s.huePrimary));
  document.documentElement.style.setProperty('--hue-accent', String(s.hueAccent));
  document.documentElement.style.setProperty('--neon-strength', String(s.neonStrength));
}
let settings = loadSettings(); saveSettings(settings);

// ---- Favorites util ----
function favs(){ try { return new Set(JSON.parse(localStorage.getItem('favorites')||'[]')); } catch { return new Set(); } }
function saveFavs(set){ localStorage.setItem('favorites', JSON.stringify(Array.from(set))); }

function openSettings(){
  const checked = (v,k) => (settings[k]===v ? 'checked' : '');
  const html = `<h2>Einstellungen</h2>
  <p>Feintuning für Bubbles, Neon & Klang. Änderungen wirken sofort und werden lokal gespeichert.</p>
  <form class="settings">
    <label>Max. Bubbles <input type="range" min="6" max="40" step="1" value="${settings.maxBubbles}" data-k="maxBubbles"><output>${settings.maxBubbles}</output></label>
    <label>Spawn‑Intervall (ms) <input type="range" min="1500" max="8000" step="100" value="${settings.spawnEveryMs}" data-k="spawnEveryMs"><output>${settings.spawnEveryMs}</output></label>
    <label>Tempo‑Skalierung <input type="range" min="0.25" max="2" step="0.05" value="${settings.speedScale}" data-k="speedScale"><output>${settings.speedScale}</output></label>
    <label>Very‑slow‑mode <input type="checkbox" ${settings.verySlowMode ? 'checked' : ''} data-k="verySlowMode"></label>
    <label>Größe min <input type="range" min="60" max="240" step="5" value="${settings.sizeMin}" data-k="sizeMin"><output>${settings.sizeMin}</output></label>
    <label>Größe max <input type="range" min="160" max="460" step="5" value="${settings.sizeMax}" data-k="sizeMax"><output>${settings.sizeMax}</output></label>
    <fieldset><legend>Farben</legend>
      <label>Hue Primary <input type="range" min="0" max="359" step="1" value="${settings.huePrimary}" data-k="huePrimary"><output>${settings.huePrimary}</output></label>
      <label>Hue Accent <input type="range" min="0" max="359" step="1" value="${settings.hueAccent}" data-k="hueAccent"><output>${settings.hueAccent}</output></label>
      <label>Neon‑Stärke <input type="range" min="0.2" max="1" step="0.05" value="${settings.neonStrength}" data-k="neonStrength"><output>${settings.neonStrength}</output></label>
    </fieldset>
    <fieldset><legend>Klang</legend>
      <label><input type="radio" name="pad" value="aus" ${checked('aus','padPreset')} data-k="padPreset"> Aus</label>
      <label><input type="radio" name="pad" value="hell" ${checked('hell','padPreset')} data-k="padPreset"> Hell</label>
      <label><input type="radio" name="pad" value="dunkel" ${checked('dunkel','padPreset')} data-k="padPreset"> Dunkel</label>
      <label>Auto‑Modulation <input type="checkbox" ${settings.padAutoPulse?'checked':''} data-k="padAutoPulse"></label>
    </fieldset>
    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
      <button type="button" class="ui btn ghost" data-settings="reset">Zurücksetzen</button>
      <button type="button" class="ui btn" data-settings="close">Schließen</button>
    </div>
  </form>`;
  openModal(html);
  // range
  $('#modal').querySelectorAll('input[type="range"]').forEach(r => {
    const out = r.nextElementSibling; const key = r.getAttribute('data-k');
    const update = () => {
      out.textContent = r.value; settings[key] = Number(r.value);
      saveSettings(settings); field.applySettings(settings);
    };
    r.addEventListener('input', update); r.addEventListener('change', update);
  });
  // checkboxes/radios
  $('#modal').querySelectorAll('input[type="radio"][data-k],input[type="checkbox"][data-k]').forEach(el => {
    const key = el.getAttribute('data-k');
    const update = () => {
      settings[key] = (el.type==='checkbox') ? el.checked : el.value;
      saveSettings(settings); field.applySettings(settings); applyPadPreset();
    };
    el.addEventListener('change', update);
  });
  $('#modal').querySelector('[data-settings="reset"]').addEventListener('click', () => {
    settings = { ...defaults }; saveSettings(settings); field.applySettings(settings); applyPadPreset(); closeModal();
  });
  $('#modal').querySelector('[data-settings="close"]').addEventListener('click', closeModal);
}

// ---- Navigation & bottom dock ----
function handleAction(action) {
  if (action === 'news') return showNews();
  if (action === 'prompts') return showPrompts();
  if (action === 'favoriten') return showFavorites();
  if (action === 'projekte') return showProjekte();
  if (action === 'impressum') return showImpressum();
  if (action === 'about') return showAbout();
  if (action === 'locale') return toggleLocale();
  if (action === 'klang') return togglePad();
  if (action === 'settings') return openSettings();
}
$('.site-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]'); if (!btn) return; handleAction(btn.dataset.action);
});
$('.dock').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]'); if (!btn) return; handleAction(btn.dataset.action);
});

// Key Shortcuts
window.addEventListener('keydown', (e)=>{
  if (e.key.toLowerCase() === 'n') handleAction('news');
  if (e.key.toLowerCase() === 'p') handleAction('prompts');
  if (e.key.toLowerCase() === 's') handleAction('settings');
  if (e.key === 'Escape') closeModal();
});

// ---- News UI with region filter + digest ----
function hostOf(url){ try { return new URL(url).hostname.replace(/^www\./,''); } catch { return ''; } }
function relativeTime(iso){
  if (!iso) return '';
  const d = new Date(iso).getTime(); if (!isFinite(d)) return '';
  const delta = Math.max(1, Math.floor((Date.now() - d)/1000));
  let v=delta, suf='s';
  if (delta >= 604800) { v = Math.floor(delta/86400); suf='d'; }
  else if (delta >= 86400) { v = Math.floor(delta/86400); suf='d'; }
  else if (delta >= 3600) { v = Math.floor(delta/3600); suf='h'; }
  else if (delta >= 60) { v = Math.floor(delta/60); suf='min'; }
  return `vor ${v}${suf}`;
}
function makeDigest(items){
  const top = items.slice(0,3);
  if (!top.length) return 'Keine Meldungen verfügbar.';
  const bullets = top.map(it => `• ${it.title.replace(/\s+/g,' ').trim()}`).join(' ');
  return `Digest: ${bullets}`;
}
function getRegion(){ return localStorage.getItem('newsRegion') || 'all'; }
function setRegion(r){ localStorage.setItem('newsRegion', r); }

async function showNews(){
  const region = getRegion();
  const resp = await fetch('/api/news/live?region='+encodeURIComponent(region)).then((r) => r.json()).catch(() => ({ items: [] }));
  const items = (resp.items || []).slice(0, 12);
  const list = items.map((it) => {
    const host = hostOf(it.url);
    const when = relativeTime(it.published);
    return `<li><a href="${it.url}" target="_blank" rel="noopener noreferrer">${it.title || it.url}</a>
    ${host ? `<small> · ${host}</small>`:''} ${when ? `<small> · ${when}</small>`:''}
    ${it.snippet ? `<p>${it.snippet}</p>` : ''}</li>`;
  }).join('');
  const btn = (r, label) => `<button class="ui btn ${r===region?'active':''}" data-region="${r}">${label}</button>`;
  const html = `<h2>EU AI Act & DACH‑News</h2>
    <div class="filter-chips">${btn('all','Alle')}${btn('dach','DACH')}${btn('eu','EU')}</div>
    <p>${makeDigest(items)}</p>
    <div style="display:flex; gap:8px; margin-bottom:8px;">
      <a class="ui btn" id="weekly">Weekly Digest</a>
      <a class="ui btn ghost" id="reload">Neu laden</a>
      <a class="ui btn ghost" href="/api/digest.svg?region=${region}" target="_blank" rel="noopener">Digest‑Karte (SVG)</a>
    </div>
    <ul class="news">${list || '<li>Keine Einträge (API‑Key?)</li>'}</ul>`;
  openModal(html);
  $('#weekly').addEventListener('click', async () => {
    const r = await fetch('/api/ai-weekly').then(x=>x.json()).catch(()=>({items:[]}));
    const l = (r.items||[]).map(it=>`<li>${it.title}</li>`).join('');
    $('#modal-content').innerHTML = `<h2>Weekly Digest (EU AI Act)</h2><ul>${l||'<li>–</li>'}</ul>`;
  });
  $('#reload').addEventListener('click', showNews);
  $('#modal').querySelectorAll('[data-region]').forEach(el => {
    el.addEventListener('click', () => { setRegion(el.getAttribute('data-region')); showNews(); });
  });
}

// ---- Prompts + Favorites + Category filters ----
async function showPrompts(){
  const data = await fetch('/prompts.json').then(r => r.json()).catch(() => []);
  const fav = favs();
  const cats = Array.from(new Set(data.map(p => p.category))).sort();
  const cur = (localStorage.getItem('promptCat') || 'Alle');
  const chip = (c) => `<button class="ui btn ${c===cur?'active':''}" data-cat="${c}">${c}</button>`;
  const filterRow = `<div class="filter-chips">${chip('Alle')}${cats.map(chip).join('')}</div>`;
  const items = data.filter(p => cur==='Alle' or p.category===cur);
  const list = items.map(p => `<li>
    <strong>${p.title}</strong> <small>· ${p.category}</small>
    <span class="star ${fav.has(p.id)?'on':''}" data-star="${p.id}" title="Favorit">★</span><br>
    <button class="ui btn" data-copy-prompt="${p.id}">Kopieren</button>
    <pre id="p-${p.id}">${p.content}</pre></li>`).join('');
  openModal(`<h2>Prompts</h2>${filterRow}<ul>${list || '<li>Keine Prompts geladen.</li>'}</ul>`);
  // interactions
  $('#modal').querySelectorAll('[data-cat]').forEach(el => {
    el.addEventListener('click', () => { localStorage.setItem('promptCat', el.getAttribute('data-cat')); showPrompts(); });
  });
  $('#modal').querySelectorAll('[data-copy-prompt]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-copy-prompt');
      const txt = $('#p-' + id)?.innerText || '';
      try { await navigator.clipboard.writeText(txt); } catch {}
    });
  });
  $('#modal').querySelectorAll('[data-star]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-star'); const set = favs();
      if (set.has(id)) { set.delete(id); el.classList.remove('on'); }
      else { set.add(id); el.classList.add('on'); }
      saveFavs(set);
    });
  });
}

async function showFavorites(){
  const data = await fetch('/prompts.json').then(r => r.json()).catch(() => []);
  const set = favs();
  const sel = data.filter(p => set.has(p.id));
  if (!sel.length) return openModal('<h2>Favoriten</h2><p>Noch keine Favoriten. Öffne <em>Prompts</em> und markiere mit ★.</p>');
  const list = sel.map(p => `<li><strong>${p.title}</strong><br>
    <button class="ui btn" data-copy-prompt="${p.id}">Kopieren</button>
    <pre id="p-${p.id}">${p.content}</pre></li>`).join('');
  openModal(`<h2>Favoriten</h2><ul>${list}</ul>`);
  $('#modal').querySelectorAll('[data-copy-prompt]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-copy-prompt');
      const txt = $('#p-' + id)?.innerText || '';
      try { await navigator.clipboard.writeText(txt); } catch {}
    });
  });
}

// ---- Static content ----
async function showProjekte(){
  const html = `<h2>Projekte</h2>
  <p>Mit TÜV‑zertifizierter Sicherheit in die KI‑Zukunft: Der erfolgreiche Einsatz von KI ist keine Raketenwissenschaft – sondern das Ergebnis unabhängiger Prüfung, fundierter Expertise und strukturierter Vorbereitung. Als TÜV‑zertifizierter KI‑Manager begleite ich Ihr Unternehmen dabei, sämtliche Anforderungen des EU AI Acts transparent, nachvollziehbar und rechtssicher umzusetzen.</p>
  <p><a href="https://ki-sicherheit.jetzt/" target="_blank" rel="noopener">ki-sicherheit.jetzt</a></p>`;
  openModal(html);
}
async function showImpressum(){
  const html = `<h2>Rechtliches & Transparenz</h2>
  <h3>Impressum</h3>
  <p>Verantwortlich für den Inhalt:<br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin</p>
  <p><a href="mailto:" rel="nofollow">E‑Mail schreiben</a></p>
  <h3>Haftungsausschluss</h3>
  <p>Diese Website dient ausschließlich der Information. Trotz sorgfältiger Prüfung übernehme ich keine Haftung für Inhalte externer Links.</p>
  <h3>Urheberrecht</h3>
  <p>Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht, alle Bilder wurden mit Hilfe von Midjourney erzeugt.</p>
  <h3>Hinweis zum EU AI Act</h3>
  <p>Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Sie ersetzt keine Rechtsberatung.</p>
  <h3>Datenschutzerklärung</h3>
  <p>Der Schutz Ihrer persönlichen Daten ist mir ein besonderes Anliegen.</p>
  <h4>Kontakt mit mir</h4>
  <p>Wenn Sie per Formular oder E‑Mail Kontakt aufnehmen, werden Ihre Angaben zur Bearbeitung sechs Monate gespeichert.</p>
  <h4>Cookies</h4>
  <p>Diese Website verwendet keine Cookies zur Nutzerverfolgung oder Analyse.</p>
  <h4>Ihre Rechte laut DSGVO</h4>
  <ul>
    <li>Auskunft, Berichtigung oder Löschung Ihrer Daten</li>
    <li>Datenübertragbarkeit</li>
    <li>Widerruf erteilter Einwilligungen</li>
    <li>Beschwerde bei der Datenschutzbehörde</li>
  </ul>`;
  openModal(html);
}
function showAbout(){
  openModal(`<h2>Über hohl.rocks</h2><p>KI‑gestützte Web‑Experience: ruhige Neon‑Bubbles, sofort nutzbare Prompts, relevante DACH/EU‑News. Bedienung: Bubbles anklicken. Shortcuts: N/P/Esc, Einstellungen: S.</p>`);
}
function toggleLocale(){
  const cur = localStorage.getItem('locale') === 'en' ? 'de' : 'en';
  localStorage.setItem('locale', cur);
  openModal('<h2>Sprache</h2><p>Locale auf <strong>' + cur.toUpperCase() + '</strong> gesetzt.</p>');
}

// ---- Jellyfish Bubbles: five size buckets, very slow option, label collision avoidance ----
class BubbleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.bubbles = [];
    this.meta = [];
    this.maxBubbles = settings.maxBubbles;
    this.spawnEveryMs = settings.spawnEveryMs;
    this.speedScale = settings.speedScale;
    this.sizeMin = settings.sizeMin;
    this.sizeMax = settings.sizeMax;
    this.sizeBuckets = [120, 180, 240, 320, 420]; // five pleasing sizes
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(document.documentElement);
    this.resize();
    this.load();
  }
  applySettings(s){
    this.maxBubbles = s.maxBubbles;
    this.spawnEveryMs = s.spawnEveryMs * (s.verySlowMode ? 1.5 : 1);
    this.speedScale = (s.verySlowMode ? 0.45 : 1) * s.speedScale;
    this.sizeMin = s.sizeMin;
    this.sizeMax = s.sizeMax;
  }
  async load() {
    this.meta = await fetch('/bubbles.json').then(r => r.json()).catch(() => []);
    let t0 = performance.now();
    const loop = (t) => { const dt = t - t0; t0 = t; this.step(dt); this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    for (let i=0;i<8;i++) this.spawn();
    this.spawner = setInterval(() => { if (this.bubbles.length < this.maxBubbles) this.spawn(); }, this.spawnEveryMs);
    // random-prompt bubble every 30s
    setInterval(async () => {
      const prompts = await fetch('/prompts.json').then(r => r.json()).catch(()=>[]);
      if (!prompts.length) return;
      const pick = prompts[Math.floor(Math.random()*prompts.length)];
      this.spawnWithTitle(pick.title);
    }, 30000);
    // occasional label relax to avoid overlaps
    setInterval(()=>this.resolveLabelCollisions(), 800);
  }
  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const { innerWidth: w, innerHeight: h } = window;
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * dpr); this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  takeMeta() {
    if (!this.meta.length) return { title:'', hue: Math.random()*360|0, desc:'' };
    const m = this.meta[Math.floor(Math.random() * this.meta.length)];
    return m;
  }
  sizeFromBucket(){
    const base = this.sizeBuckets[Math.floor(Math.random()*this.sizeBuckets.length)];
    const jitter = (Math.random()*0.15 - 0.075) * base;
    const r = Math.max(this.sizeMin, Math.min(this.sizeMax, base + jitter));
    return r;
  }
  spawnWithTitle(title){
    const m = { title, hue: Math.random()*360|0 };
    this.spawn(m);
  }
  spawn(meta) {
    const { innerWidth:w, innerHeight:h } = window;
    const r = this.sizeFromBucket();
    const m = meta || this.takeMeta();
    const life = rand(22000, 36000); // longer life
    const now = performance.now();
    const b = {
      x: rand(0, w), y: rand(0, h),
      r, hue: m.hue ?? rand(0,360), sat: 95,
      alpha: 0,
      baseVX: rand(-0.04, 0.04) * this.speedScale, baseVY: rand(-0.015, -0.08) * this.speedScale,
      drift: rand(0.4, 1.0), wobble: rand(0.6, 1.6),
      born: now, die: now + life,
      title: m.title || '', desc: m.desc || ''
    };
    this.bubbles.push(b);
  }
  step(dt) {
    const now = performance.now();
    const w = innerWidth, h = innerHeight;
    this.bubbles = this.bubbles.filter(b => now < b.die + 1200);
    for (const b of this.bubbles) {
      const life = (now - b.born) / (b.die - b.born);
      const aIn = clamp(life / 0.18, 0, 1);
      const aOut = clamp((1 - life) / 0.28, 0, 1);
      b.alpha = 0.68 * Math.min(aIn, aOut);

      b.t = (b.t || 0) + 0.0012 * b.drift * (dt || 16) * this.speedScale;
      const wob = Math.sin(b.t * 3.1) * 0.6 * b.wobble;
      const vx = b.baseVX + Math.sin(b.t * 1.1) * 0.15 * b.drift * this.speedScale;
      const vy = b.baseVY + Math.cos(b.t * 0.85) * 0.09 * b.drift * this.speedScale;

      b.x += vx; b.y += vy;
      b.r2 = b.r * (1 + wob * 0.02);

      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;
    }
  }
  draw() {
    const ctx = this.ctx, w = innerWidth, h = innerHeight;
    ctx.clearRect(0,0,w,h);
    for (const b of this.bubbles) {
      if (b.alpha <= 0.01) continue;
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r2 || b.r);
      g.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, 70%, ${b.alpha})`);
      g.addColorStop(0.6, `hsla(${b.hue}, ${b.sat}%, 45%, ${b.alpha * 0.35})`);
      g.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, 12%, 0)`);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r2 || b.r, 0, Math.PI*2); ctx.fill();

      ctx.strokeStyle = `hsla(${b.hue}, ${b.sat}%, 80%, ${b.alpha * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, (b.r2||b.r)*0.96, 0, Math.PI*2); ctx.stroke();
    }
    this.updateLabels();
  }
  updateLabels() {
    const ul = $('#bubble-labels');
    const titled = this.bubbles.filter(b => b.title && b.alpha > 0.1);
    while (ul.children.length < titled.length) ul.appendChild(document.createElement('li'));
    while (ul.children.length > titled.length) ul.removeChild(ul.lastChild);
    for (let i=0;i<titled.length;i++) {
      const b = titled[i]; const li = ul.children[i];
      li.textContent = b.title;
      li.style.left = b.x + 'px'; li.style.top = b.y + 'px';
      li.style.opacity = Math.min(0.98, b.alpha + 0.2);
    }
  }
  resolveLabelCollisions(){
    const ul = $('#bubble-labels'); const list = Array.from(ul.children);
    const boxes = list.map(li => ({
      el: li,
      x: li.offsetLeft - li.offsetWidth/2,
      y: li.offsetTop - li.offsetHeight/2,
      w: li.offsetWidth,
      h: li.offsetHeight
    }));
    for (let iter=0; iter<4; iter++) {
      for (let i=0;i<boxes.length;i++){
        for (let j=i+1;j<boxes.length;j++){
          const a = boxes[i], b = boxes[j];
          if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
            const push = 6;
            if (a.x <= b.x) { a.x -= push; b.x += push; } else { a.x += push; b.x -= push; }
            if (a.y <= b.y) { a.y -= push; b.y += push; } else { a.y += push; b.y -= push; }
          }
        }
      }
    }
    boxes.forEach(b => {
      b.el.style.transform = `translate(-50%,-50%) translate(${Math.round(b.x - (b.el.offsetLeft - b.el.offsetWidth/2))}px, ${Math.round(b.y - (b.el.offsetTop - b.el.offsetHeight/2))}px)`;
    });
    // reset transform slowly
    setTimeout(()=>list.forEach(li => li.style.transform='translate(-50%,-50%)'), 600);
  }
  click(x,y) {
    let best = null, dBest = 1e9;
    for (const b of this.bubbles) {
      const d = Math.hypot(x-b.x, y-b.y);
      if (d < b.r && d < dBest) { best = b; dBest = d; }
    }
    return best;
  }
}
function rand(a,b){ return a + Math.random()*(b-a) }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

const field = new BubbleField(document.getElementById('bubbles'));

// bubble click -> open related prompt
window.addEventListener('click', async (e) => {
  const b = field.click(e.clientX, e.clientY);
  if (!b || !b.title) return;
  const prompts = await fetch('/prompts.json').then(r => r.json()).catch(()=>[]);
  const p = prompts.find(x => x.title === b.title || b.title.startsWith(x.title)) || prompts[Math.floor(Math.random()*prompts.length)];
  if (!p) return;
  openModal(`<h2>${p.title}</h2><pre>${p.content}</pre>`);
});

// ---- Ambient Pad with presets + auto-modulation ----
let audioCtx, masterGain, padGain, running=false, pulseTimer=null, oscA, oscB;
function initPad() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain(); masterGain.gain.value = 0.06;
  padGain = audioCtx.createGain(); padGain.gain.value = 0.0;
  oscA = audioCtx.createOscillator(); oscB = audioCtx.createOscillator();
  oscA.type='sine'; oscB.type='triangle';
  const mix = audioCtx.createGain(); mix.gain.value = 0.5;
  oscA.connect(mix); oscB.connect(mix); mix.connect(padGain).connect(masterGain).connect(audioCtx.destination);
  oscA.start(); oscB.start();
  applyPadPreset();
}
function applyPadPreset(){
  if (!oscA || !oscB) return;
  const preset = settings.verySlowMode ? 'dunkel' : settings.padPreset;
  if (preset === 'hell'){ oscA.frequency.value=261.63; oscB.frequency.value=329.63; }
  else if (preset === 'dunkel'){ oscA.frequency.value=174.61; oscB.frequency.value=220.00; }
  if (preset === 'aus'){ running=false; if (padGain) padGain.gain.value = 0; }
  setAutoPulse(settings.padAutoPulse && preset!=='aus');
}
function setAutoPulse(on){
  if (pulseTimer) { clearInterval(pulseTimer); pulseTimer=null; }
  if (on && padGain && (window.AudioContext||window.webkitAudioContext)) {
    pulseTimer = setInterval(() => {
      if (!running) return;
      const now = audioCtx.currentTime;
      const g = padGain.gain.value;
      const delta = (Math.random()*0.02 - 0.01);
      const target = Math.max(0.0, Math.min(0.2, g + delta));
      padGain.gain.cancelScheduledValues(now);
      padGain.gain.linearRampToValueAtTime(target, now + 3);
    }, 40000);
  }
}
async function togglePad(){ if (!audioCtx) initPad(); running=!running;
  const target = running && settings.padPreset!=='aus' ? 0.14 : 0.0;
  const now = audioCtx.currentTime;
  padGain.gain.cancelScheduledValues(now); padGain.gain.linearRampToValueAtTime(target, now + 0.6);
}

// ---- Shortcuts + helper + onboarding ----
const hint = document.querySelector('.shortcut-hint'); let hintShown = false;
const helper = $('#helper'); let helperShown = false;
window.addEventListener('mousemove', () => {
  if (!hintShown) { hintShown = true; hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 4000); }
  if (!helperShown) { helperShown = true; helper.classList.add('show'); setTimeout(() => helper.classList.remove('show'), 6000); }
});

(function tour(){
  const TOUR_KEY = 'tourSeen';
  const seen = localStorage.getItem(TOUR_KEY) === '1';
  const tour = $('#tour');
  if (seen || !tour) return;
  tour.setAttribute('aria-hidden', 'false');
  const finish = () => { tour.setAttribute('aria-hidden','true'); localStorage.setItem(TOUR_KEY,'1'); };
  tour.addEventListener('click', (e)=>{ if (e.target === tour) finish(); });
  tour.querySelector('[data-tour="done"]').addEventListener('click', finish);
  tour.querySelector('[data-tour="skip"]').addEventListener('click', finish);
  tour.querySelector('.tour__panel').focus();
})();
