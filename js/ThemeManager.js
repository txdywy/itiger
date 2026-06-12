/**
 * ThemeManager - Manages theme switching and configuration
 */
export const THEMES = {
  'las-vegas': {
    name: 'Las Vegas',
    icon: '🎰',
    symbols: ['🎰', '💎', '7️⃣', '🍒', '🔔', '💰', '🃏', '⭐'],
    wild: '🃏',
    scatter: '⭐',
    particleEffects: ['confetti', 'goldenShower', 'explosion'],
    bgAnimation: 'neonPulse',
  },
  'egypt': {
    name: 'Ancient Egypt',
    icon: '🏛️',
    symbols: ['☥', '🐍', '👁️', '🗿', '💎', '🏺', '🦅', '☀️'],
    wild: '🦅',
    scatter: '☀️',
    particleEffects: ['fire', 'sparks'],
    bgAnimation: 'heatShimmer',
  },
  'maya': {
    name: 'Maya Temple',
    icon: '🌿',
    symbols: ['🏛️', '🐆', '🌀', '💎', '🪶', '🗿', '🦅', '☀️'],
    wild: '🦅',
    scatter: '☀️',
    particleEffects: ['sparks', 'mysticGlow'],
    bgAnimation: 'torchFlicker',
  },
  'underwater': {
    name: 'Deep Ocean',
    icon: '🌊',
    symbols: ['🐙', '🐚', '🐠', '💎', '🔱', '🦈', '🌊', '⭐'],
    wild: '🌊',
    scatter: '⭐',
    particleEffects: ['blizzard', 'mysticGlow'],
    bgAnimation: 'heatShimmer',
  },
  'space': {
    name: 'Cosmic Space',
    icon: '🚀',
    symbols: ['🚀', '🪐', '🌟', '💎', '👾', '🛸', '🌌', '⭐'],
    wild: '🛸',
    scatter: '⭐',
    particleEffects: ['starburst', 'blizzard'],
    bgAnimation: 'starTwinkle',
  },
};

export class ThemeManager {
  constructor() {
    this.currentTheme = 'las-vegas';
    this.callbacks = [];
  }

  init() {
    // Load saved theme
    const saved = localStorage.getItem('itiger-theme');
    if (saved && THEMES[saved]) {
      this.currentTheme = saved;
    }
    this.apply(this.currentTheme);
  }

  apply(themeId) {
    if (!THEMES[themeId]) return;

    this.currentTheme = themeId;
    document.documentElement.dataset.theme = themeId;
    localStorage.setItem('itiger-theme', themeId);

    // Notify listeners
    this.callbacks.forEach(cb => cb(themeId, THEMES[themeId]));
  }

  onChange(callback) {
    this.callbacks.push(callback);
  }

  getConfig() {
    return THEMES[this.currentTheme];
  }

  getSymbols() {
    return THEMES[this.currentTheme].symbols;
  }

  getWild() {
    return THEMES[this.currentTheme].wild;
  }

  getScatter() {
    return THEMES[this.currentTheme].scatter;
  }

  getAllThemes() {
    return Object.entries(THEMES).map(([id, config]) => ({ id, ...config }));
  }
}
