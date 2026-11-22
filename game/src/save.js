// Costa Vela progression saved to localStorage: cash, respect, garage and mission progress.
import { RANKS } from './config.js';

const KEY = 'costa-vela-save-v1';

export function freshProgress() {
  return {
    cash: 1250,
    respect: 0,
    missionIndex: 0,
    ownedVehicles: [0, 1],
    upgrades: { engine: 0, armour: 0, brakes: 0 },
    radioStation: 0,
    lastPlayed: Date.now(),
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.cash !== 'number') return null;
    return { ...freshProgress(), ...data };
  } catch {
    return null;
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...progress, lastPlayed: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* storage may be disabled */ }
}

export function rankFor(respect) {
  let result = RANKS[0];
  for (const rank of RANKS) if (respect >= rank.min) result = rank;
  return result;
}

export function nextRank(respect) {
  return RANKS.find((rank) => rank.min > respect) ?? null;
}
