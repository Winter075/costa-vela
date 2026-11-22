// config.js — the tuning tables, palette and original fiction for Costa Vela.
// Everything the game names (city, people, vehicles, stations, missions) is invented here.

export const WORLD = {
  halfExtent: 360,
  blockSize: 90,
  roadWidth: 18,
  sidewalkWidth: 5,
  roadLines: [-270, -180, -90, 0, 90, 180, 270],
  laneOffset: 4.5,
  seaLevel: -1.2,
};

export const PALETTE = {
  skyTop: 0x1b3a6b,
  skyHorizon: 0xffa55b,
  sun: 0xffd8a0,
  asphalt: 0x303744,
  lane: 0xf3d47c,
  sidewalk: 0xa6a2a0,
  beach: 0xe7c88c,
  water: 0x1f6b83,
  concrete: 0xb8b3aa,
  neonPink: 0xff4f9a,
  neonBlue: 0x35d7e8,
  foliage: 0x2f8f5b,
  foliageDark: 0x1f6344,
};

// Four distinct districts, each with its own building heights, colours and street life.
export const DISTRICTS = [
  {
    id: 'beach', name: 'Mirador Beach Boulevard', short: 'BEACH',
    bounds: { minX: -360, maxX: 360, minZ: 150, maxZ: 360 },
    ground: PALETTE.beach, wall: [0xf6d8ad, 0xe8a98d, 0xa8d7cd, 0xf4e6c8],
    minFloors: 2, maxFloors: 5, sign: 'MIRADOR',
  },
  {
    id: 'downtown', name: 'Halcyon Downtown', short: 'DOWNTOWN',
    bounds: { minX: -180, maxX: 180, minZ: -135, maxZ: 135 },
    ground: 0x777b80, wall: [0x3f5c72, 0x546879, 0x6d7b86, 0x2f475e],
    minFloors: 6, maxFloors: 15, sign: 'HALCYON',
  },
  {
    id: 'harbour', name: 'Tern Harbour', short: 'HARBOUR',
    bounds: { minX: 135, maxX: 360, minZ: -270, maxZ: 135 },
    ground: 0x6d797c, wall: [0xb5643f, 0xd29a54, 0x5f8b8a, 0x9a6f4b],
    minFloors: 2, maxFloors: 6, sign: 'TERN',
  },
  {
    id: 'nightlife', name: 'Velvet Nightlife Strip', short: 'VELVET',
    bounds: { minX: -360, maxX: -135, minZ: -270, maxZ: 150 },
    ground: 0x56505b, wall: [0x5b3860, 0x39426b, 0x74425a, 0x334f58],
    minFloors: 3, maxFloors: 8, sign: 'VELVET',
  },
];

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    const b = d.bounds;
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return d;
  }
  return DISTRICTS[0];
}

