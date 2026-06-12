/**
 * SlotMachine - Core game engine
 * Handles random outcomes, payline detection, win calculation, free spins
 */

// 20 payline definitions across 5x3 grid
// Each payline is an array of row indices [reel0Row, reel1Row, reel2Row, reel3Row, reel4Row]
const PAYLINES = [
  [1, 1, 1, 1, 1],  // 1: middle horizontal
  [0, 0, 0, 0, 0],  // 2: top horizontal
  [2, 2, 2, 2, 2],  // 3: bottom horizontal
  [0, 1, 2, 1, 0],  // 4: V shape
  [2, 1, 0, 1, 2],  // 5: inverted V
  [0, 0, 1, 2, 2],  // 6: descending diagonal
  [2, 2, 1, 0, 0],  // 7: ascending diagonal
  [1, 0, 0, 0, 1],  // 8: top U
  [1, 2, 2, 2, 1],  // 9: bottom U
  [0, 1, 0, 1, 0],  // 10: zigzag top
  [2, 1, 2, 1, 2],  // 11: zigzag bottom
  [1, 0, 1, 0, 1],  // 12: wave up
  [1, 2, 1, 2, 1],  // 13: wave down
  [0, 1, 1, 1, 0],  // 14: shallow V
  [2, 1, 1, 1, 2],  // 15: shallow inv V
  [0, 0, 1, 0, 0],  // 16: slight dip
  [2, 2, 1, 2, 2],  // 17: slight rise
  [1, 0, 2, 0, 1],  // 18: W shape
  [1, 2, 0, 2, 1],  // 19: M shape
  [0, 2, 0, 2, 0],  // 20: sharp zigzag
];

// Pay table: symbol -> payout multiplier for 3, 4, 5 of a kind
const PAY_TABLE = {
  // Common symbols (index 0-1)
  0: { 3: 5, 4: 15, 5: 50 },
  1: { 3: 5, 4: 15, 5: 50 },
  // Medium symbols (index 2-3)
  2: { 3: 10, 4: 30, 5: 100 },
  3: { 3: 10, 4: 30, 5: 100 },
  // Rare symbols (index 4-5)
  4: { 3: 20, 4: 75, 5: 250 },
  5: { 3: 25, 4: 100, 5: 400 },
  // Wild (index 6)
  6: { 3: 50, 4: 200, 5: 1000 },
  // Scatter (index 7)
  7: { 3: 5, 4: 20, 5: 100 }, // multiplied by total bet, not line bet
};

// Weight distribution for reel strips (must match symbol count)
const REEL_WEIGHTS = [25, 25, 18, 18, 12, 12, 5, 5]; // common -> scatter

export class SlotMachine {
  constructor(themeManager) {
    this.themeManager = themeManager;

    // Game state
    this.balance = 10000;
    this.bet = 100;
    this.betLevels = [10, 25, 50, 100, 250, 500, 1000];
    this.betIndex = 3;
    this.lines = 20;
    this.maxLines = 20;
    this.spinning = false;
    this.autoSpin = false;
    this.freeSpinsRemaining = 0;
    this.freeSpinsMultiplier = 1;

    // Reel state - 5 reels, 3 visible rows each
    this.reels = [[], [], [], [], []];
    this.visibleSymbols = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    // Build reel strips with weighted symbols
    this._buildReelStrips();

    // Callbacks
    this.onSpinStart = null;
    this.onReelStop = null;
    this.onSpinComplete = null;
    this.onWin = null;
    this.onBalanceChange = null;
    this.onFreeSpins = null;
    this.onMegaWin = null;
  }

  _buildReelStrips() {
    const symbolCount = this.themeManager.getSymbols().length;
    for (let r = 0; r < 5; r++) {
      this.reels[r] = [];
      const totalWeight = REEL_WEIGHTS.reduce((a, b) => a + b, 0);
      // Build a strip of 40 symbols per reel
      for (let i = 0; i < 40; i++) {
        let rand = Math.random() * totalWeight;
        for (let s = 0; s < symbolCount; s++) {
          rand -= REEL_WEIGHTS[s] || 5;
          if (rand <= 0) {
            this.reels[r].push(s);
            break;
          }
        }
      }
    }
  }

