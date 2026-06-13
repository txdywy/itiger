import { SymbolRenderer } from './SymbolRenderer.js';

/**
 * ReelManager - Handles reel spinning animation using GSAP
 */
export class ReelManager {
  constructor(containerEl, themeManager) {
    this.container = containerEl;
    this.themeManager = themeManager;
    this.reels = [];       // Array of { element, strip, symbols[] }
    this.paylineSvg = null;
    this.symbolSize = 0;
    this.rows = 3;
    this.cols = 5;
    this.spinning = false;
    this.tickInterval = null;

    this._buildReels();
    this._observeSize();
  }

  _buildReels() {
    this.container.innerHTML = '';
    this.reels = [];
    this.paylineSvg = this._createPaylineSvg();

    const themeId = this.themeManager.currentTheme;

    for (let c = 0; c < this.cols; c++) {
      const reelEl = document.createElement('div');
      reelEl.className = 'reel';
      reelEl.dataset.reel = c;

      const strip = document.createElement('div');
      strip.className = 'reel-strip';

      // Build initial symbols (enough for visible + overflow for spinning)
      const symbols = this.themeManager.getSymbols();
      const totalCells = this.rows + 5; // extra cells for spin animation
      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'symbol-cell';
        const symIdx = Math.floor(Math.random() * symbols.length);
        cell.innerHTML = SymbolRenderer.render(themeId, symIdx);
        cell.dataset.symbolIndex = symIdx;
        cell.dataset.row = i;
        strip.appendChild(cell);
      }

      reelEl.appendChild(strip);
      this.container.appendChild(reelEl);

      this.reels.push({
        element: reelEl,
        strip: strip,
        cells: Array.from(strip.children),
      });
    }

