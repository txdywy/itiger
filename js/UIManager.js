/**
 * UIManager - Handles all UI interactions, win celebrations, and state display
 */
export class UIManager {
  constructor(slotMachine, reelManager, particleSystem, audioManager, themeManager) {
    this.slot = slotMachine;
    this.reels = reelManager;
    this.particles = particleSystem;
    this.audio = audioManager;
    this.themes = themeManager;

    this.winOverlay = document.getElementById('win-overlay');
    this.winText = document.getElementById('win-text');
    this.winAmount = document.getElementById('win-amount');
    this.freeSpinsBanner = document.getElementById('free-spins-banner');
    this.settingsPanel = document.getElementById('settings-panel');
    this.settingsOverlay = document.getElementById('settings-overlay');
    this.winHistoryEl = document.getElementById('win-history');

    this.celebrating = false;
    this.autoSpinTimer = null;

    this._bindEvents();
    this._updateDisplay();
  }

  _bindEvents() {
    // Spin button
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
      spinBtn.addEventListener('click', () => this.handleSpin());
      // Touch ripple effect
      spinBtn.addEventListener('mousedown', (e) => this._addRipple(e, spinBtn));
    }

    // Bet buttons
    document.getElementById('btn-bet-down')?.addEventListener('click', () => {
      this.audio.playBetChange();
      this.slot.decreaseBet();
      this._updateDisplay();
    });

    document.getElementById('btn-bet-up')?.addEventListener('click', () => {
      this.audio.playBetChange();
      this.slot.increaseBet();
      this._updateDisplay();
    });

    // Lines buttons
    document.getElementById('btn-lines-down')?.addEventListener('click', () => {
      this.audio.playBetChange();
      this.slot.setLines(this.slot.lines - 1);
      this._updateDisplay();
    });

    document.getElementById('btn-lines-up')?.addEventListener('click', () => {
      this.audio.playBetChange();
      this.slot.setLines(this.slot.lines + 1);
      this._updateDisplay();
    });

    // Auto spin
    document.getElementById('btn-auto')?.addEventListener('click', () => {
      this.toggleAutoSpin();
    });

    // Add coins
    document.getElementById('btn-add-coins')?.addEventListener('click', () => {
      this.audio.playCoinDrop();
      this.slot.addCoins(10000);
      this._updateDisplay();
      // Coin shower effect
      const cx = window.innerWidth / 2;
      this.particles.goldenShower(cx, 300, 0.5);
    });

