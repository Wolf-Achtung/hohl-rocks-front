// ═══════════════════════════════════════════════════════════════
// HOHL.ROCKS - BUBBLES ENGINE
// Einfache Bubble-Animation für den Hintergrund
// Version: 1.0 - Simpel & Performant
// ═══════════════════════════════════════════════════════════════

class BubblesEngine {
  constructor(containerId = 'bubbles-container') {
    this.container = document.getElementById(containerId);
    this.bubbles = [];
    this.maxBubbles = 20;
    this.animationId = null;
    this.isRunning = false;

    if (!this.container) {
      console.warn('[Bubbles] Container not found, creating one');
      this.createContainer();
    }

    console.log('[Bubbles] BubblesEngine initialized');
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'bubbles-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    `;
    document.body.insertBefore(this.container, document.body.firstChild);
  }

  createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 60 + 20; // 20-80px
    const left = Math.random() * 100; // 0-100%
    const duration = Math.random() * 10 + 10; // 10-20s
    const delay = Math.random() * 5; // 0-5s
    
    bubble.style.cssText = `
      position: absolute;
      bottom: -100px;
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
      border-radius: 50%;
      opacity: 0.6;
      animation: float ${duration}s ease-in-out ${delay}s infinite;
      backdrop-filter: blur(2px);
    `;

    return bubble;
  }

  start() {
    if (this.isRunning) {
      console.log('[Bubbles] Already running');
      return;
    }

    console.log('[Bubbles] Starting animation');
    this.isRunning = true;

    // Erstelle initial Bubbles
    for (let i = 0; i < this.maxBubbles; i++) {
      const bubble = this.createBubble();
      this.bubbles.push(bubble);
      this.container.appendChild(bubble);
    }

    // Füge CSS Animation hinzu falls noch nicht vorhanden
    this.addAnimationStyles();
  }

  addAnimationStyles() {
    if (document.getElementById('bubbles-animation-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'bubbles-animation-styles';
    style.textContent = `
      @keyframes float {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 0.6;
        }
        90% {
          opacity: 0.6;
        }
        100% {
          transform: translateY(-100vh) rotate(360deg);
          opacity: 0;
        }
      }

      .bubble {
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[Bubbles] Stopping animation');
    this.isRunning = false;

    // Entferne alle Bubbles
    this.bubbles.forEach(bubble => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
    });
    this.bubbles = [];
  }

  pause() {
    if (!this.isRunning) return;
    
    this.bubbles.forEach(bubble => {
      bubble.style.animationPlayState = 'paused';
    });
    console.log('[Bubbles] Paused');
  }

  resume() {
    if (!this.isRunning) return;
    
    this.bubbles.forEach(bubble => {
      bubble.style.animationPlayState = 'running';
    });
    console.log('[Bubbles] Resumed');
  }

  destroy() {
    this.stop();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    console.log('[Bubbles] Destroyed');
  }
}

// Global Instance
if (typeof window !== 'undefined') {
  window.BubblesEngine = BubblesEngine;
  
  // Auto-Start beim Laden (optional)
  // window.addEventListener('DOMContentLoaded', () => {
  //   window.bubblesEngine = new BubblesEngine();
  //   window.bubblesEngine.start();
  // });
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BubblesEngine;
}

console.log('[Bubbles] bubblesEngine.js loaded successfully');
