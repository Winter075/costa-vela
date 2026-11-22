// The coastal city: four districts, a grid of roads, buildings, palms, lamps,
// harbour water, parked cars and the colliders used by movement.

import * as THREE from 'three';
import { WORLD, VEHICLES, DISTRICTS, districtAt } from './config.js';
import { makeRandom } from './random.js';
import { createVehicle, placeVehicle } from './vehicles.js';

const ROAD = new THREE.MeshStandardMaterial({ color: 0x3a4045, roughness: 0.95 });
const WALK = new THREE.MeshStandardMaterial({ color: 0xb0a68f, roughness: 0.95 });
const LINE = new THREE.MeshBasicMaterial({ color: 0xe9c98c });

function flat(width, depth, material, x, z, y = 0.02) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  return mesh;
}

function buildingMaterial(index, district) {
  const palettes = {
    palm: [0xe7c9a4, 0xf0d7b6, 0xd8b894],
    core: [0x5d7186, 0x6c8090, 0x4f6274],
    docks: [0x7d8d8c, 0x8f9a95, 0x6e7c7d],
    neon: [0x695270, 0x7b5c72, 0x554963],
  };
  const colors = palettes[district] ?? palettes.core;
  return new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.82 });
}

function addBuilding(scene, colliders, x, z, width, depth, height, district, seed) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    buildingMaterial(seed, district),
  );
  mesh.position.set(x, height / 2, z);
  mesh.castShadow = true;
  scene.add(mesh);

  const rows = Math.max(1, Math.floor(height / 5));
  const band = new THREE.MeshBasicMaterial({ color: district === 'neon' ? 0xffb4d8 : 0xffe4ad });
  for (let row = 1; row < rows; row += 1) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, 0.16, depth + 0.06), band);
    strip.position.set(x, row * 5, z);
    scene.add(strip);
  }
  colliders.push({ x1: x - width / 2, x2: x + width / 2, z1: z - depth / 2, z2: z + depth / 2 });
}

function addPalm(scene, x, z, random) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, 7.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a6b46, roughness: 1 }),
  );
  trunk.position.set(x, 3.75, z);
  scene.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d8a5e, roughness: 1, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2 + random.range(-0.2, 0.2);
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.75, 4.3, 4), leafMat);
    frond.position.set(x + Math.cos(angle) * 1.5, 7.5 + random.range(-0.2, 0.5), z + Math.sin(angle) * 1.5);
    frond.rotation.z = Math.cos(angle) * 1.1;
    frond.rotation.x = -Math.sin(angle) * 1.1;
    scene.add(frond);
  }
}

function addStreetLamp(scene, x, z, lamps) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.15, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x51585c, metalness: 0.5 }),
  );
  pole.position.set(x, 3.5, z);
  scene.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffdca0 }),
  );
  bulb.position.set(x, 7, z);
  scene.add(bulb);
  lamps.push(bulb);
}

