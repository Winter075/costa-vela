// Wanted levels and the units that answer them: cruisers, RAM, roadblocks, air support and SWAT.

import * as THREE from 'three';
import { RESPONSE_UNITS, VEHICLES } from './config.js';
import { Vehicle, buildCarMesh } from './vehicles.js';

const CRUISER = { body: 0xe9ece8, accent: 0x1f3f74, top: 190, grip: 1.05 };
const RAM = { body: 0x253044, accent: 0xe0a03c, top: 215, grip: 1.1 };
const SWAT = { body: 0x303840, accent: 0x14181c, top: 170, grip: 1.12 };

export class PoliceSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.wanted = 0;
    this.units = [];
    this.heat = 0;
    this.specs = RESPONSE_UNITS.slice();
  }

  setWanted(level, force = false) {
    const next = Math.max(0, Math.min(5, Math.round(level)));
    if (next === this.wanted && !force) return;
    this.wanted = next;
    this.heat = Math.max(this.heat, next * 20);
    if (next === 0) {
      for (const u of this.units) this.scene.remove(u.mesh || u.vehicle.mesh);
      this.units = [];
      return;
    }
    const minimums = { cruiser: 1, ram: 5, block: 3, heli: 4, swat: 5 };
    for (const spec of this.specs) {
      const need = minimums[spec.kind];
      if (next >= need && !this.units.some((u) => u.name === spec.name)) this.spawn(spec);
    }
  }

  spawn(spec) {
    if (spec.kind === 'heli') {
      const g = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 6), new THREE.MeshLambertMaterial({ color: 0x1d2733 }));
      shell.scale.set(1, 0.7, 1.8);
      g.add(shell);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0x1d2733 }));
      tail.position.z = -4.2;
      g.add(tail);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 0.5), new THREE.MeshBasicMaterial({ color: 0x2a2f36 }));
      rotor.position.y = 1.5;
      g.add(rotor);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(8, 42, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffdca0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
      );
      beam.position.y = -21;
      g.add(beam);
      g.userData.rotor = rotor;
      this.scene.add(g);
      this.units.push({ name: spec.name, kind: spec.kind, mesh: g, status: spec.status, speed: 22 });
      return;
    }

    const template = spec.kind === 'ram' ? RAM : spec.kind === 'swat' ? SWAT : CRUISER;
    if (spec.kind === 'block') {
      const mesh = buildCarMesh(template, null, { roadblock: true, police: true });
      this.scene.add(mesh);
      const barrier = {
        mesh, pos: mesh.position, heading: 0, damage: 0,
        place(x, z, heading = 0) {
          this.pos.set(x, 0, z);
          this.heading = heading;
          this.mesh.rotation.y = heading;
        },
        hit(amount) { this.damage = Math.min(100, this.damage + amount); return this.damage; },
      };
      this.units.push({ name: spec.name, kind: spec.kind, vehicle: barrier, mesh, status: spec.status, speed: 0 });
      return;
    }
    const v = new Vehicle(template, null, this.scene, { police: true });
    this.units.push({
      name: spec.name, kind: spec.kind, vehicle: v, mesh: v.mesh,
      status: spec.status, speed: spec.kind === 'ram' ? 30 : 22,
    });
  }

  trigger(x, z, amount = 1) {
    this.heat = Math.min(120, this.heat + amount * 18);
    if (this.heat > this.wanted * 20) this.setWanted(this.wanted + 1);
  }

  calm(dt) {
    this.heat = Math.max(0, this.heat - dt * 5);
    if (this.heat <= 0 && this.wanted > 0) {
      this.setWanted(this.wanted - 1);
      this.heat = 22;
    }
  }

  update(dt, playerPos, playerVehicle, time) {
    if (this.wanted > 0 && !playerVehicle) this.calm(dt);
    for (const u of this.units) {
      if (u.kind === 'heli') {
        const a = time * 0.35;
        u.mesh.position.set(playerPos.x + Math.cos(a) * 34, 42 + Math.sin(a * 2) * 3, playerPos.z + Math.sin(a) * 34);
        u.mesh.rotation.y = -a;
        u.mesh.userData.rotor.rotation.y += dt * 18;
        u.mesh.lookAt(playerPos.x, 8, playerPos.z);
        u.status = 'SPOTLIGHT';
        continue;
      }
      const v = u.vehicle;
      if (u.kind === 'block') {
        u.status = 'ROADBLOCK';
        continue;
      }
      const dx = playerPos.x - v.pos.x;
      const dz = playerPos.z - v.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 6) {
        const wantedHeading = Math.atan2(dx, dz);
        let diff = wantedHeading - v.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        v.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
        v.drive(dt, { throttle: true, brake: false, steer: 0, handbrake: false });
        v.speed = Math.max(v.speed, u.speed);
      } else {
        v.speed *= 0.94;
      }
      u.status = u.kind === 'ram' ? (dist < 22 ? 'RAMMING' : 'INTERCEPT')
        : u.kind === 'swat' ? (dist < 40 ? 'FIRING' : 'ADVANCING')
          : (dist < 30 ? 'PURSUIT' : 'PATROL');
      if (dist > 320) v.place(playerPos.x - dx * 0.2, playerPos.z - dz * 0.2, v.heading);
    }
  }

  deployRoadblock(playerPos) {
    if (this.wanted < 3 || this.units.some((u) => u.kind === 'block' && u.deployed)) return;
    const blocks = this.units.filter((u) => u.kind === 'block');
    const ahead = 70;
    blocks.forEach((u, i) => {
      const v = u.vehicle;
      v.place(playerPos.x + (i - 1) * 6, playerPos.z + ahead, Math.PI / 2);
      v.speed = 0;
      u.deployed = true;
    });
  }

  report(playerPos) {
    return this.units.map((u) => {
      const p = u.kind === 'heli' ? u.mesh.position : u.vehicle.pos;
      const dist = Math.round(Math.hypot(p.x - playerPos.x, p.z - playerPos.z));
      return { name: u.name, status: u.status, dist, active: this.wanted > 0 };
    });
  }
}