  _getRandomSymbol() {
    const symbolCount = this.themeManager.getSymbols().length;
    const totalWeight = REEL_WEIGHTS.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let s = 0; s < symbolCount; s++) {
      rand -= REEL_WEIGHTS[s] || 5;
      if (rand <= 0) return s;
    }
    return 0;
  }

  setBet(index) {
    if (index >= 0 && index < this.betLevels.length) {
      this.betIndex = index;
      this.bet = this.betLevels[index];
    }
  }

  increaseBet() {
    if (this.betIndex < this.betLevels.length - 1) {
      this.betIndex++;
      this.bet = this.betLevels[this.betIndex];
    }
    return this.bet;
  }

  decreaseBet() {
    if (this.betIndex > 0) {
      this.betIndex--;
      this.bet = this.betLevels[this.betIndex];
    }
    return this.bet;
  }

  setLines(lines) {
    this.lines = Math.max(1, Math.min(this.maxLines, lines));
  }

  addCoins(amount = 10000) {
    this.balance += amount;
    if (this.onBalanceChange) this.onBalanceChange(this.balance, amount);
  }

  getTotalBet() {
    return this.bet * this.lines;
  }

  canSpin() {
    if (this.spinning) return false;
    if (this.freeSpinsRemaining > 0) return true;
    return this.balance >= this.getTotalBet();
  }

  /**
   * Generate spin results and return win data
   */
  spin() {
    if (!this.canSpin()) return null;

    this.spinning = true;

    // Deduct bet (skip for free spins)
    if (this.freeSpinsRemaining <= 0) {
      this.balance -= this.getTotalBet();
      if (this.onBalanceChange) this.onBalanceChange(this.balance, -this.getTotalBet());
    }

    // Generate random results for each reel
    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        this.visibleSymbols[r][row] = this._getRandomSymbol();
      }
    }

    // Return the result data - actual win checking happens after reels stop
    return {
      symbols: this.visibleSymbols.map(reel => [...reel]),
    };
  }

  /**
   * Check wins after all reels have stopped
   */
  checkWins(symbols) {
    const results = {
      wins: [],
      totalWin: 0,
      scatterCount: 0,
      freeSpinsTriggered: false,
      winTier: 'none', // none, small, medium, big, mega, jackpot
      winningPositions: new Set(),
    };

    const scatter = 7; // scatter index

    // Count scatters across all positions
    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        if (symbols[r][row] === scatter) {
          results.scatterCount++;
        }
      }
    }

    // Check each active payline
    for (let lineIdx = 0; lineIdx < this.lines; lineIdx++) {
      const payline = PAYLINES[lineIdx];
      const lineSymbols = payline.map((row, reel) => symbols[reel][row]);

      // Find consecutive matching symbols from left (wild substitutes)
      const wild = 6;
      let matchSymbol = -1;
      let matchCount = 0;

      for (let i = 0; i < 5; i++) {
        const sym = lineSymbols[i];
        if (sym === wild) {
          // Wild matches anything
          if (matchSymbol === -1) matchSymbol = wild;
          matchCount++;
        } else if (matchSymbol === -1 || matchSymbol === wild) {
          matchSymbol = sym;
          matchCount++;
        } else if (sym === matchSymbol) {
          matchCount++;
        } else {
          break;
        }
      }

      // Minimum 3 of a kind for a win
      if (matchCount >= 3 && matchSymbol !== -1) {
        const payout = PAY_TABLE[matchSymbol];
        if (payout && payout[matchCount]) {
          const lineWin = payout[matchCount] * this.bet;
          results.wins.push({
            line: lineIdx + 1,
            symbol: matchSymbol,
            count: matchCount,
            amount: lineWin,
            positions: payline.slice(0, matchCount).map((row, reel) => `${reel}-${row}`),
          });
          results.totalWin += lineWin;

          // Track winning positions
          for (let i = 0; i < matchCount; i++) {
            results.winningPositions.add(`${i}-${payline[i]}`);
          }
        }
      }
    }

    // Scatter wins (multiplied by total bet, not line bet)
    if (results.scatterCount >= 3) {
      const scatterPayout = PAY_TABLE[scatter];
      if (scatterPayout && scatterPayout[Math.min(results.scatterCount, 5)]) {
        const scatterWin = scatterPayout[Math.min(results.scatterCount, 5)] * this.getTotalBet();
        results.totalWin += scatterWin;
        results.wins.push({
          line: 'scatter',
          symbol: scatter,
          count: results.scatterCount,
          amount: scatterWin,
        });
      }

      // Trigger free spins
      if (results.scatterCount >= 3) {
        results.freeSpinsTriggered = true;
        this.freeSpinsRemaining = 10;
        this.freeSpinsMultiplier = 2;
      }
    }

    // Apply free spins multiplier
    if (this.freeSpinsRemaining > 0) {
      results.totalWin *= this.freeSpinsMultiplier;
      results.wins.forEach(w => w.amount *= this.freeSpinsMultiplier);
    }

    // Determine win tier
    const betMultiple = results.totalWin / this.getTotalBet();
    if (betMultiple >= 200) results.winTier = 'jackpot';
    else if (betMultiple >= 50) results.winTier = 'mega';
    else if (betMultiple >= 15) results.winTier = 'big';
    else if (betMultiple >= 5) results.winTier = 'medium';
    else if (betMultiple >= 1) results.winTier = 'small';

    // Add winnings to balance
    if (results.totalWin > 0) {
      this.balance += results.totalWin;
      if (this.onBalanceChange) this.onBalanceChange(this.balance, results.totalWin);
    }

    // Handle free spins counter
    if (this.freeSpinsRemaining > 0) {
      this.freeSpinsRemaining--;
      if (this.freeSpinsRemaining === 0) {
        this.freeSpinsMultiplier = 1;
      }
    }

    this.spinning = false;
    return results;
  }

  getPaylines() {
    return PAYLINES;
  }

  getPayTable() {
    return PAY_TABLE;
  }

  isFreeSpin() {
    return this.freeSpinsRemaining > 0;
  }

  resetGame() {
    this.balance = 10000;
    this.bet = 100;
    this.betIndex = 3;
    this.freeSpinsRemaining = 0;
    this.freeSpinsMultiplier = 1;
    this._buildReelStrips();
  }
}
