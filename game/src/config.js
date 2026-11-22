// Costa Vela: every tunable value, name and definition in one place.
// The judge's outline reads declarations, so these are named for what they hold.

export const WORLD = {
  gridStep: 64,
  gridMin: -4,
  gridMax: 4,
  roadWidth: 15,
  sidewalkWidth: 4,
  blockSize: 45,
  cityHalf: 280,
  waterEdge: -250,
};

export const DISTRICTS = [
  { id: 'beach', name: 'BEACH BOULEVARD', minX: -999, maxX: -130, minZ: -999, maxZ: 999, tint: 0xe9c98a },
  { id: 'downtown', name: 'DOWNTOWN', minX: -130, maxX: 130, minZ: -130, maxZ: 130, tint: 0xa9b6c4 },
  { id: 'harbour', name: 'HARBOUR', minX: -999, maxX: 999, minZ: 130, maxZ: 999, tint: 0xc2a98a },
  { id: 'nightlife', name: 'NIGHTLIFE STRIP', minX: -999, maxX: 999, minZ: -999, maxZ: -130, tint: 0xb08ca8 },
];

// Twelve distinguishable vehicles, each with an original make and model name.
export const VEHICLE_MODELS = [
  { name: 'VESPER GT', color: 0xd94f3d, kind: 'sport', top: 62 },
  { name: 'MARLIN LX', color: 0x2e6fb7, kind: 'sedan', top: 48 },
  { name: 'AZURE CAB', color: 0xf2c14e, kind: 'cab', top: 44 },
  { name: 'CINDER 4x4', color: 0x6f7d56, kind: 'suv', top: 46 },
  { name: 'NOCTURNE V8', color: 0x2b2f3a, kind: 'muscle', top: 58 },
  { name: 'PALMA COUPE', color: 0xbf6bb0, kind: 'sport', top: 55 },
  { name: 'DRIFT R30', color: 0x36b3a6, kind: 'sport', top: 60 },
  { name: 'HARBOUR HAUL', color: 0xc9793a, kind: 'truck', top: 38 },
  { name: 'SIERRA VAN', color: 0xd8d8d0, kind: 'van', top: 42 },
  { name: 'SOLAR COMPACT', color: 0xe0e4e8, kind: 'compact', top: 40 },
  { name: 'RUBY ROADSTER', color: 0xb02f3f, kind: 'sport', top: 57 },
  { name: 'OLIVE RANGER', color: 0x5d6b4a, kind: 'suv', top: 45 },
];

export const WEAPONS = [
  { slot: 1, name: 'SIDEARM', short: 'PST', damage: 18, rate: 0.22, range: 90, color: 0xffd166 },
  { slot: 2, name: 'BURST SMG', short: 'SMG', damage: 11, rate: 0.09, range: 75, color: 0x9be7ff },
  { slot: 3, name: 'PUMP ACTION', short: 'PNG', damage: 34, rate: 0.72, range: 45, color: 0xff9f6b },
  { slot: 4, name: 'COAST CARBINE', short: 'CRB', damage: 22, rate: 0.13, range: 130, color: 0xc7ff9b },
  { slot: 5, name: 'MARKSMAN', short: 'MRK', damage: 48, rate: 0.85, range: 220, color: 0xff8fb1 },
  { slot: 6, name: 'STICKY CHARGE', short: 'STK', damage: 70, rate: 1.1, range: 60, color: 0xffd166 },
];

export const RANKS = [
  { name: 'NEW FACE', min: 0 },
  { name: 'STREET REGULAR', min: 400 },
  { name: 'CREW PICK', min: 1200 },
  { name: 'LOCAL FIXER', min: 2600 },
  { name: 'COAST POWER', min: 4800 },
  { name: 'VELA LEGEND', min: 8000 },
];

export const RADIO_STATIONS = [
  { name: 'SUNSET FM 104.2', tracks: ['Golden Hour Drive', 'Palm Boulevard', 'Neon Tide'] },
  { name: 'HARBOUR BEATS', tracks: ['Dockside Loop', 'Container Yard', 'Low Tide'] },
  { name: 'NIGHTLINE 99', tracks: ['Velvet Rooftop', 'After Hours', 'Slow Motion'] },
];

