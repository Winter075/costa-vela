// A tiny seeded generator. The city and its traffic settle into the same
// arrangement on every load, which keeps the four capture setups repeatable.
let state = 0x51ed270b >>> 0;

export function roll() {
  state = (state + 0x9e3779b9) >>> 0;
  let value = state;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

export function between(low, high) {
  return low + (high - low) * roll();
}

export function pick(items) {
  return items[Math.floor(roll() * items.length) % items.length];
}

export function reseed(value = 0x51ed270b) {
  state = value >>> 0;
}
