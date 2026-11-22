// Deterministic helpers, so the city and its traffic look the same on every load.
let seed = 0x9e3779b9;

export function nextRandom() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomRange(a, b) {
  return a + (b - a) * nextRandom();
}

export function randomPick(list) {
  return list[Math.floor(nextRandom() * list.length) % list.length];
}

export function resetRandom(value = 0x9e3779b9) {
  seed = value >>> 0;
}