export function buildWorld(scene) {
  const random = makeRandom(41773);
  const colliders = [];
  const lamps = [];
  const parked = [];

  scene.background = new THREE.Color(0xe6a878);
  scene.fog = new THREE.Fog(0xe9ac83, 110, 610);

  const ambient = new THREE.HemisphereLight(0xffd9b0, 0x405060, 1.35);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffd0a0, 1.25);
  sun.position.set(-160, 190, -120);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshStandardMaterial({ color: 0xa9a183, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.04, -40);
  scene.add(ground);

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f7f9e, roughness: 0.28, metalness: 0.32, transparent: true, opacity: 0.94,
  });
  const water = flat(900, 400, waterMaterial, 0, 340, 0.05);
  scene.add(water);

  const step = WORLD.gridStep;
  const roads = [];
  for (let x = -WORLD.halfX; x <= WORLD.halfX; x += step) {
    roads.push({ axis: 'z', value: x });
    scene.add(flat(WORLD.roadHalf * 2, 700, ROAD, x, -40));
    scene.add(flat(0.3, 680, LINE, x, -40, 0.05));
    for (const side of [-1, 1]) {
      scene.add(flat(2.4, 700, WALK, x + side * (WORLD.roadHalf + 1.2), -40, 0.03));
    }
  }
  for (let z = WORLD.southZ; z <= WORLD.northZ; z += step) {
    roads.push({ axis: 'x', value: z });
    scene.add(flat(470, WORLD.roadHalf * 2, ROAD, 0, z));
    scene.add(flat(450, 0.3, LINE, 0, z, 0.05));
    for (const side of [-1, 1]) {
      scene.add(flat(470, 2.4, WALK, 0, z + side * (WORLD.roadHalf + 1.2), 0.03));
    }
  }

  for (let ix = 0; ix < roads.filter((r) => r.axis === 'z').length - 1; ix += 1) {
    for (let iz = 0; iz < roads.filter((r) => r.axis === 'x').length - 1; iz += 1) {
      const gx = -WORLD.halfX + ix * step;
      const gz = WORLD.southZ + iz * step;
      const cx = gx + step / 2;
      const cz = gz + step / 2;
      const district = districtAt(cx, cz).id;
      const width = step - 2 * (WORLD.roadHalf + 3);
      if (!random.chance(district === 'docks' ? 0.7 : 0.86)) continue;

      const count = district === 'core' ? random.int(1, 2) : 1;
      for (let k = 0; k < count; k += 1) {
        const height = district === 'core'
          ? random.range(24, 68)
          : district === 'palm' ? random.range(9, 20) : random.range(10, 26);
        const bw = district === 'core' ? width * 0.52 : width * random.range(0.6, 0.9);
        const bd = district === 'core' ? width * 0.52 : width * random.range(0.6, 0.9);
        const bx = cx + (count > 1 ? (k === 0 ? -6 : 6) : random.range(-2, 2));
        const bz = cz + random.range(-2, 2);
        addBuilding(scene, colliders, bx, bz, bw, bd, height, district, random.int(0, 99));
      }
    }
  }

  for (let x = -WORLD.halfX; x <= WORLD.halfX; x += step / 2) {
    if (random.chance(0.8)) addPalm(scene, x + random.range(-3, 3), 116 + random.range(-4, 5), random);
  }
  for (let x = -WORLD.halfX; x <= WORLD.halfX; x += step) {
    for (const z of [-WORLD.gridStep, WORLD.gridStep, 69, 115]) {
      addStreetLamp(scene, x + WORLD.roadHalf + 2, z, lamps);
    }
  }

  const pool = VEHICLES.slice(0, 12);
  for (let i = 0; i < 26; i += 1) {
    const vertical = random.chance(0.55);
    const lane = random.pick([-1, 1]) * (WORLD.roadHalf - 2);
    const x = vertical ? random.range(-WORLD.halfX, WORLD.halfX) : random.range(-WORLD.halfX, WORLD.halfX);
    const z = vertical ? random.range(WORLD.southZ, WORLD.northZ) : random.range(WORLD.southZ, WORLD.northZ);
    const snapX = vertical ? Math.round(x / step) * step + lane : x;
    const snapZ = vertical ? z : Math.round(z / step) * step + lane;
    const spec = random.pick(pool);
    const car = createVehicle(spec, snapX, snapZ, vertical ? Math.PI / 2 : 0);
    scene.add(car.mesh);
    placeVehicle(car);
    parked.push(car);
  }

  for (let i = 0; i < 10; i += 1) {
    const container = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3.2, 4),
      new THREE.MeshStandardMaterial({ color: random.pick([0xb4553d, 0x3c7890, 0xd0a24e]), roughness: 0.9 }),
    );
    container.position.set(120 + (i % 5) * 12, 1.6, -110 - Math.floor(i / 5) * 12);
    scene.add(container);
    colliders.push({ x1: container.position.x - 5, x2: container.position.x + 5, z1: container.position.z - 2, z2: container.position.z + 2 });
  }

  const garage = { x: -8, z: 18 };
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.3, 18),
    new THREE.MeshStandardMaterial({ color: 0x4a4f4d, roughness: 0.8 }),
  );
  pad.position.set(garage.x - 8, 0.12, garage.z);
  scene.add(pad);

  function update(time) {
    waterMaterial.color.setHSL(0.54, 0.42, 0.36 + Math.sin(time * 0.7) * 0.025);
    sun.intensity = 1.15 + Math.sin(time * 0.05) * 0.08;
    const pulse = (Math.sin(time * 3) + 1) * 0.5;
    for (let i = 0; i < lamps.length; i += 1) {
      lamps[i].material.color.setRGB(1, 0.78 + pulse * 0.14, 0.5 + pulse * 0.22);
    }
  }

  return {
    parked, colliders, roads, water, sun, garage, update,
    districtAt: (x, z) => districtAt(x, z),
    districts: DISTRICTS,
  };
}