// Fourteen distinguishable civilian and emergency vehicle variants.
export const VEHICLE_MODELS = [
  { id: 'solamar', name: 'Solamar GT', kind: 'sports', color: 0xf25c46, accent: 0x2b323c, topSpeed: 42, grip: 0.94 },
  { id: 'vesper', name: 'Vesper Sedan', kind: 'sedan', color: 0x3d6e9c, accent: 0xd9dee4, topSpeed: 32, grip: 0.88 },
  { id: 'cobalt', name: 'Cobalt Coupe', kind: 'coupe', color: 0x2f9fb5, accent: 0xe9f4f5, topSpeed: 36, grip: 0.91 },
  { id: 'marigold', name: 'Marigold Cab', kind: 'sedan', color: 0xe8b93c, accent: 0x22252b, topSpeed: 30, grip: 0.86 },
  { id: 'dune', name: 'Dune Runner', kind: 'offroad', color: 0xc58a4a, accent: 0x40352d, topSpeed: 29, grip: 0.9 },
  { id: 'haul', name: 'Harbour Hauler', kind: 'truck', color: 0xd7d3c8, accent: 0x4d6b73, topSpeed: 26, grip: 0.78 },
  { id: 'nightjar', name: 'Nightjar Van', kind: 'van', color: 0x6b4a86, accent: 0xe46bb0, topSpeed: 27, grip: 0.82 },
  { id: 'jade', name: 'Jade Compact', kind: 'compact', color: 0x4fa77a, accent: 0xf0f3e9, topSpeed: 28, grip: 0.89 },
  { id: 'coral', name: 'Coral Cruiser', kind: 'convertible', color: 0xef7fa2, accent: 0xf6e7c8, topSpeed: 34, grip: 0.9 },
  { id: 'slate', name: 'Slate Utility', kind: 'suv', color: 0x59606b, accent: 0xc7ccd1, topSpeed: 31, grip: 0.87 },
  { id: 'ember', name: 'Ember Racer', kind: 'sports', color: 0xff542f, accent: 0x1d1f24, topSpeed: 44, grip: 0.96 },
  { id: 'paleblue', name: 'Pale Blue Comet', kind: 'coupe', color: 0x9edbe3, accent: 0x2c5a6b, topSpeed: 38, grip: 0.93 },
  { id: 'bluebird', name: 'Bluebird Cruiser', kind: 'police', color: 0xe8edf2, accent: 0x2456a6, topSpeed: 38, grip: 0.92, police: true },
  { id: 'ram', name: 'Tern RAM Plow', kind: 'ram', color: 0x26313f, accent: 0xffb43c, topSpeed: 40, grip: 0.86, police: true },
  { id: 'bearcat', name: 'SWAT Bearcat', kind: 'swat', color: 0x38414a, accent: 0xd94c4c, topSpeed: 36, grip: 0.89, police: true },
];

export function vehicleModel(id) {
  return VEHICLE_MODELS.find((m) => m.id === id) ?? VEHICLE_MODELS[0];
}

// Six weapon slots. Names are original; nothing is borrowed from another game.
export const WEAPONS = [
  { id: 'gull', name: 'Gull 9mm', slot: '1', ammo: 90, damage: 18, range: 95, rate: 0.14, color: 0xf6d47a },
  { id: 'breakwater', name: 'Breakwater Shotgun', slot: '2', ammo: 32, damage: 38, range: 55, rate: 0.55, color: 0xff8f5c },
  { id: 'ferry', name: 'Ferry Lane SMG', slot: '3', ammo: 140, damage: 13, range: 80, rate: 0.08, color: 0x7de3dc },
  { id: 'lighthouse', name: 'Lighthouse Rifle', slot: '4', ammo: 70, damage: 32, range: 170, rate: 0.24, color: 0xc7b2ff },
  { id: 'fiesta', name: 'Fiesta Launcher', slot: '5', ammo: 8, damage: 95, range: 120, rate: 1.1, color: 0xff6b6b },
  { id: 'flare', name: 'Signal Flare', slot: '6', ammo: 24, damage: 22, range: 110, rate: 0.4, color: 0xffe08a },
];

export const CREW = [
  { name: 'Mira Solano', role: 'Fixer', color: '#ffb35c', initials: 'MS' },
  { name: 'Rook Delgado', role: 'Wheelman', color: '#55d7e5', initials: 'RD' },
  { name: 'Sable Quinn', role: 'Tech', color: '#ff77ad', initials: 'SQ' },
  { name: 'Bex Aranda', role: 'Muscle', color: '#b4e07a', initials: 'BA' },
];

export const RESPECT_RANKS = [
  { name: 'Fresh Tide', at: 0, bonus: 0 },
  { name: 'Boardwalk Regular', at: 100, bonus: 250 },
  { name: 'Harbour Insider', at: 300, bonus: 750 },
  { name: 'Neon Familiar', at: 650, bonus: 1500 },
  { name: 'Costa Vela Legend', at: 1200, bonus: 4000 },
];

export function rankForRespect(respect) {
  let rank = RESPECT_RANKS[0];
  for (const r of RESPECT_RANKS) if (respect >= r.at) rank = r;
  return rank;
}

