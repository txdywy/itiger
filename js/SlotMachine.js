/**
 * SlotMachine - Core game engine
 * Authentic slot machine mechanics with weighted reel strips,
 * proper wild substitution, scatter pays, and free spins.
 *
 * Design: 5 reels x 3 rows, 20 fixed paylines.
 * Each reel has its own weighted strip (60-70 stops).
 * Spin picks a random stop per reel; 3 visible symbols = strip[pos-1, pos, pos+1].
 */

// ── Paylines (20 lines across 5x3 grid) ──────────────────────────────
// Each entry: [reel0Row, reel1Row, reel2Row, reel3Row, reel4Row]
const PAYLINES = [
  [1, 1, 1, 1, 1],  //  1: middle
  [0, 0, 0, 0, 0],  //  2: top
  [2, 2, 2, 2, 2],  //  3: bottom
  [0, 1, 2, 1, 0],  //  4: V
  [2, 1, 0, 1, 2],  //  5: inverted V
  [0, 0, 1, 2, 2],  //  6: descending
  [2, 2, 1, 0, 0],  //  7: ascending
  [1, 0, 0, 0, 1],  //  8: top U
  [1, 2, 2, 2, 1],  //  9: bottom U
  [0, 1, 0, 1, 0],  // 10: zigzag top
  [2, 1, 2, 1, 2],  // 11: zigzag bottom
  [1, 0, 1, 0, 1],  // 12: wave up
  [1, 2, 1, 2, 1],  // 13: wave down
  [0, 1, 1, 1, 0],  // 14: shallow V
  [2, 1, 1, 1, 2],  // 15: shallow inv V
  [0, 0, 1, 0, 0],  // 16: slight dip
  [2, 2, 1, 2, 2],  // 17: slight rise
  [1, 0, 2, 0, 1],  // 18: W
  [1, 2, 0, 2, 1],  // 19: M
  [0, 2, 0, 2, 0],  // 20: sharp zigzag
];

// ── Symbol indices ────────────────────────────────────────────────────
const SYM = {
  COMMON_A: 0,   // cherry / ankh (low)
  COMMON_B: 1,   // clover / urn (low)
  MED_A:     2,   // bell / cobra (mid)
  MED_B:     3,   // bar / eye (mid)
  HIGH_A:    4,   // star / scarab (high)
  HIGH_B:    5,   // seven / pharaoh (premium)
  WILD:      6,   // diamond / wild
  SCATTER:   7,   // crown / scatter
};

// ── Pay table: symbol → { 3: multiplier, 4: multiplier, 5: multiplier } ──
// Payouts are per line bet (bet_per_line × multiplier).
// Scatter pays are multiplied by TOTAL bet instead.
const PAY_TABLE = {
  [SYM.COMMON_A]: { 3: 5,   4: 15,  5: 50   },
  [SYM.COMMON_B]: { 3: 5,   4: 15,  5: 50   },
  [SYM.MED_A]:    { 3: 10,  4: 30,  5: 100  },
  [SYM.MED_B]:    { 3: 10,  4: 30,  5: 100  },
  [SYM.HIGH_A]:   { 3: 20,  4: 75,  5: 250  },
  [SYM.HIGH_B]:   { 3: 25,  4: 100, 5: 500  },
  [SYM.WILD]:     { 3: 50,  4: 200, 5: 1000 },
  [SYM.SCATTER]:  { 3: 5,   4: 20,  5: 100  },
};

// ── Reel strips ───────────────────────────────────────────────────────
// Each reel has a different weighted composition.
// Real slots tune these to hit a target RTP (return-to-player).
// Indices into SYM above.  Total ~60-70 stops per reel.
const REEL_STRIPS = [
  // Reel 0 — slightly heavier on common
  [0,1,0,2,1,0,3,1,0,2,0,1,4,0,1,2,0,1,3,0,2,1,0,5,1,0,2,1,0,3,
   1,0,2,0,1,7,0,2,1,0,3,1,0,2,1,4,0,1,2,0,1,3,0,1,6,0,2,1,0,3],
  // Reel 1 — balanced
  [1,0,2,1,3,0,1,2,0,1,4,2,0,1,3,0,2,1,0,5,1,0,2,3,1,0,2,1,7,0,
   1,2,0,3,1,0,2,1,4,0,2,1,0,3,1,2,0,1,6,2,0,1,3,0,2,1,0,2,1,3],
  // Reel 2 — more medium + wild
  [2,1,0,3,1,2,0,1,4,2,1,0,3,2,1,5,0,2,1,3,0,2,1,6,2,1,0,3,1,2,
   7,1,0,2,3,1,0,2,4,1,2,0,3,1,2,0,1,5,2,1,0,3,2,1,0,6,2,1,3,0],
  // Reel 3 — heavy wild + scatter availability
  [3,1,0,2,1,3,0,2,1,4,0,3,1,2,0,5,1,3,2,0,1,6,3,1,0,2,1,3,7,0,
   2,1,3,0,2,1,4,3,1,0,2,5,1,3,0,2,1,6,3,1,2,0,1,3,2,0,1,3,7,2],
  // Reel 4 — balanced with scatter on reel 4
  [0,2,1,3,0,1,2,4,0,1,3,2,0,1,5,2,0,3,1,0,2,6,1,0,3,2,1,0,7,3,
   1,0,2,1,3,0,4,2,1,0,3,1,5,0,2,1,3,0,6,2,1,0,3,2,1,0,7,2,1,3],
];

