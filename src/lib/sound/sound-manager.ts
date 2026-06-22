// Sound Manager — Web Audio API synthesized sounds (no asset files needed)
// Generates lab sound effects procedurally: bubbling, pouring, reaction pop, glass break, hiss
"use client";

type SoundName =
  | "reaction"
  | "pour"
  | "bubble"
  | "break"
  | "hiss"
  | "click"
  | "success"
  | "warning"
  | "drop"
  | "evaporate";

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private bubblingSource: { stop: () => void } | null = null;
  private hissSource: { stop: () => void } | null = null;

  /** Lazily create the AudioContext (must be triggered by user gesture) */
  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.35;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBubbling();
      this.stopHiss();
    }
  }

  /** Unlock audio on first user gesture */
  unlock() {
    this.ensureCtx();
  }

  private now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** Single tone with envelope */
  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    startGain = 0.3,
    freqEnd?: number,
    delay = 0
  ) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain || this.muted) return;
    const t = this.now() + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
    }
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(startGain, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /** White noise burst (for fizzing, breaking) */
  private noiseBurst(
    duration: number,
    startGain = 0.2,
    lowpass = 8000,
    highpass = 200,
    delay = 0
  ) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain || this.muted) return;
    const t = this.now() + delay;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.min(1, i / (bufferSize * 0.05)) * Math.min(1, (bufferSize - i) / (bufferSize * 0.3));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(startGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(hp);
    hp.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
    src.stop(t + duration + 0.05);
  }

  // ===== Public sound effects =====

  playReaction() {
    this.tone(880, 0.08, "triangle", 0.25);
    this.tone(1320, 0.12, "sine", 0.18, undefined, 0.04);
    this.noiseBurst(0.4, 0.15, 4000, 500, 0.05);
    this.tone(660, 0.18, "sine", 0.12, 880, 0.08);
  }

  playPour() {
    this.noiseBurst(0.6, 0.18, 3000, 800);
    this.tone(220, 0.4, "sine", 0.08, 180);
  }

  playDrop() {
    this.tone(660, 0.05, "sine", 0.18, 440);
    this.noiseBurst(0.1, 0.08, 5000, 1500);
  }

  playBreak() {
    this.noiseBurst(0.05, 0.35, 9000, 3000);
    this.noiseBurst(0.15, 0.25, 7000, 2000, 0.02);
    this.noiseBurst(0.3, 0.18, 5000, 1000, 0.05);
    this.tone(3000, 0.08, "square", 0.12, 2000, 0.02);
    this.tone(4500, 0.1, "triangle", 0.1, 1500, 0.05);
  }

  playClick() {
    this.tone(1200, 0.03, "square", 0.12);
  }

  playSuccess() {
    this.tone(523.25, 0.15, "sine", 0.18);
    this.tone(659.25, 0.15, "sine", 0.18, undefined, 0.05);
    this.tone(783.99, 0.25, "sine", 0.2, undefined, 0.1);
  }

  playWarning() {
    this.tone(440, 0.15, "square", 0.18, 220);
    this.tone(440, 0.15, "square", 0.18, 220, 0.2);
  }

  playEvaporate() {
    this.noiseBurst(0.8, 0.12, 6000, 1000);
    this.tone(440, 0.6, "sine", 0.06, 880);
  }

  // ===== Continuous ambient sounds =====

  startBubbling() {
    if (this.bubblingSource || this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;

    const intervalId = window.setInterval(() => {
      if (this.muted) return;
      this.tone(200 + Math.random() * 400, 0.08, "sine", 0.06, 100 + Math.random() * 200);
    }, 180);

    this.bubblingSource = {
      stop: () => {
        window.clearInterval(intervalId);
      },
    };
  }

  stopBubbling() {
    if (this.bubblingSource) {
      this.bubblingSource.stop();
      this.bubblingSource = null;
    }
  }

  startHiss() {
    if (this.hissSource || this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5500;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.hissSource = {
      stop: () => {
        try { src.stop(); } catch { /* noop */ }
      },
    };
  }

  stopHiss() {
    if (this.hissSource) {
      this.hissSource.stop();
      this.hissSource = null;
    }
  }

  play(name: SoundName) {
    switch (name) {
      case "reaction": this.playReaction(); break;
      case "pour": this.playPour(); break;
      case "bubble": this.tone(300 + Math.random() * 300, 0.06, "sine", 0.1, 120); break;
      case "break": this.playBreak(); break;
      case "hiss": this.noiseBurst(0.2, 0.12, 5500, 1500); break;
      case "click": this.playClick(); break;
      case "success": this.playSuccess(); break;
      case "warning": this.playWarning(); break;
      case "drop": this.playDrop(); break;
      case "evaporate": this.playEvaporate(); break;
    }
  }
}

let instance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!instance) {
    instance = new SoundManager();
  }
  return instance;
}
