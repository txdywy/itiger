/**
 * ParticlePool - High-performance object pool using Float32Arrays
 * Pre-allocates particle data in struct-of-arrays layout for cache efficiency
 */
export class ParticlePool {
  constructor(maxParticles = 8000) {
    this.max = maxParticles;
    this.count = 0;

    // Struct-of-Arrays layout for cache-friendly iteration
    this.x = new Float32Array(maxParticles);
    this.y = new Float32Array(maxParticles);
    this.vx = new Float32Array(maxParticles);
    this.vy = new Float32Array(maxParticles);
    this.life = new Float32Array(maxParticles);    // 0.0 = dead, 1.0 = full life
    this.maxLife = new Float32Array(maxParticles);  // total lifetime in seconds
    this.size = new Float32Array(maxParticles);     // current size
    this.sizeStart = new Float32Array(maxParticles);
    this.sizeEnd = new Float32Array(maxParticles);
    this.r = new Float32Array(maxParticles);        // 0.0-1.0
    this.g = new Float32Array(maxParticles);
    this.b = new Float32Array(maxParticles);
    this.a = new Float32Array(maxParticles);        // alpha
    this.gravity = new Float32Array(maxParticles);  // per-particle gravity multiplier
    this.rotation = new Float32Array(maxParticles);
    this.rotSpeed = new Float32Array(maxParticles);
    this.shape = new Uint8Array(maxParticles);      // 0=circle, 1=star, 2=coin, 3=rect, 4=ring, 5=gem, 6=gemDollar
    this.blendMode = new Uint8Array(maxParticles);   // 0=source-over (normal), 1=lighter (additive)
    this.trail = new Uint8Array(maxParticles);        // trail segment count (0=none, 1-4=afterimage streak)

    // Free list for O(1) allocation
    this.freeList = [];
    for (let i = maxParticles - 1; i >= 0; i--) {
      this.freeList.push(i);
    }
  }

  allocate() {
    if (this.freeList.length === 0) return -1;
    const i = this.freeList.pop();
    this.count++;
    return i;
  }

  release(i) {
    this.life[i] = 0;
    this.freeList.push(i);
    this.count--;
  }

  /**
   * Initialize a particle at index i with given config
   */
  init(i, config) {
    this.x[i] = config.x || 0;
    this.y[i] = config.y || 0;

    const angle = config.angle || 0;
    const speed = config.speed || 100;
    const spread = config.spread || 0;

    const finalAngle = angle + (Math.random() - 0.5) * spread;
    const finalSpeed = speed * (0.5 + Math.random() * 0.5);

    this.vx[i] = Math.cos(finalAngle) * finalSpeed;
    this.vy[i] = Math.sin(finalAngle) * finalSpeed;

    const lifetime = config.lifetime || 1;
    this.life[i] = 1.0;
    this.maxLife[i] = lifetime * (0.7 + Math.random() * 0.6);

    this.sizeStart[i] = config.sizeStart || 4;
    this.sizeEnd[i] = config.sizeEnd !== undefined ? config.sizeEnd : 0;
    this.size[i] = this.sizeStart[i];

    // Color with optional random variation
    const cFrom = config.colorFrom || { r: 1, g: 1, b: 1 };
    const cTo = config.colorTo || { r: 1, g: 0.5, b: 0 };
    const t = Math.random();
    this.r[i] = cFrom.r + (cTo.r - cFrom.r) * t;
    this.g[i] = cFrom.g + (cTo.g - cFrom.g) * t;
    this.b[i] = cFrom.b + (cTo.b - cFrom.b) * t;
    this.a[i] = config.alpha || 1.0;

    this.gravity[i] = config.gravity !== undefined ? config.gravity : 1.0;
    this.rotation[i] = Math.random() * Math.PI * 2;
    this.rotSpeed[i] = (Math.random() - 0.5) * (config.rotSpeed || 0);

    this.shape[i] = config.shape || 0;
    this.blendMode[i] = config.blendMode === 'source-over' ? 0 : 1;

    // Auto-compute trail length from speed + blendMode
    // Only additive-blend (glow) particles get trails for performance
    const speed = Math.sqrt(this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]);
    if (this.blendMode[i] === 1 && speed > 150) {
      this.trail[i] = Math.min(4, Math.floor(speed / 150));
    } else {
      this.trail[i] = 0;
    }
  }

  /**
   * Update all active particles. Returns number of particles that died this frame.
   */
  update(dt) {
    let died = 0;
    // Iterate in reverse to handle releases during iteration
    for (let i = this.max - 1; i >= 0; i--) {
      if (this.life[i] <= 0) continue;

      // Decay life
      this.life[i] -= dt / this.maxLife[i];
      if (this.life[i] <= 0) {
        this.life[i] = 0;
        this.release(i);
        died++;
        continue;
      }

      // Update position
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;

      // Apply gravity (standardized at 400 px/s²)
      this.vy[i] += 400 * this.gravity[i] * dt;

      // Bounce physics off bottom window border for coins, gems, and dollar coins
      const floor = window.innerHeight - 15;
      const shape = this.shape[i];
      if ((shape === 2 || shape === 5 || shape === 6) && this.y[i] > floor && this.vy[i] > 0) {
        this.y[i] = floor;
        this.vy[i] = -this.vy[i] * (shape === 5 ? 0.6 : 0.45); // Gems bounce higher
        this.vx[i] *= 0.75;
        this.rotSpeed[i] = (Math.random() - 0.5) * 12;
      }

      // Update size (lerp from start to end based on life)
      const lifeNorm = this.life[i]; // 1.0 = just born, 0.0 = dead
      this.size[i] = this.sizeEnd[i] + (this.sizeStart[i] - this.sizeEnd[i]) * lifeNorm;

      // Update alpha based on life (fade out)
      this.a[i] = lifeNorm;

      // Update rotation
      this.rotation[i] += this.rotSpeed[i] * dt;
    }
    return died;
  }
}
