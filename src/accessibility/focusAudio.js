// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — FOCUS AUDIO GENERATOR (100% ROYALTY-FREE)
// Pure Web Audio API ambient sound engine for ADHD, sensory calming & reading focus.
// Zero external network requests, zero copyright issues, 100% offline capable.
// ==========================================================================

class FocusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeTrack = null; // 'focus' | 'deeper' | null
    this.nodes = [];
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    if (!this.ctx || !this.masterGain) return;

    // Smooth clickless fade-out
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    const oldNodes = [...this.nodes];
    this.nodes = [];
    this.activeTrack = null;

    setTimeout(() => {
      oldNodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
          if (n.disconnect) n.disconnect();
        } catch {
          // Graceful cleanup
        }
      });
    }, 160);
  }

  playFocusTrack() {
    this.init();
    this.stop();
    if (!this.ctx || !this.masterGain) return;

    this.activeTrack = 'focus';

    setTimeout(() => {
      if (!this.ctx || this.activeTrack !== 'focus') return;

      const now = this.ctx.currentTime;

      // Track 1: Focus (432Hz Harmonic Ambient Pad + Soft Low-Pass)
      const baseFreqs = [216, 270, 324, 432];
      baseFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 1.5) * 4, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        oscGain.gain.setValueAtTime(0.07 / baseFreqs.length, now);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start();
        this.nodes.push(osc, filter, oscGain);
      });

      // Soft gentle brown noise floor
      this.addGentleBrownNoise(0.04);

      // Smooth fade-in
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, this.volume), now + 0.25);
    }, 50);
  }

  playDeeperReadingTrack() {
    this.init();
    this.stop();
    if (!this.ctx || !this.masterGain) return;

    this.activeTrack = 'deeper';

    setTimeout(() => {
      if (!this.ctx || this.activeTrack !== 'deeper') return;

      const now = this.ctx.currentTime;

      // Track 2: Deeper Reading (Sub-harmonic resonance & calming noise)
      const deepFreqs = [108, 162, 216];
      deepFreqs.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        oscGain.gain.setValueAtTime(0.08 / deepFreqs.length, now);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start();
        this.nodes.push(osc, filter, oscGain);
      });

      this.addGentleBrownNoise(0.12);

      // Smooth fade-in
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, this.volume), now + 0.25);
    }, 50);
  }

  addGentleBrownNoise(gainLevel) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start();
    this.nodes.push(whiteNoise, filter, noiseGain);
  }
}

export const focusAudio = new FocusAudioEngine();
