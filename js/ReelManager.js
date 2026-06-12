/**
 * ReelManager - Handles reel spinning animation using GSAP
 */
export class ReelManager {
  constructor(containerEl, themeManager) {
    this.container = containerEl;
    this.themeManager = themeManager;
    this.reels = [];       // Array of { element, strip, symbols[] }
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
        cell.textContent = symbols[Math.floor(Math.random() * symbols.length)];
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

  /**
   * Update symbols after theme change
   */
  updateSymbols() {
    const symbols = this.themeManager.getSymbols();
    this.reels.forEach(reel => {
      reel.cells.forEach(cell => {
        cell.textContent = symbols[Math.floor(Math.random() * symbols.length)];
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
  async spin(targetSymbols, onReelStop, onTick) {
    if (this.spinning) return;
    this.spinning = true;

    const symbols = this.themeManager.getSymbols();
    const spinDuration = 0.8; // base duration per reel
    const staggerDelay = 0.2; // delay between reels

    // Stop tick sound
    if (this.tickInterval) clearInterval(this.tickInterval);

    const promises = this.reels.map((reel, reelIdx) => {
      return new Promise(resolve => {
        const delay = reelIdx * staggerDelay;
        const duration = spinDuration + reelIdx * 0.15; // later reels spin longer

        // Set target symbols on the visible cells
        setTimeout(() => {
          // Add spinning class for blur effect
          reel.element.classList.add('reel-spinning');

          // Set final symbols
          for (let row = 0; row < this.rows; row++) {
            if (reel.cells[row] && targetSymbols[reelIdx] && targetSymbols[reelIdx][row] !== undefined) {
              reel.cells[row].textContent = symbols[targetSymbols[reelIdx][row]];
              reel.cells[row].dataset.symbolIndex = targetSymbols[reelIdx][row];
            }
          }

          // Fill extra cells with random symbols for spin illusion
          for (let i = this.rows; i < reel.cells.length; i++) {
            reel.cells[i].textContent = symbols[Math.floor(Math.random() * symbols.length)];
          }
        }, delay * 500);

        // Animate the strip
        setTimeout(() => {
          // Reset strip position
          gsap.set(reel.strip, { y: 0 });

          // Spin animation - move strip down then bounce back to start
          const totalDistance = this.symbolSize * 6; // spin through 6 symbols worth

          const tl = gsap.timeline();

          // Quick blur spin
          tl.to(reel.strip, {
            y: totalDistance,
            duration: duration * 0.6,
            ease: 'power1.in',
          });

          // Set final position and bounce-stop
          tl.set(reel.strip, { y: -this.symbolSize * 3 });
          tl.to(reel.strip, {
            y: 0,
            duration: duration * 0.4,
            ease: 'back.out(1.4)',
            onComplete: () => {
              reel.element.classList.remove('reel-spinning');

              // Add landing animation to visible cells
              for (let row = 0; row < this.rows; row++) {
                if (reel.cells[row]) {
                  reel.cells[row].classList.add('highlight');
                  setTimeout(() => reel.cells[row].classList.remove('highlight'), 500);
                }
              }

              if (onReelStop) onReelStop(reelIdx);
              resolve();
            },
          });
        }, delay * 1000 + 100);
      });
    });

    // Start tick sound
    if (onTick) {
      this.tickInterval = setInterval(() => onTick(), 80);
    }

    await Promise.all(promises);

    // Stop tick sound
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.spinning = false;
  }

  /**
   * Highlight winning symbol positions
   */
  highlightWins(positions) {
    // Clear previous highlights
    this.reels.forEach(reel => {
      reel.cells.forEach(cell => {
        cell.classList.remove('highlight', 'wild', 'scatter');
      });
    });

    // Apply win highlights
    positions.forEach(pos => {
      const [reel, row] = pos.split('-').map(Number);
      if (this.reels[reel] && this.reels[reel].cells[row]) {
        const cell = this.reels[reel].cells[row];
        cell.classList.add('highlight');

        const symIdx = parseInt(cell.dataset.symbolIndex);
        if (symIdx === 6) cell.classList.add('wild');
        if (symIdx === 7) cell.classList.add('scatter');
      }
    });
  }

  clearHighlights() {
    this.reels.forEach(reel => {
      reel.cells.forEach(cell => {
        cell.classList.remove('highlight', 'wild', 'scatter');
      });
    });
  }
}
