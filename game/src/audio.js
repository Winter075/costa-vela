// Costa Vela procedural WebAudio: engine note, police siren, shots, impacts and a radio loop.
import { RADIO_STATIONS } from './config.js';

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.engine = null;
    this.engineGain = null;
    this.siren = null;
    this.sirenGain = null;
    this.radioGain = null;
    this.radioTimer = 0;
    this.radioStep = 0;
    this.station = 0;
    this.muted = false;
  }

  // Browsers require a gesture before audio starts; the start screen provides it.
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const master = this.ctx.createGain();
    master.gain.value = 0.35;
    master.connect(this.ctx.destination);
    this.master = master;

    this.engine = this.ctx.createOscillator();
    this.engine.type = 'sawtooth';
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 700;
    this.engine.connect(engineFilter).connect(this.engineGain).connect(master);
    this.engine.start();

    this.siren = this.ctx.createOscillator();
    this.siren.type = 'square';
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.siren.connect(this.sirenGain).connect(master);
    this.siren.start();

    this.radioGain = this.ctx.createGain();
    this.radioGain.gain.value = 0.12;
    this.radioGain.connect(master);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.35;
  }

  updateEngine(speed, inCar, dt) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const target = inCar ? 0.05 + Math.min(0.16, speed / 500) : 0;
    this.engineGain.gain.setTargetAtTime(target, now, 0.15);
    this.engine.frequency.setTargetAtTime(55 + Math.abs(speed) * 2.6, now, 0.1);
  }

  updateSiren(active, dt) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sirenGain.gain.setTargetAtTime(active ? 0.07 : 0, now, 0.2);
    if (active) {
      this.siren.frequency.setTargetAtTime(680 + Math.sin(now * 7) * 220, now, 0.04);
    }
  }

  setStation(index) {
    this.station = ((index % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    this.radioStep = 0;
  }

  currentTrack() {
    const st = RADIO_STATIONS[this.station];
    return { station: st.name, track: st.tracks[this.radioStep % st.tracks.length] };
  }

  updateRadio(dt, playing) {
    if (!this.ctx || !playing) return;
    this.radioTimer -= dt;
    if (this.radioTimer > 0) return;
    this.radioTimer = 0.45;
    const scale = [261.6, 329.6, 392, 523.3, 392, 329.6][this.radioStep % 6];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = scale;
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.10, this.ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    osc.connect(gain).connect(this.radioGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.42);
    this.radioStep++;
  }

  playShot() {
    if (!this.ctx) return;
    const dur = 0.12;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.30;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
  }

  playImpact() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.28);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playUi() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
}
