// Local storage saves, respect ranks and garage upgrades.

import { RANKS } from './config.js';

const KEY = 'costa-vela-save-v1';

export function rankFor(respect) {
  let name = RANKS[0].name;
  for (const r of RANKS) if (respect >= r.at) name = r.name;
  return name;
}

export function nextRank(respect) {
  return RANKS.find((r) => r.at > respect) || null;
}

export function blankSave() {
  return { mission: 0, cash: 1250, respect: 0, weapon: 0, upgrades: { engine: 0, armour: 0, brakes: 0 }, owned: 6, radio: 0 };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { ...blankSave(), ...data, upgrades: { ...blankSave().upgrades, ...(data.upgrades || {}) } };
  } catch (e) {
    return null;
  }
}

export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
  catch (e) { return false; }
}

export function upgradeCost(level, base) {
  return Math.round(base * (1 + level * 0.65));
}
