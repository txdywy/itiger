/**
 * ParticleRenderer - Canvas 2D renderer for particles
 * Uses drawImage with pre-rendered sprites for performance
 */
export class ParticleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = {};
    this._screenEffects = []; // managed externally by ParticleSystem

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
    const shapes = ['circle', 'star', 'diamond', 'rect', 'ring', 'gem', 'gemDollar'];
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

        case 'gem':
          // 8-pointed faceted gem
          ctx.beginPath();
          ctx.moveTo(cx, 2);
          ctx.lineTo(size * 0.7, cy * 0.7);
          ctx.lineTo(size - 2, cy);
          ctx.lineTo(size * 0.7, cy * 1.3);
          ctx.lineTo(cx, size - 2);
          ctx.lineTo(size * 0.3, cy * 1.3);
          ctx.lineTo(2, cy);
          ctx.lineTo(size * 0.3, cy * 0.7);
          ctx.closePath();
          ctx.fill();
          // Sparkle highlight
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(cx, 2);
          ctx.lineTo(size * 0.7, cy * 0.7);
          ctx.lineTo(cx, cy);
          ctx.lineTo(size * 0.3, cy * 0.7);
          ctx.closePath();
          ctx.fill();
          break;

        case 'gemDollar':
          // Gold coin with $ symbol
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          // $ symbol cutout
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          const scx = cx, scy = cy;
          ctx.beginPath();
          ctx.moveTo(scx + 3, scy - 6);
          ctx.bezierCurveTo(scx + 3, scy - 7.5, scx - 1, scy - 8, scx - 2.5, scy - 6.5);
          ctx.bezierCurveTo(scx - 4, scy - 5, scx + 4, scy - 3, scx + 2.5, scy - 1);
          ctx.bezierCurveTo(scx + 1, scy + 1.5, scx - 3, scy + 1.5, scx - 3, scy + 4);
          ctx.bezierCurveTo(scx - 3, scy + 7, scx + 3, scy + 7.5, scx + 3, scy + 6);
          ctx.stroke();
          // Vertical line through $
          ctx.beginPath();
          ctx.moveTo(scx, scy - 9);
          ctx.lineTo(scx, scy + 9);
          ctx.lineWidth = 1;
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
    if (pool.count === 0 && !this._screenEffects?.length) return;

    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    ctx.clearRect(0, 0, w, h);

    // Screen effects (color waves, spotlights) — drawn first with additive blend
    if (this._screenEffects?.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const fx of this._screenEffects) {
        const progress = fx.elapsed / fx.duration;
        if (fx.type === 'colorWave') {
          const maxR = Math.sqrt(w * w + h * h);
          const radius = maxR * progress;
          const alpha = (1 - progress) * 0.18;
          if (alpha > 0.005) {
            const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, radius);
            const [r, g, b] = fx.color;
            grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
        } else if (fx.type === 'spotlightPulse') {
          const pulse = Math.sin(progress * Math.PI);
          const alpha = pulse * 0.12;
          if (alpha > 0.005) {
            const [r, g, b] = fx.color;
            const spotR = Math.min(w, h) * (0.3 + pulse * 0.35);
            const grad = ctx.createRadialGradient(
              fx.x * w, fx.y * h, 0,
              fx.x * w, fx.y * h, spotR
            );
            grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
            grad.addColorStop(0.4, `rgba(${r},${g},${b},${alpha * 0.5})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    if (pool.count === 0) return;

    const shapeNames = ['circle', 'star', 'diamond', 'rect', 'ring', 'gem', 'gemDollar'];

    // Batch particles by (shape, blendMode) to minimize canvas state switches
    const batches = {};
    for (let i = 0; i < pool.max; i++) {
      if (pool.life[i] <= 0) continue;
      const size = pool.size[i];
      if (size < 0.5) continue;
      const key = pool.shape[i] * 2 + pool.blendMode[i];
      if (!batches[key]) batches[key] = [];
      batches[key].push(i);
    }

    // Pass 1: normal blend (source-over)
    ctx.globalCompositeOperation = 'source-over';
    for (const key in batches) {
      if (key % 2 !== 0) continue;
      const shapeIdx = key >> 1;
      this._renderBatch(pool, ctx, batches[key], shapeNames[shapeIdx] || 'circle');
    }

    // Pass 2: additive blend (lighter) — includes trail rendering
    ctx.globalCompositeOperation = 'lighter';
    for (const key in batches) {
      if (key % 2 !== 1) continue;
      const shapeIdx = key >> 1;
      this._renderBatch(pool, ctx, batches[key], shapeNames[shapeIdx] || 'circle');
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  _renderBatch(pool, ctx, indices, spriteName) {
    const sprite = this.sprites[spriteName];
    if (!sprite) return;

    for (let n = 0; n < indices.length; n++) {
      const i = indices[n];
      const size = pool.size[i];
      const alpha = pool.a[i] * pool.life[i];
      if (alpha < 0.01) continue;

      const px = pool.x[i];
      const py = pool.y[i];
      const r = Math.round(pool.r[i] * 255);
      const g = Math.round(pool.g[i] * 255);
      const b = Math.round(pool.b[i] * 255);

      // Draw velocity-based afterimage trail (additive-blend particles only)
      const trail = pool.trail[i];
      if (trail > 0) {
        const speed = Math.sqrt(pool.vx[i] * pool.vx[i] + pool.vy[i] * pool.vy[i]);
        if (speed > 80) {
          const nx = -pool.vx[i] / speed;
          const ny = -pool.vy[i] / speed;
          const step = Math.min(size * 0.7, speed * 0.008);
          for (let t = trail; t >= 1; t--) {
            const tAlpha = alpha * (0.12 + 0.08 * (trail - t));
            if (tAlpha < 0.01) continue;
            const tSize = size * (0.4 + 0.2 * (trail - t));
            const tpx = px + nx * step * t;
            const tpy = py + ny * step * t;
            ctx.save();
            ctx.globalAlpha = tAlpha;
            ctx.translate(tpx, tpy);
            ctx.rotate(pool.rotation[i]);
            this._drawShape(ctx, pool.shape[i], r, g, b, tSize, tAlpha);
            ctx.restore();
          }
        }
      }

      // Main particle
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      ctx.rotate(pool.rotation[i]);

      if (r === 255 && g === 255 && b === 255) {
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      } else {
        this._drawShape(ctx, pool.shape[i], r, g, b, size, alpha);
      }

      ctx.restore();
    }
  }

  /**
   * Draw a single particle shape with direct canvas calls (no pre-rendered sprite).
   * Called with ctx already translated+rotated to particle position, draw centered at (0,0).
   */
  _drawShape(ctx, shapeIdx, r, g, b, size, alpha) {
    const halfSize = size / 2;
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    switch (shapeIdx) {
      case 0: // circle
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // star
        this._drawStar(ctx, 0, 0, 5, halfSize, halfSize * 0.45);
        ctx.fill();
        break;
      case 2: // coin
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, 0)`;
        ctx.beginPath();
        ctx.arc(0, 0, halfSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(-halfSize * 0.25, -halfSize * 0.25, halfSize * 0.5, halfSize * 0.5);
        break;
      case 3: // rect / gold bar
        if (r > 200 && g > 150 && b < 100) {
          ctx.fillStyle = `rgb(${Math.max(0, r - 65)}, ${Math.max(0, g - 65)}, 0)`;
          ctx.fillRect(-halfSize, -halfSize * 0.4, size, size * 0.6);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(-halfSize + 2, -halfSize * 0.4 + 2, size - 4, size * 0.6 - 4);
          ctx.fillStyle = `rgb(${Math.min(255, r + 45)}, ${Math.min(255, g + 45)}, 120)`;
          ctx.fillRect(-halfSize + 2, -halfSize * 0.4 + 2, size - 4, 3);
        } else {
          ctx.fillRect(-halfSize, -halfSize * 0.4, size, size * 0.6);
        }
        break;
      case 4: // ring
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 5: // gem - 8-pointed faceted precious stone
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize * 0.65, -halfSize * 0.35);
        ctx.lineTo(halfSize, 0);
        ctx.lineTo(halfSize * 0.65, halfSize * 0.35);
        ctx.lineTo(0, halfSize);
        ctx.lineTo(-halfSize * 0.65, halfSize * 0.35);
        ctx.lineTo(-halfSize, 0);
        ctx.lineTo(-halfSize * 0.65, -halfSize * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize * 0.65, -halfSize * 0.35);
        ctx.lineTo(0, 0);
        ctx.lineTo(-halfSize * 0.65, -halfSize * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(-halfSize * 0.25, -halfSize * 0.35, halfSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 6: // gemDollar - gold coin with $ symbol
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, 0)`;
        ctx.beginPath();
        ctx.arc(0, 0, halfSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = Math.max(1, halfSize * 0.15);
        ctx.lineCap = 'round';
        const sr = halfSize * 0.4;
        ctx.beginPath();
        ctx.moveTo(sr * 0.3, -sr * 0.75);
        ctx.bezierCurveTo(sr * 0.3, -sr, -sr * 0.4, -sr, -sr * 0.5, -sr * 0.5);
        ctx.bezierCurveTo(-sr * 0.7, 0, sr * 0.5, -sr * 0.15, sr * 0.5, sr * 0.25);
        ctx.bezierCurveTo(sr * 0.5, sr * 0.8, -sr * 0.3, sr, -sr * 0.3, sr * 0.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -sr * 1.1);
        ctx.lineTo(0, sr * 1.1);
        ctx.lineWidth = Math.max(0.8, halfSize * 0.08);
        ctx.stroke();
        break;
    }
  }
