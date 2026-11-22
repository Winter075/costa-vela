// Moving traffic and sidewalk pedestrians. Pedestrians run when the player nears.

import * as THREE from 'three';
import { WORLD, VEHICLES } from './config.js';
import { makeRandom } from './random.js';
import { createVehicle, placeVehicle } from './vehicles.js';

function makePedestrian(color) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb98a68, roughness: 1 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x39424c, roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.95, 0.34), shirt);
  body.position.y = 1.28;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), skin);
  head.position.y = 1.98;
  group.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.2), trousers);
    leg.position.set(side * 0.16, 0.4, 0);
    group.add(leg);
  }
  return group;
}

export function createTraffic(scene, world) {
  const random = makeRandom(77123);
  const cars = [];
  const peds = [];
  const colors = [0xd8dedf, 0x4f6f86, 0xc25d48, 0x7f9a68, 0xe0b45c, 0x766a91];

  for (let i = 0; i < 16; i += 1) {
    const vertical = random.chance(0.5);
    const lane = random.pick([-1, 1]) * (WORLD.roadHalf - 2);
    const value = vertical
      ? Math.round(random.range(-WORLD.halfX, WORLD.halfX) / WORLD.gridStep) * WORLD.gridStep
      : Math.round(random.range(WORLD.southZ, WORLD.northZ) / WORLD.gridStep) * WORLD.gridStep;
    const spec = VEHICLES[random.int(0, 11)];
    const x = vertical ? value + lane : random.range(-WORLD.halfX, WORLD.halfX);
    const z = vertical ? random.range(WORLD.southZ, WORLD.northZ) : value + lane;
    const car = createVehicle(spec, x, z, vertical ? (lane > 0 ? Math.PI / 2 : -Math.PI / 2) : (lane > 0 ? 0 : Math.PI));
    car.axis = vertical ? 'z' : 'x';
    car.lane = value;
    car.direction = lane > 0 ? 1 : -1;
    car.cruise = random.range(14, 23);
    scene.add(car.mesh);
    placeVehicle(car);
    cars.push(car);
  }

  for (let i = 0; i < 26; i += 1) {
    const horizontal = random.chance(0.5);
    const laneSide = random.pick([-1, 1]) * (WORLD.roadHalf + 1.4);
    const street = Math.round(random.range(-WORLD.halfX, WORLD.halfX) / WORLD.gridStep) * WORLD.gridStep;
    const cross = Math.round(random.range(WORLD.southZ, WORLD.northZ) / WORLD.gridStep) * WORLD.gridStep;
    const mesh = makePedestrian(random.pick(colors));
    const ped = {
      mesh,
      x: horizontal ? random.range(-WORLD.halfX, WORLD.halfX) : street + laneSide,
      z: horizontal ? cross + laneSide : random.range(WORLD.southZ, WORLD.northZ),
      horizontal,
      laneSide,
      street,
      speed: random.range(1.1, 2.1),
      direction: random.pick([-1, 1]),
      fleeing: 0,
    };
    mesh.position.set(ped.x, 0, ped.z);
    scene.add(mesh);
    peds.push(ped);
  }

  function moveCar(car, dt, ctx) {
    const player = ctx.state;
    const distance = Math.hypot(player.x - car.x, player.z - car.z);
    const alarmed = ctx.state.wanted > 0 && distance < 55;
    let speed = alarmed ? car.cruise * 1.7 : car.cruise;
    if (distance < 13 && !ctx.state.car) speed *= 0.2;
    car.speed += (speed - car.speed) * Math.min(1, dt * 2);
    if (car.axis === 'z') {
      car.z += car.direction * car.speed * dt;
      if (car.z > WORLD.northZ + 40) car.z = WORLD.southZ - 30;
      if (car.z < WORLD.southZ - 40) car.z = WORLD.northZ + 30;
    } else {
      car.x += car.direction * car.speed * dt;
      if (car.x > WORLD.halfX + 40) car.x = -WORLD.halfX - 30;
      if (car.x < -WORLD.halfX - 40) car.x = WORLD.halfX + 30;
    }
    car.wheelSpin += car.speed * dt * 1.6;
    placeVehicle(car);
  }

  function movePed(ped, dt, ctx) {
    const player = ctx.state;
    const distance = Math.hypot(player.x - ped.x, player.z - ped.z);
    if (distance < 14 && (player.wanted > 0 || !player.car)) ped.fleeing = 2.4;
    if (ped.fleeing > 0) ped.fleeing -= dt;
    const pace = ped.fleeing > 0 ? ped.speed * 3.2 : ped.speed;
    if (ped.horizontal) {
      ped.x += ped.direction * pace * dt;
      if (ped.x > WORLD.halfX || ped.x < -WORLD.halfX) ped.direction *= -1;
      ped.z += (ped.street + ped.laneSide - ped.z) * Math.min(1, dt * 2);
      ped.mesh.rotation.y = ped.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      ped.z += ped.direction * pace * dt;
      if (ped.z > WORLD.northZ || ped.z < WORLD.southZ) ped.direction *= -1;
      ped.x += (ped.street + ped.laneSide - ped.x) * Math.min(1, dt * 2);
      ped.mesh.rotation.y = ped.direction > 0 ? 0 : Math.PI;
    }
    ped.mesh.position.set(ped.x, ped.fleeing > 0 ? Math.abs(Math.sin(ped.fleeing * 12)) * 0.18 : 0, ped.z);
  }

  function update(dt, ctx) {
    for (const car of cars) moveCar(car, dt, ctx);
    for (const ped of peds) movePed(ped, dt, ctx);
  }

  function targets() {
    const list = [];
    for (const car of cars) list.push({ root: car.mesh, onHit: (damage) => { car.damage = Math.min(120, car.damage + damage * 0.5); } });
    for (const ped of peds) list.push({ root: ped.mesh, onHit: () => { ped.fleeing = 3.5; } });
    return list;
  }

  return { cars, peds, update, targets, random };
}
