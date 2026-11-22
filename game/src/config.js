// Costa Vela - shared game data for the gta6-01 entry.
// Every system reads its names and numbers from here so the city, the jobs and
// the HUD tell one consistent story.

export const LAYOUT = {
  limit: 232,
  avenues: [-160, -80, 0, 80, 160],
  streets: [-160, -80, 0, 80],
  road: 18,
  shore: 132,
  promenade: 80,
};

export const QUARTERS = [
  { id: 'palm', label: 'Palm Boulevard', x: 0, z: 96, tint: 0xf3cf94 },
  { id: 'core', label: 'Vela Downtown', x: 0, z: -32, tint: 0x9fc0cd },
  { id: 'harbour', label: 'Costa Harbour', x: 152, z: 40, tint: 0xd0a46e },
  { id: 'neon', label: 'The Neon Strip', x: -152, z: -56, tint: 0xc58dd0 },
];

export const HELPERS = [
  { id: 'mara', name: 'MARA', role: 'Driver', color: '#f0b060' },
  { id: 'teo', name: 'TEO', role: 'Gunner', color: '#6fd0e8' },
  { id: 'vex', name: 'VEX', role: 'Fixer', color: '#c79ce8' },
];

export const WORKSHOP = 'COSTA VELA MOTOR WORKS';
export const RADIO = { station: 'SUNSET FM 104.2', track: 'Golden Hour Drive' };
export const SPAWN = { x: 24, z: 100 };

export const CARS = [
  { id: 'vesper', name: 'VESPER GT', kind: 'sport', body: 0xe0563f, trim: 0x242a33, top: 42, grip: 0.94 },
  { id: 'marlin', name: 'MARLIN LX', kind: 'coupe', body: 0xd9dde2, trim: 0x303841, top: 38, grip: 0.9 },
  { id: 'azure', name: 'AZURE CAB', kind: 'sedan', body: 0xf2c537, trim: 0x2b2b2b, top: 31, grip: 0.85 },
  { id: 'cinder', name: 'CINDER 4x4', kind: 'suv', body: 0xb9a06b, trim: 0x33302a, top: 33, grip: 0.88 },
  { id: 'nocturne', name: 'NOCTURNE V8', kind: 'sport', body: 0xb15bd1, trim: 0x1e2230, top: 44, grip: 0.92 },
  { id: 'palma', name: 'PALMA COUPE', kind: 'coupe', body: 0x3f6ea8, trim: 0xe8e3d4, top: 34, grip: 0.87 },
  { id: 'drift', name: 'DRIFT R30', kind: 'sport', body: 0xf0b429, trim: 0x2a2f36, top: 43, grip: 0.91 },
  { id: 'haul', name: 'HARBOUR HAUL', kind: 'truck', body: 0x9a5b3c, trim: 0x2c2420, top: 25, grip: 0.76 },
  { id: 'sierra', name: 'SIERRA VAN', kind: 'van', body: 0xc9c4b3, trim: 0x4a4a43, top: 27, grip: 0.8 },
  { id: 'solar', name: 'SOLAR COMPACT', kind: 'sedan', body: 0x6fae86, trim: 0x26332c, top: 30, grip: 0.85 },
  { id: 'ruby', name: 'RUBY ROADSTER', kind: 'coupe', body: 0xd2605f, trim: 0x302528, top: 41, grip: 0.9 },
  { id: 'olive', name: 'OLIVE RANGER', kind: 'suv', body: 0x8d9a5b, trim: 0x2b3024, top: 34, grip: 0.89 },
];

export const PRICES = [0, 0, 0, 0, 0, 0, 0, 3340, 3360, 3780, 4000, 4220];

export const WEAPONS = [
  { id: 'sidearm', name: 'SIDEARM', kind: 'pistol', damage: 24, rate: 0.22, range: 90, color: '#ffd479' },
  { id: 'burst', name: 'BURST SMG', kind: 'smg', damage: 15, rate: 0.09, range: 70, color: '#9fe6ff' },
  { id: 'pump', name: 'PUMP ACTION', kind: 'shotgun', damage: 52, rate: 0.6, range: 45, color: '#ff8f8f' },
  { id: 'carbine', name: 'COAST CARBINE', kind: 'rifle', damage: 30, rate: 0.14, range: 150, color: '#c6f29b' },
  { id: 'marksman', name: 'MARKSMAN', kind: 'rifle', damage: 46, rate: 0.5, range: 210, color: '#e2c3ff' },
  { id: 'sticky', name: 'STICKY CHARGE', kind: 'launcher', damage: 90, rate: 1.1, range: 120, color: '#ffbf6b' },
];

export const RANKS = [
  { name: 'NEW FACE', at: 0 },
  { name: 'STREET NAME', at: 700 },
  { name: 'LOCAL FIXER', at: 2000 },
  { name: 'HARBOUR NAME', at: 4000 },
  { name: 'COAST POWER', at: 6000 },
  { name: 'VELA LEGEND', at: 8000 },
];

export const TUNING = [
  { id: 'engine', name: 'ENGINE', cost: 900, detail: 'Top speed +14%' },
  { id: 'armour', name: 'ARMOUR', cost: 900, detail: 'Damage taken -35%' },
  { id: 'brakes', name: 'BRAKES', cost: 900, detail: 'Grip +18%' },
];

