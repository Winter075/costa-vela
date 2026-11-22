// Costa Vela: every name, number and line of dialogue the game draws on.

export const CITY = {
  block: 48,
  road: 14,
  limit: 216,
  grid: [-192, -144, -96, -48, 0, 48, 96, 144, 192],
  waterLevel: -0.6,
};

export const DISTRICTS = [
  { name: 'BEACH BOULEVARD', tint: 0xd9b48a, height: 16, zone: (x, z) => z > 96 },
  { name: 'DOWNTOWN', tint: 0x9aa7b4, height: 52, zone: (x, z) => Math.abs(x) < 96 && z < 48 },
  { name: 'HARBOUR', tint: 0xb08a63, height: 20, zone: (x, z) => x < -96 && z < 48 },
  { name: 'NIGHTLIFE STRIP', tint: 0x6c5b78, height: 30, zone: (x, z) => x > 96 && z > -48 },
  { name: 'PALMA HILLS', tint: 0xc0a07a, height: 24, zone: () => true },
];

export const VEHICLES = [
  { name: 'VESPER GT', body: 0xc43a3f, accent: 0x1b1e26, top: 190, grip: 1.0 },
  { name: 'MARLIN LX', body: 0x2e6f9e, accent: 0x101820, top: 176, grip: 1.05 },
  { name: 'AZURE CAB', body: 0xd8b23c, accent: 0x202020, top: 150, grip: 0.95 },
  { name: 'CINDER 4x4', body: 0x596b3c, accent: 0x1a1a16, top: 128, grip: 1.15 },
  { name: 'NOCTURNE V8', body: 0x2a2b33, accent: 0x8d1f2b, top: 205, grip: 0.92 },
  { name: 'PALMA COUPE', body: 0x8b5e3c, accent: 0x201810, top: 168, grip: 1.02 },
  { name: 'DRIFT R30', body: 0x3aa39c, accent: 0x12282a, top: 184, grip: 0.86 },
  { name: 'HARBOUR HAUL', body: 0x7d8a94, accent: 0x2a3036, top: 116, grip: 1.2 },
  { name: 'SIERRA VAN', body: 0xd6d2c4, accent: 0x3b3b36, top: 132, grip: 1.12 },
  { name: 'SOLAR COMPACT', body: 0xe0c84b, accent: 0x333026, top: 142, grip: 1.08 },
  { name: 'RUBY ROADSTER', body: 0x9c2440, accent: 0x1d1016, top: 212, grip: 0.88 },
  { name: 'OLIVE RANGER', body: 0x6b7150, accent: 0x23251c, top: 138, grip: 1.14 },
  { name: 'COAST CRUISER', body: 0xe8e9e6, accent: 0x2b3a52, top: 158, grip: 1.0 },
  { name: 'SIDERAL VAN', body: 0x24384f, accent: 0x0d1420, top: 124, grip: 1.16 },
];

export const WEAPONS = [
  { name: 'SIDEARM', rate: 0.28, damage: 16, color: 0xffd76a },
  { name: 'BURST SMG', rate: 0.09, damage: 9, color: 0xffc266 },
  { name: 'PUMP ACTION', rate: 0.62, damage: 38, color: 0xff9d52 },
  { name: 'COAST CARBINE', rate: 0.14, damage: 13, color: 0xffb347 },
  { name: 'MARKSMAN', rate: 0.7, damage: 55, color: 0xffe08a },
  { name: 'STICKY CHARGE', rate: 0.9, damage: 70, color: 0xff7b52 },
];

export const CREW = [
  { name: 'MARA', role: 'Driver', color: '#f2c14e' },
  { name: 'TEO', role: 'Gunner', color: '#43c6bb' },
  { name: 'VEX', role: 'Fixer', color: '#b487d6' },
];

