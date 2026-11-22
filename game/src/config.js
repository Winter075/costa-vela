// Costa Vela configuration. One place for the city grid, the cast, the cars,
// the mission chain and the progression tables the other modules read.

export const CITY = {
  worldHalf: 240,
  roadStepX: 80,
  roadStepZ: 80,
  roadWidth: 18,
  shoreZ: 132,
  beachRoadZ: 80,
  shopZ: 56,
};

export const DISTRICTS = [
  { id: 'palm', name: 'Palm Boulevard', x: 0, z: 96, color: 0xf3cf94, crew: 'Sunseekers' },
  { id: 'core', name: 'Vela Downtown', x: 0, z: -32, color: 0x9fc0cd, crew: 'Suit Crowd' },
  { id: 'docks', name: 'Costa Harbour', x: 152, z: 40, color: 0xd0a46e, crew: 'Dock Union' },
  { id: 'neon', name: 'The Neon Strip', x: -152, z: -56, color: 0xc58dd0, crew: 'After Hours' },
];

export const CREW = [
  { id: 'mara', name: 'Mara Reyes', role: 'Wheel', ability: 'Hotwire', detail: 'Starts any car without a wait', color: '#ffb066' },
  { id: 'ivo', name: 'Ivo Cardenas', role: 'Muscle', ability: 'Intimidate', detail: 'Peds clear the street faster', color: '#8fd0ff' },
  { id: 'sol', name: 'DJ Sol', role: 'Eyes', ability: 'Scan', detail: 'Reveals dispatch on the minimap', color: '#d6a2ff' },
];

export const VEHICLES = [
  { id: 'velagt', name: 'Vela GT', type: 'sport', body: 0xe0563f, trim: 0x242a33, top: 42, grip: 0.94 },
  { id: 'solano', name: 'Solano Coupe', type: 'coupe', body: 0xd9dde2, trim: 0x303841, top: 38, grip: 0.9 },
  { id: 'palma', name: 'Palma cruiser', type: 'sedan', body: 0x3f6ea8, trim: 0xe8e3d4, top: 32, grip: 0.86 },
  { id: 'cayo', name: 'Cayo Sport', type: 'sport', body: 0xf0b429, trim: 0x2a2f36, top: 44, grip: 0.92 },
  { id: 'brisa', name: 'Brisa sedan', type: 'sedan', body: 0x6fae86, trim: 0x26332c, top: 30, grip: 0.85 },
  { id: 'harbour', name: 'Harbour Van', type: 'van', body: 0xc9c4b3, trim: 0x4a4a43, top: 27, grip: 0.8 },
  { id: 'hauler', name: 'Cinder Hauler', type: 'truck', body: 0x9a5b3c, trim: 0x2c2420, top: 25, grip: 0.76 },
  { id: 'dune', name: 'Dune Runner', type: 'suv', body: 0xb9a06b, trim: 0x33302a, top: 33, grip: 0.88 },
  { id: 'neon', name: 'Neon Rider', type: 'coupe', body: 0xb15bd1, trim: 0x1e2230, top: 40, grip: 0.9 },
  { id: 'taxi', name: 'Costa Cab', type: 'sedan', body: 0xf2c537, trim: 0x2b2b2b, top: 31, grip: 0.85 },
  { id: 'alta', name: 'Alta pickup', type: 'truck', body: 0x547f9c, trim: 0x2a3238, top: 30, grip: 0.82 },
  { id: 'marina', name: 'Marina 4x4', type: 'suv', body: 0x8d9a5b, trim: 0x2b3024, top: 34, grip: 0.89 },
];

export const WEAPONS = [
  { id: 'palm9', name: 'Palm 9', kind: 'pistol', damage: 24, rate: 0.22, range: 90, color: '#ffd479' },
  { id: 'brisa', name: 'Brisa SMG', kind: 'smg', damage: 15, rate: 0.09, range: 70, color: '#9fe6ff' },
  { id: 'cobre', name: 'Cobre .45', kind: 'pistol', damage: 36, rate: 0.36, range: 100, color: '#ffad8f' },
  { id: 'import', name: 'Harbour 12', kind: 'shotgun', damage: 52, rate: 0.6, range: 45, color: '#ff8f8f' },
  { id: 'velar', name: 'Vela Rifle', kind: 'rifle', damage: 30, rate: 0.14, range: 150, color: '#c6f29b' },
  { id: 'cinder', name: 'Cinder Launcher', kind: 'launcher', damage: 90, rate: 1.1, range: 120, color: '#ffbf6b' },
];