// Eight short missions with an unbroken objective chain.
export const MISSION_CHAIN = [
  {
    title: 'Sunrise Handshake', character: 'Mira Solano', type: 'drive',
    target: { x: -160, z: 190 },
    lines: ['Mira: The tide is up and my contact is waiting on Mirador.', 'Mira: Bring the car. We do not keep people waiting in this city.'],
    stage: 'Reach the boulevard meeting point', next: 'Meet Mira by the palms', reward: 450, respect: 40,
  },
  {
    title: 'Harbour Manifest', character: 'Bex Aranda', type: 'steal',
    target: { x: 215, z: -45 },
    lines: ['Bex: A Nightjar van is sitting by the Tern containers.', 'Bex: Lift it and we can move the manifest without questions.'],
    stage: 'Reach the harbour loading yard', next: 'Steal any parked vehicle', reward: 700, respect: 70,
  },
  {
    title: 'Neon Calling Card', character: 'Sable Quinn', type: 'drive',
    target: { x: -225, z: -60 },
    lines: ['Sable: Velvet Strip knows the name before we say it.', 'Sable: Take the long way. Let the neon do the talking.'],
    stage: 'Cruise the Velvet Strip', next: 'Arrive at the club row', reward: 850, respect: 90,
  },
  {
    title: 'Rooftop Exchange', character: 'Rook Delgado', type: 'drive',
    target: { x: 55, z: 55 },
    lines: ['Rook: Downtown rooftop, four flights up, no elevator.', 'Rook: Park close. If the engine stalls we are walking.'],
    stage: 'Cross town to Halcyon', next: 'Meet the contact downtown', reward: 1100, respect: 130,
  },
  {
    title: 'Causeway Sprint', character: 'Rook Delgado', type: 'race',
    target: { x: 180, z: 180 },
    lines: ['Rook: Street race, south causeway. Winner takes the purse.', 'Rook: Stay on the glow line and do not look back.'],
    stage: 'Street race: three checkpoint gates', next: 'Beat the rival to the finish', reward: 1600, respect: 210,
  },
  {
    title: 'Pier Pressure', character: 'Mira Solano', type: 'heat',
    target: { x: 0, z: 270 },
    lines: ['Mira: You lit up every scanner in Costa Vela.', 'Mira: Lose the heat and come to the pier. Three stars will do.'],
    stage: 'Escape a three-star pursuit', next: 'Reach the pier with heat', reward: 1900, respect: 260,
  },
  {
    title: 'Cross-Town Run', character: 'Sable Quinn', type: 'drive',
    target: { x: -270, z: -180 },
    lines: ['Sable: Package collected. The whole city is watching now.', 'Sable: Get it to the north safehouse in one piece.'],
    stage: 'Deliver the package north', next: 'Reach the safehouse', reward: 2300, respect: 320,
  },
  {
    title: 'Last Light Vendetta', character: 'Mira Solano', type: 'finale',
    target: { x: 90, z: -90 },
    lines: ['Mira: Every unit they have is rolling. Five stars, no excuses.', 'Mira: Hold the intersection. Make them remember this sunset.'],
    stage: 'Five-star finale at the exchange', next: 'Survive the roadblock and finish the run', reward: 5000, respect: 700,
  },
];

export const STREET_RACE_GATES = [
  { x: 180, z: 180, radius: 18 },
  { x: -90, z: 180, radius: 18 },
  { x: -270, z: 90, radius: 18 },
];

export const RADIO_STATIONS = [
  { name: 'Costa FM 99.4', track: 'Sunset on the Causeway', tint: '#ffb35c' },
  { name: 'Tern Harbour Radio', track: 'Container Yard Blues', tint: '#57d6e4' },
  { name: 'Velvet 102.1', track: 'Neon After Midnight', tint: '#ff77ad' },
];

export const POLICE_UNIT_NAMES = {
  cruiser: 'Bluebird Cruiser',
  ram: 'Tern RAM Plow',
  roadblock: 'Barrier Detail',
  helicopter: 'Aero Patrol',
  swat: 'SWAT Bearcat',
};

export function unitsForWanted(level) {
  const units = [{ kind: 'cruiser', count: Math.min(1 + level, 4), status: 'PURSUIT' }];
  if (level >= 2) units.push({ kind: 'ram', count: 1, status: 'RAMMING' });
  if (level >= 3) units.push({ kind: 'roadblock', count: 1, status: 'ROADBLOCK' });
  if (level >= 4) units.push({ kind: 'helicopter', count: 1, status: 'SPOTLIGHT' });
  if (level >= 5) units.push({ kind: 'swat', count: 2, status: 'FIRING' });
  return units;
}
