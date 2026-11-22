// Costa Vela police: wanted levels 1-5, cruisers, a RAM/PIT unit, roadblocks,
// a helicopter with a tracking spotlight and a SWAT van at five stars.

import * as THREE from 'three';
import { WORLD } from './config.js';
import { buildCarMesh, buildHelicopter } from './vehicles.js';
import { range } from './random.js';

const STATUS_LABELS = {
  CRUISER: 'PATROL',
  RAM: 'RAMMING',
  ROADBLOCK: 'ROADBLOCK',
  HELI: 'SPOTLIGHT',
  SWAT: 'FIRING',
};

export class PoliceSystem {
  constructor(scene, random) {
    this.scene = scene;
    this.random = random;
    this.wanted = 0;
    this.units = [];
    this.roadblock = null;
    this.escapeTimer = 0;
    this.ensureTimer = 0;
    this.time = 0;
    this.flashTime = 0;
    this.nextId = 1;
  }

  setWanted(level) {
    const next = Math.max(0, Math.min(5, Math.round(level)));
    if (next > this.wanted) this.escapeTimer = 0;
    this.wanted = next;
    this.ensureUnits(this.lastPlayer);
  }

  addWanted(n = 1) { this.setWanted(this.wanted + n); }

  clearWanted() {
    this.wanted = 0;
    for (const unit of this.units) this.scene.remove(unit.mesh);
    this.units = [];
    if (this.roadblock) this.scene.remove(this.roadblock.mesh);
    this.roadblock = null;
  }

  targetComposition() {
    switch (this.wanted) {
      case 0: return {};
      case 1: return { CRUISER: 1 };
      case 2: return { CRUISER: 2 };
      case 3: return { CRUISER: 2, HELI: 1 };
      case 4: return { CRUISER: 3, RAM: 1, HELI: 1, ROADBLOCK: 1 };
      case 5: return { CRUISER: 3, RAM: 1, HELI: 1, ROADBLOCK: 1, SWAT: 1 };
      default: return {};
    }
  }

