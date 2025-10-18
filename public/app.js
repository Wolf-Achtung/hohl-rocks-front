const API_BASE = window.API_BASE || "/_api";
const $ = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));

const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalBody = $("#modalBody");
const toast = $("#toast");

function openModal(title, html){
  modalTitle.textContent = title || "Info";
  modalBody.innerHTML = html || "";
  modal.removeAttribute("hidden");
  // simple focus trap: focus first interactive element
  const focusables = $$("button, input, a[href]", modal);
  if(focusables.length) focusables[0].focus();
}
function closeModal(){ modal.setAttribute("hidden",""); }

modal.addEventListener("click", (e) => {
  if(e.target.dataset.close !== undefined) return closeModal();
  if(e.target === modal) closeModal();
});
modal.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});
$$("[data-copy]", modal)?.forEach(el => {
  el.addEventListener("click", async () => {
    const text = modalBody.innerText.trim();
    if(text){ await navigator.clipboard.writeText(text); showToast("Kopiert ✓"); }
  });
});
function showToast(msg){
  toast.textContent = msg;
  toast.removeAttribute("hidden");
  setTimeout(() => toast.setAttribute("hidden",""), 1500);
}

async function apiGET(path){
  try {
    const r = await fetch(API_BASE + path);
    if(!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch { return { ok:false }; }
}
async function apiPOST(path, data){
  try {
    const r = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {})
    });
    if(!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch { return { ok:false }; }
}

async function showNews(){
  const j = await apiGET("/news");
  const list = (j.items||[]).map(it => `<li><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></li>`).join("");
  openModal("News", list ? `<ul class="list">${list}</ul>` : "<p>Keine News verfügbar.</p>");
}
async function showDaily(){
  const j = await apiGET("/daily");
  const list = (j.items||[]).map(it => `<li><a href="${it.url}" target="_blank" rel="noopener">${it.title}</a></li>`).join("");
  openModal("Heute neu", list ? `<ul class="list">${list}</ul>` : "<p>Nichts Neues.</p>");
}
async function showPrompts(){
  openModal("Prompts", "<p>Nutze die interaktiven Bubbles und ihre Eingabefelder, um Inhalte zu generieren.</p>");
}
function showImpressum(){
  openModal("Impressum", `<p><strong>Wolf Hohl</strong><br/>Greifswalder Str. 224a<br/>10405 Berlin</p>
  <p>Diese Website dient ausschließlich der Information. Keine Haftung für externe Links.</p>
  <p>Alle Inhalte unterliegen dem deutschen Urheberrecht; Bilder sind teils KI‑generiert.</p>`);
}

async function apiRun(id, input){
  openModal("Lädt …", "<p>Bitte warten …</p>");
  const j = await apiPOST("/run", { id, input, locale: navigator.language || "de-DE" });
  if(!j.ok) return openModal("Fehler", "<p>Service nicht erreichbar.</p>");
  openModal("Ergebnis", `<pre>${escapeHtml(j.content)}</pre>`);
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function toggleSound(btn){
  if(!window.audioCtx){
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = window.audioCtx.createGain();
    master.gain.value = 0.18;
    master.connect(window.audioCtx.destination);
    const osc1 = window.audioCtx.createOscillator(); osc1.type = "sine"; osc1.frequency.value = 138;
    const osc2 = window.audioCtx.createOscillator(); osc2.type = "triangle"; osc2.frequency.value = 207;
    const g1 = window.audioCtx.createGain(); g1.gain.value = 0.05;
    const g2 = window.audioCtx.createGain(); g2.gain.value = 0.04;
    osc1.connect(g1).connect(master);
    osc2.connect(g2).connect(master);
    osc1.start(); osc2.start();
    const lfo = window.audioCtx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.05;
    const lfoGain = window.audioCtx.createGain(); lfoGain.gain.value = 20;
    lfo.connect(lfoGain).connect(osc1.frequency); lfo.start();
    window.master = master;
  }
  const pressed = btn.getAttribute("aria-pressed") === "true";
  if(pressed){
    window.master.gain.linearRampToValueAtTime(0, window.audioCtx.currentTime + 0.3);
    btn.setAttribute("aria-pressed","false");
  } else {
    if(window.audioCtx.state === "suspended") window.audioCtx.resume();
    window.master.gain.linearRampToValueAtTime(0.18, window.audioCtx.currentTime + 0.3);
    btn.setAttribute("aria-pressed","true");
  }
}

// Navigation handlers
document.querySelector(".pills").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if(!b) return;
  const act = b.dataset.action;
  if(act === "news") return showNews();
  if(act === "prompts") return showPrompts();
  if(act === "impressum") return showImpressum();
  if(act === "daily") return showDaily();
  if(act === "sound") return toggleSound(b);
});

// Bubble selection handler
window.addEventListener("bubble-select", (e) => {
  const { id, label } = e.detail;
  const html = `<label>Eingabe:</label>
  <input id="userInput" class="input" placeholder="Thema, Frage oder Kontext"/>
  <div style="height:8px"></div>
  <button id="btnRun">Generieren</button>`;
  openModal(label || "Modul", html);
  document.getElementById("btnRun").addEventListener("click", () => {
    const userVal = document.getElementById("userInput").value;
    apiRun(id, userVal);
  });
});
