// Only fetch /api/spark/today if meta x-api-base is present. No console 404s.
(function(){
  'use strict';
  var meta = document.querySelector('meta[name="x-api-base"]');
  var base = meta && meta.content ? meta.content.replace(/\/$/, '') : '';
  if (!base) return;
  var url = base + '/spark/today';
  try {
    fetch(url, { cache: 'no-store' })
      .then(function(res){ if(!res.ok) return null; return res.json(); })
      .then(function(){ /* optional UI here */ })
      .catch(function(){});
  } catch(e){}
})();
