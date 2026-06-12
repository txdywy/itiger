/**
 * AudioManager - Synthesized sound effects using Web Audio API
 * No external audio files needed - everything generated in code
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.muted = false;
    this.initialized = false;
    this.sfxVolume = 0.5;
    this.musicVolume = 0.3;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  // ==============================
  // Synthesized Sound Effects
  // ==============================

  /**
   * Short UI click sound
   */
  playClick() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Reel spin tick sound
   */
  playTick() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Reel stop thud
   */
  playReelStop() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;

    // Low thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  /**
   * Spin start whoosh
   */
  playSpinStart() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Small win chime - ascending notes
   */
  playSmallWin() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.2, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.35);
    });
  }

  /**
   * Big win fanfare - rich chord with tremolo
   */
  playBigWin() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = i < 3 ? 'triangle' : 'sine';
      osc.frequency.value = freq;

      lfo.type = 'sine';
      lfo.frequency.value = 5 + i; // tremolo
      lfoGain.gain.value = 0.05;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
      gain.gain.setValueAtTime(0.15, t + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      lfo.start(t);
      osc.start(t);
      osc.stop(t + 2.6);
      lfo.stop(t + 2.6);
    });
  }

  /**
   * Jackpot - epic multi-layered sound
   */
  playJackpot() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;

    // Layer 1: Deep bass pulse
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = 65.41; // C2
    bassGain.gain.setValueAtTime(0.3, t);
    bassGain.gain.exponentialRampToValueAtTime(0.01, t + 4);
    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bass.start(t);
    bass.stop(t + 4.1);

    // Layer 2: Ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.9);
    });

    // Layer 3: Shimmering high notes
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1046.50 * (1 + i * 0.01); // slight detuning
      gain.gain.setValueAtTime(0, t + 0.5);
      gain.gain.linearRampToValueAtTime(0.08, t + 1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 3.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + 0.5);
      osc.stop(t + 3.6);
    }
  }

  /**
   * Coin drop sound
   */
  playCoinDrop() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(800, t + i * 0.06 + 0.1);
      gain.gain.setValueAtTime(0.15, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    }
  }

  /**
   * Free spins trigger sound
   */
  playFreeSpins() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;

    // Mystical chord
    [392, 466.16, 554.37, 659.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 2.1);
    });
  }

  /**
   * Bet change click
   */
  playBetChange() {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Tension rising sound for anticipation reels
   */
  startAnticipation() {
    if (!this.initialized || this.muted) return null;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 4); // Rise up to 1400Hz over 4s

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(8, t); // 8Hz modulation
    lfoGain.gain.setValueAtTime(0.08, t);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(t);
    osc.start(t);

    return {
      osc,
      lfo,
      gain,
      stop: () => {
        if (!this.ctx) return;
        const stopTime = this.ctx.currentTime;
        try {
          gain.gain.setValueAtTime(gain.gain.value, stopTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stopTime + 0.1);
          setTimeout(() => {
            try {
              osc.stop();
              lfo.stop();
            } catch (e) {}
          }, 120);
        } catch (err) {}
      }
    };
  }

  /**
   * Quick odometer sound tick
   */
  playOdometerTick(pitchFactor = 1.0) {
    if (!this.initialized || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 * pitchFactor, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}
