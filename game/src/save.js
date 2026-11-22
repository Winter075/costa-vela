// save.js — localStorage progression: respect, cash, upgrades, mission index and radio.

const SAVE_KEY = 'costa-vela-save-v1';

export class SaveGame {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  defaults() {
    return {
      cash: 1200,
      respect: 0,
      missionIndex: 0,
      ownedVehicle: 'solamar',
      upgrades: { engine: 0, armor: 0, brakes: 0 },
      radioIndex: 0,
      wins: 0,
      savedAt: new Date().toISOString(),
    };
  }

  hasSave() {
    try { return Boolean(this.storage?.getItem(SAVE_KEY)); } catch { return false; }
  }

  read() {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return this.defaults();
      const parsed = JSON.parse(raw);
      return { ...this.defaults(), ...parsed, upgrades: { ...this.defaults().upgrades, ...(parsed.upgrades ?? {}) } };
    } catch {
      return this.defaults();
    }
  }

  write(state) {
    const payload = { ...state, savedAt: new Date().toISOString() };
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(payload)); } catch { /* private mode */ }
    return payload;
  }

  clear() {
    try { this.storage?.removeItem(SAVE_KEY); } catch { /* private mode */ }
  }
}