    this.container.appendChild(this.paylineSvg);
  }

  _createPaylineSvg() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'payline-svg';
    svg.classList.add('payline-overlay');
    svg.setAttribute('aria-hidden', 'true');
    return svg;
  }

  _observeSize() {
    const updateSize = () => {
      if (this.reels.length > 0 && this.reels[0].cells.length > 0) {
        const firstCell = this.reels[0].cells[0];
        this.symbolSize = firstCell.offsetHeight;
      }
    };

    // Initial measurement
    requestAnimationFrame(() => {
      setTimeout(updateSize, 100);
    });

    // ResizeObserver for dynamic updates
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateSize());
      ro.observe(this.container);
    }
  }

  _measureSymbolSize() {
    const firstCell = this.reels[0]?.cells[0];
    if (!firstCell) return 0;

    const measured = firstCell.getBoundingClientRect().height || firstCell.offsetHeight;
    if (measured > 0) {
      this.symbolSize = measured;
      return measured;
    }

    const cssSize = getComputedStyle(firstCell).height;
    const parsed = Number.parseFloat(cssSize);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.symbolSize = parsed;
      return parsed;
    }

    return this.symbolSize || 72;
  }

  /**
   * Update symbols after theme change
   */
  updateSymbols() {
    const symbols = this.themeManager.getSymbols();
    const themeId = this.themeManager.currentTheme;
    this.reels.forEach(reel => {
      reel.cells.forEach(cell => {
        const symIdx = Math.floor(Math.random() * symbols.length);
        cell.innerHTML = SymbolRenderer.render(themeId, symIdx);
        cell.dataset.symbolIndex = symIdx;
        cell.className = 'symbol-cell';
      });
    });
  }

  /**
   * Animate reel spin and stop at given symbols
   * @param {number[][]} targetSymbols - [reel][row] symbol indices
   * @param {Function} onReelStop - called when each reel stops
   * @param {Function} onTick - called for each tick during spin
   * @returns {Promise} resolves when all reels have stopped
   */
  async spin(targetSymbols, onReelStop, onTick, audio, particles) {
    if (this.spinning) return;
    this.spinning = true;
    const symbolSize = this._measureSymbolSize();

    const symbols = this.themeManager.getSymbols();
    const scatterSymbolIndex = 7; // Scatter index is 7
    let scatterCount = 0;
    let anticipationSoundNode = null;

    // Stop tick sound
    if (this.tickInterval) clearInterval(this.tickInterval);

    const themeId = this.themeManager.currentTheme;

    // Phase 1: Start infinite spin loops for ALL reels simultaneously
    this.reels.forEach((reel, reelIdx) => {
      reel.element.classList.add('reel-spinning');
      gsap.set(reel.strip, { y: 0, force3D: true });

      // Animate the strip endlessly
      reel.spinTween = gsap.to(reel.strip, {
        y: symbolSize * 3,
        duration: 0.15,
        ease: 'none',
        repeat: -1,
        force3D: true,
        onRepeat: () => {
          // Shuffle symbols slightly while spinning
          reel.cells.forEach((cell, i) => {
            if (i >= this.rows) {
              const symIdx = Math.floor(Math.random() * symbols.length);
              cell.innerHTML = SymbolRenderer.render(themeId, symIdx);
              cell.dataset.symbolIndex = symIdx;
            }
          });
        }
      });
    });

    // Start tick sound
    if (onTick) {
      this.tickInterval = setInterval(() => onTick(), 80);
    }

    const stopReel = (reelIdx) => {
      return new Promise(resolve => {
        const reel = this.reels[reelIdx];

        // Determine if this reel is currently anticipating
        const isAnticipating = reel.element.classList.contains('anticipating');

        if (isAnticipating) {
          reel.element.classList.remove('anticipating');
          if (anticipationSoundNode) {
            anticipationSoundNode.stop();
            anticipationSoundNode = null;
          }
        }

        // Set target symbols on the visible cells
        for (let row = 0; row < this.rows; row++) {
          if (reel.cells[row] && targetSymbols[reelIdx] && targetSymbols[reelIdx][row] !== undefined) {
            const symIdx = targetSymbols[reelIdx][row];
            reel.cells[row].innerHTML = SymbolRenderer.render(themeId, symIdx);
            reel.cells[row].dataset.symbolIndex = symIdx;
          }
        }
        // Fill extra cells with random symbols
        for (let i = this.rows; i < reel.cells.length; i++) {
          const symIdx = Math.floor(Math.random() * symbols.length);
          reel.cells[i].innerHTML = SymbolRenderer.render(themeId, symIdx);
          reel.cells[i].dataset.symbolIndex = symIdx;
        }

        // Stop the endless tween
        if (reel.spinTween) {
          reel.spinTween.kill();
        }

        // Reset and animate stop with elastic bounce
        gsap.set(reel.strip, { y: -symbolSize * 3, force3D: true });
        gsap.to(reel.strip, {
          y: 0,
          duration: 0.45,
          ease: 'back.out(1.8)',
          force3D: true,
          onComplete: () => {
            reel.element.classList.remove('reel-spinning');

            // Add landing highlight to cells
            for (let row = 0; row < this.rows; row++) {
              if (reel.cells[row]) {
                reel.cells[row].classList.add('highlight');
                // Trigger landing sparks if it's a scatter or wild
                const symIdx = parseInt(reel.cells[row].dataset.symbolIndex);
                if ((symIdx === 7 || symIdx === 6) && particles) {
                  const rect = reel.cells[row].getBoundingClientRect();
                  particles.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
                }
                setTimeout(() => reel.cells[row].classList.remove('highlight'), 500);
              }
            }

            // Count scatters on stopped reel
            for (let row = 0; row < this.rows; row++) {
              if (targetSymbols[reelIdx][row] === scatterSymbolIndex) {
                scatterCount++;
              }
            }

            // Trigger stop callback
            if (onReelStop) onReelStop(reelIdx);

            resolve();
          }
        });
      });
    };

    // Phase 2: Stop reels one by one with delays, applying anticipation dynamically
    for (let reelIdx = 0; reelIdx < this.cols; reelIdx++) {
      // Base wait time before stopping this reel
      let waitTime = reelIdx === 0 ? 800 : 350; // Milliseconds

      // Check if this reel should anticipate based on scatters landed so far
      if (reelIdx >= 2 && scatterCount >= 2) {
        const nextReel = this.reels[reelIdx];
        nextReel.element.classList.add('anticipating');

        // Add ambient sparks on the anticipating reel
        let sparksTimer = setInterval(() => {
          if (!nextReel.element.classList.contains('anticipating')) {
            clearInterval(sparksTimer);
            return;
          }
          if (particles) {
            const rect = nextReel.element.getBoundingClientRect();
            particles.sparks(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.4);
          }
        }, 250);

        // Play anticipation audio
        if (audio && audio.startAnticipation) {
          anticipationSoundNode = audio.startAnticipation();
        }

        // Extend spin time for anticipation tension
        waitTime = 2000;
      }

      await new Promise(r => setTimeout(r, waitTime));
      await stopReel(reelIdx);
    }

    // Stop tick sound
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.spinning = false;
  }

  stopAll() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.reels.forEach(reel => {
      if (reel.spinTween) {
        reel.spinTween.kill();
        reel.spinTween = null;
      }
      gsap.killTweensOf(reel.strip);
      gsap.set(reel.strip, { y: 0 });
      reel.element.classList.remove('reel-spinning', 'anticipating');
    });

    this.spinning = false;
  }

  /**
   * Highlight winning symbol positions
   */
  highlightWins(positions) {
    // Apply win highlights
    positions.forEach(pos => {
      const [reel, row] = pos.split('-').map(Number);
      if (this.reels[reel] && this.reels[reel].cells[row]) {
        const cell = this.reels[reel].cells[row];
        cell.classList.add('highlight', 'win-active');

        const symIdx = parseInt(cell.dataset.symbolIndex);
        if (symIdx === 6) cell.classList.add('wild');
        if (symIdx === 7) cell.classList.add('scatter');
      }
    });
  }

  clearHighlights() {
    this.reels.forEach(reel => {
      reel.cells.forEach(cell => {
        cell.classList.remove('highlight', 'win-active', 'wild', 'scatter');
      });
      reel.element.classList.remove('anticipating');
    });
  }
}
