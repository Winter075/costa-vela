// Local progression. The save is a plain JSON object in the browser's storage.
const KEY = 'costa-vela-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function writeSave(state) {
  const record = {
    cash: Math.round(state.cash),
    respect: Math.round(state.respect),
    missionIndex: state.missionIndex,
    upgrades: { ...state.upgrades },
    carId: state.car?.spec.id ?? null,
    x: Math.round(state.x),
    z: Math.round(state.z),
    savedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch (error) {
    return false;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (error) {
    return false;
  }
  return true;
}
