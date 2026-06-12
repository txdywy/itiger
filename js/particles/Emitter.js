/**
 * Emitter - Configurable particle emitter
 * Emits particles from a position with configurable spread, colors, gravity, etc.
 */
export class Emitter {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.active = true;

    // Emission
    this.rate = config.rate || 0;          // particles per second (0 = burst only)
    this.burstCount = config.burstCount || 0;
    this.accumulator = 0;

    // Particle config
    this.angle = config.angle || 0;        // radians, 0 = right, -PI/2 = up
    this.spread = config.spread || Math.PI * 2; // radians
    this.speed = config.speed || 100;      // px/s
    this.speedVariance = config.speedVariance || 0.5;

    this.lifetime = config.lifetime || 1.0;
    this.gravity = config.gravity !== undefined ? config.gravity : 0;

    this.sizeStart = config.sizeStart || 4;
    this.sizeEnd = config.sizeEnd !== undefined ? config.sizeEnd : 0;

    this.colorFrom = config.colorFrom || { r: 1, g: 0.84, b: 0 };   // gold
    this.colorTo = config.colorTo || { r: 1, g: 0.4, b: 0 };        // orange
    this.alpha = config.alpha || 1.0;

    this.shape = config.shape || 0;        // 0=circle, 1=star, 2=diamond, 3=rect
    this.rotSpeed = config.rotSpeed || 0;

    this.blendMode = config.blendMode || 'lighter'; // 'lighter' for additive, 'source-over' for normal

    // Lifetime of emitter itself
    this.duration = config.duration || Infinity;
    this.age = 0;

    // Do initial burst
    if (this.burstCount > 0) {
      this.burst(this.burstCount);
    }
  }

  burst(count) {
    for (let i = 0; i < count; i++) {
      const idx = this.pool.allocate();
      if (idx === -1) break; // pool full
      this.pool.init(idx, {
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y + (Math.random() - 0.5) * 10,
        angle: this.angle,
        spread: this.spread,
        speed: this.speed * (1 + (Math.random() - 0.5) * this.speedVariance * 2),
        lifetime: this.lifetime,
        gravity: this.gravity,
        sizeStart: this.sizeStart * (0.7 + Math.random() * 0.6),
        sizeEnd: this.sizeEnd,
        colorFrom: this.colorFrom,
        colorTo: this.colorTo,
        alpha: this.alpha,
        shape: this.shape,
        rotSpeed: this.rotSpeed,
      });
    }
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    if (this.age >= this.duration) {
      this.active = false;
      return;
    }

    // Continuous emission
    if (this.rate > 0) {
      this.accumulator += this.rate * dt;
      while (this.accumulator >= 1) {
        this.accumulator -= 1;
        const idx = this.pool.allocate();
        if (idx === -1) break;
        this.pool.init(idx, {
          x: this.x + (Math.random() - 0.5) * 10,
          y: this.y + (Math.random() - 0.5) * 10,
          angle: this.angle,
          spread: this.spread,
          speed: this.speed * (1 + (Math.random() - 0.5) * this.speedVariance * 2),
          lifetime: this.lifetime,
          gravity: this.gravity,
          sizeStart: this.sizeStart * (0.7 + Math.random() * 0.6),
          sizeEnd: this.sizeEnd,
          colorFrom: this.colorFrom,
          colorTo: this.colorTo,
          alpha: this.alpha,
          shape: this.shape,
          rotSpeed: this.rotSpeed,
        });
      }
    }
  }
}
