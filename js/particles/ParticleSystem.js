/**
 * ParticleSystem - Facade that ties pool, emitters, and renderer together
 * Manages the update/render loop and provides high-level effect methods
 */
import { ParticlePool } from './ParticlePool.js';
import { Emitter } from './Emitter.js';
import { ParticleRenderer } from './ParticleRenderer.js';

export class ParticleSystem {
  constructor(canvas) {
    this.pool = new ParticlePool(12000);
    this.renderer = new ParticleRenderer(canvas);
    this.emitters = [];
    this.running = false;
    this.lastTime = 0;
    this.densityMultiplier = 1; // for mobile performance scaling

    // FPS tracking and dynamic optimization properties
    this.fps = 60;
    this.frameTimes = [];

    // Detect mobile and reduce particle count
    if (window.innerWidth < 768 || navigator.maxTouchPoints > 0) {
      this.densityMultiplier = 0.5;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp dt to prevent huge jumps on tab switch
    if (dt > 0.1) dt = 0.016;

    // Monitor FPS
    this.frameTimes.push(now);
    while (this.frameTimes.length > 0 && this.frameTimes[0] <= now - 1000) {
      this.frameTimes.shift();
    }
    const currentFps = this.frameTimes.length;
    this.fps = this.fps * 0.95 + currentFps * 0.05; // smoothed FPS

    // Throttling down density multiplier if performance drops below 54fps
    if (this.fps < 54 && this.densityMultiplier > 0.15) {
      this.densityMultiplier -= 0.05 * dt;
    } else if (this.fps > 58 && this.densityMultiplier < 1.0) {
      const maxDensity = (window.innerWidth < 768 || navigator.maxTouchPoints > 0) ? 0.5 : 1.0;
      if (this.densityMultiplier < maxDensity) {
        this.densityMultiplier += 0.02 * dt;
      }
    }

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this._loop());
  }

  update(dt) {
    // Update emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const emitter = this.emitters[i];
      emitter.update(dt);
      if (!emitter.active) {
        this.emitters.splice(i, 1);
      }
    }

