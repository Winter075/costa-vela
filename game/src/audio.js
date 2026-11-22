// Procedural WebAudio: engine hum, police siren, gunshots and a radio bed.

export function createAudio() {
  let context = null;
  let engine = null;
  let engineGain = null;
  let siren = null;
  let sirenGain = null;
  let radio = null;
  let radioGain = null;
  let phase = 0;

  function start() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return;
    }
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    context = new AudioEngine();
    engine = context.createOscillator();
    engine.type = 'sawtooth';
    engine.frequency.value = 60;
    engineGain = context.createGain();
    engineGain.gain.value = 0;
    const lowPass = context.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 620;
    engine.connect(lowPass).connect(engineGain).connect(context.destination);
    engine.start();

    siren = context.createOscillator();
    siren.type = 'square';
    siren.frequency.value = 720;
    sirenGain = context.createGain();
    sirenGain.gain.value = 0;
    siren.connect(sirenGain).connect(context.destination);
    siren.start();

    radio = context.createOscillator();
    radio.type = 'triangle';
    radio.frequency.value = 220;
    radioGain = context.createGain();
    radioGain.gain.value = 0.012;
    radio.connect(radioGain).connect(context.destination);
    radio.start();
  }

  function tone(frequency, duration, type = 'square', volume = 0.08) {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.45), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function shot(index) {
    if (!context) return;
    const pitches = [420, 300, 180, 260, 900, 90];
    tone(pitches[index] ?? 360, index === 5 ? 0.4 : 0.12, index === 4 ? 'sine' : 'square', index === 5 ? 0.16 : 0.07);
  }

  function crash() {
    tone(110, 0.32, 'sawtooth', 0.12);
  }

  function update(speed, wanted, dt = 0.016) {
    if (!context) return;
    phase += dt;
    engineGain.gain.value = Math.min(0.08, speed * 0.0022);
    engine.frequency.value = 58 + speed * 3.4;
    sirenGain.gain.value = wanted > 0 ? 0.035 : 0;
    siren.frequency.value = 650 + Math.sin(phase * 6) * 220;
    radio.frequency.value = 200 + Math.sin(phase * 0.7) * 34;
  }

  return { start, shot, crash, update };
}
