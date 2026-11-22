// Procedural sound: engine note, siren, gunfire and a small radio loop. No audio files.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
    this.siren = null;
    this.sirenGain = null;
    this.radioGain = null;
    this.note = 0;
    this.radioOn = false;
  }

  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.28;
    this.master.connect(this.ctx.destination);

    this.engine = this.ctx.createOscillator();
    this.engine.type = 'sawtooth';
    this.engine.frequency.value = 60;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    this.engine.connect(filter).connect(this.engineGain).connect(this.master);
    this.engine.start();

    this.siren = this.ctx.createOscillator();
    this.siren.type = 'triangle';
    this.siren.frequency.value = 680;
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.siren.connect(this.sirenGain).connect(this.master);
    this.siren.start();

    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.value = 0.05;
    this.radioGain.connect(this.master);
  }

  setEngine(kmh, inCar) {
    if (!this.ctx) return;
    this.engine.frequency.setTargetAtTime(52 + kmh * 1.5, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(inCar ? 0.1 + Math.min(0.16, kmh / 900) : 0.02, this.ctx.currentTime, 0.1);
  }

  setSiren(level) {
    if (!this.ctx) return;
    this.sirenGain.gain.setTargetAtTime(level > 0 ? 0.035 : 0, this.ctx.currentTime, 0.3);
  }

  shot() {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * 0.12);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = 0.22;
    src.connect(g).connect(this.master);
    src.start();
  }

  updateRadio(dt, on) {
    if (!this.ctx || !on) return;
    this.note += dt;
    if (this.note < 0.32) return;
    this.note = 0;
    const scale = [220, 277, 330, 370, 330, 277, 247, 220];
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = scale[Math.floor(Math.random() * scale.length)];
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
    o.connect(g).connect(this.radioGain);
    o.start();
    o.stop(this.ctx.currentTime + 0.32);
  }
}
