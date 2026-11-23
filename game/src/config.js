// config.js — the names, numbers and dialogue Costa Vela invents for itself.
// The city, crew, cars, stations and jobs are original to this game.

export const WORLD = {
  halfExtent: 360,
  blockSize: 90,
  roadWidth: 18,
  sidewalkWidth: 5,
  roadLines: [-270, -180, -90, 0, 90, 180, 270],
  laneOffset: 4.5,
  seaLevel: -1.2,
};

// Fixed limits keep the frame budget visible instead of hiding magic numbers.
export const PERFORMANCE = {
  maxPixelRatio: 1.5,
  maxFrameStep: 0.05,
  maxParkedCars: 60,
  maxMinimapBlips: 18,
  windowStride: 1,
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

// Four quarters, each with its own ground, height band and sign colours.
export const DISTRICTS = [
  {
    id: 'beach', name: 'Mirador Beach Boulevard', short: 'BEACH',
    bounds: { minX: -360, maxX: 360, minZ: 150, maxZ: 360 },
    ground: PALETTE.beach,
    wall: [0xf6d8ad, 0xe8a98d, 0xa8d7cd, 0xf4e6c8],
    minFloors: 2, maxFloors: 5, sign: 'MIRADOR',
  },
  {
    id: 'downtown', name: 'Halcyon Downtown', short: 'DOWNTOWN',
    bounds: { minX: -180, maxX: 180, minZ: -135, maxZ: 135 },
    ground: 0x777b80,
    wall: [0x3f5c72, 0x546879, 0x6d7b86, 0x2f475e],
    minFloors: 6, maxFloors: 15, sign: 'HALCYON',
  },
  {
    id: 'harbour', name: 'Tern Harbour', short: 'HARBOUR',
    bounds: { minX: 135, maxX: 360, minZ: -270, maxZ: 135 },
    ground: 0x6d797c,
    wall: [0xb5643f, 0xd29a54, 0x5f8b8a, 0x9a6f4b],
    minFloors: 2, maxFloors: 6, sign: 'TERN',
  },
  {
    id: 'nightlife', name: 'Velvet Nightlife Strip', short: 'VELVET',
    bounds: { minX: -360, maxX: -135, minZ: -270, maxZ: 150 },
    ground: 0x56505b,
    wall: [0x5b3860, 0x39426b, 0x74425a, 0x334f58],
    minFloors: 3, maxFloors: 8, sign: 'VELVET',
  },
];

export function districtAt(x, z) {
  return DISTRICTS.find((district) => {
    const b = district.bounds;
    return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  }) || DISTRICTS[0];
}

function ride(id, name, kind, color, accent, topSpeed, grip, police = false) {
  return { id, name, kind, color, accent, topSpeed, grip, police };
}

// Twelve street cars with distinct shapes, then three emergency variants.
export const VEHICLE_MODELS = [
  ride('solamar', 'Solamar GT', 'sports', 0xf25c46, 0x2b323c, 42, 0.94),
  ride('vesper', 'Vesper Sedan', 'sedan', 0x3d6e9c, 0xd9dee4, 32, 0.88),
  ride('cobalt', 'Cobalt Coupe', 'coupe', 0x2f9fb5, 0xe9f4f5, 36, 0.91),
  ride('marigold', 'Marigold Cab', 'sedan', 0xe8b93c, 0x22252b, 30, 0.86),
  ride('dune', 'Dune Runner', 'offroad', 0xc58a4a, 0x40352d, 29, 0.9),
  ride('haul', 'Harbour Hauler', 'truck', 0xd7d3c8, 0x4d6b73, 26, 0.78),
  ride('nightjar', 'Nightjar Van', 'van', 0x6b4a86, 0xe46bb0, 27, 0.82),
  ride('jade', 'Jade Compact', 'compact', 0x4fa77a, 0xf0f3e9, 28, 0.89),
  ride('coral', 'Coral Cruiser', 'convertible', 0xef7fa2, 0xf6e7c8, 34, 0.9),
  ride('slate', 'Slate Utility', 'suv', 0x59606b, 0xc7ccd1, 31, 0.87),
  ride('ember', 'Ember Racer', 'sports', 0xff542f, 0x1d1f24, 44, 0.96),
  ride('paleblue', 'Pale Blue Comet', 'coupe', 0x9edbe3, 0x2c5a6b, 38, 0.93),
  ride('bluebird', 'Bluebird Cruiser', 'police', 0xe8edf2, 0x2456a6, 38, 0.92, true),
  ride('ram', 'Tern RAM Plow', 'ram', 0x26313f, 0xffb43c, 40, 0.86, true),
  ride('bearcat', 'SWAT Bearcat', 'swat', 0x38414a, 0xd94c4c, 36, 0.89, true),
];

export function vehicleModel(id) {
  return VEHICLE_MODELS.find((model) => model.id === id) || VEHICLE_MODELS[0];
}

// Six weapon slots. Names and stats were made up for this game.
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

// One active perk per crew card, with a key, a cooldown and a short HUD label.
export const CREW_ABILITIES = [
  { name: 'Cool the Heat', owner: 'Mira Solano', key: 'Z', cooldown: 24, detail: 'Drops one wanted star', effect: 'heat' },
  { name: 'Rook Boost', owner: 'Rook Delgado', key: 'X', cooldown: 18, detail: 'Surge in any car', effect: 'speed' },
  { name: 'Signal Jam', owner: 'Sable Quinn', key: 'C', cooldown: 30, detail: 'Cools the pursuit', effect: 'jam' },
  { name: 'Plate Armour', owner: 'Bex Aranda', key: 'V', cooldown: 35, detail: 'Repairs the car', effect: 'armor' },
];

export const DISTRICT_STANDING = {
  beach: 'Sunburned',
  downtown: 'Tower Regular',
  harbour: 'Dockside Name',
  nightlife: 'Velvet Regular',
};

export const DISTRICT_STANDING_START = { beach: 0, downtown: 0, harbour: 0, nightlife: 0 };

export function standingTitle(value) {
  if (value >= 400) return 'CONTROLLED';
  if (value >= 180) return 'RESPECTED';
  if (value >= 60) return 'KNOWN';
  return 'UNKNOWN';
}

export const RESPECT_RANKS = [
  { name: 'Fresh Tide', at: 0, bonus: 0 },
  { name: 'Boardwalk Regular', at: 100, bonus: 250 },
  { name: 'Harbour Insider', at: 300, bonus: 750 },
  { name: 'Neon Familiar', at: 650, bonus: 1500 },
  { name: 'Costa Vela Legend', at: 1200, bonus: 4000 },
];

export function rankForRespect(respect) {
  let current = RESPECT_RANKS[0];
  for (const rank of RESPECT_RANKS) if (respect >= rank.at) current = rank;
  return current;
}

// Eight jobs in a fixed order, each with a speaker, a target and a next step.
export const MISSION_CHAIN = [
  {
    title: 'Sunrise Handshake', character: 'Mira Solano', type: 'drive',
    target: { x: -160, z: 190 },
    lines: ['Mira: Tide is high and my contact waits along Mirador.', 'Mira: Take the car. Nobody keeps Mira waiting.'],
    stage: 'Reach the boulevard meeting point', next: 'Meet Mira by the palms', reward: 450, respect: 40,
  },
  {
    title: 'Harbour Manifest', character: 'Bex Aranda', type: 'steal',
    target: { x: 215, z: -45 },
    lines: ['Bex: A Nightjar van sits by the Tern containers.', 'Bex: Lift it and the manifest moves without questions.'],
    stage: 'Reach the harbour loading yard', next: 'Steal any parked vehicle', reward: 700, respect: 70,
  },
  {
    title: 'Neon Calling Card', character: 'Sable Quinn', type: 'drive',
    target: { x: -225, z: -60 },
    lines: ['Sable: Velvet Strip should hear the name before we say it.', 'Sable: Take the long way and let the neon work.'],
    stage: 'Cruise the Velvet Strip', next: 'Arrive at the club row', reward: 850, respect: 90,
  },
  {
    title: 'Rooftop Exchange', character: 'Rook Delgado', type: 'drive',
    target: { x: 55, z: 55 },
    lines: ['Rook: Downtown rooftop, four flights, and no elevator.', 'Rook: Park close. If the engine quits, we are walking.'],
    stage: 'Cross town to Halcyon', next: 'Meet the contact downtown', reward: 1100, respect: 130,
  },
  {
    title: 'Causeway Sprint', character: 'Rook Delgado', type: 'race',
    target: { x: 180, z: 180 },
    lines: ['Rook: Street race on the south causeway. Winner takes the purse.', 'Rook: Follow the glow line and do not look back.'],
    stage: 'Street race: three checkpoint gates', next: 'Beat the rival to the finish', reward: 1600, respect: 210,
  },
  {
    title: 'Pier Pressure', character: 'Mira Solano', type: 'heat',
    target: { x: 0, z: 270 },
    lines: ['Mira: You lit every scanner in Costa Vela.', 'Mira: Shake them, then come to the pier. Three stars will do.'],
    stage: 'Escape a three-star pursuit', next: 'Reach the pier with heat', reward: 1900, respect: 260,
  },
  {
    title: 'Cross-Town Run', character: 'Sable Quinn', type: 'drive',
    target: { x: -270, z: -180 },
    lines: ['Sable: The package is ours and the whole city is watching.', 'Sable: Get it north in one piece.'],
    stage: 'Deliver the package north', next: 'Reach the safehouse', reward: 2300, respect: 320,
  },
  {
    title: 'Last Light Vendetta', character: 'Mira Solano', type: 'finale',
    target: { x: 90, z: -90 },
    lines: ['Mira: Every unit they own is rolling. Five stars, no excuses.', 'Mira: Hold the crossing. Make them remember this sunset.'],
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
  const roster = [{ kind: 'cruiser', count: Math.min(1 + level, 4), status: 'PURSUIT' }];
  if (level >= 2) roster.push({ kind: 'ram', count: 1, status: 'RAMMING' });
  if (level >= 3) roster.push({ kind: 'roadblock', count: 1, status: 'ROADBLOCK' });
  if (level >= 4) roster.push({ kind: 'helicopter', count: 1, status: 'SPOTLIGHT' });
  if (level >= 5) roster.push({ kind: 'swat', count: 2, status: 'FIRING' });
  return roster;
}
