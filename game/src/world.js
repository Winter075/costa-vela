// Costa Vela's city. Roads, four districts, water, palms, street furniture,
// the garage and the harbour are generated here from boxes and canvas textures.
import * as THREE from 'three';
import { CITY, DISTRICTS, VEHICLES } from './config.js';
import { randomRange, randomPick, nextRandom } from './random.js';
import { makeVehicle, placeVehicle } from './vehicles.js';

export const ROAD_X = [-160, -80, 0, 80, 160];
export const ROAD_Z = [-160, -80, 0, 80];

const ASPHALT = new THREE.MeshLambertMaterial({ color: 0x3b3e45 });
const PAVE = new THREE.MeshLambertMaterial({ color: 0xcabfa9 });
const SAND = new THREE.MeshLambertMaterial({ color: 0xd9bd8c });
const LINE = new THREE.MeshBasicMaterial({ color: 0xe6d7a6 });
const TRUNK = new THREE.MeshLambertMaterial({ color: 0x6f533a });
const LEAF = new THREE.MeshLambertMaterial({ color: 0x3f7c4d, side: THREE.DoubleSide });
const LAMP = new THREE.MeshBasicMaterial({ color: 0xffe2a6 });
const POLE = new THREE.MeshLambertMaterial({ color: 0x5c6068 });

const SIGN_WORDS = [
  ['CORAL CAFE', '#203e52', '#ffd98a'],
  ['SUNSET MARKET', '#6b3a2c', '#ffe9c2'],
  ['NEON LOUNGE', '#2c2040', '#ff8fd8'],
  ['DOCK NINE', '#234451', '#bfeaff'],
  ['PALM LAUNDRY', '#3f603f', '#f2f4cf'],
  ['CAYO RECORDS', '#4a2f52', '#f6c6ff'],
  ['BAY PHARMACY', '#26504a', '#d9fff0'],
  ['VELA MOTORS', '#3a2d25', '#ffd06b'],
];

function signTexture(title, background, foreground) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = foreground;
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 128, 33);
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function windowTexture(base, lit) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      ctx.fillStyle = nextRandom() > 0.62 ? lit : '#2c3540';
      ctx.fillRect(6 + col * 15, 8 + row * 15, 9, 8);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addBox(parent, width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addPalm(parent, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.4, 7, 6), TRUNK);
  trunk.position.y = 3.5;
  group.add(trunk);
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.62, 4.6, 4), LEAF);
    leaf.position.set(Math.sin(angle) * 1.5, 7.4, Math.cos(angle) * 1.5);
    leaf.rotation.set(Math.PI * 0.36, angle, 0);
    group.add(leaf);
  }
  group.position.set(x, 0, z);
  parent.add(group);
}

function addStreetlight(parent, x, z) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 6), POLE);
  pole.position.set(x, 4, z);
  parent.add(pole);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 5), LAMP);
  head.position.set(x, 8, z);
  parent.add(head);
}

function buildSky(scene) {
  const geometry = new THREE.SphereGeometry(900, 24, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      upper: { value: new THREE.Color(0x2e4a76) },
      lower: { value: new THREE.Color(0xffb875) },
    },
    vertexShader: 'varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 upper; uniform vec3 lower; varying vec3 vPos; void main(){ float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(lower, upper, pow(h, 0.8)), 1.0); }',
  });
  scene.add(new THREE.Mesh(geometry, material));

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(34, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe0a0, fog: false }),
  );
  sun.position.set(-360, 110, -520);
  scene.add(sun);
}

function heightFor(x, z) {
  if (Math.abs(x) < 80 && z < 0 && z > -130) return randomRange(30, 82);
  if (x < -95 && z < 10) return randomRange(18, 48);
  if (x > 95 && z > -20) return randomRange(12, 34);
  return randomRange(12, 36);
}

function buildRoads(parent) {
  for (const x of ROAD_X) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(CITY.roadWidth, 500), ASPHALT);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.02, 0);
    parent.add(strip);
    for (let z = -230; z < 120; z += 14) {
      addBox(parent, 0.32, 0.02, 6, LINE, x, 0.05, z);
    }
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(4, 500), PAVE);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(x + side * (CITY.roadWidth * 0.5 + 2), 0.13, 0);
      parent.add(walk);
    }
  }
  for (const z of ROAD_Z) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(500, CITY.roadWidth), ASPHALT);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.025, z);
    parent.add(strip);
    for (let x = -230; x < 230; x += 14) {
      addBox(parent, 6, 0.02, 0.32, LINE, x, 0.055, z);
    }
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(500, 4), PAVE);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(0, 0.14, z + side * (CITY.roadWidth * 0.5 + 2));
      parent.add(walk);
    }
  }
  const boulevard = new THREE.Mesh(new THREE.PlaneGeometry(500, CITY.roadWidth * 1.35), ASPHALT);
  boulevard.rotation.x = -Math.PI / 2;
  boulevard.position.set(0, 0.03, CITY.beachRoadZ);
  parent.add(boulevard);
  for (const x of [-160, -80, 0, 80, 160]) addStreetlight(parent, x + 11, CITY.beachRoadZ - 12);
}

