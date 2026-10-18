class AlchemyAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.ensure();
    if (!this.master || !this.context) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(enabled ? 0.2 : 0, now, 0.05);
  }

  ensure() {
    if (this.context) {
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      return this.context;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? 0.2 : 0;
    this.master.connect(this.context.destination);
    return this.context;
  }

  tone(frequency, options = {}) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const {
      type = "sine",
      duration = 0.18,
      gain = 0.18,
      delay = 0,
      slide = null,
      attack = 0.012,
      release = 0.1,
    } = options;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);
    osc.connect(envelope);
    envelope.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + release + 0.02);
  }

  noise(options = {}) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const { duration = 0.3, gain = 0.05, delay = 0, lowpass = 1200 } = options;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    source.start(start);
  }

  click() {
    this.tone(680, { type: "square", duration: 0.035, gain: 0.035, release: 0.04 });
  }

  select() {
    this.tone(520, { type: "triangle", duration: 0.07, gain: 0.08 });
    this.tone(780, { type: "sine", duration: 0.1, gain: 0.05, delay: 0.045 });
  }

  fuse() {
    this.noise({ duration: 0.35, gain: 0.08, lowpass: 900 });
    this.tone(180, { type: "sawtooth", duration: 0.3, gain: 0.04, slide: 320 });
  }

  fail() {
    this.tone(150, { type: "triangle", duration: 0.2, gain: 0.08, slide: 86 });
    this.noise({ duration: 0.16, gain: 0.025, lowpass: 500 });
  }

  discover() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, index) => {
      this.tone(note, {
        type: "triangle",
        duration: 0.24,
        gain: 0.08,
        delay: index * 0.09,
        release: 0.3,
      });
      this.tone(note / 2, {
        type: "sine",
        duration: 0.3,
        gain: 0.04,
        delay: index * 0.09,
      });
    });
  }

  chapter() {
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, index) => {
      this.tone(note, {
        type: index === notes.length - 1 ? "sine" : "triangle",
        duration: 0.5,
        gain: 0.08,
        delay: index * 0.12,
        release: 0.5,
      });
    });
  }

  endgame() {
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, index) => {
      this.tone(note, {
        type: "sine",
        duration: 0.9,
        gain: 0.07,
        delay: index * 0.16,
        release: 0.8,
      });
    });
    this.noise({ duration: 1.2, gain: 0.03, lowpass: 800 });
  }
}

export const audio = new AlchemyAudio();
