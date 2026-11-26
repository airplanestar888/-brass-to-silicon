// Procedural Web Audio API synthesizer for authentic hardware feedback
// Zero external asset files required.

type HumMode = 'none' | 'motor' | 'tube' | 'crt';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private humMode: HumMode = 'none';

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopHum();
    }
  }

  public isEnabled() {
    return this.enabled;
  }

  public stopHum() {
    try {
      if (this.humGain && this.ctx) {
        this.humGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      }
      if (this.humOsc) {
        const osc = this.humOsc;
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // ignore cleanup errors
          }
        }, 120);
      }
    } catch {
      // ignore
    }
    this.humOsc = null;
    this.humGain = null;
    this.humMode = 'none';
  }

  public setHum(mode: HumMode, intensity = 1) {
    if (!this.enabled || mode === 'none' || intensity <= 0.02) {
      if (this.humMode !== 'none') this.stopHum();
      return;
    }
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const targetFreq = mode === 'motor' ? 68 : mode === 'tube' ? 60 : 120;
    const targetGain =
      (mode === 'motor' ? 0.025 : mode === 'tube' ? 0.032 : 0.012) * Math.min(1, intensity);

    if (this.humMode === mode && this.humOsc && this.humGain) {
      this.humGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.08);
      return;
    }

    this.stopHum();
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = mode === 'tube' ? 'sawtooth' : 'triangle';
      osc.frequency.value = targetFreq;

      filter.type = 'lowpass';
      filter.frequency.value = mode === 'tube' ? 170 : 210;

      gain.gain.value = 0;
      gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.humOsc = osc;
      this.humGain = gain;
      this.humMode = mode;
    } catch {
      // ignore
    }
  }

  public playCrankClick(pitch = 1) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.035);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playCarryThunk() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playJamClank() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [190, 277, 415].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.16);
      gain.gain.setValueAtTime(0.08 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  public playKnifeSwitch() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.055);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playRelayClack(offset = 0) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1150 + offset * 90, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);

    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    filter.Q.value = 1.6;

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playToggleClick(high = true) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(high ? 920 : 640, now);
    osc.frequency.exponentialRampToValueAtTime(high ? 460 : 310, now + 0.018);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.025);
  }

  public playTubePop() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.11);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPostBeep() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1046.5, now); // crisp C6 POST beep
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.08, now + 0.11);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playClockTick() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.015);
  }

  public playGpuFlash() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.012);
      gain.gain.setValueAtTime(0.05, now + idx * 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.012 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.012);
      osc.stop(now + idx * 0.012 + 0.17);
    });
  }
}

export const soundEngine = new SoundEngine();
