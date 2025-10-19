/** Simple ambient audio shim; provides window.AudioController.toggle() */
if (!window.AudioController){
  const audio = new Audio();
  audio.loop = true; audio.preload = 'none';
  // You can set your own audio source here later
  let on = false;
  window.AudioController = {
    toggle(){
      on = !on;
      try{
        if (on){ audio.play().catch(()=>{}); } else { audio.pause(); }
      }catch{}
      return on;
    }
  };
}
