(() => {
  const API_BASE = "/api"; // Netlify leitet weiter
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /** Modal **/
  const modal = $("#modal");
  const mTitle = $("#modalTitle");
  const mBody = $("#modalBody");
  const btnCopy = $("#btnCopy");
  const btnClose = $("#btnClose");
  const btnX = $("#modalClose");
  let copyPayload = "";

  function openModal(title, html, copyText=""){
    mTitle.textContent = title || "Info";
    mBody.innerHTML = html || "";
    copyPayload = copyText || "";
    modal.classList.add("is-open");
  }
  function closeModal(){ modal.classList.remove("is-open"); }
  btnClose.addEventListener("click", closeModal);
  btnX.addEventListener("click", closeModal);

  function toast(msg){
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-on");
    setTimeout(()=> el.classList.remove("is-on"), 1400);
  }

  btnCopy.addEventListener("click", async () => {
    if(!copyPayload){ toast("Nichts zu kopieren."); return; }
    try{ await navigator.clipboard.writeText(copyPayload); toast("Kopiert ✓"); } catch{ toast("Kopieren fehlgeschlagen"); }
  });

  /** News **/
  async function showNews(){
    try{
      const r = await fetch(API_BASE + "/news", { cache:"no-store" });
      const j = await r.json();
      const list = (j.items||[]).map(i => `<li><a target="_blank" rel="noopener" href="${i.url}">${i.title}</a></li>`).join("");
      openModal("News", `<ul>${list}</ul>`);
      copyPayload = (j.items||[]).map(i => `- ${i.title} — ${i.url}`).join("\n");
    }catch(e){
      openModal("News", "<p>News-Service nicht erreichbar.</p>");
    }
  }
  $("#chipNews").addEventListener("click", showNews);

  /** Impressum **/
  function showImpressum(){
    const html = `
    <h3>Rechtliches & Transparenz</h3>
    <p><strong>Verantwortlich für den Inhalt:</strong><br>Wolf Hohl<br>Greifswalder Str. 224a<br>10405 Berlin</p>
    <p><strong>E-Mail:</strong> <em>bitte im Footer oder Profil</em></p>
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

  /** Prompts (Büroalltag) **/
  const officePrompts = [
    {t:"E‑Mail‑Klartext", d:"Zu lange E‑Mail respektvoll auf 5 Sätze verdichten (3 Varianten).",
      p:"Formuliere diese zu lange E‑Mail respektvoll, klar und in 5 Sätzen. Erzeuge 3 Varianten (direkt, diplomatisch, motivierend). Text:
<<<TEXT>>>"
    },
    {t:"Meeting‑Agenda 30 Min", d:"Ziel, 3 Blöcke, Timebox, Entscheidungsfragen.",
      p:"Erstelle eine Agenda für ein 30‑Minuten‑Meeting: Ziel, drei Blöcke, Timebox je Block, Entscheidungsfragen am Ende."
    },
    {t:"Protokoll aus Stichpunkten", d:"Stichpunkte in kurzes Aufgaben‑Protokoll wandeln.",
      p:"Wandle diese Stichpunkte in ein prägnantes Protokoll mit Aufgaben (Wer macht bis wann?):
<<<STICHPUNKTE>>>"
    },
    {t:"Status‑Update wie Exec", d:"120 Wörter, Executive‑Ton, 3 KPIs + Ampel.",
      p:"Verdichte folgende Infos zu einem 120‑Wörter‑Update im Executive‑Ton mit 3 KPIs und Ampel:
<<<INPUT>>>"
    },
    {t:"OKR‑Feinschliff", d:"Kennzahlen schärfen, Outcome‑Fokus, max. 5 KRs.",
      p:"Überarbeite diese OKRs: klare Metriken, Outcome‑Fokus, keine Aufgabenformulierungen, max. 5 Key Results:
<<<OKRS>>>"
    },
    {t:"PR‑Statement", d:"Kurzes, neutrales Statement ohne Superlative.",
      p:"Schreibe ein kurzes Pressestatement: neutral, faktisch, ohne Superlative. Thema:
<<<THEMA>>>"
    },
    {t:"Social Copy ×3", d:"3 LinkedIn‑Posts: 280 Zeichen, Hook, Nutzen, Hashtag.",
      p:"Erzeuge 3 Social‑Posts (LinkedIn), je 280 Zeichen, mit Hook, Nutzen, Klarheit und 1 Hashtag. Thema:
<<<THEMA>>>"
    },
    {t:"Kunden‑E‑Mail heikel", d:"Höflich deeskalieren + nächster Schritt.",
      p:"Formuliere eine höfliche, klare Antwort auf diese Beschwerde. Ziel: Deeskalation + nächster Schritt:
<<<BESCHWERDE>>>"
    },
    {t:"Sales‑Pitch Kurzfassung", d:"90‑Sekunden‑Pitch mit Nutzen, 3 Belegen, CTA.",
      p:"Erstelle einen 90‑Sekunden‑Pitch mit Nutzen, drei Belegen und CTA. Zielgruppe/Use‑Case:
<<<DATEN>>>"
    },
    {t:"SWOT in 8 Punkten", d:"Je 2 komprimierte Aussagen pro Quadrant.",
      p:"Erstelle eine SWOT zu [THEMA] mit je zwei kompakten Aussagen pro Quadrant."
    },
    {t:"Briefing für Designer", d:"Ziel, Ton, Pflicht‑/Nicht‑Ziele, 3 Beispiele.",
      p:"Fasse diese Anforderung in ein Design‑Briefing: Ziel, Ton, Pflicht‑Elemente, Nicht‑Ziele, drei Referenz‑Beispiele:
<<<ANFORDERUNG>>>"
    },
    {t:"Roadmap in Meilensteinen", d:"Vorhaben in 5 Meilensteine + Done/Risiken.",
      p:"Zerlege dieses Vorhaben in fünf Meilensteine mit Definition of Done und Risiken:
<<<VORHABEN>>>"
    },
    {t:"Stakeholder‑Map", d:"Bedarf/Interesse clustern, Einbindung vorschlagen.",
      p:"Identifiziere Stakeholder, ordne Power/Interesse ein und schlage Einbindung vor. Kontext:
<<<KONTEXT>>>"
    },
    {t:"Kundeninterview‑Leitfaden", d:"10 Fragen: Problem, bisherige Lösungen, Entscheidungskriterien.",
      p:"Erstelle 10 Fragen: Problemverständnis, bisherige Lösungen, Entscheidungskriterien, Budgetrahmen."
    },
    {t:"Onboarding‑Plan 30 Tage", d:"Woche 1–4 mit Lernziele, Shadowing, erste Erfolge.",
      p:"Plane 30‑Tage‑Onboarding: Woche 1–4, Lernziele, Shadowing, erste Erfolge. Rolle:
<<<ROLLE>>>"
    },
    {t:"Projektplan (2 Wochen)", d:"Meilensteine, Abhängigkeiten, Risiken.",
      p:"Erstelle einen zweiwöchigen Mini‑Projektplan inkl. Meilensteine, Abhängigkeiten und Risiken. Thema:
<<<THEMA>>>"
    },
    {t:"Website‑Hero Copy", d:"3 Varianten: Headline (≤10 Wörter) + Subhead (≤18).",
      p:"Schreibe 3 Varianten einer Hero‑Zeile (≤10 Wörter) und eines Subheaders (≤18 Wörter) für:
<<<PRODUKT>>>"
    },
    {t:"Interview‑Leitfaden", d:"8 Fragen für Kundengespräch (Bedarf, Barrieren, Kriterien).",
      p:"Erstelle 8 Interviewfragen für ein Kundengespräch. Ziel: Bedarf, Barrieren, Entscheiderkriterien. Produkt:
<<<PRODUKT>>>"
    },
    {t:"KI‑Policy (Light)", d:"Kurze, praxistaugliche Richtlinie für KMU (EU‑AI‑Act‑aware).",
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
    // Delegate copy
    $("#modalBody").addEventListener("click", (ev)=>{
      const b = ev.target.closest("button[data-prompt]");
      if(!b) return;
      copyPayload = b.getAttribute("data-prompt");
      navigator.clipboard.writeText(copyPayload).then(()=> toast("Kopiert ✓"));
    }, { once:true });
  }
  $("#chipPrompts").addEventListener("click", showPrompts);

  /** Ticker **/
  async function startTicker(){
    const el = $("#tickerText");
    let items = [{title:"Lädt …"}];
    try{
      const r = await fetch(API_BASE + "/daily", { cache:"no-store" });
      const j = await r.json();
      if(Array.isArray(j.items) && j.items.length) items = j.items;
    }catch{ /* fallback bleibt */}
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

  /** Public run function for bubbles **/
  async function runBubble(id, title){
    // Stream in modal
    openModal(title || "Generierung", "<div id='stream'></div>");
    copyPayload = "";
    try{
      const r = await fetch(API_BASE + "/run", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ id, input:{ text: "" } })
      });
      if(!r.ok || !r.body){ mBody.innerHTML = "<p>Service nicht erreichbar.</p>"; return; }
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
      mBody.innerHTML = "<p>Fehler beim Stream.</p>";
    }
  }
  window.runBubble = runBubble;

  // Wire header stubs
  $("#chipProjects").addEventListener("click", ()=> openModal("Projekte","<p>Coming soon.</p>"));
  $("#chipLang").addEventListener("click", ()=> toast("Sprachumschalter folgt."));
  $("#chipSound").addEventListener("click", ()=> toast("Klang folgt."));

  // Cosmetic cards CSS (injected minimal)
  const style = document.createElement("style");
  style.textContent = `
  .cardgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(260px,1fr)); gap:12px }
  .card{ background:linear-gradient(180deg,#0e1a21,#0c161b); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:12px }
  .card h4{ margin:0 0 6px 0 }
  .card p{ margin:0 0 10px 0; color:#a8b6bf }
  .card .actions{ display:flex; justify-content:flex-end }
  `;
  document.head.appendChild(style);
})();