    // Theme selector
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.theme;
        this.audio.playClick();
        this.themes.apply(themeId);
        this.reels.updateSymbols();
        this._updateThemeButtons(themeId);
      });
    });

    // Settings
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.toggleSettings();
    });

    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.toggleSettings(false);
    });

    document.getElementById('settings-overlay')?.addEventListener('click', () => {
      this.toggleSettings(false);
    });

    document.getElementById('btn-mute')?.addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      const btn = document.getElementById('btn-mute');
      btn.textContent = muted ? '🔇' : '🔊';
    });

    // SFX volume
    document.getElementById('sfx-volume')?.addEventListener('input', (e) => {
      this.audio.setSfxVolume(parseFloat(e.target.value));
    });

    // Particle density
    document.getElementById('particle-density')?.addEventListener('change', (e) => {
      this.particles.densityMultiplier = parseFloat(e.target.value);
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.handleSpin();
      }
    });

    // Balance change callback
    this.slot.onBalanceChange = (balance, delta) => {
      this._updateDisplay();
      if (delta > 0) {
        this._animateBalanceGain(delta);
      }
    };
  }

  _addRipple(e, btn) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  _updateDisplay() {
    const balanceEl = document.getElementById('balance-amount');
    const betEl = document.getElementById('bet-value');
    const linesEl = document.getElementById('lines-value');
    const totalBetEl = document.getElementById('total-bet');
    const freeSpinsEl = document.getElementById('free-spins-count');

    if (balanceEl) {
      balanceEl.textContent = this._formatNumber(this.slot.balance);
    }
    if (betEl) betEl.textContent = this._formatNumber(this.slot.bet);
    if (linesEl) linesEl.textContent = this.slot.lines;
    if (totalBetEl) totalBetEl.textContent = this._formatNumber(this.slot.getTotalBet());
    if (freeSpinsEl) freeSpinsEl.textContent = this.slot.freeSpinsRemaining;

    // Free spins banner
    if (this.freeSpinsBanner) {
      if (this.slot.freeSpinsRemaining > 0) {
        this.freeSpinsBanner.classList.add('active');
        this.freeSpinsBanner.querySelector('.free-spins-count').textContent =
          this.slot.freeSpinsRemaining;
      } else {
        this.freeSpinsBanner.classList.remove('active');
      }
    }

    // Max bet indicator
    const maxBet = document.querySelector('.max-bet-indicator');
    if (maxBet) {
      maxBet.classList.toggle('show', this.slot.betIndex === this.slot.betLevels.length - 1);
    }

    // Disable spin if can't afford
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
      spinBtn.classList.toggle('disabled', !this.slot.canSpin());
    }
  }

  _updateThemeButtons(activeId) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === activeId);
    });
  }

  _formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  _animateBalanceGain(amount) {
    const balanceEl = document.getElementById('balance-amount');
    if (!balanceEl) return;

    gsap.fromTo(balanceEl,
      { scale: 1.3, color: '#00ff00' },
      { scale: 1, color: 'var(--gold)', duration: 0.5, ease: 'back.out(2)' }
    );
  }

  toggleAutoSpin() {
    this.slot.autoSpin = !this.slot.autoSpin;
    const btn = document.getElementById('btn-auto');
    if (btn) btn.classList.toggle('active', this.slot.autoSpin);

    if (this.slot.autoSpin) {
      this._autoSpinLoop();
    } else {
      if (this.autoSpinTimer) {
        clearTimeout(this.autoSpinTimer);
        this.autoSpinTimer = null;
      }
    }
  }

  async _autoSpinLoop() {
    if (!this.slot.autoSpin || this.celebrating) return;
    if (!this.slot.canSpin()) {
      this.slot.autoSpin = false;
      document.getElementById('btn-auto')?.classList.remove('active');
      return;
    }

    await this.handleSpin();

    if (this.slot.autoSpin) {
      this.autoSpinTimer = setTimeout(() => this._autoSpinLoop(), 1200);
    }
  }

  toggleSettings(open) {
    const isOpen = open !== undefined ? open : !this.settingsPanel.classList.contains('open');
    this.settingsPanel?.classList.toggle('open', isOpen);
    this.settingsOverlay?.classList.toggle('open', isOpen);
  }

  /**
   * Handle spin action - the main game loop
   */
  async handleSpin() {
    if (this.celebrating) return;
    if (!this.slot.canSpin()) return;

    // Initialize audio on first interaction
    this.audio.init();
    this.audio.resume();

    // Clear previous payline rendering and win states
    this.celebrating = false;
    this.clearWinCelebration();
    this._hideWinOverlay();
    if (this.particles) this.particles.clearEmitters();

    // Start spin
    this.audio.playSpinStart();
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.classList.add('spinning');

    // Generate results
    const result = this.slot.spin();
    if (!result) {
      if (spinBtn) spinBtn.classList.remove('spinning');
      return;
    }

    // Animate reels passing audio and particles for anticipation cues
    await this.reels.spin(
      result.symbols,
      (reelIdx) => {
        this.audio.playReelStop();
        this.audio.playTick();
      },
      () => this.audio.playTick(),
      this.audio,
      this.particles
    );

    if (spinBtn) spinBtn.classList.remove('spinning');

    // Check wins
    const winResult = this.slot.checkWins(result.symbols);

    if (winResult.totalWin > 0) {
      await this._celebrateWin(winResult);
    }

    // Handle free spins trigger
    if (winResult.freeSpinsTriggered) {
      await this._celebrateFreeSpins();
    }

    this._updateDisplay();
    this._addToHistory(winResult);
  }

  /**
   * Win celebration with escalating effects
   */
  clearWinCelebration() {
    if (this.winCycleTimeout) {
      clearTimeout(this.winCycleTimeout);
      this.winCycleTimeout = null;
    }
    const svg = document.getElementById('payline-svg');
    if (svg) svg.innerHTML = '';
    this.reels.clearHighlights();
  }

  _drawPaylinePath(win) {
    const svg = document.getElementById('payline-svg');
    if (!svg || !win.positions || win.positions.length < 2) return;

    // Clear previous drawing
    svg.innerHTML = '';

    // Choose line color
    const color = `var(--payline-${win.line === 'scatter' ? 7 : (win.line || 1)})`;

    let points = [];
    win.positions.forEach(pos => {
      const [reelIdx, rowIdx] = pos.split('-').map(Number);
      const reel = this.reels.reels[reelIdx];
      if (reel && reel.cells[rowIdx]) {
        const cell = reel.cells[rowIdx];
        const cellRect = cell.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Calculate center coordinates relative to the SVG container
        const x = cellRect.left - svgRect.left + cellRect.width / 2;
        const y = cellRect.top - svgRect.top + cellRect.height / 2;
        points.push({ x, y });
      }
    });

    if (points.length < 2) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }

    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    path.setAttribute('filter', `drop-shadow(0 0 10px ${color})`);

    // Dash array for dynamic drawing pulse
    const pathLength = 1000;
    path.style.strokeDasharray = '20, 10';
    path.style.strokeDashoffset = '0';
    path.style.animation = 'laserPathGlow 1s infinite linear';

    svg.appendChild(path);
  }

  /**
   * Win celebration with escalating effects
   */
  async _celebrateWin(winResult) {
    this.celebrating = true;
    const tier = winResult.winTier;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Start cycling through individual paylines sequentially for clean clarity
    let winLineIndex = 0;
    const cycleWinLines = () => {
      if (!this.celebrating || winResult.wins.length === 0) return;

      const currentWin = winResult.wins[winLineIndex];
      if (currentWin && currentWin.positions) {
        this.reels.clearHighlights();
        this.reels.highlightWins(currentWin.positions);
        this._drawPaylinePath(currentWin);
      }

      winLineIndex = (winLineIndex + 1) % winResult.wins.length;
      this.winCycleTimeout = setTimeout(cycleWinLines, 1400);
    };

    // Trigger odometer count-up
    this._showWinAmount(winResult.totalWin, tier);

    // Initial cycle trigger
    cycleWinLines();

    const currentTheme = this.themes.currentTheme;

    switch (tier) {
      case 'small':
        this.audio.playSmallWin();
        this.particles.sparks(cx, cy, 0.6);
        await this._delay(1500);
        break;

      case 'medium':
        this.audio.playSmallWin();
        this.particles.goldenShower(cx, 400, 0.7);
        this.particles.sparks(cx, cy, 0.9);
        this._screenFlash();
        await this._delay(2500);
        break;

      case 'big':
        this.audio.playBigWin();
        this._showWinText('BIG WIN!');
        
        // Theme-specific premium explosions
        if (currentTheme === 'egypt' || currentTheme === 'maya') {
          this.particles.fireBlast(cx, cy);
        } else if (currentTheme === 'underwater') {
          this.particles.frostStorm(cx, cy);
        } else if (currentTheme === 'space') {
          this.particles.electricStorm(cx, cy);
        } else {
          this.particles.explosion(cx, cy, 1.4);
        }
        
        this.particles.goldenShower(cx, 500, 1.2);
        this.particles.coinRain(1.0);
        this._screenShake();
        this._screenFlash();
        await this._delay(3500);
        break;

      case 'mega':
        this.audio.playBigWin();
        this._showWinText('MEGA WIN!!');
        
        // Theme-specific blast + Golden coin/bar sprayer
        if (currentTheme === 'egypt' || currentTheme === 'maya') {
          this.particles.fireBlast(cx, cy);
        } else if (currentTheme === 'underwater') {
          this.particles.frostStorm(cx, cy);
        } else if (currentTheme === 'space') {
          this.particles.electricStorm(cx, cy);
        } else {
          this.particles.explosion(cx, cy, 2.2);
        }
        
        this.particles.goldSprayer(cx, cy);
        this.particles.starburst(cx, cy, 1.8);
        this._screenShake();
        this._screenFlash();
        await this._delay(4500);
        break;

      case 'jackpot':
        this.audio.playJackpot();
        this._showWinText('🎉 JACKPOT 🎉');
        
        // Ultimate combo
        this.particles.fireBlast(cx, cy);
        this.particles.frostStorm(cx, cy);
        this.particles.electricStorm(cx, cy);
        this.particles.goldSprayer(cx, cy);
        
        this.particles.starburst(cx, cy, 2.2);
        this.particles.fireRing(cx, cy, 220);
        this.particles.fire(cx, cy - 100, 1.8);
        this._screenShake();
        this._screenFlash();
        await this._delay(6000);
        break;
    }

    this._hideWinOverlay();
    this.particles.clearEmitters();
    this.clearWinCelebration();
    this.celebrating = false;
  }

  async _celebrateFreeSpins() {
    this.audio.playFreeSpins();
    this._showWinText('FREE SPINS!');
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.particles.mysticGlow(cx, cy, { r: 0.5, g: 0, b: 1 });
    this.particles.starburst(cx, cy, 1);
    await this._delay(2000);
    this._hideWinOverlay();
  }

  _showWinAmount(amount, tier) {
    if (!this.winAmount) return;
    this.winAmount.textContent = '+0';

    const countTarget = { val: 0 };
    const duration = tier === 'jackpot' ? 3.5 : tier === 'mega' ? 2.5 : tier === 'big' ? 1.8 : 1.0;

    gsap.fromTo(this.winAmount,
      { scale: 0, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }
    );

    let lastTickValue = 0;
    gsap.to(countTarget, {
      val: amount,
      duration: duration,
      ease: 'power2.out',
      onUpdate: () => {
        const rounded = Math.round(countTarget.val);
        this.winAmount.textContent = `+${this._formatNumber(rounded)}`;

        // Trigger audio click ticks as counter rolls up
        if (rounded - lastTickValue > amount / 18) {
          lastTickValue = rounded;
          const pitch = 0.8 + (countTarget.val / amount) * 0.6;
          if (this.audio && this.audio.playOdometerTick) {
            this.audio.playOdometerTick(pitch);
          }
        }
      },
      onComplete: () => {
        this.winAmount.textContent = `+${this._formatNumber(amount)}`;
        if (this.audio && this.audio.playSmallWin) {
          this.audio.playSmallWin();
        }
      }
    });

    // Scale pulse
    gsap.to(this.winAmount, {
      scale: 1.25,
      duration: 0.15,
      yoyo: true,
      repeat: Math.floor(duration / 0.15),
      ease: 'power1.inOut',
    });

    setTimeout(() => {
      gsap.to(this.winAmount, { opacity: 0, scale: 0.5, duration: 0.3 });
    }, (duration + 0.6) * 1000);
  }

  _showWinText(text) {
    if (!this.winOverlay || !this.winText) return;
    this.winText.textContent = text;
    this.winOverlay.classList.add('active');

    gsap.fromTo(this.winText,
      { scale: 0, rotation: -10, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }
    );

    // Pulse effect
    gsap.to(this.winText, {
      scale: 1.1,
      duration: 0.3,
      yoyo: true,
      repeat: 4,
      ease: 'power1.inOut',
      delay: 0.5,
    });
  }

  _hideWinOverlay() {
    if (!this.winOverlay) return;
    gsap.to(this.winOverlay, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        this.winOverlay.classList.remove('active');
        this.winOverlay.style.opacity = '';
      },
    });
  }

  _screenShake() {
    const container = document.querySelector('.game-container');
    if (container) {
      container.style.animation = 'screenShake 0.5s ease-in-out';
      setTimeout(() => { container.style.animation = ''; }, 500);
    }
  }

  _screenFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; inset: 0; z-index: 99;
      background: var(--win-flash, #FFD700);
      animation: flashOverlay 0.5s ease-out forwards;
      pointer-events: none;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  _addToHistory(winResult) {
    if (!this.winHistoryEl) return;
    if (winResult.totalWin <= 0) return;

    const entry = document.createElement('div');
    entry.className = 'win-history-entry';
    entry.innerHTML = `
      <span>${winResult.winTier.toUpperCase()} win × ${winResult.wins.length} line${winResult.wins.length > 1 ? 's' : ''}</span>
      <span class="amount">+${this._formatNumber(winResult.totalWin)}</span>
    `;

    this.winHistoryEl.insertBefore(entry, this.winHistoryEl.firstChild);

    // Keep only last 20 entries
    while (this.winHistoryEl.children.length > 20) {
      this.winHistoryEl.removeChild(this.winHistoryEl.lastChild);
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