  spawnUnit(type, player) {
    const angle = range(this.random, 0, Math.PI * 2);
    const radius = range(this.random, 70, 110);
    const px = player.x + Math.sin(angle) * radius;
    const pz = player.z + Math.cos(angle) * radius;
    let mesh;
    let unit;
    if (type === 'HELI') {
      mesh = buildHelicopter();
      unit = { type, mesh, x: px, z: pz, y: 20, speed: 24, status: STATUS_LABELS.HELI };
    } else if (type === 'ROADBLOCK') {
      mesh = this.buildRoadblockMesh(player);
      unit = { type, mesh, x: mesh.userData.center.x, z: mesh.userData.center.z, speed: 0, status: STATUS_LABELS.ROADBLOCK };
      this.roadblock = unit;
    } else {
      const swat = type === 'SWAT';
      const color = swat ? 0x26282e : 0xe8e9ec;
      mesh = buildCarMesh(color, swat ? 'van' : type === 'RAM' ? 'muscle' : 'sedan', true, swat);
      if (type === 'RAM') {
        const ram = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.7, 3.0),
          new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 0.35, metalness: 0.7 }),
        );
        ram.position.set(2.6, 1.0, 0);
        mesh.add(ram);
      }
      unit = {
        type, mesh, x: px, z: pz, y: 0,
        speed: swat ? 22 : type === 'RAM' ? 32 : 27,
        status: STATUS_LABELS[type],
        heading: Math.atan2(player.x - px, player.z - pz),
        orbit: range(this.random, 0, Math.PI * 2),
      };
    }
    unit.id = this.nextId++;
    unit.name = this.unitName(type, unit.id);
    this.scene.add(mesh);
    mesh.position.set(unit.x, unit.y ?? 0, unit.z);
    this.units.push(unit);
    return unit;
  }

  unitName(type, id) {
    const names = {
      CRUISER: ['BLUE UNIT', 'COAST PATROL', 'DISTRICT CAR'],
      RAM: ['PIT UNIT 12'],
      ROADBLOCK: ['TACTICAL BARRIER'],
      HELI: ['SKYWATCH 1'],
      SWAT: ['SWAT BREAKER'],
    };
    const list = names[type] ?? ['UNIT'];
    return `${list[(id - 1) % list.length]}${type === 'CRUISER' ? ' ' + String.fromCharCode(64 + id) : ''}`;
  }

  buildRoadblockMesh(player) {
    const group = new THREE.Group();
    const gridStep = WORLD.gridStep;
    const rx = Math.round(player.x / gridStep) * gridStep;
    const rz = Math.round((player.z + 55) / gridStep) * gridStep;
    const acrossX = Math.abs(player.x - rx) < Math.abs(player.z - rz);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff7a2f, emissive: 0x8a2f00, emissiveIntensity: 0.4 });
    for (const offset of [-14, 0, 14]) {
      const mesh = buildCarMesh(0xe8e9ec, 'sedan', true);
      if (acrossX) { mesh.position.set(rx + offset, 0, rz); mesh.rotation.y = 0; }
      else { mesh.position.set(rx, 0, rz + offset); mesh.rotation.y = Math.PI / 2; }
      group.add(mesh);
      for (const k of [-1, 1]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 8), coneMat);
        cone.position.set(acrossX ? rx + offset + k * 4 : rx + k * 4, 1, acrossX ? rz + 5 : rz + offset + 5);
        group.add(cone);
      }
    }
    group.position.set(0, 0, 0);
    group.userData.center = { x: rx, z: rz };
    return group;
  }

  ensureUnits(player) {
    if (!player) return;
    const target = this.targetComposition();
    for (const [type, count] of Object.entries(target)) {
      const have = this.units.filter((u) => u.type === type).length;
      for (let i = have; i < count; i++) this.spawnUnit(type, player);
    }
    const wantedTypes = new Set(Object.keys(target));
    for (let i = this.units.length - 1; i >= 0; i--) {
      if (!wantedTypes.has(this.units[i].type)) {
        this.scene.remove(this.units[i].mesh);
        this.units.splice(i, 1);
      }
    }
  }

  update(dt, player) {
    this.lastPlayer = player;
    this.time += dt;
    this.flashTime += dt;
    this.ensureTimer -= dt;
    if (this.ensureTimer <= 0) {
      this.ensureTimer = 0.5;
      this.ensureUnits(player);
    }
    if (this.wanted === 0) return;

    const flashes = this.flashTime % 0.7 < 0.35;
    for (const unit of this.units) {
      if (unit.type === 'ROADBLOCK') continue;
      const dx = player.x - unit.x;
      const dz = player.z - unit.z;
      const dist = Math.hypot(dx, dz);

      if (unit.type === 'HELI') {
        unit.orbit += dt * 0.5;
        const tx = player.x + Math.sin(unit.orbit) * 55;
        const tz = player.z + Math.cos(unit.orbit) * 55;
        unit.x += (tx - unit.x) * Math.min(1, dt * 0.9);
        unit.z += (tz - unit.z) * Math.min(1, dt * 0.9);
        unit.y += (20 - unit.y) * Math.min(1, dt * 0.8);
        unit.mesh.position.set(unit.x, unit.y, unit.z);
        unit.mesh.rotation.y = Math.atan2(-dx, -dz);
        if (unit.mesh.userData.rotor) unit.mesh.userData.rotor.rotation.y += dt * 22;
        if (unit.mesh.userData.tailRotor) unit.mesh.userData.tailRotor.rotation.x += dt * 30;
        const spotlight = unit.mesh.userData.spotlight;
        if (spotlight) {
          unit.mesh.updateMatrixWorld();
          const local = unit.mesh.worldToLocal(new THREE.Vector3(player.x, 0, player.z));
          spotlight.target.position.copy(local);
          spotlight.intensity = 90;
        }
        unit.status = 'SPOTLIGHT';
        continue;
      }

      // Ground units steer toward the player, with a little separation so they do not stack.
      let sepX = 0;
      let sepZ = 0;
      for (const other of this.units) {
        if (other === unit || other.y > 0 || other.type === 'ROADBLOCK') continue;
        const ox = unit.x - other.x;
        const oz = unit.z - other.z;
        const od = Math.hypot(ox, oz);
        if (od > 0.1 && od < 14) { sepX += ox / od; sepZ += oz / od; }
      }
      const desired = Math.atan2(dx + sepX * 8, dz + sepZ * 8);
      let diff = desired - unit.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      unit.heading += diff * Math.min(1, dt * 2.6);
      const boost = unit.type === 'RAM' && dist < 45 ? 1.2 : 1;
      unit.x += Math.sin(unit.heading) * unit.speed * boost * dt;
      unit.z += Math.cos(unit.heading) * unit.speed * boost * dt;
      unit.mesh.position.set(unit.x, 0, unit.z);
      unit.mesh.rotation.y = unit.heading - Math.PI / 2;
      if (unit.mesh.userData.wheels) {
        for (const w of unit.mesh.userData.wheels) w.rotation.y += unit.speed * dt * 1.6;
      }
      if (unit.mesh.userData.flashers && flashes) {
        unit.mesh.userData.flashers[0].emissiveIntensity = 3;
        unit.mesh.userData.flashers[1].emissiveIntensity = 0.2;
      } else if (unit.mesh.userData.flashers) {
        unit.mesh.userData.flashers[0].emissiveIntensity = 0.2;
        unit.mesh.userData.flashers[1].emissiveIntensity = 3;
      }
      if (unit.type === 'RAM') unit.status = dist < 40 ? 'RAMMING' : 'INTERCEPT';
      else if (unit.type === 'SWAT') unit.status = dist < 60 ? 'FIRING' : 'ADVANCING';
      else unit.status = dist < 35 ? 'PURSUIT' : 'PATROL';

      if (dist > 320 && unit.type !== 'ROADBLOCK') {
        const angle = range(this.random, 0, Math.PI * 2);
        unit.x = player.x + Math.sin(angle) * 100;
        unit.z = player.z + Math.cos(angle) * 100;
      }
    }

    // Losing the pursuit lowers the wanted level after a quiet interval.
    const nearest = Math.min(...this.units.filter((u) => u.type !== 'ROADBLOCK').map((u) => Math.hypot(u.x - player.x, u.z - player.z)));
    if (nearest > 85) this.escapeTimer += dt; else this.escapeTimer = Math.max(0, this.escapeTimer - dt * 0.5);
    if (this.escapeTimer > 14) {
      this.setWanted(this.wanted - 1);
      this.escapeTimer = 0;
    }
  }

  responseRows(player) {
    return this.units
      .map((unit) => ({
        name: unit.name,
        status: unit.status,
        distance: Math.round(Math.hypot(unit.x - player.x, unit.z - player.z)),
        type: unit.type,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }
}