export const JOBS = [
  {
    id: 'j1', title: 'A RIDE ALONG THE BOULEVARD', client: 'MARA',
    brief: 'Reach the boulevard drop point', hint: 'Collect the keys from Mara',
    steps: ['Walk to the drop point', 'Take the Vesper GT', 'Drive to the downtown steps', 'Collect your cut'],
    points: [[24, 96], [40, 80], [-8, -40], [-8, -32]],
    pay: 600, heat: 0,
  },
  {
    id: 'j2', title: 'HARBOUR HANDOFF', client: 'TEO',
    brief: 'Meet the dock crew', hint: 'Bring a car they will not question',
    steps: ['Steal any parked car', 'Drive to the harbour', 'Park at the blue marker', 'Talk to Teo'],
    points: [[80, 80], [152, 40], [152, 32], [144, 32]],
    pay: 850, heat: 1,
  },
  {
    id: 'j3', title: 'GHOST RUN', client: 'VEX',
    brief: 'Beat the strip ghost', hint: 'Stay on the neon strip',
    steps: ['Reach the start line', 'Beat the ghost to the finish', 'Collect the purse'],
    points: [[-152, -96], [-152, -16], [-144, -16]],
    pay: 1100, heat: 1,
  },
  {
    id: 'j4', title: 'NIGHT SHIFT', client: 'MARA',
    brief: 'Cross the nightlife strip', hint: 'Lose the heat on the way',
    steps: ['Reach the strip entrance', 'Take the Nocturne V8', 'Shake the patrols', 'Meet Mara downtown'],
    points: [[-152, -88], [-144, -80], [0, -40], [-8, -32]],
    pay: 1500, heat: 3,
  },
  {
    id: 'j5', title: 'THE COASTAL RUN', client: 'TEO',
    brief: 'Win the street race', hint: 'Follow the checkpoint markers',
    steps: ['Reach the start line', 'Pass three checkpoints', 'Collect the pot'],
    points: [[-152, -96], [-152, 80], [0, 80], [152, 80]],
    pay: 1900, heat: 1, race: true,
  },
  {
    id: 'j6', title: 'DISPATCH DOWN', client: 'VEX',
    brief: 'Bring in a patrol car', hint: 'Wipe the plates at the safehouse',
    steps: ['Find a patrol car', 'Take it', 'Deliver it to the safe house', 'Wipe the plates'],
    points: [[80, -80], [80, -80], [-120, -120], [-128, -120]],
    pay: 2200, heat: 4,
  },
  {
    id: 'j7', title: 'SHOW OF FORCE', client: 'MARA',
    brief: 'Reach the safehouse under fire', hint: 'Watch the roadblocks',
    steps: ['Reach the file drop', 'Light the wreck', 'Survive the response', 'Meet Mara'],
    points: [[152, 80], [152, 80], [0, 0], [-8, -32]],
    pay: 2800, heat: 5,
  },
  {
    id: 'j8', title: 'LAST LIGHT', client: 'MARA',
    brief: 'Run the boulevard to the pier', hint: 'Get the crew across the water',
    steps: ['Start the engine', 'Cross the boulevard', 'Reach the pier', 'Leave the city'],
    points: [[24, 80], [0, 80], [0, 128], [0, 152]],
    pay: 5000, heat: 5,
  },
];

export const DIALOGUE = {
  j1: ['MARA: Keep it smooth. The coastline looks better at speed.', 'MARA: Keys are in the Vesper. Go.', 'MARA: Downstairs. I will take it from here.', 'MARA: Good. You eat now, we talk later.'],
  j2: ['TEO: Any wheels will do. Nobody checks.', 'TEO: Harbour gate, second dock. Bring it.', 'TEO: Leave it running. Walk away slow.', 'TEO: Welcome to the crew, amigo.'],
  j3: ['VEX: Start line is yours. The ghost runs clean.', 'VEX: Hold the line. Finish is north.', 'VEX: That was tidy. The strip is yours tonight.'],
  j4: ['MARA: Headlights behind us. Lose them before we reach the strip.', 'MARA: Nocturne is parked. Take it.', 'MARA: They are still on you. Shake them.', 'MARA: Made it. Keep the lights off.'],
  j5: ['TEO: Street race, three checkpoints. Winner takes the pot.', 'TEO: Stay on the markers. Do not cut the corner.', 'TEO: That pays. Nobody saw a thing.'],
  j6: ['VEX: A patrol car. Blue and white. Any one.', 'VEX: Door is open if you are quick.', 'VEX: Safe house on the west road. No lights.', 'VEX: Plates are gone. Nobody saw a thing.'],
  j7: ['MARA: They closed the roads. Keep moving and mind the barricades.', 'MARA: That wreck will burn nicely.', 'MARA: Five stars. Do not stop now.', 'MARA: You made it. I did not doubt you.'],
  j8: ['MARA: Last run. Boulevard, then the pier.', 'MARA: Wide open. Give it everything.', 'MARA: Boat is at the end of the pier. Jump.', 'MARA: Costa Vela is yours. See you across the water.'],
};

export function rankFor(respect) {
  let current = RANKS[0];
  for (const rank of RANKS) if (respect >= rank.at) current = rank;
  return current;
}
