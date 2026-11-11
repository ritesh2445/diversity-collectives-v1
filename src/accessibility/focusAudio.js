// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — FOCUS AUDIO GENERATOR (100% ROYALTY-FREE)
// Pure Web Audio API ambient sound engine for ADHD, sensory calming & reading focus.
// Zero external network requests, zero copyright issues, 100% offline capable.
// ==========================================================================

class FocusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.activeTrack = null; // 'focus' | 'deeper' | null
    this.nodes = [];
    this.volume = 0.65;
    this.stopTimer = null;
  }

  _ensureContext() {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);
    }

    return this.ctx;
  }

  init() {
    const ctx = this._ensureContext();
    if (ctx && ctx.state === 'suspended') {
      return ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  _clearPendingStop() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  _teardownNodes(nodesToStop = this.nodes) {
    nodesToStop.forEach((n) => {
      try {
        if (typeof n.stop === 'function') n.stop();
      } catch {
        // Ignore already-stopped nodes
      }
      try {
        if (typeof n.disconnect === 'function') n.disconnect();
      } catch {
        // Ignore already-disconnected nodes
      }
    });
    if (nodesToStop === this.nodes) {
      this.nodes = [];
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, Number(val) || 0));
    if (this.masterGain && this.ctx && this.activeTrack) {
      const target = Math.max(0.0001, this.volume * 0.7);
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(target, now, 0.04);
    }
  }

  stop() {
    this._clearPendingStop();
    this.activeTrack = null;

    if (!this.ctx || !this.masterGain) {
      this._teardownNodes();
      return;
    }

    const now = this.ctx.currentTime;
    const oldNodes = [...this.nodes];
    this.nodes = [];

    try {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    } catch {
      // Fallback immediate teardown below
    }

    this.stopTimer = setTimeout(() => {
      this.stopTimer = null;
      this._teardownNodes(oldNodes);
    }, 160);
  }

  async _prepareForPlayback(trackName) {
    const ctx = this._ensureContext();
    if (!ctx || !this.masterGain) return false;

    // Cancel any queued fade-out timer and immediately release prior track nodes
    this._clearPendingStop();
    this._teardownNodes();
    this.activeTrack = trackName;

    // Must resume synchronously inside click call stack, then await activation
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        this.activeTrack = null;
        return false;
      }
    }

    return this.activeTrack === trackName;
  }

  _fadeInMaster(durationSec = 0.35) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const targetGain = Math.max(0.02, this.volume * 0.7);
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(targetGain, now + durationSec);
  }

  async playFocusTrack() {
    const ready = await this._prepareForPlayback('focus');
    if (!ready || !this.ctx || !this.masterGain) return false;

    const now = this.ctx.currentTime;

    // Track 1: 432Hz Warm Sanctuary Chord (audible across laptop & phone speakers)
    const freqs = [216, 432, 540, 648];
    const chordFilter = this.ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    chordFilter.frequency.setValueAtTime(1150, now);
    chordFilter.Q.setValueAtTime(0.7, now);
    chordFilter.connect(this.masterGain);
    this.nodes.push(chordFilter);

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle breathing shimmer modulation
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.14 + idx * 0.03, now);
      lfoGain.gain.setValueAtTime(0.015, now);

      const baseLevel = idx === 0 ? 0.11 : 0.085;
      oscGain.gain.setValueAtTime(baseLevel, now);

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(chordFilter);

      osc.start(now);
      lfo.start(now);
      this.nodes.push(osc, oscGain, lfo, lfoGain);
    });

    this.addGentleBrownNoise(0.14, 520);
    this._fadeInMaster(0.3);
    return true;
  }

  async playDeeperReadingTrack() {
    const ready = await this._prepareForPlayback('deeper');
    if (!ready || !this.ctx || !this.masterGain) return false;

    const now = this.ctx.currentTime;

    // Track 2: Deeper Reading (Warm sub-harmonic drone + soothing brown rain noise)
    const deepFreqs = [108, 162, 216, 324];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(640, now);
    filter.connect(this.masterGain);
    this.nodes.push(filter);

    deepFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      oscGain.gain.setValueAtTime(0.065, now);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      this.nodes.push(osc, oscGain);
    });

    this.addGentleBrownNoise(0.28, 620);
    this._fadeInMaster(0.3);
    return true;
  }

  addGentleBrownNoise(gainLevel, cutoffHz = 520) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = output[i];
      output[i] *= 3.8;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start();
    this.nodes.push(noiseSource, filter, noiseGain);
  }
}

export const focusAudio = new FocusAudioEngine();