function buildBlocks(parent, colliders) {
  const materials = [
    '#c8a980', '#b7c3c4', '#d3b39a', '#a9b6bf', '#cfc1a6', '#b6a4a0',
  ].map((base) => new THREE.MeshLambertMaterial({ map: windowTexture(base, '#ffe0a0') }));

  const xRanges = [[-210, -160], [-160, -80], [-80, 0], [0, 80], [80, 160], [160, 210]];
  const zRanges = [[-210, -160], [-160, -80], [-80, 0], [0, 80], [80, 114]];

  for (const [xA, xB] of xRanges) {
    for (const [zA, zB] of zRanges) {
      if (zA === 80) continue;
      if (xA === -160 && zA === -160) continue;
      if (xA === 0 && zA === -80) continue;

      const inset = CITY.roadWidth * 0.5 + 5;
      const minX = xA + inset;
      const maxX = xB - inset;
      const minZ = zA + inset;
      const maxZ = zB - inset;
      if (maxX - minX < 16 || maxZ - minZ < 16) continue;

      const split = nextRandom() > 0.5 ? 2 : 1;
      for (let ix = 0; ix < split; ix += 1) {
        for (let iz = 0; iz < split; iz += 1) {
          if (nextRandom() < 0.12) continue;
          const cellW = (maxX - minX) / split;
          const cellD = (maxZ - minZ) / split;
          const width = cellW - 4;
          const depth = cellD - 4;
          if (width < 8 || depth < 8) continue;
          const x = minX + cellW * (ix + 0.5);
          const z = minZ + cellD * (iz + 0.5);
          const height = heightFor(x, z);
          addBox(parent, width, height, depth, randomPick(materials), x, height * 0.5, z);
          colliders.push({ x1: x - width * 0.5, x2: x + width * 0.5, z1: z - depth * 0.5, z2: z + depth * 0.5 });
        }
      }
    }
  }

  for (let i = 0; i < 14; i += 1) {
    const [word, background, foreground] = SIGN_WORDS[i % SIGN_WORDS.length];
    const x = ROAD_X[i % ROAD_X.length] + (i % 2 ? 15 : -15);
    const z = ROAD_Z[i % ROAD_Z.length] + 12;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 3.25),
      new THREE.MeshBasicMaterial({ map: signTexture(word, background, foreground) }),
    );
    sign.position.set(x, 6 + (i % 3) * 2, z);
    parent.add(sign);
  }
}

function buildBeach(parent) {
  for (let x = -210; x <= 210; x += 22) {
    addPalm(parent, x, 101);
    if (nextRandom() > 0.45) addPalm(parent, x + 8, 66);
  }
  const boardwalk = new THREE.Mesh(new THREE.PlaneGeometry(500, 26), SAND);
  boardwalk.rotation.x = -Math.PI / 2;
  boardwalk.position.set(0, 0.1, 116);
  parent.add(boardwalk);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 500),
    new THREE.MeshPhongMaterial({ color: 0x2f7392, shininess: 90, specular: 0xffd9a0 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.04, 390);
  parent.add(water);

  const glints = [];
  for (let i = 0; i < 12; i += 1) {
    const glint = new THREE.Mesh(
      new THREE.PlaneGeometry(randomRange(8, 30), 0.4),
      new THREE.MeshBasicMaterial({ color: 0xbfe3e8, transparent: true, opacity: 0.35 }),
    );
    glint.rotation.x = -Math.PI / 2;
    glint.position.set(randomRange(-220, 220), 0.08, randomRange(140, 350));
    parent.add(glint);
    glints.push(glint);
  }
  return glints;
}

function buildHarbour(parent, colliders) {
  const crateColors = [0xa9704d, 0x4f7786, 0xb4a15f, 0x8a5d5d, 0x5f6f9a];
  for (let i = 0; i < 22; i += 1) {
    const x = 160 + (i % 6) * 9;
    const z = 22 + Math.floor(i / 6) * 10;
    const stack = i % 4 === 0 ? 2 : 1;
    for (let level = 0; level < stack; level += 1) {
      addBox(parent, 8, 4, 7, new THREE.MeshLambertMaterial({ color: crateColors[i % crateColors.length] }), x, 2 + level * 4, z);
      colliders.push({ x1: x - 4, x2: x + 4, z1: z - 3.5, z2: z + 3.5 });
    }
  }
  for (const x of [130, 160, 190]) {
    addBox(parent, 10, 1.2, 48, new THREE.MeshLambertMaterial({ color: 0x9c7b55 }), x, 0.6, 143);
  }
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(16, 5, 34),
    new THREE.MeshLambertMaterial({ color: 0xd8d4c7 }),
  );
  hull.position.set(176, 1.5, 178);
  parent.add(hull);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(9, 5, 10),
    new THREE.MeshLambertMaterial({ color: 0xe9e6da }),
  );
  cabin.position.set(176, 6, 172);
  parent.add(cabin);
}

