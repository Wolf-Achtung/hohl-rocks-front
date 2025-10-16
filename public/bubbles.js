// Minimal, performant 'Jellyfish' bubble engine
(function(){
  const stage = document.getElementById("bubbleStage");
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const COLORS = [
    "#ff00d4","#00f0ff","#ffd800","#5bff9f","#8c7bff","#ff7aa2","#7dffea","#ffad66"
  ];

  const DATA = [
    { id:"zeitreise-tagebuch", title:"Zeitreise‑Tagebuch" },
    { id:"weltbau", title:"Weltbau" },
    { id:"poesie-html", title:"Bunte Poesie" },
    { id:"bild-generator", title:"Bild‑Generator" },
    { id:"idea-bibliothek-ungelebter-leben", title:"Bibliothek ungelebter Leben" },
    { id:"idea-surrealismus-generator", title:"Surrealismus‑Generator" },
    { id:"idea-vintage-futurist", title:"Vintage‑Futurist" },
    { id:"idea-emotional-alchemist", title:"Emotional‑Alchemist" },
    { id:"idea-realitaets-debugger", title:"Realitäts‑Debugger" },
    { id:"idea-ki-traeume", title:"KI‑Träume" }
  ];

  let queueIndex = 0;
  function nextData(){
    const d = DATA[queueIndex];
    queueIndex = (queueIndex + 1) % DATA.length;
    return d;
  }

  function makeBubble(){
    const d = nextData();
    const el = document.createElement("div");
    el.className = "bubble";
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    const size = Math.min(220, Math.max(120, d.title.length*7 + 80)); // dynamisch
    el.style.width = el.style.height = size + "px";
    el.style.left = Math.round(Math.random()*(W()-size))+"px";
    el.style.top = Math.round(Math.random()*(H()-size))+"px";
    el.style.background = `radial-gradient(circle at 30% 30%, ${hexA(color, .85)}, ${hexA(color,.45)} 60%, ${hexA(color,.25)} 70%, ${hexA(color, .1)} 100%)`;
    el.style.boxShadow = `0 0 ${Math.round(size*.6)}px ${hexA(color,.35)}, inset 0 0 ${Math.round(size*.25)}px ${hexA("#ffffff",.25)}`;
    el.innerHTML = `<div class="bubble__title">${d.title}</div><div class="bubble__start">Start</div>`;
    stage.appendChild(el);

    let vx = (Math.random() * 0.25 + 0.05) * (Math.random()<.5? -1:1);
    let vy = (Math.random() * 0.25 + 0.05) * (Math.random()<.5? -1:1);
    let x = el.offsetLeft, y = el.offsetTop;
    const born = performance.now();
    const TTL = 22000 + Math.random()*8000;

    function tick(t){
      const dt = 16; // approx
      x += vx * dt; y += vy * dt;
      if(x<0){ x=0; vx*=-1 } else if(x>W()-size){ x=W()-size; vx*=-1 }
      if(y<80){ y=80; vy*=-1 } else if(y>H()-size){ y=H()-size; vy*=-1 }
      el.style.transform = `translate(${Math.round(x-el.offsetLeft)}px,${Math.round(y-el.offsetTop)}px)`;
      if(t-born>TTL){ fadeOut(); return; }
      el._raf = requestAnimationFrame(tick);
    }

    function fadeOut(){
      cancelAnimationFrame(el._raf);
      el.style.transition = "opacity .8s ease, transform .8s ease";
      el.style.opacity = "0";
      el.style.transform += " scale(.92)";
      setTimeout(()=> { el.remove(); makeBubble(); }, 820);
    }

    el.addEventListener("click", ()=> window.runBubble(d.id, d.title));
    el._raf = requestAnimationFrame(tick);
    return el;
  }

  function hexA(hex, a){
    const c = hex.replace("#","");
    const bigint = parseInt(c,16);
    const r=(bigint>>16)&255,g=(bigint>>8)&255,b=bigint&255;
    return `rgba(${r},${g},${b},${a})`;
  }

  // Spawn initial set
  for(let i=0;i<7;i++) makeBubble();

  // Resize: keep within stage
  window.addEventListener("resize", ()=>{
    $$(".bubble", stage).forEach(el=>{
      const size = el.offsetWidth;
      const left = Math.min(parseFloat(el.style.left||"0"), W()-size);
      const top = Math.min(parseFloat(el.style.top||"0"), H()-size);
      el.style.left = left+"px"; el.style.top = top+"px";
    });
  });

  // helpers
  function $$(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
})();
