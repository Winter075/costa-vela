// Small seeded helpers so the city and its traffic are the same every run.

export function makeRandom(seed = 20261122) {
  let s = seed >>> 0;
  return function random() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function range(rng, lo, hi) {
  return lo + (hi - lo) * rng();
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}

export function tint(color, amount) {
  const r = Math.min(255, Math.max(0, ((color >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((color >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (color & 255) + amount));
  return (r << 16) | (g << 8) | b;
}
