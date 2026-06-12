/**
 * ParticleRenderer - Canvas 2D renderer for particles
 * Uses drawImage with pre-rendered sprites for performance
 */
export class ParticleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = {};

    // Pre-render particle shapes to offscreen canvases
    this._createSprites();

    // Handle resize
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
    this.dpr = dpr;
  }

  _createSprites() {
    const shapes = ['circle', 'star', 'diamond', 'rect', 'ring'];
    const size = 32; // sprite resolution

    shapes.forEach(shape => {
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext('2d');

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 1;

      switch (shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'star':
          this._drawStar(ctx, cx, cy, 5, r, r * 0.45);
          ctx.fill();
          break;

        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(cx, 1);
          ctx.lineTo(size - 1, cy);
          ctx.lineTo(cx, size - 1);
          ctx.lineTo(1, cy);
          ctx.closePath();
          ctx.fill();
          break;

        case 'rect':
          ctx.fillRect(2, 6, size - 4, size - 12);
          break;

        case 'ring':
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          break;
      }

      this.sprites[shape] = offscreen;
    });
  }

  _drawStar(ctx, cx, cy, points, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
  }

  render(pool) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    const shapeNames = ['circle', 'star', 'diamond', 'rect', 'ring'];

    // Group particles by blend mode for efficient rendering
    // First pass: normal blend
    ctx.globalCompositeOperation = 'source-over';
    this._renderParticles(pool, ctx, shapeNames, 0);

    // Second pass: additive blend (glow effects)
    ctx.globalCompositeOperation = 'lighter';
    this._renderParticles(pool, ctx, shapeNames, 1);

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderParticles(pool, ctx, shapeNames, passMode) {
    for (let i = 0; i < pool.max; i++) {
      if (pool.life[i] <= 0) continue;

      const size = pool.size[i];
      if (size < 0.5) continue;

      // Skip if wrong pass (shape 0=circle, 1=star use additive; 3=rect uses normal)
      const isAdditive = pool.shape[i] !== 3; // most shapes use additive
      if (passMode === 0 && isAdditive) continue;
      if (passMode === 1 && !isAdditive) continue;

      const spriteName = shapeNames[pool.shape[i]] || 'circle';
      const sprite = this.sprites[spriteName];
      if (!sprite) continue;

      ctx.save();
      ctx.globalAlpha = pool.a[i] * pool.life[i];
      ctx.translate(pool.x[i], pool.y[i]);
      ctx.rotate(pool.rotation[i]);

      // Tint the sprite
      const r = Math.round(pool.r[i] * 255);
      const g = Math.round(pool.g[i] * 255);
      const b = Math.round(pool.b[i] * 255);

      // For additive blending, we can use filter for tinting on supported browsers
      // Fallback: draw with globalAlpha only (white particles)
      if (r === 255 && g === 255 && b === 255) {
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        // Color tint via offscreen composite
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.globalCompositeOperation = 'source-over';

        // Draw shape directly with color for better perf than compositing
        const cx = 0, cy = 0, halfSize = size / 2;
        switch (pool.shape[i]) {
          case 0: // circle
            ctx.beginPath();
            ctx.arc(cx, cy, halfSize, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 1: // star
            this._drawStar(ctx, cx, cy, 5, halfSize, halfSize * 0.45);
            ctx.fill();
            break;
          case 2: // diamond
            ctx.beginPath();
            ctx.moveTo(cx, -halfSize);
            ctx.lineTo(halfSize, cy);
            ctx.lineTo(cx, halfSize);
            ctx.lineTo(-halfSize, cy);
            ctx.closePath();
            ctx.fill();
            break;
          case 3: // rect
            ctx.fillRect(-halfSize, -halfSize * 0.4, size, size * 0.6);
            break;
          case 4: // ring
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, halfSize, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        // Restore composite mode
        ctx.globalCompositeOperation = passMode === 1 ? 'lighter' : 'source-over';
      }

      ctx.restore();
    }
  }
}
