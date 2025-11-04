// public/js/spark-bubble.js
// "Today's Spark": holt optional eine kleine Tages-Inspiration vom Backend.
// Fehler/500 werden leise geloggt (kein roter "Failed to load resource").
// Nutzt <meta name="x-api-base" content="/api"> als API-Base (siehe index.html).

(function(){
  const apiBase = document.querySelector('meta[name="x-api-base"]')?.content || '/api';
  const url = apiBase.replace(/\/$/,'') + '/spark/today';

  async function run(){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        // 404/500: dezent + ohne störendes rotes Netzwerklageräusch
        console.debug('[spark-bubble] suppressed HTTP', res.status);
        return;
      }
      const data = await res.json().catch(()=>null);
      if (!data) return;

      // Optional: dezente UI (nur wenn Container existiert)
      const host = document.querySelector('#panel-daily');
      if (host){
        const box = document.createElement('div');
        box.className = 'spark';
        box.innerHTML = `<strong>${data.title || 'Today’s Spark'}</strong>${data.text?`<p>${data.text}</p>`:''}`;
        host.appendChild(box);
        host.removeAttribute('hidden');
      }
    } catch (err){
      console.debug('[spark-bubble] suppressed error', err);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
