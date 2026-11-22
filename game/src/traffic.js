// traffic.js — civilian traffic lanes and sidewalk pedestrians who react to the player.

import * as THREE from 'three';
import { WORLD } from './config.js';

function createPedestrianMesh(color, random) {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc99a72, roughness: 0.95 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.15, 4, 8), coat);
  torso.position.y = 1.35;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), skin);
  head.position.y = 2.35;
  group.add(head);
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 6), coat);
    leg.position.set(sx * 0.2, 0.48, 0);
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
    const colors = [0xe4705a, 0x4fa9b8, 0xe8c15b, 0x8b6bb0, 0x6fae7a, 0xd8d2c4];
    for (let i = 0; i < count; i++) {
      const line = this.random.pick(WORLD.roadLines);
      const alongX = this.random.chance(0.5);
      const p = this.random.range(-330, 330);
      const side = this.random.chance(0.5) ? 1 : -1;
      const x = alongX ? p : line + side * 11.5;
      const z = alongX ? line + side * 11.5 : p;
      const walker = createPedestrianMesh(this.random.pick(colors), this.random);
      walker.group.position.set(x, 0, z);
      walker.axis = alongX ? 'x' : 'z';
      walker.direction = this.random.chance(0.5) ? 1 : -1;
      walker.speed = this.random.range(1.4, 2.6);
      walker.fleeTimer = 0;
      walker.phase = this.random.range(0, 6);
      this.scene.add(walker.group);
      this.pedestrians.push(walker);
    }
  }

  update(dt, elapsed, playerPosition, playerSpeed) {
    for (const car of this.cars) {
      const cruise = 11 + (car.model.topSpeed - 28) * 0.22;
      if (!car.parked) {
        car.speed = THREE.MathUtils.lerp(car.speed, cruise, dt * 0.9);
        const p = car.position;
        if (Math.abs(p.x) > 350 || Math.abs(p.z) > 350) {
          p.x = THREE.MathUtils.clamp(p.x, -345, 345);
          p.z = THREE.MathUtils.clamp(p.z, -345, 345);
          car.group.rotation.y += Math.PI;
        }
        const ahead = new THREE.Vector3(
          p.x + Math.sin(car.group.rotation.y) * 14,
          0,
          p.z + Math.cos(car.group.rotation.y) * 14,
        );
        let blocked = false;
        for (const other of this.fleet.vehicles) {
          if (other === car) continue;
          if (other.position.distanceTo(ahead) < 5.5) { blocked = true; break; }
        }
        car.speed = blocked ? Math.min(car.speed, 3) : car.speed;
        car.update(dt, { throttle: car.speed < cruise ? 1 : 0 });
      }
    }

    for (const ped of this.pedestrians) {
      const distance = Math.hypot(ped.group.position.x - playerPosition.x, ped.group.position.z - playerPosition.z);
      if (distance < 16 || (distance < 24 && playerSpeed > 18)) ped.fleeTimer = 2.4;
      ped.fleeTimer = Math.max(0, ped.fleeTimer - dt);
      const fleeing = ped.fleeTimer > 0;
      const speed = fleeing ? ped.speed * 2.7 : ped.speed;
      if (fleeing) {
        const dx = ped.group.position.x - playerPosition.x;
        const dz = ped.group.position.z - playerPosition.z;
        const angle = Math.atan2(dx, dz);
        ped.group.rotation.y = angle;
        ped.group.position.x += Math.sin(angle) * speed * dt;
        ped.group.position.z += Math.cos(angle) * speed * dt;
      } else {
        const axis = ped.axis === 'x' ? 'x' : 'z';
        ped.group.position[axis] += ped.direction * speed * dt;
        ped.group.rotation.y = ped.axis === 'x' ? (ped.direction > 0 ? Math.PI / 2 : -Math.PI / 2) : (ped.direction > 0 ? 0 : Math.PI);
        if (Math.abs(ped.group.position[axis]) > 345) ped.direction *= -1;
      }
      ped.phase += dt * (fleeing ? 13 : 7);
      ped.legs[0].rotation.x = Math.sin(ped.phase) * 0.5;
      ped.legs[1].rotation.x = -Math.sin(ped.phase) * 0.5;
    }
  }
}