export const RANKS = [
  { name: 'Fresh Off The Boat', at: 0 },
  { name: 'Crew Pick', at: 800 },
  { name: 'Block Regular', at: 2200 },
  { name: 'District Name', at: 4800 },
  { name: 'Harbour Boss', at: 9000 },
  { name: 'City Legend', at: 16000 },
];

export const UPGRADES = [
  { id: 'engine', name: 'Engine tune', cost: 1200, detail: '+14% top speed' },
  { id: 'brakes', name: 'Race brakes', cost: 800, detail: '+18% grip' },
  { id: 'armor', name: 'Plate & roll cage', cost: 1500, detail: '-35% damage taken' },
  { id: 'nitro', name: 'Nitro kit', cost: 2200, detail: 'Space boost on the straight' },
];

export const MISSIONS = [
  {
    id: 'm1', title: 'Sunset Delivery', client: 'Mara Reyes',
    brief: 'Take the parcel from Palm Boulevard to the downtown steps.',
    stages: ['Walk to the parcel', 'Take the Vela GT', 'Deliver to the downtown marker', 'Collect your cut'],
    targets: [[24, 96], [40, 80], [-8, -40], [-8, -32]],
    reward: 600, wanted: 0,
  },
  {
    id: 'm2', title: 'Harbour Handshake', client: 'Ivo Cardenas',
    brief: 'Meet the dock crew. Bring a car they will not question.',
    stages: ['Steal any parked car', 'Drive to the harbour', 'Park at the blue marker', 'Talk to Ivo'],
    targets: [[80, 80], [152, 40], [152, 32], [144, 32]],
    reward: 850, wanted: 1,
  },
  {
    id: 'm3', title: 'Neon Sprint', client: 'DJ Sol',
    brief: 'Win the strip race before the lights come on.',
    stages: ['Reach the start line', 'Beat the ghost to the finish', 'Collect the purse'],
    targets: [[-152, -96], [-152, -16], [-144, -16]],
    reward: 1100, wanted: 1, race: true,
  },
  {
    id: 'm4', title: 'Cold Import', client: 'Mara Reyes',
    brief: 'A Marina 4x4 just landed at the docks. Make it disappear.',
    stages: ['Reach the dock yard', 'Take the Marina 4x4', 'Lose the heat', 'Return to Mara'],
    targets: [[168, 72], [176, 72], [0, -40], [-8, -32]],
    reward: 1300, wanted: 2,
  },
  {
    id: 'm5', title: 'Rooftop Terms', client: 'DJ Sol',
    brief: 'The broadcast tower needs a new signal. Lose dispatch on the way.',
    stages: ['Take the tower lift', 'Climb to the roof', 'Hold until the scan finishes', 'Get down'],
    targets: [[-40, -40], [-40, -40], [-40, -40], [-32, -48]],
    reward: 1600, wanted: 3,
  },
  {
    id: 'm6', title: 'Dispatch Down', client: 'Ivo Cardenas',
    brief: 'Bring back a CVPD cruiser. No questions about how.',
    stages: ['Find a cruiser', 'Steal it', 'Deliver it to the safe house', 'Wipe the plates'],
    targets: [[80, -80], [80, -80], [-120, -120], [-128, -120]],
    reward: 2000, wanted: 4,
  },
  {
    id: 'm7', title: 'Five Star Farewell', client: 'Mara Reyes',
    brief: 'Burn the crew file and survive the response.',
    stages: ['Reach the file drop', 'Light the wreck', 'Survive the response', 'Meet Mara'],
    targets: [[152, 80], [152, 80], [0, 0], [-8, -32]],
    reward: 2800, wanted: 5,
  },
  {
    id: 'm8', title: 'Costa Vela', client: 'Mara Reyes',
    brief: 'One last run down the boulevard, then the boat waits.',
    stages: ['Start the engine', 'Cross the boulevard', 'Reach the pier', 'Leave the city'],
    targets: [[24, 80], [0, 80], [0, 128], [0, 152]],
    reward: 5000, wanted: 5,
  },
];

export const RADIO = { station: 'Radio Coral', track: 'Sunset Frequency 98.4' };

export const START = { x: 24, z: 100 };

export function rankFor(respect) {
  let rank = RANKS[0];
  for (const r of RANKS) if (respect >= r.at) rank = r;
  return rank;
}
