(() => {
  const API_BASE = "/api"; // Netlify redirects to Railway
  const $ = (s, r=document) => r.querySelector(s);

  /** ====== Telemetry (local only) ====== */
  const tele = {
    push(evt, data={}){
      try{
        const k = "telemetry";
        const all = JSON.parse(localStorage.getItem(k) || "[]");
        all.push({ t: Date.now(), evt, ...data });
        if(all.length > 500) all.shift();
        localStorage.setItem(k, JSON.stringify(all));
      }catch{}
    }
  };

  /** ====== Toast ====== */
  function toast(msg){
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-on");
    setTimeout(()=> el.classList.remove("is-on"), 1400);
  }

  /** ====== Modal + A11y ====== */
  const modal = $("#modal");
  const mTitle = $("#modalTitle");
  const mBody = $("#modalBody");
  const btnCopy = $("#btnCopy");
  const btnClose = $("#btnClose");
  const btnX = $("#modalClose");
  let copyPayload = "";
  let lastFocus = null;

  function trapFocus(e){
    if(!modal.classList.contains("is-open")) return;
    if(e.key !== "Tab") return;
    const focusables = modal.querySelectorAll("button, [href], input, textarea, [tabindex]:not([tabindex='-1'])");
    const list = Array.from(focusables).filter(el => !el.hasAttribute("disabled"));
    if(list.length === 0) return;
    const first = list[0], last = list[list.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  function openModal(title, html, copyText=""){
    lastFocus = document.activeElement;
    mTitle.textContent = title || "Info";
    mBody.innerHTML = html || "";
    copyPayload = copyText || "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden","false");
    setTimeout(()=> (btnCopy.focus()), 10);
    tele.push("modal_open",{title});
  }
  function closeModal(){
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    (lastFocus || document.body).focus?.();
  }
  btnClose.addEventListener("click", closeModal);
  btnX.addEventListener("click", closeModal);
  window.addEventListener("keydown", e => { if(e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
  window.addEventListener("keydown", trapFocus);

  btnCopy.addEventListener("click", async () => {
    if(!copyPayload){ toast("Nichts zu kopieren."); return; }
    try{ await navigator.clipboard.writeText(copyPayload); toast("Kopiert ✓"); tele.push("copy",{len: copyPayload.length}); } catch{ toast("Kopieren fehlgeschlagen"); }
  });

  /** ====== Sound Engine (Ambient; start on first gesture) ====== */
  const sound = (()=>{
    let ctx, master, filt, oscA, oscB, lfo, lastTouch=0, enabled=false;
    function init(){
      if(enabled) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.08;
      filt = ctx.createBiquadFilter(); filt.type="lowpass"; filt.frequency.value = 600;
      // Two gentle detuned sines
      oscA = ctx.createOscillator(); oscA.type="sine"; oscA.frequency.value = 110;
      oscB = ctx.createOscillator(); oscB.type="sine"; oscB.frequency.value = 113.2;
      // LFO controls filter cutoff
      lfo = ctx.createOscillator(); lfo.type="sine"; lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 280; // depth
      lfo.connect(lfoGain).connect(filt.frequency);

      oscA.connect(filt); oscB.connect(filt);
      filt.connect(master).connect(ctx.destination);
      oscA.start(); oscB.start(); lfo.start();
      enabled = true;
      tele.push("sound_on",{});
    }
    function nudge(){
      if(!enabled) return;
      const now = ctx.currentTime;
      // slight swell and timbre change
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0.12, now+0.05);
      master.gain.linearRampToValueAtTime(0.08, now+0.6);
      filt.frequency.linearRampToValueAtTime(900, now+0.15);
      filt.frequency.linearRampToValueAtTime(600, now+0.8);
      lastTouch = Date.now();
    }
    function toggle(){
      if(!enabled){ init(); toast("Klang an"); return; }
      // Suspend
      ctx.suspend();
      enabled = false;
      toast("Klang aus");
      tele.push("sound_off",{});
    }
    return { init, nudge, toggle };
  })();
  $("#chipSound").addEventListener("click", ()=> sound.toggle());
  // Auto-init on first user gesture (policy compliant)
  ["pointerdown","keydown"].forEach(ev => window.addEventListener(ev, ()=> sound.init(), { once:true }));

  /** ====== News ====== */
  async function showNews(){
    try{
      const r = await fetch(API_BASE + "/news", { cache:"no-store" });
      const j = await r.json();
      const list = (j.items||[]).map(i => `<li><a target="_blank" rel="noopener" href="${i.url}">${i.title}</a></li>`).join("");
      openModal("News", `<ul>${list}</ul>`);
      copyPayload = (j.items||[]).map(i => `- ${i.title} — ${i.url}`).join("\n");
      tele.push("news_open", {count: (j.items||[]).length});
    }catch(e){
      openModal("News", "<p>News-Service nicht erreichbar.</p>");
    }
  }
  $("#chipNews").addEventListener("click", showNews);

  /** ====== Impressum ====== */
  function showImpressum(){
    const html = `
    <h3>Rechtliches & Transparenz</h3>
    <p><strong>Verantwortlich für den Inhalt:</strong><br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin</p>
    <p><strong>Haftungsausschluss:</strong> Diese Website dient ausschließlich der Information. Keine Haftung für externe Links.</p>
    <p><strong>Urheberrecht:</strong> Alle Inhalte unterliegen dem deutschen Urheberrecht; Bilder wurden mit Midjourney erzeugt.</p>
    <p><strong>Hinweis zum EU AI Act:</strong> Diese Website informiert über Pflichten, Risiken und Fördermöglichkeiten beim Einsatz von KI nach EU AI Act und DSGVO. Keine Rechtsberatung.</p>
    <h3>Datenschutz</h3>
    <p><strong>Kontakt</strong> – Bei Kontakt per Formular/E‑Mail werden Angaben 6 Monate gespeichert.</p>
    <p><strong>Cookies</strong> – Keine Tracking/Analyse-Cookies.</p>
    <p><strong>Rechte DSGVO</strong> – Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Widerruf, Beschwerde.</p>`;
    openModal("Impressum", html);
  }
  $("#chipImpressum").addEventListener("click", showImpressum);

  /** ====== Prompts (Büroalltag) ====== */
  const officePrompts = [
    {t:"E‑Mail‑Klartext", d:"Zu lange E‑Mail respektvoll auf 5 Sätze verdichten (3 Varianten).",
      p:"Formuliere diese zu lange E‑Mail respektvoll, klar und in 5 Sätzen. Erzeuge 3 Varianten (direkt, diplomatisch, motivierend). Text:\n<<<TEXT>>>"
    },
    {t:"Meeting‑Agenda 30 Min", d:"Ziel, 3 Blöcke, Timebox, Entscheidungsfragen.",
      p:"Erstelle eine Agenda für ein 30‑Minuten‑Meeting: Ziel, drei Blöcke, Timebox je Block, Entscheidungsfragen am Ende."
    },
    {t:"Protokoll aus Stichpunkten", d:"Stichpunkte in kurzes Aufgaben‑Protokoll wandeln.",
      p:"Wandle diese Stichpunkte in ein prägnantes Protokoll mit Aufgaben (Wer macht bis wann?):\n<<<STICHPUNKTE>>>"
    },
    {t:"Status‑Update wie Exec", d:"120 Wörter, Executive‑Ton, 3 KPIs + Ampel.",
      p:"Verdichte folgende Infos zu einem 120‑Wörter‑Update im Executive‑Ton mit 3 KPIs und Ampel:\n<<<INPUT>>>"
    },
    {t:"OKR‑Feinschliff", d:"Kennzahlen schärfen, Outcome‑Fokus, max. 5 KRs.",
      p:"Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen, max. 5 Key Results:\n<<<OKRS>>>"
    },
    {t:"PR‑Statement", d:"Kurzes, neutrales Statement ohne Superlative.",
      p:"Schreibe ein kurzes Pressestatement: neutral, faktisch, ohne Superlative. Thema:\n<<<THEMA>>>"
    },
    {t:"Social Copy ×3", d:"3 LinkedIn‑Posts: 280 Zeichen, Hook, Nutzen, Hashtag.",
      p:"Erzeuge 3 Social‑Posts (LinkedIn), je 280 Zeichen, mit Hook, Nutzen, Klarheit und 1 Hashtag. Thema:\n<<<THEMA>>>"
    },
    {t:"Kunden‑E‑Mail heikel", d:"Höflich deeskalieren + nächster Schritt.",
      p:"Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation + nächster Schritt:\n<<<BESCHWERDE>>>"
    },
    {t:"Sales‑Pitch Kurzfassung", d:"90‑Sekunden‑Pitch mit Nutzen, 3 Belegen, CTA.",
      p:"Erstelle einen 90‑Sekunden‑Pitch mit Nutzen, drei Belegen und CTA. Zielgruppe/Use‑Case:\n<<<DATEN>>>"
    },
    {t:"SWOT in 8 Punkten", d:"Je 2 komprimierte Aussagen pro Quadrant.",
      p:"Erstelle eine SWOT zu [THEMA] mit je zwei kompakten Aussagen pro Quadrant."
    },
    {t:"Briefing für Designer", d:"Ziel, Ton, Pflicht‑/Nicht‑Ziele, 3 Beispiele.",
      p:"Fasse diese Anforderung in ein Design‑Briefing: Ziel, Ton, Pflicht‑Elemente, Nicht‑Ziele, drei Referenz‑Beispiele:\n<<<ANFORDERUNG>>>"
    },
    {t:"Roadmap in Meilensteinen", d:"Vorhaben in 5 Meilensteine + Done/Risiken.",
      p:"Zerlege dieses Vorhaben in fünf Meilensteine mit Definition of Done und Risiken:\n<<<VORHABEN>>>"
    },
    {t:"Stakeholder‑Map", d:"Bedarf/Interesse clustern, Einbindung vorschlagen.",
      p:"Identifiziere Stakeholder, ordne Power/Interesse ein und schlage Einbindung vor. Kontext:\n<<<KONTEXT>>>"
    },
    {t:"Kundeninterview‑Leitfaden", d:"10 Fragen: Problem, Lösungen, Kriterien.",
      p:"Erstelle 10 Fragen: Problemverständnis, bisherige Lösungen, Entscheidungskriterien, Budgetrahmen."
    },
    {t:"Onboarding‑Plan 30 Tage", d:"Woche 1–4, Lernziele, Shadowing, Erfolge.",
      p:"Plane 30‑Tage‑Onboarding: Woche 1–4, Lernziele, Shadowing, erste Erfolge. Rolle:\n<<<ROLLE>>>"
    },
    {t:"Projektplan (2 Wochen)", d:"Meilensteine, Abhängigkeiten, Risiken.",
      p:"Erstelle einen zweiwöchigen Mini‑Projektplan inkl. Meilensteine, Abhängigkeiten und Risiken. Thema:\n<<<THEMA>>>"
    },
    {t:"Website‑Hero Copy", d:"3 Varianten: Headline (≤10) + Subhead (≤18).",
      p:"Schreibe 3 Varianten einer Hero‑Zeile (≤10 Wörter) und eines Subheaders (≤18 Wörter) für:\n<<<PRODUKT>>>"
    },
    {t:"Interview‑Leitfaden", d:"8 Fragen (Bedarf, Barrieren, Kriterien).",
      p:"Erstelle 8 Interviewfragen für ein Kundengespräch. Ziel: Bedarf, Barrieren, Entscheiderkriterien. Produkt:\n<<<PRODUKT>>>"
    },
    {t:"KI‑Policy (Light)", d:"Kurze Richtlinie (EU‑AI‑Act‑aware).",
      p:"Formuliere eine kurze, praxistaugliche KI‑Nutzungsrichtlinie (10 Punkte) für ein KMU (DSGVO‑konform, EU‑AI‑Act‑aware)."
    }
  ];

  function showPrompts(){
    const cards = officePrompts.map(({t,d,p})=>`
      <article class="card">
        <header><h4>${t}</h4></header>
        <p>${d}</p>
        <div class="actions"><button class="btn btn--ghost" data-prompt=${JSON.stringify(p).replace(/"/g,"&quot;")}>Kopieren</button></div>
      </article>`).join("");
    openModal("Prompts (Büroalltag)", `<div class="cardgrid">${cards}</div>`);
    $("#modalBody").addEventListener("click", (ev)=>{
      const b = ev.target.closest("button[data-prompt]");
      if(!b) return;
      copyPayload = b.getAttribute("data-prompt");
      navigator.clipboard.writeText(copyPayload).then(()=> { toast("Kopiert ✓"); tele.push("copy_prompt",{}); });
    }, { once:true });
  }
  $("#chipPrompts").addEventListener("click", showPrompts);

  /** ====== Ticker ====== */
  async function startTicker(){
    const el = $("#tickerText");
    let items = [{title:"Lädt …"}];
    try{
      const r = await fetch(API_BASE + "/daily", { cache:"no-store" });
      const j = await r.json();
      if(Array.isArray(j.items) && j.items.length) items = j.items;
    }catch{}
    let i=0;
    const run = () => {
      const t = (items[i]?.title || items[i] || "").toString();
      el.textContent = " – " + t;
      i = (i+1) % items.length;
    };
    run();
    setInterval(run, 6000);
  }
  startTicker();

  /** ====== Public run function for bubbles ====== */
  async function runBubble(id, title){
    openModal(title || "Generierung", "<div id='stream' style='white-space:pre-wrap'></div>");
    copyPayload = "";
    sound.nudge();
    tele.push("bubble_run",{id});

    try{
      const r = await fetch(API_BASE + "/run", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ id, input:{ text: "" } })
      });
      if(!r.ok || !r.body){ $("#stream").innerHTML = "<p>Service nicht erreichbar.</p>"; return; }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while(true){
        const {value, done} = await reader.read();
        if(done) break;
        buf += dec.decode(value, {stream:true});
        const parts = buf.split("\n\n"); buf = parts.pop() || "";
        for(const p of parts){
          if(!p.startsWith("data:")) continue;
          const pay = p.slice(5).trim(); if(!pay) continue;
          try{
            const j = JSON.parse(pay);
            if(j.delta){
              copyPayload += j.delta;
              $("#stream").insertAdjacentText("beforeend", j.delta);
            }
          }catch{}
        }
      }
    }catch(e){
      $("#stream").innerHTML = "<p>Fehler beim Stream.</p>";
    }
  }
  window.runBubble = runBubble;

  // Stubs
  $("#chipProjects").addEventListener("click", ()=> openModal("Projekte","<p>Coming soon.</p>"));
  $("#chipLang").addEventListener("click", ()=> toast("Sprachumschalter folgt."));

})();
