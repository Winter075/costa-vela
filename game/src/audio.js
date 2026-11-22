// audio.js — procedural WebAudio: engine hum, police siren, gunfire and a tiny radio motif.

export class ProceduralAudio {
  constructor() {
    this.context = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.radioTimer = 0;
    this.radioStep = 0;
    this.station = 0;
  }

  start() {
    if (this.context) {
      this.context.resume?.();
      return;
    }
    const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Ctx) return;
    this.context = new Ctx();
    const master = this.context.createGain();
    master.gain.value = 0.22;
    master.connect(this.context.destination);
    this.master = master;

    this.engineOsc = this.context.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineGain = this.context.createGain();
    this.engineGain.gain.value = 0;
    const engineFilter = this.context.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 620;
    this.engineOsc.connect(engineFilter).connect(this.engineGain).connect(master);
    this.engineOsc.start();

    this.sirenOsc = this.context.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenGain = this.context.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc.connect(this.sirenGain).connect(master);
    this.sirenOsc.start();
  }

  setEngine(speed, inVehicle) {
    if (!this.context) return;
    const t = this.context.currentTime;
    const target = this.muted || !inVehicle ? 0 : 0.035 + Math.min(speed / 60, 1) * 0.075;
    this.engineGain.gain.setTargetAtTime(target, t, 0.12);
    this.engineOsc.frequency.setTargetAtTime(58 + Math.min(speed, 60) * 5.4, t, 0.09);
  }

  setSiren(level) {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.sirenGain.gain.setTargetAtTime(this.muted ? 0 : Math.min(level, 5) * 0.012, t, 0.3);
    this.sirenOsc.frequency.setTargetAtTime(520 + Math.sin(t * 4.2) * 180 + level * 18, t, 0.08);
  }

  shot(weight = 1) {
    if (!this.context || this.muted) return;
    const t = this.context.currentTime;
    const buffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.13), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.value = Math.min(weight, 3) * 0.5;
    src.connect(gain).connect(this.master);
    src.start(t);
  }

  explosion() {
    if (!this.context || this.muted) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.7);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  setStation(index) { this.station = index % 3; }

  updateRadio(dt) {
    if (!this.context || this.muted) return;
    this.radioTimer -= dt;
    if (this.radioTimer > 0) return;
    this.radioTimer = 0.32;
    const scales = [
      [220, 277, 330, 415, 330, 277],
      [196, 247, 294, 392, 294, 247],
      [261, 329, 392, 523, 392, 329],
    ][this.station];
    const note = scales[this.radioStep % scales.length];
    this.radioStep++;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.045, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.context) this.master.gain.value = this.muted ? 0 : 0.22;
    return this.muted;
  }
}
