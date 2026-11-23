// traffic.js — civil cars on the avenues and walkers who scatter near the player.

import * as THREE from 'three';
import { WORLD } from './config.js';

function makeWalker(coatColor, random) {
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc99a72, roughness: 0.95 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.15, 4, 8), cloth);
  torso.position.y = 1.35;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), skin);
  head.position.y = 2.35;
  group.add(head);
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 6), cloth);
    leg.position.set(side * 0.2, 0.48, 0);
    group.add(leg);
    legs.push(leg);
  }
  group.rotation.y = random.range(0, Math.PI * 2);
  return { group, legs, torso };
}

export class TrafficSystem {
  constructor(scene, fleet, random) {
    this.scene = scene;
    this.fleet = fleet;
    this.random = random;
    this.cars = fleet.spawnTraffic(18);
    this.pedestrians = [];
    this.spawnPedestrians(38);
  }

  spawnPedestrians(count) {
    const coats = [0xe4705a, 0x4fa9b8, 0xe8c15b, 0x8b6bb0, 0x6fae7a, 0xd8d2c4];
    for (let i = 0; i < count; i++) {
      const avenue = this.random.pick(WORLD.roadLines);
      const alongX = this.random.chance(0.5);
      const sidewalkSide = this.random.chance(0.5) ? 1 : -1;
      const p = this.random.range(-330, 330);
      const walker = makeWalker(this.random.pick(coats), this.random);
      walker.group.position.set(
        alongX ? p : avenue + sidewalkSide * 11.5,
        0,
        alongX ? avenue + sidewalkSide * 11.5 : p,
      );
      walker.axis = alongX ? 'x' : 'z';
      walker.direction = this.random.chance(0.5) ? 1 : -1;
      walker.speed = this.random.range(1.4, 2.6);
      walker.fleeTimer = 0;
      walker.phase = this.random.range(0, 6);
      this.scene.add(walker.group);
      this.pedestrians.push(walker);
    }
  }

  update(dt, elapsed, player, playerSpeed) {
    for (const car of this.cars) {
      if (car.parked) continue;
      const cruise = 11 + (car.model.topSpeed - 28) * 0.22;
      car.speed = THREE.MathUtils.lerp(car.speed, cruise, dt * 0.9);

      const pos = car.position;
      if (Math.abs(pos.x) > 350 || Math.abs(pos.z) > 350) {
        pos.x = THREE.MathUtils.clamp(pos.x, -345, 345);
        pos.z = THREE.MathUtils.clamp(pos.z, -345, 345);
        car.group.rotation.y += Math.PI;
      }

      const probe = new THREE.Vector3(
        pos.x + Math.sin(car.group.rotation.y) * 14, 0,
        pos.z + Math.cos(car.group.rotation.y) * 14,
      );
      let obstructed = false;
      for (const other of this.fleet.vehicles) {
        if (other !== car && other.position.distanceTo(probe) < 5.5) { obstructed = true; break; }
      }
      if (obstructed) car.speed = Math.min(car.speed, 3);
      car.update(dt, { throttle: car.speed < cruise ? 1 : 0 });
    }

    for (const walker of this.pedestrians) {
      const dx = walker.group.position.x - player.x;
      const dz = walker.group.position.z - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 16 || (distance < 24 && playerSpeed > 18)) walker.fleeTimer = 2.4;
      walker.fleeTimer = Math.max(0, walker.fleeTimer - dt);
      const scared = walker.fleeTimer > 0;
      const pace = walker.speed * (scared ? 2.7 : 1);

      if (scared) {
        const away = Math.atan2(dx, dz);
        walker.group.rotation.y = away;
        walker.group.position.x += Math.sin(away) * pace * dt;
        walker.group.position.z += Math.cos(away) * pace * dt;
      } else {
        const axis = walker.axis;
        walker.group.position[axis] += walker.direction * pace * dt;
        walker.group.rotation.y = axis === 'x'
          ? (walker.direction > 0 ? Math.PI / 2 : -Math.PI / 2)
          : (walker.direction > 0 ? 0 : Math.PI);
        if (Math.abs(walker.group.position[axis]) > 345) walker.direction *= -1;
      }
      walker.phase += dt * (scared ? 13 : 7);
      walker.legs[0].rotation.x = Math.sin(walker.phase) * 0.5;
      walker.legs[1].rotation.x = -Math.sin(walker.phase) * 0.5;
    }
  }
}
