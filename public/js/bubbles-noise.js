// public/js/bubbles-noise.js
// Jellyfish-like ambient bubbles (Perlin Noise) — lightweight & elegant.
// Does not interfere with interactive DIV bubbles; sits on a fixed canvas background.

function makePRNG(seed=1337){
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2**32;
}

function Perlin2(seed=12345){
  const rand = makePRNG(seed);
  const perm = new Uint8Array(512);
  for(let i=0;i<256;i++) perm[i]=i;
  for(let i=255;i>0;i--){
    const j = (rand()* (i+1))|0;
    const t = perm[i]; perm[i]=perm[j]; perm[j]=t;
  }
  for(let i=0;i<256;i++) perm[i+256]=perm[i];
  const grad = (h,x,y)=>{
    switch(h&3){
      case 0: return  x + y;
      case 1: return -x + y;
      case 2: return  x - y;
      default:return -x - y;
    }
  };
  const fade = t => t*t*t*(t*(t*6-15)+10);
  const lerp = (a,b,t)=>a+(b-a)*t;
  return (x,y)=>{
    const X = Math.floor(x)&255, Y = Math.floor(y)&255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[X+perm[Y]],   ab = perm[X+perm[Y+1]];
    const ba = perm[X+1+perm[Y]], bb = perm[X+1+perm[Y+1]];
    const n00 = grad(aa, x, y);
    const n10 = grad(ba, x-1, y);
    const n01 = grad(ab, x, y-1);
    const n11 = grad(bb, x-1, y-1);
    const nx0 = lerp(n00, n10, u);
    const nx1 = lerp(n01, n11, u);
    return lerp(nx0, nx1, v);
  };
}

function clamp(v,a,b){return v<a?a:v>b?b:v;}
function lerp(a,b,t){return a+(b-a)*t;}

function makeOffscreen(canvas){
  const supported = typeof OffscreenCanvas!=='undefined';
  if(!supported) return { ctx: canvas.getContext('2d'), transfer: ()=>{}, resize:(w,h)=>{} };
  const off = new OffscreenCanvas(canvas.width, canvas.height);
  const ctx = off.getContext('2d', { alpha: true });
  return {
    ctx,
    transfer(){
      const bmp = off.transferToImageBitmap();
      const cctx = canvas.getContext('2d');
      cctx.clearRect(0,0,canvas.width,canvas.height);
      cctx.drawImage(bmp,0,0);
    },
    resize(w,h){ off.width=w; off.height=h; }
  };
}

export function startBubblesCanvas(selector, opts={}){
  const cfg = {
    bubbleCount: 18,
    baseRadius: 24,
    radiusJitter: 12,
    speed: 0.07,
    alphaMin: 0.10,
    alphaMax: 0.32,
    spawnPadding: 0.08,
    colorStops: ['rgba(0,255,255,0.35)','rgba(255,0,255,0.35)','rgba(0,120,255,0.35)'],
    composite: 'lighter',
    seed: 4242,
    useOffscreen: true,
    ...opts
  };
  const canvas = document.querySelector(selector);
  if(!canvas) return;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function fit(){
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, (rect.width||window.innerWidth) * dpr);
    const h = Math.max(1, (rect.height||window.innerHeight) * dpr);
    canvas.width = w; canvas.height = h;
    off.resize?.(w,h);
  }
  const off = cfg.useOffscreen ? makeOffscreen(canvas) : { ctx: canvas.getContext('2d'), transfer: ()=>{}, resize:()=>{} };
  const ctx = off.ctx;

  function Perlin(){ return Perlin2(cfg.seed); }
  const noise = Perlin();
  const rng   = makePRNG(cfg.seed ^ 0x9e3779b9);

  const bubbles = [];
  function spawn(fromTop=false){
    const w=canvas.width, h=canvas.height, pad=cfg.spawnPadding;
    const x = rng()*w;
    const y = fromTop ? -h*pad : (rng()<0.5 ? h*(1+pad) : -h*pad);
    const r = cfg.baseRadius + (rng()*2-1)*cfg.radiusJitter;
    const color = cfg.colorStops[(rng()*cfg.colorStops.length)|0];
    const t0 = rng()*1000;
    const lifeMax = lerp(8,16,rng());
    bubbles.push({x,y,r,color,t:t0,life:0,lifeMax});
  }
  for(let i=0;i<cfg.bubbleCount;i++) spawn(true);

  let last=performance.now()/1000;
  function tick(){
    const now=performance.now()/1000, dt=clamp(now-last,0,0.033); last=now;
    const w=canvas.width, h=canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation = cfg.composite;

    for(const b of bubbles){
      b.t += cfg.speed * dt;
      const nx = noise(b.t*0.25, (b.y+1)*0.0006);
      const ny = noise((b.x+1)*0.0006, b.t*0.25);
      const buoyancy = lerp(15, 38, (b.r - (cfg.baseRadius-cfg.radiusJitter)) / (cfg.radiusJitter*2));
      b.x += nx * 18 * dt * dpr;
      b.y += (-buoyancy + ny*10) * dt * dpr;

      const breathe = (noise(b.t*0.5, 42)+1)/2;
      const alpha = lerp(cfg.alphaMin, cfg.alphaMax, breathe);

      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r*dpr);
      grd.addColorStop(0, 'rgba(255,255,255,'+alpha+')');
      grd.addColorStop(0.25, b.color.replace(/0\.\d+/, String(alpha)));
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r*dpr, 0, Math.PI*2);
      ctx.fill();

      b.life += dt;
    }
    // Recycle
    for(let i=bubbles.length-1;i>=0;i--){
      const b=bubbles[i]; const out = b.y<-h*0.2||b.y>h*1.2||b.x<-w*0.2||b.x>w*1.2||b.life>b.lifeMax;
      if(out){ bubbles.splice(i,1); if(bubbles.length<cfg.bubbleCount) spawn(false); }
    }
    off.transfer();
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', fit, {passive:true});
  fit(); requestAnimationFrame(tick);
  return {
    setCount(n){ cfg.bubbleCount=Math.max(1,n|0); },
    setSpeed(s){ cfg.speed=Math.max(0.01,s); }
  };
}

// Auto-start with tasteful defaults
document.addEventListener('DOMContentLoaded', ()=>{
  startBubblesCanvas('#jelly-canvas', { bubbleCount: 16, speed: 0.06 });
});
