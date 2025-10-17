/**
 * Neon bubble engine with "jellyfish" motion.
 * - Monochrome neon fill, soft aura glow
 * - Different sizes (s,m,l) based on label length
 * - Queue rotation: as one fades out, a new one fades in (cycle)
 * - no external deps
 */
(function(){
  const canvas = document.getElementById('bubble-canvas');
  const ctx = canvas.getContext('2d');
  let W=0, H=0, DPR = Math.max(1, window.devicePixelRatio || 1);

  const palette = [
    '#ff6ec7', '#9bf6ff', '#ffd166', '#caffbf', '#bdb2ff', '#fcb0f3', '#80ffdb', '#ffd6a5', '#72efdd', '#a0c4ff'
  ];

  const ITEMS = [
    { id:'zeitreise', label:'Zeitreise-Tagebuch' },
    { id:'bibliothek', label:'Bibliothek ungelebter Leben' },
    { id:'surreal', label:'Surrealismus-Generator' },
    { id:'debug', label:'Realitäts-Debugger' },
    { id:'futurist', label:'Vintage-Futurist' },
    { id:'brief', label:'Briefing-Assistent' },
    { id:'bunt', label:'Bunte Poesie' },
    { id:'bild', label:'Bild-Generator' },
    { id:'xeno', label:'Xenobiologe' },
    { id:'why', label:'5-Why-Analyse' },
  ];

  const active = [];
  let queueIndex = 0;
  const MAX_BUBBLES = 7;

  function resize(){
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  function sizeForLabel(len){
    if(len < 12) return 90 + Math.random()*20;
    if(len < 20) return 120 + Math.random()*30;
    return 150 + Math.random()*40;
  }

  function spawnOne(item){
    const color = palette[Math.floor(Math.random()*palette.length)];
    const r = sizeForLabel(item.label);
    const x = Math.random() * (W - 2*r) + r;
    const y = Math.random() * (H - 2*r) + r;
    const vx = (Math.random()-0.5) * 0.25;
    const vy = (Math.random()-0.5) * 0.25;
    const bubble = { ...item, x,y,r, vx,vy, color, alpha:0, life: 0, ready:false };
    active.push(bubble);
  }

  function ensurePopulation(){
    while(active.length < MAX_BUBBLES){
      spawnOne(ITEMS[queueIndex % ITEMS.length]);
      queueIndex++;
    }
  }

  function step(dt){
    ctx.clearRect(0,0,W,H);
    ensurePopulation();
    for(const b of active){
      // Motion
      b.x += b.vx;
      b.y += b.vy;
      // edge bounce
      if(b.x < b.r || b.x > W-b.r) b.vx *= -1;
      if(b.y < b.r || b.y > H-b.r) b.vy *= -1;
      // alpha
      b.life += dt;
      b.alpha = Math.min(1, b.alpha + 0.01);
      // draw aura
      const g = ctx.createRadialGradient(b.x, b.y, b.r*0.3, b.x, b.y, b.r*1.25);
      g.addColorStop(0, hexWithAlpha(b.color, 0.25*b.alpha));
      g.addColorStop(1, hexWithAlpha(b.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r*1.25, 0, Math.PI*2); ctx.fill();
      // draw body
      ctx.fillStyle = hexWithAlpha(b.color, 0.85*b.alpha);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      // text
      ctx.fillStyle = '#0b0f14aa';
      ctx.font = '600 13px system-ui';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(b.label, b.x, b.y-6);
      ctx.fillStyle = '#0b0f14bb';
      ctx.font = '10px system-ui';
      ctx.fillText('Start', b.x, b.y+10);
    }
  }

  let last=performance.now();
  function loop(ts){
    const dt = Math.min(33, ts-last); last=ts;
    step(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pointer picking
  canvas.addEventListener('click', (ev)=>{
    const rect = canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
    // find topmost bubble hit
    for(let i=active.length-1;i>=0;i--){
      const b = active[i];
      const dx = px-b.x, dy=py-b.y;
      if(dx*dx+dy*dy <= b.r*b.r){
        window.dispatchEvent(new CustomEvent('bubble:open', { detail:{ id:b.id, label:b.label } }));
        break;
      }
    }
  });

  function hexWithAlpha(hex, a){
    // hex like #RRGGBB
    const [r,g,b] = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)].map(h=>parseInt(h,16));
    return `rgba(${r},${g},${b},${a})`;
  }
})();
