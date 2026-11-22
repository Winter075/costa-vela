// police.js — wanted-level escalation: cruisers, RAM, roadblocks, spotlight helicopter and SWAT.

import * as THREE from 'three';
import { WORLD, POLICE_UNIT_NAMES, unitsForWanted } from './config.js';

function wrapAngle(value) {
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function buildHelicopter(scene) {
  const group = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x2b3b4b, metalness: 0.45, roughness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd8e8, metalness: 0.6, roughness: 0.18 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), shell);
  body.scale.set(1, 0.8, 1.7);
  group.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 8), glass);
  nose.position.set(0, 0.1, 4);
  group.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 11), shell);
  tail.position.set(0, 0.5, -8);
  group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 1.6), shell);
  fin.position.set(0, 1.9, -12.5);
  group.add(fin);
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(15, 0.16, 0.7), shell);
    blade.rotation.y = (i * Math.PI) / 2;
    rotor.add(blade);
  }
  rotor.position.y = 3.1;
  group.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 0.3), shell);
  tailRotor.position.set(0.5, 1.2, -12.6);
  group.add(tailRotor);
  group.position.set(0, 48, 0);
  scene.add(group);

  const spotlight = new THREE.SpotLight(0xfff0b0, 24, 220, 0.26, 0.6, 1);
  spotlight.position.copy(group.position);
  scene.add(spotlight);
  scene.add(spotlight.target);
  const groundGlow = new THREE.Mesh(
    new THREE.CircleGeometry(7, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = 0.14;
  scene.add(groundGlow);
  return { group, rotor, tailRotor, spotlight, groundGlow };
}

export class PoliceResponse {
  constructor(scene, fleet, random) {
    this.scene = scene;
    this.fleet = fleet;
    this.random = random;
    this.wanted = 0;
    this.heat = 0;
    this.thresholds = [0, 10, 28, 50, 74, 96];
    this.units = [];
    this.roadblocks = [];
    this.helicopter = buildHelicopter(scene);
    this.helicopter.group.visible = false;
    this.helicopter.spotlight.visible = false;
    this.helicopter.groundGlow.visible = false;
    this.spotPoint = new THREE.Vector3();
    this.explosionPending = 0;
    this.elapsed = 0;
  }

  addHeat(amount) {
    this.heat = THREE.MathUtils.clamp(this.heat + amount, 0, 100);
    this.syncWanted();
  }

  syncWanted() {
    let level = 0;
    for (let i = 1; i <= 5; i++) if (this.heat >= this.thresholds[i]) level = i;
    if (level > this.wanted) this.wanted = level;
    return this.wanted;
  }

  setWanted(level) {
    this.wanted = THREE.MathUtils.clamp(level, 0, 5);
    this.heat = Math.max(this.heat, this.thresholds[this.wanted]);
    this.spawnRequired();
  }

  spawnRequired() {
    const required = unitsForWanted(this.wanted);
    for (const spec of required) {
      const have = this.units.filter((u) => u.kind === spec.kind).length;
      for (let i = have; i < spec.count; i++) this.spawnUnit(spec.kind, spec.status);
    }
  }

  spawnUnit(kind, status) {
    const modelId = kind === 'ram' ? 'ram' : kind === 'swat' ? 'bearcat' : 'bluebird';
    const angle = this.random.range(0, Math.PI * 2);
    const radius = this.random.range(55, 95);
    const vehicle = this.fleet.spawn(modelId, new THREE.Vector3(Math.sin(angle) * radius, 0, Math.cos(angle) * radius), angle + Math.PI, { role: kind });
    const unit = { kind, status, vehicle, name: POLICE_UNIT_NAMES[kind] ?? kind, ramTimer: 0 };
    this.units.push(unit);
    return unit;
  }

  spawnRoadblock(playerPosition) {
    const line = WORLD.roadLines.reduce((best, x) => Math.abs(x - playerPosition.x) < Math.abs(best - playerPosition.x) ? x : best, WORLD.roadLines[0]);
    const z = Math.max(-330, Math.min(330, playerPosition.z + 95));
    const barrier = new THREE.Group();
    const stripe = new THREE.MeshStandardMaterial({ color: 0xf2b134, roughness: 0.7 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.8 });
    for (let i = -3; i <= 3; i++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 0.9), i % 2 ? stripe : dark);
      block.position.set(i * 4.2, 0.75, 0);
      barrier.add(block);
    }
    barrier.position.set(line, 0, z);
    this.scene.add(barrier);
    const cruisers = [];
    for (const side of [-1, 1]) {
      cruisers.push(this.fleet.spawn('bluebird', new THREE.Vector3(line + side * 17, 0, z - 3), Math.PI, { role: 'roadblock' }));
    }
    this.roadblocks.push({ barrier, cruisers, name: POLICE_UNIT_NAMES.roadblock, status: 'ROADBLOCK' });
  }

  clearRoadblocks() {
    for (const block of this.roadblocks) {
      this.scene.remove(block.barrier);
      for (const car of block.cruisers) {
        this.scene.remove(car.group);
        const i = this.fleet.vehicles.indexOf(car);
        if (i >= 0) this.fleet.vehicles.splice(i, 1);
      }
    }
    this.roadblocks.length = 0;
  }

  trimUnits() {
    const allowed = Object.fromEntries(unitsForWanted(this.wanted).map((spec) => [spec.kind, spec.count]));
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      const sameKind = this.units.filter((candidate) => candidate.kind === unit.kind).length;
      if (sameKind > (allowed[unit.kind] ?? 0)) {
        this.scene.remove(unit.vehicle.group);
        const index = this.fleet.vehicles.indexOf(unit.vehicle);
        if (index >= 0) this.fleet.vehicles.splice(index, 1);
        this.units.splice(i, 1);
      }
    }
  }

  clear() {
    for (const unit of this.units) {
      this.scene.remove(unit.vehicle.group);
      const i = this.fleet.vehicles.indexOf(unit.vehicle);
      if (i >= 0) this.fleet.vehicles.splice(i, 1);
    }
    this.units.length = 0;
    this.clearRoadblocks();
    this.wanted = 0;
    this.heat = 0;
    this.helicopter.group.visible = false;
    this.helicopter.spotlight.visible = false;
    this.helicopter.groundGlow.visible = false;
  }

  update(dt, playerPosition, elapsed) {
    this.elapsed += dt;
    this.spawnRequired();

    if (this.wanted >= 3 && this.roadblocks.length === 0) this.spawnRoadblock(playerPosition);
    if (this.wanted < 3 && this.roadblocks.length > 0) this.clearRoadblocks();
    if (this.wanted >= 5) this.explosionPending = Math.max(0, this.explosionPending - dt);
    if (this.wanted >= 4) {
      const heli = this.helicopter;
      heli.group.visible = true;
      heli.spotlight.visible = true;
      heli.groundGlow.visible = true;
      const angle = elapsed * 0.25;
      const target = new THREE.Vector3(
        playerPosition.x + Math.sin(angle) * 42,
        52 + Math.sin(elapsed * 0.7) * 4,
        playerPosition.z + Math.cos(angle) * 42,
      );
      heli.group.position.lerp(target, Math.min(1, dt * 1.6));
      heli.group.rotation.y = Math.atan2(playerPosition.x - heli.group.position.x, playerPosition.z - heli.group.position.z);
      heli.rotor.rotation.y += dt * 34;
      heli.tailRotor.rotation.x += dt * 42;
      this.spotPoint.lerp(playerPosition, Math.min(1, dt * 0.85));
      heli.spotlight.position.copy(heli.group.position);
      heli.spotlight.target.position.set(this.spotPoint.x, 0, this.spotPoint.z);
      heli.groundGlow.position.set(this.spotPoint.x, 0.14, this.spotPoint.z);
      heli.groundGlow.material.opacity = 0.22 + Math.sin(elapsed * 5) * 0.06;
    } else {
      this.helicopter.group.visible = false;
      this.helicopter.spotlight.visible = false;
      this.helicopter.groundGlow.visible = false;
    }

    for (const unit of this.units) {
      const car = unit.vehicle;
      const dx = playerPosition.x - car.position.x;
      const dz = playerPosition.z - car.position.z;
      const distance = Math.hypot(dx, dz);
      const desired = Math.atan2(dx, dz);
      const error = wrapAngle(desired - car.group.rotation.y);
      const steer = THREE.MathUtils.clamp(-error * 1.8, -1, 1);
      if (unit.kind === 'ram') {
        unit.ramTimer += dt;
        unit.status = distance < 16 ? 'RAMMING' : 'INTERCEPTING';
      } else if (unit.kind === 'swat') {
        unit.status = distance < 40 ? 'FIRING' : 'CLOSING IN';
      } else {
        unit.status = distance < 25 ? 'PURSUIT · CLOSE' : 'PURSUIT';
      }
      car.update(dt, { throttle: distance > 5 ? 1 : 0, steer, handbrake: distance < 9 && Math.abs(error) > 1.2 });
      if (distance > 420) {
        car.position.set(playerPosition.x - dx * 0.6, 0, playerPosition.z - dz * 0.6);
        car.group.rotation.y = desired;
      }
    }
  }

  getResponseRows(playerPosition) {
    const rows = [];
    for (const unit of this.units) {
      rows.push({
        name: unit.name,
        status: unit.status,
        distance: Math.round(unit.vehicle.position.distanceTo(playerPosition)),
      });
    }
    for (const block of this.roadblocks) {
      rows.push({
        name: block.name,
        status: block.status,
        distance: Math.round(block.barrier.position.distanceTo(playerPosition)),
      });
    }
    if (this.helicopter.group.visible) {
      rows.push({
        name: POLICE_UNIT_NAMES.helicopter,
        status: 'SPOTLIGHT',
        distance: Math.round(this.helicopter.group.position.distanceTo(playerPosition)),
      });
    }
    return rows.slice(0, 6);
  }
}
