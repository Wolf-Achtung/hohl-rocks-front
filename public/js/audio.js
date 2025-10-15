// js/audio.js (ambient pads + noise; Presets: still | weich | daemmerung)
import { storage } from './utils.js';

const store = storage('hohl.audio');
let ctx = null, raf = 0;
let enabled = false;
let preset = 'weich'; // still | weich | daemmerung

let nodes = {};

function mk(ctx){ return { g: ctx.createGain(), lp: ctx.createBiquadFilter(), del: ctx.createDelay(1.2), fb: ctx.createGain() }; }

function connectChain(){
  const { g, lp, del, fb } = nodes;
  lp.type='lowpass'; lp.frequency.value = 1400; lp.Q.value = 0.7;
  del.delayTime.value = 0.35; fb.gain.value = 0.25;
  lp.connect(del); del.connect(fb); fb.connect(del); del.connect(g); g.connect(ctx.destination);
  g.gain.value = 0.1;
}

function startPads(){
  stopPads();
  nodes = mk(ctx); connectChain();
  const dst = nodes.lp;
  // gentle noise bed
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * 0.01;
  const noise = ctx.createBufferSource(); noise.buffer=noiseBuf; noise.loop=true;
  const nGain = ctx.createGain(); nGain.gain.value = (preset==='still') ? 0.02 : 0.035;
  noise.connect(nGain).connect(dst); noise.start();

  function osc(freq, detune=0){
    const o = ctx.createOscillator(); o.type='sine'; o.frequency.value=freq; o.detune.value = detune;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    o.connect(g).connect(dst); o.start();
    return {o,g};
  }
  const tonic = preset==='daemmerung' ? 196 : 220; // G3 or A3
  const fifth = tonic * 1.5;
  const third = tonic * (preset==='still' ? 1.2 : 1.25);

  const o1 = osc(tonic, -7);
  const o2 = osc(fifth, +7);
  const o3 = osc(third, 0);

  nodes.sources = [noise, o1.o, o2.o, o3.o];
  nodes.gains = [o1.g, o2.g, o3.g, nGain];

  function tick(){
    const t = ctx.currentTime;
    o1.g.gain.setTargetAtTime(0.045 + 0.01*Math.sin(t*0.07), t, 0.8);
    o2.g.gain.setTargetAtTime(0.035 + 0.01*Math.cos(t*0.05), t, 0.8);
    o3.g.gain.setTargetAtTime(0.028 + 0.008*Math.sin(t*0.04), t, 0.8);
    nodes.lp.frequency.setTargetAtTime(1000 + 400*Math.sin(t*0.06), t, 0.5);
    nodes.g.gain.setTargetAtTime((preset==='still'?0.06:0.09) + 0.02*Math.sin(t*0.03), t, 1.2);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}

function stopPads(){
  if(!ctx || !nodes.sources) return;
  try{ nodes.sources.forEach(s=> s.stop?.()); }catch{}
  cancelAnimationFrame(raf);
  nodes = {};
}

function build(){
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  startPads();
}

export function toggleAudio(on){
  if(on===undefined) on = !enabled;
  enabled = on;
  const state = store.get() || {};
  state.enabled = enabled; state.preset = preset; store.set(state);
  if(enabled){
    if(!ctx) build();
    else { ctx.resume(); startPads(); }
  }else{
    stopPads();
    if(ctx) ctx.suspend();
  }
  return enabled;
}

export function setPreset(name){
  preset = (name==='still'||name==='weich'||name==='daemmerung') ? name : 'weich';
  const s = store.get() || {}; s.preset = preset; store.set(s);
  if(enabled && ctx){ startPads(); }
  return preset;
}

export function setupToggle(btn){
  const saved = store.get();
  if(saved?.preset) preset = saved.preset;
  if(saved?.enabled) toggleAudio(true);
  btn.setAttribute('aria-pressed', String(!!saved?.enabled));
  btn.title = 'Klang an/aus (Doppelklick: Preset wechseln)';
  btn.addEventListener('click', ()=>{
    const state = toggleAudio();
    btn.setAttribute('aria-pressed', String(state));
  }, {passive:true});
  btn.addEventListener('dblclick', ()=>{
    preset = (preset==='still') ? 'weich' : (preset==='weich' ? 'daemmerung' : 'still');
    setPreset(preset);
  }, {passive:true});
}