function buildGarage(parent, colliders) {
  const x = -120;
  const z = -120;
  const material = new THREE.MeshLambertMaterial({ color: 0x9d8874 });
  addBox(parent, 34, 15, 26, material, x, 7.5, z);
  colliders.push({ x1: x - 17, x2: x + 17, z1: z - 13, z2: z + 13 });
  addBox(parent, 18, 10, 0.5, new THREE.MeshLambertMaterial({ color: 0x2f3a44 }), x, 5, z + 13.4);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 4),
    new THREE.MeshBasicMaterial({ map: signTexture('VELA MOTORS', '#2c2620', '#ffd070') }),
  );
  sign.position.set(x, 13, z + 13.7);
  parent.add(sign);
  for (const side of [-1, 1]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 0.5), new THREE.MeshBasicMaterial({ color: 0x8fd8ff }));
    light.position.set(x + side * 11, 7, z + 13.7);
    parent.add(light);
  }
  return new THREE.Vector3(x, 0, z + 20);
}

function buildNeon(parent) {
  const colors = [0xff5fc8, 0x68e0ff, 0xffc65c, 0xb98cff];
  for (let i = 0; i < 16; i += 1) {
    const x = -190 + (i % 4) * 24;
    const z = -100 + Math.floor(i / 4) * 26;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, randomRange(4, 10), 0.5),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }),
    );
    bar.position.set(x, 8 + (i % 3), z);
    parent.add(bar);
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 5),
    new THREE.MeshBasicMaterial({ map: signTexture('NEON STRIP', '#241a33', '#ff9fe0') }),
  );
  sign.position.set(-152, 14, -28);
  parent.add(sign);
}

function buildParked(parent) {
  const parked = [];
  for (const x of ROAD_X) {
    for (let z = -200; z < 112; z += 27) {
      if (nextRandom() < 0.28) continue;
      const side = nextRandom() > 0.5 ? 1 : -1;
      const spec = randomPick(VEHICLES);
      const vehicle = makeVehicle(spec, x + side * (CITY.roadWidth * 0.5 + 3.4), z, side > 0 ? 0 : Math.PI);
      parent.add(vehicle.mesh);
      placeVehicle(vehicle);
      parked.push(vehicle);
    }
  }
  return parked;
}

function buildMarker(parent) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.34, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x8ef2d4 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.2;
  group.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 30, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8ef2d4, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 15;
  group.add(beam);
  group.visible = false;
  parent.add(group);
  return group;
}

export function buildWorld(scene) {
  scene.fog = new THREE.Fog(0xe8a978, 150, 640);
  buildSky(scene);

  const hemisphere = new THREE.HemisphereLight(0xffd5a0, 0x44516a, 1.15);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xffbd7d, 1.45);
  sun.position.set(-140, 120, -100);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), SAND);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  scene.add(ground);

  const colliders = [];
  buildRoads(scene);
  buildBlocks(scene, colliders);
  const glints = buildBeach(scene);
  buildHarbour(scene, colliders);
  const garage = buildGarage(scene, colliders);
  buildNeon(scene);
  const parked = buildParked(scene);
  const marker = buildMarker(scene);

  for (const [x, z] of [[-160, -80], [-80, 0], [0, 80], [80, -80], [160, 0]]) {
    for (const side of [-1, 1]) addStreetlight(scene, x + side * 14, z + 13);
  }

  function districtAt(x, z) {
    let best = DISTRICTS[0];
    let bestDistance = Infinity;
    for (const district of DISTRICTS) {
      const distance = (district.x - x) ** 2 + (district.z - z) ** 2;
      if (distance < bestDistance) {
        best = district;
        bestDistance = distance;
      }
    }
    return best;
  }

  function update(time) {
    marker.rotation.y = time * 0.8;
    marker.children[0].position.y = 1.2 + Math.sin(time * 2) * 0.3;
    glints.forEach((glint, index) => {
      glint.position.z = 140 + ((time * (6 + index) + index * 31) % 210);
      glint.material.opacity = 0.18 + Math.sin(time * 2 + index) * 0.16;
    });
  }

  return { garage, marker, colliders, parked, districtAt, update };
}