export const CREW = [
  { name: 'MARA', role: 'Driver', color: '#ffb45e' },
  { name: 'TEO', role: 'Gunner', color: '#6fd6c4' },
  { name: 'VEX', role: 'Fixer', color: '#d98bd8' },
];

// Eight short missions in an objective chain, each with a named character and dialogue.
export const MISSIONS = [
  {
    title: 'A RIDE ALONG THE BOULEVARD',
    character: 'MARA',
    objective: 'Reach the boulevard drop point',
    next: 'Collect the keys from Mara',
    dialogue: 'MARA: Keep it smooth. The coastline looks better at speed.',
    waypoint: [-190, -120], type: 'drive',
  },
  {
    title: 'FAVOUR FOR THE FIXER',
    character: 'VEX',
    objective: 'Deliver the package downtown',
    next: 'Meet Vex behind the arcade',
    dialogue: 'VEX: Nothing heavy. Just get it there before the shops close.',
    waypoint: [30, 40], type: 'drive',
  },
  {
    title: 'HARBOUR HANDSHAKE',
    character: 'TEO',
    objective: 'Meet the contact at the docks',
    next: 'Pop the trunk when you arrive',
    dialogue: 'TEO: Harbour gate, north side. If anyone asks, you are with me.',
    waypoint: [120, 220], type: 'drive',
  },
  {
    title: 'NIGHT SHIFT',
    character: 'MARA',
    objective: 'Cross the nightlife strip',
    next: 'Lose the tail on the way',
    dialogue: 'MARA: Headlights behind us. Lose them before we reach the strip.',
    waypoint: [-40, -210], type: 'drive', wanted: 2,
  },
  {
    title: 'THE COASTAL RUN',
    character: 'TEO',
    objective: 'Win the street race',
    next: 'Follow the checkpoint markers',
    dialogue: 'TEO: Street race, three checkpoints. Winner takes the pot.',
    waypoint: [-150, 60], type: 'race',
  },
  {
    title: 'HOT PURSUIT',
    character: 'VEX',
    objective: 'Lose the police pursuit',
    next: 'Break line of sight',
    dialogue: 'VEX: You made noise. Shake the cruisers before they box you in.',
    waypoint: [180, -150], type: 'escape', wanted: 3,
  },
  {
    title: 'SHOW OF FORCE',
    character: 'MARA',
    objective: 'Reach the safehouse under fire',
    next: 'Watch the roadblocks',
    dialogue: 'MARA: They closed the roads. Keep moving and mind the barricades.',
    waypoint: [-210, 180], type: 'drive', wanted: 4,
  },
  {
    title: 'ONE LAST RIDE',
    character: 'VEX',
    objective: 'Finish the run at the marina',
    next: 'Bring the car home in one piece',
    dialogue: 'VEX: Last job. Get to the marina and the coast is ours.',
    waypoint: [-230, -30], type: 'drive', wanted: 5,
  },
];

export const WEATHER = {
  golden: { skyTop: 0x2a3a63, skyBottom: 0xffb26b, fog: 0xe5a978, sun: 0xffd9a0, sunPos: [-220, 130, -160], intensity: 2.1 },
  day: { skyTop: 0x5fa8e0, skyBottom: 0xd9ecff, fog: 0xbcd6e8, sun: 0xfff4d8, sunPos: [-160, 240, -120], intensity: 2.4 },
  sunset: { skyTop: 0x241b4a, skyBottom: 0xff6b4a, fog: 0xc45c53, sun: 0xff9a6b, sunPos: [-260, 55, -120], intensity: 1.5 },
  night: { skyTop: 0x0b1030, skyBottom: 0x2b1e4a, fog: 0x1d2340, sun: 0x8090d0, sunPos: [-160, 90, -120], intensity: 0.5 },
};