export const RESPONSE_UNITS = [
  { name: 'BLUE UNIT A', kind: 'cruiser', status: 'PURSUIT' },
  { name: 'COAST PATROL B', kind: 'cruiser', status: 'PATROL' },
  { name: 'DISTRICT CAR C', kind: 'cruiser', status: 'PATROL' },
  { name: 'SKYWATCH 1', kind: 'heli', status: 'SPOTLIGHT' },
  { name: 'PIT UNIT 12', kind: 'ram', status: 'INTERCEPT' },
  { name: 'TACTICAL BARRIER', kind: 'block', status: 'ROADBLOCK' },
  { name: 'SWAT LANCER', kind: 'swat', status: 'FIRING' },
];

export const RADIO = [
  'SUNSET FM 104.2 | Golden Hour Drive',
  'MANGO 98.6 | Afternoon Current',
  'RADIO CORAL 91.3 | Slow Tide',
];

export const RANKS = [
  { at: 0, name: 'NEW FACE' },
  { at: 400, name: 'LOCAL FIXER' },
  { at: 1200, name: 'COAST POWER' },
  { at: 2400, name: 'VELA LEGEND' },
];

export const MISSIONS = [
  {
    title: 'A RIDE ALONG THE BOULEVARD',
    task: 'Reach the boulevard drop point',
    next: 'NEXT: Collect the keys from Mara',
    who: 'MARA', line: 'Keep it smooth. The coastline looks better at speed.',
    goal: { x: 96, z: 120, radius: 16 }, stars: 0, pay: 250, respect: 60,
  },
  {
    title: 'KEYS TO THE HARBOUR',
    task: 'Meet Vex at the harbour gate',
    next: 'NEXT: Take the service van',
    who: 'VEX', line: 'The gate code changes at dusk. We go before the trucks.',
    goal: { x: -144, z: -48, radius: 16 }, stars: 0, pay: 320, respect: 80,
  },
  {
    title: 'SERVICE LANE',
    task: 'Deliver the van to the loading bay',
    next: 'NEXT: Lose the coast patrol',
    who: 'TEO', line: 'Two cruisers on the overpass. Keep your foot down.',
    goal: { x: -192, z: 48, radius: 18 }, stars: 1, pay: 400, respect: 100,
  },
  {
    title: 'THE COASTAL RUN',
    task: 'Win the street race',
    next: 'NEXT: Follow the checkpoint markers',
    who: 'TEO', line: 'Three checkpoints. Winner takes the pot.',
    goal: { x: 144, z: -96, radius: 18 }, stars: 2, pay: 900, respect: 180, race: true,
  },
  {
    title: 'NIGHT SHIFT',
    task: 'Cross the nightlife strip',
    next: 'NEXT: Lose the tail on the way',
    who: 'MARA', line: 'Headlights behind us. Lose them before we reach the strip.',
    goal: { x: 168, z: 24, radius: 18 }, stars: 4, pay: 800, respect: 200,
  },
  {
    title: 'BORROWED PLATES',
    task: 'Swap cars in the downtown alley',
    next: 'NEXT: Watch for the roadblocks',
    who: 'VEX', line: 'Any set of wheels will do. Just do not bring them home hot.',
    goal: { x: 48, z: -48, radius: 18 }, stars: 3, pay: 700, respect: 160,
  },
  {
    title: 'SHOW OF FORCE',
    task: 'Reach the safehouse under fire',
    next: 'NEXT: Watch the roadblocks',
    who: 'MARA', line: 'They closed the roads. Keep moving and mind the barricades.',
    goal: { x: -96, z: -144, radius: 20 }, stars: 5, pay: 1400, respect: 320,
  },
  {
    title: 'LAST LIGHT',
    task: 'Get out past the harbour blockade',
    next: 'NEXT: The coast is yours',
    who: 'VEX', line: 'One more turn and we are clear. Drive like you mean it.',
    goal: { x: -192, z: 144, radius: 22 }, stars: 5, pay: 2200, respect: 500,
  },
];

export const UPGRADES = [
  { key: 'engine', label: 'ENGINE', base: 900 },
  { key: 'armour', label: 'ARMOUR', base: 900 },
  { key: 'brakes', label: 'BRAKES', base: 900 },
];
