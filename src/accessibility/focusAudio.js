// ==========================================================================
// DIVERSITY COLLECTIVE VENTURA COUNTY — FOCUS AUDIO GENERATOR (100% ROYALTY-FREE)
// Pure Web Audio API + in-memory WAV <audio> fallback for ADHD, sensory calming
// & reading focus. Zero external network requests, 100% offline capable.
// ==========================================================================

function encodeMonoWavUrl(samples, sampleRate = 22050) {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function buildFallbackTrackBlobUrl(trackName) {
  const sampleRate = 22050;
  const seconds = 4;
  const length = sampleRate * seconds;
  const samples = new Float32Array(length);
  const twoPi = Math.PI * 2;

  if (trackName === 'focus') {
    // Integer-multiple frequencies over 4s loop seamlessly with zero clicks
    const freqs = [216, 324, 432, 540];
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      let val = 0;
      freqs.forEach((f, idx) => {
        val += Math.sin(twoPi * f * t) * (idx === 0 ? 0.22 : 0.14);
      });
      samples[i] = val * 0.55;
    }
  } else {
    // Seamless smoothed pink/brown noise + gentle warm 108Hz/216Hz harmonic drone
    let lastOut = 0;
    for (let i = 0; i < length; i += 1) {
      const t = i / sampleRate;
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.03 * white) / 1.03;
      const drone = Math.sin(twoPi * 108 * t) * 0.14 + Math.sin(twoPi * 216 * t) * 0.09;
      samples[i] = Math.max(-0.9, Math.min(0.9, lastOut * 2.4 + drone));
    }
    // Cross-fade loop boundary over 200ms
    const fadeLen = Math.floor(sampleRate * 0.2);
    for (let i = 0; i < fadeLen; i += 1) {
      const alpha = i / fadeLen;
      samples[i] = samples[i] * alpha + samples[length - fadeLen + i] * (1 - alpha);
    }
  }

  return encodeMonoWavUrl(samples, sampleRate);
}

class FocusAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.activeTrack = null; // 'focus' | 'deeper' | null
    this.nodes = [];
    this.volume = 0.65;
    this.stopTimer = null;
    this.fallbackAudio = null;
    this.fallbackUrls = {};
  }

  _ensureContext() {
    if (typeof window === 'undefined') return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
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

  _stopFallbackAudio() {
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      } catch {
        // Ignore media stop cleanup errors
      }
      this.fallbackAudio = null;
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
    if (this.fallbackAudio) {
      this.fallbackAudio.volume = Math.max(0, Math.min(1, this.volume));
    }
    if (this.masterGain && this.ctx && this.activeTrack) {
      const target = Math.max(0.0001, this.volume * 0.85);
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(target, now, 0.04);
    }
  }

  stop() {
    this._clearPendingStop();
    this.activeTrack = null;
    this._stopFallbackAudio();

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

  async _startFallbackTrack(trackName) {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
    try {
      this._stopFallbackAudio();
      if (!this.fallbackUrls[trackName]) {
        this.fallbackUrls[trackName] = buildFallbackTrackBlobUrl(trackName);
      }
      const url = this.fallbackUrls[trackName];
      if (!url) return false;

      const audioEl = new Audio(url);
      audioEl.loop = true;
      audioEl.volume = Math.max(0.05, Math.min(1, this.volume));
      this.fallbackAudio = audioEl;
      await audioEl.play();
      this.activeTrack = trackName;
      return true;
    } catch {
      this._stopFallbackAudio();
      this.activeTrack = null;
      return false;
    }
  }

  async _prepareForPlayback(trackName) {
    const ctx = this._ensureContext();
    if (!ctx || !this.masterGain) return false;

    // Cancel any queued fade-out timer and immediately release prior track nodes
    this._clearPendingStop();
    this._teardownNodes();
    this._stopFallbackAudio();
    this.activeTrack = trackName;

    // Kick off resume synchronously inside user click handler before awaiting
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        this.activeTrack = null;
        return false;
      }
    }

    return this.activeTrack === trackName && ctx.state === 'running';
  }

  _fadeInMaster(durationSec = 0.25) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const targetGain = Math.max(0.04, this.volume * 0.85);
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + durationSec);
  }

  async playFocusTrack() {
    if (typeof window === 'undefined') return false;
    const ready = await this._prepareForPlayback('focus');
    if (!ready || !this.ctx || !this.masterGain) {
      return this._startFallbackTrack('focus');
    }

    const now = this.ctx.currentTime;

    // Track 1: 432Hz Warm Center Chord (audible across laptop & phone speakers)
    const freqs = [216, 324, 432, 540];
    const chordFilter = this.ctx.createBiquadFilter();
    chordFilter.type = 'lowpass';
    chordFilter.frequency.setValueAtTime(1400, now);
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
      lfoGain.gain.setValueAtTime(0.02, now);

      const baseLevel = idx === 0 ? 0.16 : 0.12;
      oscGain.gain.setValueAtTime(baseLevel, now);

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(chordFilter);

      osc.start(now);
      lfo.start(now);
      this.nodes.push(osc, oscGain, lfo, lfoGain);
    });

    this.addGentleBrownNoise(0.22, 620);
    this._fadeInMaster(0.25);
    return true;
  }

  async playDeeperReadingTrack() {
    if (typeof window === 'undefined') return false;
    const ready = await this._prepareForPlayback('deeper');
    if (!ready || !this.ctx || !this.masterGain) {
      return this._startFallbackTrack('deeper');
    }

    const now = this.ctx.currentTime;

    // Track 2: Deeper Reading (Warm sub-harmonic drone + soothing brown rain noise)
    const deepFreqs = [110, 165, 220, 330];
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(760, now);
    filter.connect(this.masterGain);
    this.nodes.push(filter);

    deepFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = idx < 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      oscGain.gain.setValueAtTime(idx === 0 ? 0.12 : 0.09, now);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      this.nodes.push(osc, oscGain);
    });

    this.addGentleBrownNoise(0.38, 720);
    this._fadeInMaster(0.25);
    return true;
  }

  addGentleBrownNoise(gainLevel, cutoffHz = 620) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = output[i];
      output[i] *= 4.0;
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
