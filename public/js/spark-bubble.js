// public/js/spark-bubble.js – Vanilla JS Version (keine Frameworks)
(function(){
  const ENABLE = true;
  if(!ENABLE) return;

  function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
  function ce(tag, cls){ const el=document.createElement(tag); if(cls) el.className=cls; return el; }

  async function fetchSpark() {
    try {
      const r = await fetch('/api/spark/today', { cache: 'no-store' });
      if (!r.ok) return null;
      // ETag wird vom Browser automatisch für 304 genutzt, hier nicht manuell gebraucht
      return await r.json();
    } catch(e){ return null; }
  }

  function renderBubble(data){
    if (!data) return;
    const wrap = ce('button','spark-bubble'); wrap.setAttribute('aria-label',"Today's Spark");

    const badge = ce('span','spark-badge'); badge.textContent = data.type;
    wrap.appendChild(badge);

    wrap.addEventListener('click', () => openOverlay(data));
    document.body.appendChild(wrap);
  }

  function openOverlay(data){
    const overlay = ce('div','spark-overlay');
    overlay.addEventListener('click', () => overlay.remove());

    const card = ce('div','spark-card');
    card.addEventListener('click', e => e.stopPropagation());

    const type = ce('div','spark-type'); type.textContent = data.type;
    const title = ce('div','spark-title'); title.textContent = data.title;
    const teaser = ce('div','spark-teaser'); teaser.textContent = data.teaser;

    const actions = ce('div','spark-actions');
    const cta = ce('a','spark-btn primary'); cta.textContent = data.cta.label; cta.href = data.cta.url;
    const hide = ce('button','spark-btn ghost'); hide.textContent = 'Ausblenden';
    hide.addEventListener('click', () => {
      // session-hide: einfache Variante
      sessionStorage.setItem('spark_hidden', '1');
      overlay.remove();
      const b = qs('.spark-bubble'); if (b) b.remove();
    });

    actions.appendChild(cta); actions.appendChild(hide);
    card.appendChild(type); card.appendChild(title); card.appendChild(teaser); card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('spark_hidden') === '1') return;
    const data = await fetchSpark();
    if (data) renderBubble(data);
  });
})();
