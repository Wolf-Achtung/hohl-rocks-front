// Jellyfish-like ambient bubbles (Perlin noise). Canvas does not block clicks.

function makePRNG(seed){ let s=(seed>>>0)||1337; return ()=> (s=(s*1664525+1013904223)>>>0)/4294967296; }
function Perlin2(seed){
  const rand=makePRNG(seed||12345), p=new Uint8Array(512); for(let i=0;i<256;i++) p[i]=i;
  for(let i=255;i>0;i--){ const j=(rand()*(i+1))|0; const t=p[i]; p[i]=p[j]; p[j]=t; }
  for(let i=0;i<256;i++) p[i+256]=p[i];
  const grad=(h,x,y)=>{ switch(h&3){ case 0:return x+y; case 1:return -x+y; case 2:return x-y; default:return -x-y; } };
  const fade=t=>t*t*t*(t*(t*6-15)+10), lerp=(a,b,t)=>a+(b-a)*t;
  return (x,y)=>{ const X=Math.floor(x)&255,Y=Math.floor(y)&255; x-=Math.floor(x); y-=Math.floor(y);
    const u=fade(x), v=fade(y); const aa=p[X+p[Y]],ab=p[X+p[Y+1]],ba=p[X+1+p[Y]],bb=p[X+1+p[Y+1]];
    const n00=grad(aa,x,y), n10=grad(ba,x-1,y), n01=grad(ab,x,y-1), n11=grad(bb,x-1,y-1);
    return lerp(lerp(n00,n10,u), lerp(n01,n11,u), v);
  };
}
function clamp(v,a,b){return v<a?a:v>b?b:v;} function lerp(a,b,t){return a+(b-a)*t;}

function makeOffscreen(canvas){
  const ok = typeof OffscreenCanvas!=='undefined';
  if(!ok) return { ctx: canvas.getContext('2d'), transfer: ()=>{}, resize:()=>{} };
  const off = new OffscreenCanvas(canvas.width, canvas.height); const ctx = off.getContext('2d', { alpha:true });
  return { ctx, transfer(){ const bmp=off.transferToImageBitmap(); const c=canvas.getContext('2d'); c.clearRect(0,0,canvas.width,canvas.height); c.drawImage(bmp,0,0); }, resize(w,h){ off.width=w; off.height=h; } };
}

export function startBubblesCanvas(selector, opts){
  opts = Object.assign({ bubbleCount:16, baseRadius:24, radiusJitter:12, speed:0.06, alphaMin:0.10, alphaMax:0.32, spawnPadding:0.08, colorStops:['rgba(0,255,255,0.35)','rgba(255,0,255,0.35)','rgba(0,120,255,0.35)'], composite:'lighter', seed:4242, useOffscreen:true }, (opts||{}));
  const canvas = document.querySelector(selector); if(!canvas) return;

  // Important: canvas must not block UI clicks
  canvas.style.pointerEvents = 'none';
  canvas.style.userSelect = 'none';

  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  const off = opts.useOffscreen ? makeOffscreen(canvas) : { ctx: canvas.getContext('2d'), transfer:()=>{}, resize:()=>{} };
  const ctx=off.ctx, noise=Perlin2(opts.seed), rng=makePRNG(opts.seed^0x9e3779b9);

  function fit(){ const r=canvas.getBoundingClientRect(); const w=Math.max(1,(r.width||window.innerWidth)*dpr), h=Math.max(1,(r.height||window.innerHeight)*dpr); canvas.width=w; canvas.height=h; off.resize(w,h); }
  window.addEventListener('resize', fit, { passive:true });

  const bubbles=[]; function spawn(fromTop){ const w=canvas.width,h=canvas.height,p=opts.spawnPadding; const x=rng()*w; const y=fromTop?-h*p:(rng()<0.5?h*(1+p):-h*p); const r=opts.baseRadius+(rng()*2-1)*opts.radiusJitter; const color=opts.colorStops[(rng()*opts.colorStops.length)|0]; const t0=rng()*1000; const lifeMax=lerp(8,16,rng()); bubbles.push({x,y,r,color,t:t0,life:0,lifeMax}); }
  for(let i=0;i<opts.bubbleCount;i++) spawn(true);

  let last=performance.now()/1000;
  function tick(){
    const now=performance.now()/1000, dt=clamp(now-last,0,0.033); last=now; const w=canvas.width, h=canvas.height;
    ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation = opts.composite;
    for(const b of bubbles){
      b.t += opts.speed*dt; const nx=noise(b.t*0.25,(b.y+1)*0.0006), ny=noise((b.x+1)*0.0006,b.t*0.25);
      const buoy=lerp(15,38,(b.r-(opts.baseRadius-opts.radiusJitter))/(opts.radiusJitter*2));
      b.x += nx*18*dt*dpr; b.y += (-buoy + ny*10)*dt*dpr;
      const breathe=(noise(b.t*0.5,42)+1)/2, alpha=lerp(opts.alphaMin,opts.alphaMax,breathe);
      const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*dpr); g.addColorStop(0,'rgba(255,255,255,'+alpha+')'); g.addColorStop(0.25,b.color.replace(/0\.\d+/,String(alpha))); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*dpr,0,Math.PI*2); ctx.fill(); b.life+=dt;
    }
    for(let i=bubbles.length-1;i>=0;i--){ const b=bubbles[i]; const out=b.y<-h*0.2||b.y>h*1.2||b.x<-w*0.2||b.x>w*1.2||b.life>b.lifeMax; if(out){ bubbles.splice(i,1); if(bubbles.length<opts.bubbleCount) spawn(false); } }
    off.transfer(); requestAnimationFrame(tick);
  }
  fit(); requestAnimationFrame(tick);
  return { setCount(n){ opts.bubbleCount=Math.max(1,n|0); }, setSpeed(s){ opts.speed=Math.max(0.01,s||0.01); } };
}

document.addEventListener('DOMContentLoaded', function(){ startBubblesCanvas('#jelly-canvas', {}); });
