// public/js/audio.js
// Minimaler Ambient-Player (dezent, loop). Startet nur nach User-Interaktion.
const src = './audio/road_trip.mp3';
let playing = false;
const audio = new Audio(src);
audio.loop = true;
audio.preload = 'auto';
audio.volume = 0.28; // dezent
audio.playbackRate = 0.92; // etwas ruhigeres Tempo

export const AudioController = {
  toggle(){
    try{
      if(!playing){
        const p = audio.play();
        if (p && typeof p.then==='function') { p.then(()=>{}).catch(()=>{}); }
        playing = true;
      }else{
        audio.pause();
        playing = false;
      }
      return playing;
    }catch(_e){ return false; }
  },
  isOn(){ return playing; }
};

// global verfügbar (bestandskompatibel)
window.AudioController = AudioController;
