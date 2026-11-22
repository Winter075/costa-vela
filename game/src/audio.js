// Procedural WebAudio: engine, siren, radio and weapon reports. Nothing is
// fetched, so the game stays silent until the player starts it with a click.
export function createAudio() {
  let context = null;
  let master = null;
  let engine = null;
  let engineGain = null;
  let siren = null;
  let sirenGain = null;
  let muted = false;

  function start() {
    if (context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();

    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);

    engine = context.createOscillator();
    engine.type = 'sawtooth';
    engine.frequency.value = 60;
    const engineFilter = context.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 480;
    engineGain = context.createGain();
    engineGain.gain.value = 0.01;
    engine.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(master);
    engine.start();

    siren = context.createOscillator();
    siren.type = 'square';
    siren.frequency.value = 680;
    sirenGain = context.createGain();
    sirenGain.gain.value = 0;
    siren.connect(sirenGain);
    sirenGain.connect(master);
    siren.start();

    const radioGain = context.createGain();
    radioGain.gain.value = 0.028;
    radioGain.connect(master);
    [220, 277.18, 329.63].forEach((frequency, index) => {
      const voice = context.createOscillator();
      voice.type = index === 0 ? 'triangle' : 'sine';
      voice.frequency.value = frequency;
      const level = context.createGain();
      level.gain.value = 0.33;
      voice.connect(level);
      level.connect(radioGain);
      voice.start();
    });
  }

  function update(speed, wanted) {
    if (!context) return;
    const now = context.currentTime;
    engine.frequency.setTargetAtTime(56 + speed * 4.4, now, 0.08);
    engineGain.gain.setTargetAtTime(speed > 0.4 ? 0.045 + Math.min(speed, 45) * 0.0018 : 0.012, now, 0.12);
    if (wanted > 0) {
      siren.frequency.setTargetAtTime(620 + Math.sin(now * 5.5) * 170, now, 0.03);
      sirenGain.gain.setTargetAtTime(0.01 + wanted * 0.005, now, 0.12);
    } else {
      sirenGain.gain.setTargetAtTime(0, now, 0.25);
    }
  }

  function shot(kind) {
    if (!context) return;
    const length = kind === 'shotgun' ? 0.28 : 0.12;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * length), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'launcher' ? 400 : 1800;
    const gain = context.createGain();
    gain.gain.value = kind === 'shotgun' ? 0.32 : 0.17;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  function crash() {
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(160, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.35);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    oscillator.stop(now + 0.4);
  }

  function setMuted(value) {
    muted = value;
    if (master) master.gain.value = muted ? 0 : 0.5;
  }

  return { start, update, shot, crash, setMuted, isMuted: () => muted };
}
