// Costa Vela traffic: cars that run the grid and pedestrians who use the sidewalks and scatter.

import * as THREE from 'three';
import { WORLD, VEHICLE_MODELS } from './config.js';
import { buildCarMesh } from './vehicles.js';
import { pick, range } from './random.js';

const SKIN = [0xd9a07a, 0xa86a4a, 0x6f4a33, 0xe8c39a, 0x8d5f45];
const SHIRTS = [0x3f6fb0, 0xb04f4f, 0x4f8a6b, 0xc09a3f, 0x6a4f9a, 0xd0d0c8];

export function buildPedestrian(random) {
  const group = new THREE.Group();
  const shirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.46, 1.35, 7),
    new THREE.MeshStandardMaterial({ color: pick(random, SHIRTS), roughness: 0.95 }),
  );
  shirt.position.y = 1.35;
  group.add(shirt);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 10, 8),
    new THREE.MeshStandardMaterial({ color: pick(random, SKIN), roughness: 0.9 }),
  );
  head.position.y = 2.25;
  group.add(head);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x30343b, roughness: 1 });
  const legs = [];
  for (const z of [-0.2, 0.2]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.0, 0.26), legMat);
    leg.position.set(0, 0.5, z);
    group.add(leg);
    legs.push(leg);
  }
  const arms = [];
  for (const z of [-0.5, 0.5]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), shirt.material);
    arm.position.set(0, 1.4, z);
    group.add(arm);
    arms.push(arm);
  }
  group.userData = { legs, arms };
  return group;
}

export class TrafficSystem {
  constructor(scene, random, countCars = 26, countPeds = 34) {
    this.scene = scene;
    this.random = random;
    this.cars = [];
    this.pedestrians = [];
    this.time = 0;
    const span = (WORLD.gridMax - WORLD.gridMin) * WORLD.gridStep;
    this.limit = span / 2 + 40;

    for (let i = 0; i < countCars; i++) {
      const modelIndex = Math.floor(random() * VEHICLE_MODELS.length);
      const alongX = random() > 0.5;
      const dir = random() > 0.5 ? 1 : -1;
      const laneLine = (Math.floor(range(random, WORLD.gridMin, WORLD.gridMax + 1)) * WORLD.gridStep)
        + dir * (WORLD.roadWidth / 2 - 3.4);
      const along = range(random, -this.limit, this.limit);
      const mesh = buildCarMesh(VEHICLE_MODELS[modelIndex].color, VEHICLE_MODELS[modelIndex].kind);
      const car = {
        mesh,
        x: alongX ? along : laneLine,
        z: alongX ? laneLine : along,
        heading: alongX ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI),
        speed: range(random, 9, 17),
        alongX,
        dir,
        laneLine,
        modelIndex,
        damage: 0,
        stolen: false,
      };
      mesh.position.set(car.x, 0, car.z);
      mesh.rotation.y = car.heading - Math.PI / 2;
      scene.add(mesh);
      this.cars.push(car);
    }

    for (let i = 0; i < countPeds; i++) {
      const mesh = buildPedestrian(random);
      const alongZ = random() > 0.5;
      const road = Math.floor(range(random, WORLD.gridMin, WORLD.gridMax + 1)) * WORLD.gridStep;
      const side = random() > 0.5 ? 1 : -1;
      const walkLine = road + side * (WORLD.roadWidth / 2 + 2.2);
      const along = range(random, -this.limit, this.limit);
      const ped = {
        mesh,
        x: alongZ ? walkLine : along,
        z: alongZ ? along : walkLine,
        heading: alongZ ? 0 : Math.PI / 2,
        speed: range(random, 1.4, 2.6),
        walkLine,
        alongZ,
        fleeTimer: 0,
        gait: random() * 10,
      };
      mesh.position.set(ped.x, 0, ped.z);
      scene.add(mesh);
      this.pedestrians.push(ped);
    }
  }

  removeCar(car) {
    this.scene.remove(car.mesh);
    const index = this.cars.indexOf(car);
    if (index >= 0) this.cars.splice(index, 1);
  }

  respawnCar(car) {
    const alongX = this.random() > 0.5;
    const dir = this.random() > 0.5 ? 1 : -1;
    const laneLine = Math.floor(range(this.random, WORLD.gridMin, WORLD.gridMax + 1)) * WORLD.gridStep
      + dir * (WORLD.roadWidth / 2 - 3.4);
    car.alongX = alongX;
    car.dir = dir;
    car.laneLine = laneLine;
    car.x = alongX ? range(this.random, -this.limit, this.limit) : laneLine;
    car.z = alongX ? laneLine : range(this.random, -this.limit, this.limit);
    car.heading = alongX ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
    car.speed = range(this.random, 9, 17);
    car.damage = 0;
    car.mesh.visible = true;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.heading + Math.PI;
  }

  update(dt, player) {
    this.time += dt;
    for (const car of this.cars) {
      const step = car.speed * dt * car.dir;
      if (car.alongX) car.x += step; else car.z += step;
      if (car.alongX ? Math.abs(car.x) > this.limit : Math.abs(car.z) > this.limit) this.respawnCar(car);
      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = car.heading + Math.PI;
      for (const w of car.mesh.userData.wheels) w.rotation.y += car.speed * dt * 1.6;
    }

    const px = player.x;
    const pz = player.z;
    for (const ped of this.pedestrians) {
      const dx = ped.x - px;
      const dz = ped.z - pz;
      const dist = Math.hypot(dx, dz);
      if (dist < 15 && player.speed !== undefined && Math.abs(player.speed) > 6) ped.fleeTimer = 1.6;
      else if (dist < 9) ped.fleeTimer = 1.0;
      const fleeing = ped.fleeTimer > 0;
      if (fleeing) {
        ped.fleeTimer -= dt;
        const inv = 1 / Math.max(0.01, dist);
        ped.x += dx * inv * 7.5 * dt;
        ped.z += dz * inv * 7.5 * dt;
        ped.heading = Math.atan2(dx, dz) + Math.PI;
      } else {
        const step = ped.speed * dt;
        if (ped.alongZ) ped.z += step; else ped.x += step;
        const pos = ped.alongZ ? ped.z : ped.x;
        if (Math.abs(pos) > this.limit) {
          if (ped.alongZ) ped.z = -this.limit; else ped.x = -this.limit;
        }
      }
      ped.gait += dt * (fleeing ? 13 : 6);
      ped.mesh.position.set(ped.x, 0, ped.z);
      ped.mesh.rotation.y = ped.heading;
      const swing = Math.sin(ped.gait) * (fleeing ? 0.7 : 0.35);
      const { legs, arms } = ped.mesh.userData;
      if (legs[0]) legs[0].rotation.z = swing;
      if (legs[1]) legs[1].rotation.z = -swing;
      if (arms[0]) arms[0].rotation.z = -swing;
      if (arms[1]) arms[1].rotation.z = swing;
    }
  }

  nearestCar(x, z, radius = 6) {
    let best = null;
    let bestD = radius;
    for (const car of this.cars) {
      const d = Math.hypot(car.x - x, car.z - z);
      if (d < bestD) { best = car; bestD = d; }
    }
    return best;
  }
}