// ── Free spin configuration ───────────────────────────────────────────
const FREE_SPINS_COUNT    = 15;   // 3+ scatters → 15 free spins
const FREE_SPINS_MULTI    = 3;    // All wins × 3 during free spins
const FREE_SPINS_RETRIGGER = 15;  // Re-trigger adds another 15

// ── Win tier thresholds (as multiples of total bet) ───────────────────
const TIER_JACKPOT = 100;
const TIER_MEGA    = 50;
const TIER_BIG     = 15;
const TIER_MEDIUM  = 5;

// ── SlotMachine class ─────────────────────────────────────────────────
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

    // Free spin state
    this.freeSpinsRemaining = 0;
    this.freeSpinsMultiplier = 1;

    // Visible window: 5 reels × 3 rows
    this.visibleSymbols = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    // Cache reel strip lengths
    this._stripLengths = REEL_STRIPS.map(s => s.length);

    // Callbacks
    this.onSpinStart = null;
    this.onReelStop = null;
    this.onSpinComplete = null;
    this.onWin = null;
    this.onBalanceChange = null;
    this.onFreeSpins = null;
    this.onMegaWin = null;
  }

  // ── Reel strip mechanics ──────────────────────────────────────────

  /**
   * Pick a random stop position on a reel strip and return the 3 visible
   * symbols (the stop itself plus one above and one below, wrapping).
   * This mirrors how real slot machines work: the reel is a loop of symbols,
   * and stopping at position P shows strip[P-1], strip[P], strip[P+1].
   */
  _getReelResult(reelIdx) {
    const strip = REEL_STRIPS[reelIdx];
    const len = this._stripLengths[reelIdx];
    const stop = Math.floor(Math.random() * len);

    return [
      strip[(stop - 1 + len) % len],  // top row
      strip[stop],                      // middle row (the "stop")
      strip[(stop + 1) % len],          // bottom row
    ];
  }

  // ── Bet management ───────────────────────────────────────────────

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

  getBetPerLine() {
    return this.bet;
  }

  canSpin() {
    if (this.spinning) return false;
    if (this.freeSpinsRemaining > 0) return true;
    return this.balance >= this.getTotalBet();
  }

  // ── Spin ─────────────────────────────────────────────────────────

  /**
   * Generate spin results using reel strip stop positions.
   * Returns the visible 3×5 grid for the animation to display.
   */
  spin() {
    if (!this.canSpin()) return null;

    this.spinning = true;

    try {
      // Deduct total bet (skip during free spins)
      if (this.freeSpinsRemaining <= 0) {
        const totalBet = this.getTotalBet();
        this.balance -= totalBet;
        if (this.onBalanceChange) this.onBalanceChange(this.balance, -totalBet);
      }

      // Generate results from reel strips
      for (let r = 0; r < 5; r++) {
        const [top, mid, bot] = this._getReelResult(r);
        this.visibleSymbols[r][0] = top;
        this.visibleSymbols[r][1] = mid;
        this.visibleSymbols[r][2] = bot;
      }

      return {
        symbols: this.visibleSymbols.map(reel => [...reel]),
      };
    } catch (err) {
      this.spinning = false;
      throw err;
    }
  }

  // ── Win checking ─────────────────────────────────────────────────

  /**
   * Evaluate all paylines and scatter pays.
   * Returns structured win data with proper left-to-right evaluation,
   * wild substitution (best pay), scatter pays, and free spin triggers.
   */
  checkWins(symbols) {
    const results = {
      wins: [],
      totalWin: 0,
      scatterCount: 0,
      freeSpinsTriggered: false,
      freeSpinsRetriggered: false,
      winTier: 'none',
      winningPositions: new Set(),
    };

    // ── Count scatters (anywhere on the grid, not on paylines) ─────
    for (let r = 0; r < 5; r++) {
      for (let row = 0; row < 3; row++) {
        if (symbols[r][row] === SYM.SCATTER) {
          results.scatterCount++;
        }
      }
    }

    // ── Evaluate each active payline ───────────────────────────────
    const betPerLine = this.bet;

    for (let lineIdx = 0; lineIdx < this.lines; lineIdx++) {
      const payline = PAYLINES[lineIdx];
      const lineSymbols = payline.map((row, reel) => symbols[reel][row]);

      // Find the best-paying left-to-right match on this line.
      // Wild substitutes for any symbol except scatter.
      // Strategy: track the "anchor" symbol (first non-wild),
      // then count consecutive matches including wilds.
      let anchor = -1;       // first non-wild symbol
      let count = 0;         // consecutive matching count

      for (let i = 0; i < 5; i++) {
        const sym = lineSymbols[i];

        if (sym === SYM.SCATTER) {
          // Scatter does not participate in paylines
          break;
        }

        if (sym === SYM.WILD) {
          // Wild: always continues the streak
          count++;
          continue;
        }

        if (anchor === -1) {
          // First real symbol — becomes the anchor
          anchor = sym;
          count++;
        } else if (sym === anchor) {
          // Matches the anchor
          count++;
        } else {
          // Different symbol — streak broken
          break;
        }
      }

      // Need at least 3 of a kind for a win
      if (count >= 3) {
        // If all were wilds, the anchor is WILD
        const paySymbol = anchor === -1 ? SYM.WILD : anchor;
        const payout = PAY_TABLE[paySymbol];

        if (payout && payout[count]) {
          const lineWin = payout[count] * betPerLine;
          results.wins.push({
            line: lineIdx + 1,
            symbol: paySymbol,
            count,
            amount: lineWin,
            positions: payline.slice(0, count).map((row, reel) => `${reel}-${row}`),
          });
          results.totalWin += lineWin;

          for (let i = 0; i < count; i++) {
            results.winningPositions.add(`${i}-${payline[i]}`);
          }
        }
      }
    }

    // ── Scatter pays (anywhere on reels, multiplied by TOTAL bet) ──
    if (results.scatterCount >= 3) {
      const scatterKey = Math.min(results.scatterCount, 5);
      const scatterPay = PAY_TABLE[SYM.SCATTER][scatterKey];

      if (scatterPay) {
        const scatterWin = scatterPay * this.getTotalBet();
        results.totalWin += scatterWin;
        results.wins.push({
          line: 'scatter',
          symbol: SYM.SCATTER,
          count: results.scatterCount,
          amount: scatterWin,
          positions: [],  // scatter positions are highlighted separately
        });
      }

      // ── Free spins trigger / retrigger ─────────────────────────
      if (this.freeSpinsRemaining > 0) {
        // Retrigger during free spins — add more
        this.freeSpinsRemaining += FREE_SPINS_RETRIGGER;
        results.freeSpinsRetriggered = true;
      } else {
        // Initial trigger
        this.freeSpinsRemaining = FREE_SPINS_COUNT;
        this.freeSpinsMultiplier = FREE_SPINS_MULTI;
        results.freeSpinsTriggered = true;
      }
    }

    // ── Apply free spins multiplier to ALL wins on this spin ─────
    if (this.freeSpinsMultiplier > 1) {
      const m = this.freeSpinsMultiplier;
      results.totalWin *= m;
      results.wins.forEach(w => { w.amount *= m; });
    }

    // ── Determine win tier ───────────────────────────────────────
    const totalBet = this.getTotalBet();
    if (totalBet > 0) {
      const betMultiple = results.totalWin / totalBet;
      if (betMultiple >= TIER_JACKPOT)     results.winTier = 'jackpot';
      else if (betMultiple >= TIER_MEGA)   results.winTier = 'mega';
      else if (betMultiple >= TIER_BIG)    results.winTier = 'big';
      else if (betMultiple >= TIER_MEDIUM) results.winTier = 'medium';
      else if (betMultiple >= 1)           results.winTier = 'small';
    }

    // ── Credit winnings ──────────────────────────────────────────
    if (results.totalWin > 0) {
      this.balance += results.totalWin;
      if (this.onBalanceChange) this.onBalanceChange(this.balance, results.totalWin);
    }

    // ── Decrement free spins counter AFTER processing ────────────
    if (this.freeSpinsRemaining > 0) {
      this.freeSpinsRemaining--;
      if (this.freeSpinsRemaining === 0) {
        this.freeSpinsMultiplier = 1;
      }
    }

    this.spinning = false;
    return results;
  }

  // ── Accessors ────────────────────────────────────────────────────

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
  }
}
