// Small deterministic random helpers. A fixed seed keeps screenshot scenes reproducible.
export function makeRandom(seed = 1337) {
  let s = seed >>> 0;
  return function random() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick(random, list) {
  return list[Math.floor(random() * list.length) % list.length];
}

export function range(random, lo, hi) {
  return lo + random() * (hi - lo);
}

export function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
