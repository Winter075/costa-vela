// Traffic cars follow rectangular loops on the road grid. Pedestrians use the
// sidewalks and scatter when the player gets too close.
import * as THREE from 'three';
import { VEHICLES } from './config.js';
import { ROAD_X, ROAD_Z } from './world.js';
import { makeVehicle, placeVehicle } from './vehicles.js';
import { randomPick, randomRange } from './random.js';

function makePedestrian(color) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc99b74 });
  const trousers = new THREE.MeshLambertMaterial({ color: 0x353b46 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.05, 0.42), shirt);
  body.position.y = 1.35;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), skin);
  head.position.y = 2.1;
  group.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), trousers);
    leg.position.set(side * 0.18, 0.45, 0);
    group.add(leg);
  }
  return group;
}

export function createTraffic(scene) {
  const cars = [];
  const peds = [];
  const loops = [];

  for (let i = 0; i < ROAD_X.length - 1; i += 1) {
    for (let j = 0; j < ROAD_Z.length - 1; j += 1) {
      loops.push([
        [ROAD_X[i], ROAD_Z[j]],
        [ROAD_X[i + 1], ROAD_Z[j]],
        [ROAD_X[i + 1], ROAD_Z[j + 1]],
        [ROAD_X[i], ROAD_Z[j + 1]],
      ]);
    }
  }

  for (let i = 0; i < 22; i += 1) {
    const loop = randomPick(loops);
    const spec = randomPick(VEHICLES);
    const vehicle = makeVehicle(spec, loop[0][0], loop[0][1], 0);
    vehicle.loop = loop;
    vehicle.segment = Math.floor(randomRange(0, 4));
    vehicle.progress = randomRange(0, 1);
    vehicle.cruise = randomRange(13, 23);
    scene.add(vehicle.mesh);
    cars.push(vehicle);
  }

  const shirtColors = [0xe0a45c, 0x6f9fc4, 0xc07d8d, 0x86b58c, 0xe2d3ae, 0x8d7fb3];
  for (let i = 0; i < 30; i += 1) {
    const onVertical = i % 2 === 0;
    const x = onVertical ? randomPick(ROAD_X) + (i % 2 ? 12.5 : -12.5) : randomRange(-200, 200);
    const z = onVertical ? randomRange(-190, 105) : randomPick(ROAD_Z) + (i % 2 ? 12.5 : -12.5);
    const mesh = makePedestrian(randomPick(shirtColors));
    mesh.position.set(x, 0.2, z);
    scene.add(mesh);
    const angle = randomRange(0, Math.PI * 2);
    peds.push({
      mesh,
      x,
      z,
      vx: Math.cos(angle) * randomRange(1.1, 2.2),
      vz: Math.sin(angle) * randomRange(1.1, 2.2),
      phase: randomRange(0, 6),
      fleeing: 0,
    });
  }

  function update(dt, ctx) {
    const playerX = ctx.state.x;
    const playerZ = ctx.state.z;

    for (const vehicle of cars) {
      if (vehicle.driven) continue;
      const from = vehicle.loop[vehicle.segment];
      const to = vehicle.loop[(vehicle.segment + 1) % vehicle.loop.length];
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const length = Math.hypot(dx, dz) || 1;
      const speed = vehicle.cruise * (vehicle.stolen ? 0 : 1);
      vehicle.progress += (dt * speed) / length;
      if (vehicle.progress >= 1) {
        vehicle.progress -= 1;
        vehicle.segment = (vehicle.segment + 1) % vehicle.loop.length;
      }
      const current = vehicle.loop[vehicle.segment];
      const next = vehicle.loop[(vehicle.segment + 1) % vehicle.loop.length];
      vehicle.x = current[0] + (next[0] - current[0]) * vehicle.progress;
      vehicle.z = current[1] + (next[1] - current[1]) * vehicle.progress;
      vehicle.yaw = Math.atan2(next[0] - current[0], next[1] - current[1]);
      vehicle.speed = speed;
      vehicle.wheelSpin += dt * speed * 1.4;
      placeVehicle(vehicle);
    }

    for (const ped of peds) {
      const dx = ped.x - playerX;
      const dz = ped.z - playerZ;
      const distance = Math.hypot(dx, dz);
      const threatened = distance < (ctx.state.crewAbility === 'Intimidate' ? 21 : 13);
      if (threatened) {
        const force = 1 / Math.max(2, distance);
        ped.vx += dx * force * dt * 7;
        ped.vz += dz * force * dt * 7;
        ped.fleeing = 1;
      } else {
        ped.fleeing = Math.max(0, ped.fleeing - dt);
      }
      const magnitude = Math.hypot(ped.vx, ped.vz) || 1;
      const targetSpeed = threatened ? 6.5 : 1.8;
      ped.vx = (ped.vx / magnitude) * targetSpeed;
      ped.vz = (ped.vz / magnitude) * targetSpeed;
      ped.x += ped.vx * dt;
      ped.z += ped.vz * dt;
      ped.x = Math.max(-215, Math.min(215, ped.x));
      ped.z = Math.max(-205, Math.min(122, ped.z));
      ped.phase += dt * (threatened ? 13 : 6);
      ped.mesh.position.set(ped.x, 0.2 + Math.abs(Math.sin(ped.phase)) * 0.08, ped.z);
      ped.mesh.rotation.y = Math.atan2(ped.vx, ped.vz);
    }
  }

  return { cars, peds, update };
}
