// save.js — browser localStorage progression with a safe in-memory fallback.

const STORAGE_KEY = 'vela.progress.2';

function freshState() {
  return {
    cash: 1200,
    respect: 0,
    missionIndex: 0,
    ownedVehicle: 'solamar',
    upgrades: { engine: 0, armor: 0, brakes: 0 },
    radioIndex: 0,
    wins: 0,
    savedAt: null,
  };
}

export class SaveGame {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  defaults() { return freshState(); }

  hasSave() {
    try { return Boolean(this.storage?.getItem(STORAGE_KEY)); } catch { return false; }
  }

  read() {
    const base = freshState();
    try {
      const text = this.storage?.getItem(STORAGE_KEY);
      if (!text) return base;
      const found = JSON.parse(text);
      return {
        ...base,
        ...found,
        upgrades: { ...base.upgrades, ...(found.upgrades || {}) },
      };
    } catch {
      return base;
    }
  }

  write(state) {
    const record = { ...state, savedAt: new Date().toISOString() };
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* private browsing */ }
    return record;
  }

  clear() {
    try { this.storage?.removeItem(STORAGE_KEY); } catch { /* private browsing */ }
  }
}
