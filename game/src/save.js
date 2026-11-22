// Progression is a small JSON record in localStorage. Failures (private mode,
// disabled storage) are swallowed so the game never stops over a save.
const STORE_KEY = 'costa-vela-progress-v1';

export function readProgress() {
  try {
    const text = window.localStorage.getItem(STORE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null;
  }
}

export function storeProgress(player) {
  const record = {
    cash: Math.round(player.cash),
    respect: Math.round(player.respect),
    job: player.jobIndex,
    tuning: { ...player.parts },
    owned: { ...player.owned },
    car: player.car?.spec.id ?? null,
    x: Math.round(player.x),
    z: Math.round(player.z),
    bestRace: player.bestRace,
    savedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(record));
    return true;
  } catch (error) {
    return false;
  }
}

export function forgetProgress() {
  try {
    window.localStorage.removeItem(STORE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}
