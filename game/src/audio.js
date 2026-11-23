// audio.js — small WebAudio synth: engine, siren, gunfire, explosions and a radio motif.
// Every sound is generated at runtime, so the game ships with no audio files.

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
    const AudioEngine = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioEngine) return;

    this.context = new AudioEngine();
    const master = this.context.createGain();
    master.gain.value = 0.22;
    master.connect(this.context.destination);
    this.master = master;

    this.engineOsc = this.context.createOscillator();
    this.engineOsc.type = 'sawtooth';
    const engineFilter = this.context.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 620;
    this.engineGain = this.context.createGain();
    this.engineGain.gain.value = 0;
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
    const now = this.context.currentTime;
    const volume = this.muted || !inVehicle ? 0 : 0.035 + Math.min(speed / 60, 1) * 0.075;
    this.engineGain.gain.setTargetAtTime(volume, now, 0.12);
    this.engineOsc.frequency.setTargetAtTime(58 + Math.min(speed, 60) * 5.4, now, 0.09);
  }

  setSiren(level) {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.sirenGain.gain.setTargetAtTime(this.muted ? 0 : Math.min(level, 5) * 0.012, now, 0.3);
    this.sirenOsc.frequency.setTargetAtTime(520 + Math.sin(now * 4.2) * 180 + level * 18, now, 0.08);
  }

  shot(weight = 1) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const frames = Math.floor(this.context.sampleRate * 0.13);
    const buffer = this.context.createBuffer(1, frames, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.value = Math.min(weight, 3) * 0.5;
    source.connect(gain).connect(this.master);
    source.start(now);
  }

  explosion() {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const rumble = this.context.createOscillator();
    const gain = this.context.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(120, now);
    rumble.frequency.exponentialRampToValueAtTime(32, now + 0.7);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    rumble.connect(gain).connect(this.master);
    rumble.start(now);
    rumble.stop(now + 0.8);
  }

  setStation(index) {
    this.station = index % 3;
  }

  updateRadio(dt) {
    if (!this.context || this.muted) return;
    this.radioTimer -= dt;
    if (this.radioTimer > 0) return;
    this.radioTimer = 0.32;

    const melodies = [
      [220, 277, 330, 415, 330, 277],
      [196, 247, 294, 392, 294, 247],
      [261, 329, 392, 523, 392, 329],
    ];
    const notes = melodies[this.station];
    const note = notes[this.radioStep % notes.length];
    this.radioStep++;

    const now = this.context.currentTime;
    const tone = this.context.createOscillator();
    const gain = this.context.createGain();
    tone.type = 'triangle';
    tone.frequency.value = note;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    tone.connect(gain).connect(this.master);
    tone.start(now);
    tone.stop(now + 0.32);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.context) this.master.gain.value = this.muted ? 0 : 0.22;
    return this.muted;
  }
}
