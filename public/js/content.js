// Guard so that feature flags don't block clicks when disabled
(function(){
  'use strict';
  // If any overlay accidentally stays on top, remove pointer-events after 3s idle
  setTimeout(() => {
    const overlays = document.querySelectorAll('.overlay, .modal, #bubble-modal');
    overlays.forEach(el => {
      if (getComputedStyle(el).display === 'none') {
        el.style.pointerEvents = 'none';
      }
    });
  }, 3000);
})();
