const COLORS=['#ff43b6','#8bff7a','#67d1ff','#ffd166','#a78bfa','#ff8fab','#5eead4','#b0f','#f59e0b'];
const DATA=[
{id:'zeitreise-tagebuch',title:'Zeitreise‑Tagebuch'},
{id:'weltbau',title:'Weltbau'},
{id:'bunte-poesie',title:'Bunte Poesie'},
{id:'bild-beschreibung',title:'Bild‑Beschreibung'},
{id:'realitaets-debugger',title:'Realitäts‑Debugger'},
{id:'briefing-assistent',title:'Briefing‑Assistent'},
{id:'fuenf-why',title:'5‑Why‑Analyse'},
{id:'surrealismus-generator',title:'Surrealismus‑Generator'},
{id:'bibliothek-leben',title:'Bibliothek ungelebter Leben'},
{id:'emotion-visualizer',title:'Emotion‑Visualizer'}
];
const root=document.getElementById('bubble-root');
function hexA(h,a){h=h.replace('#','');const n=parseInt(h,16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return`rgba(${r},${g},${b},${a})`}
function mk(item,i){
  const el=document.createElement('div');el.className='bubble';
  const size=Math.min(240,Math.max(120,item.title.length*7+80));
  const x=60+Math.random()*(root.clientWidth-size-120);
  const y=60+Math.random()*(root.clientHeight-size-160);
  const c=COLORS[i%COLORS.length];
  el.style.width=el.style.height=size+'px';
  el.style.left='0px';el.style.top='0px';
  el.style.background=`radial-gradient(60% 60% at 30% 25%, rgba(255,255,255,.85), ${c})`;
  el.style.boxShadow=`0 0 80px ${hexA(c,.45)}, inset 0 0 22px rgba(255,255,255,.18)`;
  const lab=document.createElement('div');lab.className='label';lab.textContent=item.title;el.appendChild(lab);
  el.style.transform=`translate(${x}px,${y}px)`;
  el.__x=x;el.__y=y;el.__vx=(Math.random()*0.2+0.05)*(Math.random()<.5?-1:1);
  el.__vy=(Math.random()*0.2+0.05)*(Math.random()<.5?-1:1);el.__size=size;el.__item=item;root.appendChild(el);
  el.addEventListener('click',()=>window.app&&window.app.openRunModal(item));
  return el;
}
function step(){
  const w=root.clientWidth,h=root.clientHeight;
  for(const el of Array.from(root.children)){
    let x=el.__x+el.__vx,y=el.__y+el.__vy,s=el.__size;
    if(x<10||x>w-s-10) el.__vx*=-1;
    if(y<90||y>h-s-10) el.__vy*=-1;
    el.__x+=el.__vx;el.__y+=el.__vy;
    el.style.transform=`translate(${Math.round(el.__x)}px,${Math.round(el.__y)}px)`;
  }
  requestAnimationFrame(step);
}
function mount(){root.innerHTML='';for(let i=0;i<Math.min(9,DATA.length);i++) mk(DATA[i],i);requestAnimationFrame(step)}
window.addEventListener('resize',()=>{ /* keep layout simple */ }); mount();
