/**
 * iTiger - Main Entry Point
 * Initializes all systems and starts the game
 */
import { ThemeManager } from './ThemeManager.js';
import { AudioManager } from './AudioManager.js';
import { SlotMachine } from './SlotMachine.js';
import { ReelManager } from './ReelManager.js';
import { UIManager } from './UIManager.js';
import { ParticleSystem } from './particles/ParticleSystem.js';

// ==============================
// App Initialization
// ==============================

class App {
  constructor() {
    this.themeManager = new ThemeManager();
    this.audioManager = new AudioManager();
    this.particleSystem = null;
    this.slotMachine = null;
    this.reelManager = null;
    this.uiManager = null;
  }

  async init() {
    // Show loading screen
    this._showLoading();

    // Init theme (applies CSS custom properties)
    this.themeManager.init();

    // Init particle system on the VFX canvas
    const canvas = document.getElementById('vfx-canvas');
    if (canvas) {
      this.particleSystem = new ParticleSystem(canvas);
      this.particleSystem.start();
    }

    // Init slot machine engine
    this.slotMachine = new SlotMachine(this.themeManager);

    // Init reel manager (DOM-based reel animation)
    const reelsContainer = document.getElementById('reels-container');
    if (reelsContainer) {
      this.reelManager = new ReelManager(reelsContainer, this.themeManager);
    }

    // Init UI manager (connects everything)
    this.uiManager = new UIManager(
      this.slotMachine,
      this.reelManager,
      this.particleSystem,
      this.audioManager,
      this.themeManager
    );

    // Theme change handler
    this.themeManager.onChange((themeId, config) => {
      // Update theme buttons
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeId);
      });
    });

    // Set initial theme buttons state
    this._initThemeButtons();

    // Ambient particle effects per theme
    this._startAmbientEffects();

    // Hide loading screen
    this._hideLoading();

    // Welcome message
    console.log('%c🎰 iTiger Slot Machine loaded!', 'color: #FFD700; font-size: 20px; font-weight: bold;');
    console.log('%cPress SPACE or click SPIN to play', 'color: #888; font-size: 14px;');
  }

  _initThemeButtons() {
    const currentTheme = this.themeManager.currentTheme;
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
  }

  _startAmbientEffects() {
    // Subtle ambient particles based on theme
    const themeConfig = this.themeManager.getConfig();
    if (!this.particleSystem) return;

    // Periodic ambient effect
    const emitAmbient = () => {
      if (!this.particleSystem.running) return;

      const effects = themeConfig.particleEffects;
      const effect = effects[Math.floor(Math.random() * effects.length)];

      switch (effect) {
        case 'fire':
          this.particleSystem.fire(
            Math.random() * window.innerWidth,
            window.innerHeight,
            0.3
          );
          break;
        case 'sparks':
          this.particleSystem.sparks(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight,
            0.2
          );
          break;
        case 'blizzard':
          this.particleSystem.blizzard(0.3);
          break;
        case 'confetti':
          // Don't auto-confetti - only on wins
          break;
        case 'goldenShower':
          // Don't auto-golden shower - only on wins
          break;
        case 'mysticGlow':
          this.particleSystem.mysticGlow(
            Math.random() * window.innerWidth,
            window.innerHeight,
            { r: 0.3, g: 0.8, b: 0.5 }
          );
          break;
        case 'starburst':
          this.particleSystem.sparks(
            Math.random() * window.innerWidth,
            Math.random() * window.innerHeight * 0.5,
            0.15
          );
          break;
      }
    };

    // Fire ambient effect every 3 seconds
    setInterval(emitAmbient, 3000);
    // Fire once immediately
    setTimeout(emitAmbient, 1000);
  }

  _showLoading() {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.style.display = 'flex';
  }

  _hideLoading() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          loader.style.display = 'none';
        },
      });
    }
  }
}

// ==============================
// Boot
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(console.error);
});