    // Update particles
    this.pool.update(dt);
  }

  render() {
    this.renderer.render(this.pool);
  }

  /**
   * Create an emitter and add it to the system
   */
  createEmitter(config) {
    const emitter = new Emitter(this.pool, config);
    this.emitters.push(emitter);
    return emitter;
  }

  /**
   * Remove all emitters and fade out existing particles
   */
  clearEmitters() {
    this.emitters = [];
  }

  clearAll() {
    this.emitters = [];
    // Release all particles
    for (let i = 0; i < this.pool.max; i++) {
      if (this.pool.life[i] > 0) {
        this.pool.life[i] = 0;
        this.pool.freeList.push(i);
      }
    }
    this.pool.count = 0;
  }

  // ==============================
  // High-level effect methods
  // ==============================

  /**
   * Fire effect - upward flames
   */
  fire(x, y, intensity = 1) {
    const count = Math.round(80 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x, y,
      rate: count,
      duration: 2,
      angle: -Math.PI / 2,     // upward
      spread: Math.PI * 0.4,
      speed: 120 * intensity,
      speedVariance: 0.6,
      lifetime: 1.2,
      gravity: -0.3,            // slight upward pull
      sizeStart: 8 * intensity,
      sizeEnd: 1,
      colorFrom: { r: 1, g: 0.9, b: 0.3 },    // yellow
      colorTo: { r: 1, g: 0.2, b: 0 },          // red
      alpha: 0.9,
      shape: 0,  // circle
      blendMode: 'lighter',
    });
  }

  /**
   * Fire ring - circular fire burst
   */
  fireRing(x, y, radius = 100) {
    const emitters = [];
    const count = Math.round(16 * this.densityMultiplier);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const ex = x + Math.cos(angle) * radius;
      const ey = y + Math.sin(angle) * radius;
      emitters.push(this.createEmitter({
        x: ex, y: ey,
        rate: 15,
        duration: 1.5,
        angle: angle - Math.PI, // inward
        spread: Math.PI * 0.3,
        speed: 60,
        lifetime: 0.8,
        gravity: -0.2,
        sizeStart: 6,
        sizeEnd: 0,
        colorFrom: { r: 1, g: 0.8, b: 0.2 },
        colorTo: { r: 1, g: 0.1, b: 0 },
        shape: 0,
      }));
    }
    return emitters;
  }

  /**
   * Explosion - radial burst of particles
   */
  explosion(x, y, intensity = 1) {
    const count = Math.round(150 * intensity * this.densityMultiplier);
    const emitter = this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,      // 360 degrees
      speed: 300 * intensity,
      speedVariance: 0.8,
      lifetime: 1.0,
      gravity: 0.2,
      sizeStart: 6,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 0.8 },    // white-yellow
      colorTo: { r: 1, g: 0.2, b: 0 },       // red
      shape: 0,
      rotSpeed: 5,
    });
    return emitter;
  }

  /**
   * Golden shower - gold coins raining down
   */
  goldenShower(centerX, width, intensity = 1) {
    const count = Math.round(120 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x: centerX,
      y: -20,
      rate: count,
      duration: 3,
      angle: Math.PI / 2,       // downward
      spread: Math.PI * 0.6,
      speed: 200,
      speedVariance: 0.4,
      lifetime: 3,
      gravity: 0.4,
      sizeStart: 20,
      sizeEnd: 14,
      colorFrom: { r: 1, g: 0.84, b: 0 },    // gold
      colorTo: { r: 1, g: 1, b: 0.8 },        // light gold
      alpha: 0.95,
      shape: 2,  // coin
      rotSpeed: 8,
      blendMode: 'source-over',
    });
  }

  /**
   * Blizzard - snow/wind particles
   */
  blizzard(intensity = 1) {
    const w = window.innerWidth;
    const count = Math.round(60 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x: w / 2,
      y: -20,
      rate: count,
      duration: 4,
      angle: Math.PI * 0.6,     // downward with wind
      spread: Math.PI * 0.5,
      speed: 80,
      speedVariance: 0.6,
      lifetime: 4,
      gravity: 0.1,
      sizeStart: 4,
      sizeEnd: 1,
      colorFrom: { r: 1, g: 1, b: 1 },        // white
      colorTo: { r: 0.7, g: 0.85, b: 1 },     // ice blue
      alpha: 0.7,
      shape: 0,
      blendMode: 'source-over',
    });
  }

  /**
   * Sparks - short-lived bright particles from a point
   */
  sparks(x, y, intensity = 1) {
    const count = Math.round(40 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x, y,
      burstCount: count,
      angle: -Math.PI / 2,      // upward
      spread: Math.PI * 0.8,
      speed: 250,
      speedVariance: 0.7,
      lifetime: 0.6,
      gravity: 0.5,
      sizeStart: 3,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 0.8 },    // white
      colorTo: { r: 1, g: 0.5, b: 0 },       // orange
      shape: 0,
      rotSpeed: 3,
    });
  }

  /**
   * Confetti - colorful paper pieces
   */
  confetti(centerX, intensity = 1) {
    const count = Math.round(100 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x: centerX,
      y: -20,
      burstCount: count,
      angle: Math.PI / 2,       // downward
      spread: Math.PI * 0.8,
      speed: 300,
      speedVariance: 0.6,
      lifetime: 3,
      gravity: 0.3,
      sizeStart: 8,
      sizeEnd: 3,
      colorFrom: { r: 1, g: 0.2, b: 0.6 },    // pink
      colorTo: { r: 0, g: 0.8, b: 1 },          // cyan
      shape: 3,  // rect
      rotSpeed: 12,
      blendMode: 'source-over',
    });
  }

  /**
   * Starburst - expanding ring of stars
   */
  starburst(x, y, intensity = 1) {
    const count = Math.round(60 * intensity * this.densityMultiplier);
    return this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,
      speed: 200,
      speedVariance: 0.3,
      lifetime: 1.5,
      gravity: -0.05,
      sizeStart: 10,
      sizeEnd: 2,
      colorFrom: { r: 1, g: 0.84, b: 0 },    // gold
      colorTo: { r: 1, g: 1, b: 1 },           // white
      shape: 1,  // star
      rotSpeed: 6,
      blendMode: 'lighter',
    });
  }

  /**
   * Coin rain - coins falling across the screen
   */
  coinRain(intensity = 1) {
    const w = window.innerWidth;
    const emitters = [];
    const columnCount = Math.round(5 * intensity);

    for (let i = 0; i < columnCount; i++) {
      const x = (w / (columnCount + 1)) * (i + 1);
      emitters.push(this.createEmitter({
        x,
        y: -30,
        rate: 8,
        duration: 3,
        angle: Math.PI / 2,
        spread: Math.PI * 0.15,
        speed: 150,
        speedVariance: 0.3,
        lifetime: 3,
        gravity: 0.3,
        sizeStart: 24,
        sizeEnd: 18,
        colorFrom: { r: 1, g: 0.84, b: 0 },
        colorTo: { r: 1, g: 0.65, b: 0 },
        shape: 2,  // coin
        rotSpeed: 10,
        blendMode: 'source-over',
      }));
    }
    return emitters;
  }

  /**
   * Mystic glow - ethereal particles rising
   */
  mysticGlow(x, y, color = { r: 0.3, g: 0.8, b: 0.5 }) {
    return this.createEmitter({
      x, y,
      rate: 30,
      duration: 2,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.5,
      speed: 50,
      speedVariance: 0.5,
      lifetime: 2,
      gravity: -0.15,
      sizeStart: 5,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 1 },
      colorTo: color,
      alpha: 0.6,
      shape: 4,  // ring
      blendMode: 'lighter',
    });
  }

  /**
   * Fire Blast - massive fire explosion
   */
  fireBlast(x, y) {
    const intensity = 1.6;
    const count = Math.round(180 * intensity * this.densityMultiplier);
    // Erupting fire sparks
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,
      speed: 340,
      speedVariance: 0.6,
      lifetime: 1.4,
      gravity: -0.2, // slightly floating up
      sizeStart: 25,
      sizeEnd: 4,
      colorFrom: { r: 1, g: 0.8, b: 0 },
      colorTo: { r: 1, g: 0.1, b: 0 },
      alpha: 0.9,
      shape: 0, // circle
      blendMode: 'lighter',
    });

    // Outer ring shockwave
    this.fireRing(x, y, 80);
  }

  /**
   * Frost Storm - ice blizzard
   */
  frostStorm(x, y) {
    const intensity = 1.5;
    const count = Math.round(150 * this.densityMultiplier);
    // Cold starburst
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,
      speed: 260,
      speedVariance: 0.5,
      lifetime: 1.8,
      gravity: 0.1,
      sizeStart: 18,
      sizeEnd: 2,
      colorFrom: { r: 0.8, g: 0.95, b: 1 }, // ice white
      colorTo: { r: 0.2, g: 0.6, b: 1 },    // deep ice blue
      alpha: 0.9,
      shape: 1, // star (ice crystals)
      rotSpeed: 5,
      blendMode: 'lighter',
    });
  }

  /**
   * Electric Storm - lightning sparks
   */
  electricStorm(x, y) {
    const count = Math.round(120 * this.densityMultiplier);
    // Shock sparks
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,
      speed: 400,
      speedVariance: 0.7,
      lifetime: 0.8,
      gravity: 0.2,
      sizeStart: 12,
      sizeEnd: 1,
      colorFrom: { r: 1, g: 1, b: 1 },      // white flash
      colorTo: { r: 0.6, g: 0, b: 1 },      // deep violet neon
      alpha: 1.0,
      shape: 4, // ring (shockwave arcs)
      rotSpeed: 15,
      blendMode: 'lighter',
    });
  }

  /**
   * Gold Sprayer - fountain spraying coins & gold bars
   */
  goldSprayer(centerX, centerY) {
    // Emitters spraying gold coins (shape 2) and gold bars (shape 3) upwards
    const count = Math.round(80 * this.densityMultiplier);
    
    // Coins fountain
    this.createEmitter({
      x: centerX,
      y: centerY,
      rate: count,
      duration: 3,
      angle: -Math.PI / 2, // upwards
      spread: Math.PI * 0.4,
      speed: 400,
      speedVariance: 0.5,
      lifetime: 3.5,
      gravity: 0.6, // pull back down heavily
      sizeStart: 22,
      sizeEnd: 16,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 1, b: 0.8 },
      alpha: 1.0,
      shape: 2, // coin
      rotSpeed: 8,
      blendMode: 'source-over',
    });

    // Gold bars fountain
    this.createEmitter({
      x: centerX,
      y: centerY,
      rate: Math.round(count * 0.4),
      duration: 2.5,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.3,
      speed: 380,
      speedVariance: 0.4,
      lifetime: 3.5,
      gravity: 0.65,
      sizeStart: 28,
      sizeEnd: 22,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 0.5, b: 0 },
      alpha: 1.0,
      shape: 3, // rect (renders as gold bar)
      rotSpeed: 6,
      blendMode: 'source-over',
    });
  }

  /**
   * Lightning Strike - shockwave sparks dropping from sky
   */
  lightningStrike(x, y) {
    const count = Math.round(150 * this.densityMultiplier);
    // Main vertical strike flash
    this.createEmitter({
      x,
      y: 0,
      burstCount: 40,
      angle: Math.PI / 2,
      spread: 0.05,
      speed: 1000,
      lifetime: 0.3,
      gravity: 0,
      sizeStart: 15,
      sizeEnd: 1,
      colorFrom: { r: 0.9, g: 0.95, b: 1 },
      colorTo: { r: 0.5, g: 0, b: 1 },
      alpha: 1.0,
      shape: 0,
    });
    // Ground shock blast
    this.createEmitter({
      x,
      y,
      burstCount: count,
      angle: -Math.PI / 2,
      spread: Math.PI * 1.5,
      speed: 450,
      speedVariance: 0.5,
      lifetime: 0.8,
      gravity: 0.1,
      sizeStart: 8,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 1 },
      colorTo: { r: 0, g: 0.8, b: 1 }, // electric cyan
      alpha: 1.0,
      shape: 4, // ring
      rotSpeed: 10,
      blendMode: 'lighter',
    });
  }

  /**
   * Color Shockwave - expanding multi-colored circle rings
   */
  colorShockwave(x, y, radius = 50) {
    const count = Math.round(90 * this.densityMultiplier);
    // Expand concentric ring sparks
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: 0,
      spread: Math.PI * 2,
      speed: 350,
      speedVariance: 0.2,
      lifetime: 1.2,
      gravity: 0,
      sizeStart: 10,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 0, b: 0.5 }, // Magenta
      colorTo: { r: 0, g: 1, b: 1 },    // Cyan
      alpha: 0.8,
      shape: 4, // ring
      rotSpeed: 12,
      blendMode: 'lighter',
    });
  }

  // ======================================================
  // NEW DAZZLING EFFECTS - Gems, Money, Treasure
  // ======================================================

  /**
   * Diamond Burst - sparkling gem explosion
   */
  diamondBurst(x, y, intensity = 1) {
    const count = Math.round(80 * intensity * this.densityMultiplier);
    // Diamond gems
    this.createEmitter({
      x, y,
      burstCount: Math.round(count * 0.6),
      angle: 0,
      spread: Math.PI * 2,
      speed: 280 * intensity,
      speedVariance: 0.6,
      lifetime: 2.0,
      gravity: 0.3,
      sizeStart: 16,
      sizeEnd: 6,
      colorFrom: { r: 0.6, g: 0.95, b: 1 },    // ice blue
      colorTo: { r: 0.9, g: 0.9, b: 1 },         // white
      alpha: 0.95,
      shape: 5, // gem
      rotSpeed: 10,
      blendMode: 'source-over',
    });
    // Sparkle accents
    this.createEmitter({
      x, y,
      burstCount: Math.round(count * 0.4),
      angle: 0,
      spread: Math.PI * 2,
      speed: 350,
      speedVariance: 0.7,
      lifetime: 0.8,
      gravity: -0.1,
      sizeStart: 5,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 1 },
      colorTo: { r: 0.7, g: 0.9, b: 1 },
      alpha: 1.0,
      shape: 1, // star sparkles
      rotSpeed: 15,
      blendMode: 'lighter',
    });
  }

  /**
   * Money Rain - dollar coins and regular coins raining down
   */
  moneyRain(intensity = 1) {
    const w = window.innerWidth;
    const baseRate = Math.round(60 * intensity * this.densityMultiplier);

    // Dollar coins from left
    this.createEmitter({
      x: w * 0.25,
      y: -30,
      rate: baseRate,
      duration: 3.5,
      angle: Math.PI * 0.55,
      spread: Math.PI * 0.3,
      speed: 220,
      speedVariance: 0.4,
      lifetime: 3.5,
      gravity: 0.35,
      sizeStart: 24,
      sizeEnd: 18,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 1, b: 0.8 },
      alpha: 1.0,
      shape: 6, // gemDollar
      rotSpeed: 8,
      blendMode: 'source-over',
    });

    // Regular coins from right
    this.createEmitter({
      x: w * 0.75,
      y: -30,
      rate: baseRate,
      duration: 3.5,
      angle: Math.PI * 0.45,
      spread: Math.PI * 0.3,
      speed: 220,
      speedVariance: 0.4,
      lifetime: 3.5,
      gravity: 0.35,
      sizeStart: 24,
      sizeEnd: 18,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 0.8, g: 0.6, b: 0 },
      alpha: 1.0,
      shape: 2, // coin
      rotSpeed: 8,
      blendMode: 'source-over',
    });

    // Center gold bar shower
    this.createEmitter({
      x: w * 0.5,
      y: -30,
      rate: Math.round(baseRate * 0.3),
      duration: 3,
      angle: Math.PI / 2,
      spread: Math.PI * 0.4,
      speed: 180,
      speedVariance: 0.3,
      lifetime: 3.5,
      gravity: 0.45,
      sizeStart: 28,
      sizeEnd: 22,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 0.5, b: 0 },
      alpha: 1.0,
      shape: 3, // gold bar
      rotSpeed: 5,
      blendMode: 'source-over',
    });
  }

  /**
   * Treasure Explosion - all valuables bursting out (coins, gems, gold bars, dollar coins)
   */
  treasureExplosion(x, y) {
    const dm = this.densityMultiplier;

    // Gold coins burst
    this.createEmitter({
      x, y,
      burstCount: Math.round(80 * dm),
      angle: 0,
      spread: Math.PI * 2,
      speed: 350,
      speedVariance: 0.7,
      lifetime: 3.0,
      gravity: 0.5,
      sizeStart: 22,
      sizeEnd: 16,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 1, b: 0.8 },
      alpha: 1.0,
      shape: 2, // coin
      rotSpeed: 10,
      blendMode: 'source-over',
    });

    // Diamond gems burst
    this.createEmitter({
      x, y,
      burstCount: Math.round(50 * dm),
      angle: 0,
      spread: Math.PI * 2,
      speed: 300,
      speedVariance: 0.6,
      lifetime: 2.5,
      gravity: 0.4,
      sizeStart: 18,
      sizeEnd: 8,
      colorFrom: { r: 0.6, g: 0.95, b: 1 },
      colorTo: { r: 0.9, g: 0.9, b: 1 },
      alpha: 0.95,
      shape: 5, // gem
      rotSpeed: 12,
      blendMode: 'source-over',
    });

    // Dollar coins burst
    this.createEmitter({
      x, y,
      burstCount: Math.round(40 * dm),
      angle: 0,
      spread: Math.PI * 2,
      speed: 320,
      speedVariance: 0.65,
      lifetime: 3.0,
      gravity: 0.45,
      sizeStart: 22,
      sizeEnd: 16,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 0.8, g: 0.65, b: 0 },
      alpha: 1.0,
      shape: 6, // gemDollar
      rotSpeed: 8,
      blendMode: 'source-over',
    });

    // Gold bars burst
    this.createEmitter({
      x, y,
      burstCount: Math.round(30 * dm),
      angle: 0,
      spread: Math.PI * 2,
      speed: 250,
      speedVariance: 0.5,
      lifetime: 3.5,
      gravity: 0.6,
      sizeStart: 30,
      sizeEnd: 24,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 0.5, b: 0 },
      alpha: 1.0,
      shape: 3, // gold bar
      rotSpeed: 6,
      blendMode: 'source-over',
    });

    // Sparkle ring
    this.colorShockwave(x, y);
  }

  /**
   * Gold Bar Cascade - gold bars streaming down the screen
   */
  goldBarCascade(centerX, width) {
    const dm = this.densityMultiplier;
    const w = width || window.innerWidth * 0.6;
    const count = Math.round(50 * dm);

    this.createEmitter({
      x: centerX,
      y: -30,
      rate: count,
      duration: 3.5,
      angle: Math.PI / 2,
      spread: Math.PI * 0.5,
      speed: 180,
      speedVariance: 0.4,
      lifetime: 4,
      gravity: 0.4,
      sizeStart: 28,
      sizeEnd: 22,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 1, g: 0.5, b: 0 },
      alpha: 1.0,
      shape: 3, // rect (gold bar)
      rotSpeed: 5,
      blendMode: 'source-over',
    });
  }

  /**
   * Diamond Sparkle - subtle twinkling gems (ambient)
   */
  diamondSparkle(x, y, intensity = 1) {
    const count = Math.round(25 * intensity * this.densityMultiplier);
    // Gem particles
    this.createEmitter({
      x, y,
      burstCount: Math.round(count * 0.5),
      angle: -Math.PI / 2,
      spread: Math.PI * 0.8,
      speed: 80,
      speedVariance: 0.5,
      lifetime: 1.8,
      gravity: 0.15,
      sizeStart: 10,
      sizeEnd: 3,
      colorFrom: { r: 0.6, g: 0.95, b: 1 },
      colorTo: { r: 0.9, g: 0.85, b: 1 },
      alpha: 0.8,
      shape: 5, // gem
      rotSpeed: 6,
      blendMode: 'source-over',
    });
    // Star sparkles
    this.createEmitter({
      x, y,
      burstCount: Math.round(count * 0.5),
      angle: -Math.PI / 2,
      spread: Math.PI,
      speed: 100,
      speedVariance: 0.6,
      lifetime: 1.0,
      gravity: -0.05,
      sizeStart: 4,
      sizeEnd: 0,
      colorFrom: { r: 1, g: 1, b: 1 },
      colorTo: { r: 0.7, g: 0.9, b: 1 },
      alpha: 1.0,
      shape: 1, // star
      rotSpeed: 12,
      blendMode: 'lighter',
    });
  }

  /**
   * Coin Tornado - swirling vortex of coins rising from center
   */
  coinTornado(cx, cy) {
    const dm = this.densityMultiplier;
    const w = window.innerWidth;
    // Multiple vertical streams from bottom sweeping inward
    const streams = 8;
    for (let s = 0; s < streams; s++) {
      const xOff = (s - streams / 2) * (w * 0.08);
      this.createEmitter({
        x: cx + xOff,
        y: window.innerHeight + 20,
        rate: Math.round(12 * dm),
        duration: 3.5,
        angle: -Math.PI / 2 + (xOff > 0 ? -0.3 : 0.3),
        spread: Math.PI * 0.2,
        speed: 420,
        speedVariance: 0.4,
        lifetime: 2.5,
        gravity: -0.15,
        sizeStart: 20,
        sizeEnd: 12,
        colorFrom: { r: 1, g: 0.84, b: 0 },
        colorTo: { r: 1, g: 0.65, b: 0 },
        alpha: 1.0,
        shape: 2, // coin
        rotSpeed: 14,
        blendMode: 'source-over',
      });
    }
    // Dollar coins spiraling
    this.createEmitter({
      x: cx,
      y: cy + 100,
      rate: Math.round(20 * dm),
      duration: 3,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.6,
      speed: 300,
      speedVariance: 0.5,
      lifetime: 2.2,
      gravity: -0.2,
      sizeStart: 22,
      sizeEnd: 14,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 0.8, g: 0.65, b: 0 },
      alpha: 1.0,
      shape: 6, // gemDollar
      rotSpeed: 12,
      blendMode: 'source-over',
    });
  }

  /**
   * Jackpot Fireworks - staged firework bursts with treasure payloads
   */
  jackpotFireworks(cx, cy) {
    const dm = this.densityMultiplier;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Wave 1: Initial massive treasure explosion at center
    this.treasureExplosion(cx, cy);

    // Wave 2: Staggered side bursts (delayed via emitter duration trick)
    setTimeout(() => {
      // Left burst - gems
      this.diamondBurst(w * 0.2, h * 0.4, 1.5);
      // Right burst - coins
      this.explosion(w * 0.8, h * 0.4, 1.8);
    }, 600);

    // Wave 3: Top rain of all treasures
    setTimeout(() => {
      this.moneyRain(1.5);
      this.goldBarCascade(cx);
      // Center color shockwave
      this.colorShockwave(cx, cy, 100);
    }, 1200);

    // Wave 4: Final massive starburst ring
    setTimeout(() => {
      this.starburst(cx, cy, 2.5);
      // Additional side sparkles
      this.diamondSparkle(w * 0.15, h * 0.3, 1.5);
      this.diamondSparkle(w * 0.85, h * 0.3, 1.5);
    }, 2000);
  }

  /**
   * Floating Gems - ambient gem particles rising gently
   */
  floatingGems(x, y) {
    const count = Math.round(15 * this.densityMultiplier);
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.6,
      speed: 40,
      speedVariance: 0.5,
      lifetime: 3.0,
      gravity: -0.1,
      sizeStart: 10,
      sizeEnd: 4,
      colorFrom: { r: 0.6, g: 0.95, b: 1 },
      colorTo: { r: 0.4, g: 0.7, b: 1 },
      alpha: 0.6,
      shape: 5, // gem
      rotSpeed: 4,
      blendMode: 'source-over',
    });
  }

  /**
   * Diamond Drizzle - light shower of small gems
   */
  diamondDrizzle(intensity = 0.5) {
    const w = window.innerWidth;
    const count = Math.round(30 * intensity * this.densityMultiplier);
    this.createEmitter({
      x: w / 2,
      y: -20,
      rate: count,
      duration: 4,
      angle: Math.PI * 0.55,
      spread: Math.PI * 0.4,
      speed: 120,
      speedVariance: 0.3,
      lifetime: 4,
      gravity: 0.15,
      sizeStart: 10,
      sizeEnd: 5,
      colorFrom: { r: 0.7, g: 0.95, b: 1 },
      colorTo: { r: 0.5, g: 0.8, b: 1 },
      alpha: 0.7,
      shape: 5, // gem
      rotSpeed: 6,
      blendMode: 'source-over',
    });
  }

  /**
   * Money Float - ambient dollar coins drifting
   */
  moneyFloat(x, y) {
    const count = Math.round(12 * this.densityMultiplier);
    this.createEmitter({
      x, y,
      burstCount: count,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.5,
      speed: 60,
      speedVariance: 0.4,
      lifetime: 3.0,
      gravity: 0.05,
      sizeStart: 18,
      sizeEnd: 10,
      colorFrom: { r: 1, g: 0.84, b: 0 },
      colorTo: { r: 0.8, g: 0.65, b: 0 },
      alpha: 0.7,
      shape: 6, // gemDollar
      rotSpeed: 5,
      blendMode: 'source-over',
    });
  }
}
