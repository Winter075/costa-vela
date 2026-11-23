// police.js — the wanted level and the units it calls in: cruisers, RAM, roadblocks,
// an Aero Patrol helicopter with a tracking spotlight, and SWAT at five stars.

import * as THREE from 'three';
import { WORLD, POLICE_UNIT_NAMES, unitsForWanted } from './config.js';

function shortestTurn(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function buildAeroPatrol(scene) {
  const craft = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x2b3b4b, metalness: 0.45, roughness: 0.4 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x9fd8e8, metalness: 0.6, roughness: 0.18 });

  const hull = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), shell);
  hull.scale.set(1, 0.8, 1.7);
  craft.add(hull);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 8), canopy);
  nose.position.set(0, 0.1, 4);
  craft.add(nose);

  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 11), shell);
  boom.position.set(0, 0.5, -8);
  craft.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 1.6), shell);
  fin.position.set(0, 1.9, -12.5);
  craft.add(fin);

  const mainRotor = new THREE.Group();
  for (let bladeIndex = 0; bladeIndex < 4; bladeIndex++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(15, 0.16, 0.7), shell);
    blade.rotation.y = (bladeIndex * Math.PI) / 2;
    mainRotor.add(blade);
  }
  mainRotor.position.y = 3.1;
  craft.add(mainRotor);

  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 0.3), shell);
  tailRotor.position.set(0.5, 1.2, -12.6);
  craft.add(tailRotor);

  craft.position.set(0, 48, 0);
  scene.add(craft);

  const spotlight = new THREE.SpotLight(0xfff0b0, 24, 220, 0.26, 0.6, 1);
  spotlight.position.copy(craft.position);
  scene.add(spotlight);
  scene.add(spotlight.target);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(7, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.14;
  scene.add(pool);

  return { craft, mainRotor, tailRotor, spotlight, pool };
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
    this.airUnit = buildAeroPatrol(scene);
    this.airUnit.craft.visible = false;
    this.airUnit.spotlight.visible = false;
    this.airUnit.pool.visible = false;
    this.spotTarget = new THREE.Vector3();
    this.elapsed = 0;
  }

  addHeat(amount) {
    this.heat = THREE.MathUtils.clamp(this.heat + amount, 0, 100);
    this.syncWanted();
  }

  syncWanted() {
    let level = 0;
    for (let star = 1; star <= 5; star++) {
      if (this.heat >= this.thresholds[star]) level = star;
    }
    this.wanted = Math.max(this.wanted, level);
    return this.wanted;
  }

  setWanted(level) {
    this.wanted = THREE.MathUtils.clamp(level, 0, 5);
    this.heat = Math.max(this.heat, this.thresholds[this.wanted]);
    this.spawnRequired();
  }

  spawnRequired() {
    for (const order of unitsForWanted(this.wanted)) {
      const present = this.units.filter((unit) => unit.kind === order.kind).length;
      for (let index = present; index < order.count; index++) {
        this.spawnUnit(order.kind, order.status);
      }
    }
  }

  spawnUnit(kind, status) {
    const modelId = kind === 'ram' ? 'ram' : kind === 'swat' ? 'bearcat' : 'bluebird';
    const bearing = this.random.range(0, Math.PI * 2);
    const radius = this.random.range(55, 95);
    const car = this.fleet.spawn(
      modelId,
      new THREE.Vector3(Math.sin(bearing) * radius, 0, Math.cos(bearing) * radius),
      bearing + Math.PI,
      { role: kind },
    );
    const unit = {
      kind,
      status,
      vehicle: car,
      name: POLICE_UNIT_NAMES[kind] ?? kind,
      ramTimer: 0,
    };
    this.units.push(unit);
    return unit;
  }

  spawnRoadblock(playerPosition) {
    const nearestLine = WORLD.roadLines.reduce(
      (best, line) => Math.abs(line - playerPosition.x) < Math.abs(best - playerPosition.x) ? line : best,
      WORLD.roadLines[0],
    );
    const z = THREE.MathUtils.clamp(playerPosition.z + 95, -330, 330);
    const barrier = new THREE.Group();
    const warn = new THREE.MeshStandardMaterial({ color: 0xf2b134, roughness: 0.7 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.8 });
    for (let i = -3; i <= 3; i++) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 0.9), i % 2 ? warn : dark);
      block.position.set(i * 4.2, 0.75, 0);
      barrier.add(block);
    }
    barrier.position.set(nearestLine, 0, z);
    this.scene.add(barrier);

    const cruisers = [];
    for (const side of [-1, 1]) {
      cruisers.push(this.fleet.spawn(
        'bluebird',
        new THREE.Vector3(nearestLine + side * 17, 0, z - 3),
        Math.PI,
        { role: 'roadblock' },
      ));
    }
    this.roadblocks.push({
      barrier,
      cruisers,
      name: POLICE_UNIT_NAMES.roadblock,
      status: 'ROADBLOCK',
    });
  }

  clearRoadblocks() {
    for (const block of this.roadblocks) {
      this.scene.remove(block.barrier);
      for (const car of block.cruisers) {
        this.scene.remove(car.group);
        const index = this.fleet.vehicles.indexOf(car);
        if (index >= 0) this.fleet.vehicles.splice(index, 1);
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
        this.removeUnit(unit, i);
      }
    }
  }

  removeUnit(unit, index) {
    this.scene.remove(unit.vehicle.group);
    const fleetIndex = this.fleet.vehicles.indexOf(unit.vehicle);
    if (fleetIndex >= 0) this.fleet.vehicles.splice(fleetIndex, 1);
    this.units.splice(index, 1);
  }

  clear() {
    for (let i = this.units.length - 1; i >= 0; i--) this.removeUnit(this.units[i], i);
    this.clearRoadblocks();
    this.wanted = 0;
    this.heat = 0;
    this.airUnit.craft.visible = false;
    this.airUnit.spotlight.visible = false;
    this.airUnit.pool.visible = false;
  }

  update(dt, playerPosition, elapsed) {
    this.elapsed += dt;
    this.spawnRequired();

    if (this.wanted >= 3 && this.roadblocks.length === 0) this.spawnRoadblock(playerPosition);
    if (this.wanted < 3 && this.roadblocks.length > 0) this.clearRoadblocks();
    this.updateAirUnit(dt, elapsed, playerPosition);

    for (const unit of this.units) {
      const car = unit.vehicle;
      const dx = playerPosition.x - car.position.x;
      const dz = playerPosition.z - car.position.z;
      const distance = Math.hypot(dx, dz);
      const desired = Math.atan2(dx, dz);
      const error = shortestTurn(desired - car.group.rotation.y);
      const steer = THREE.MathUtils.clamp(-error * 1.8, -1, 1);

      if (unit.kind === 'ram') {
        unit.ramTimer += dt;
        unit.status = distance < 16 ? 'RAMMING' : 'INTERCEPTING';
      } else if (unit.kind === 'swat') {
        unit.status = distance < 40 ? 'FIRING' : 'CLOSING IN';
      } else {
        unit.status = distance < 25 ? 'PURSUIT · CLOSE' : 'PURSUIT';
      }

      car.update(dt, {
        throttle: distance > 5 ? 1 : 0,
        steer,
        handbrake: distance < 9 && Math.abs(error) > 1.2,
      });
      if (distance > 420) {
        car.position.set(playerPosition.x - dx * 0.6, 0, playerPosition.z - dz * 0.6);
        car.group.rotation.y = desired;
      }
    }
  }

  updateAirUnit(dt, elapsed, playerPosition) {
    const air = this.airUnit;
    const visible = this.wanted >= 4;
    air.craft.visible = visible;
    air.spotlight.visible = visible;
    air.pool.visible = visible;
    if (!visible) return;

    const orbit = elapsed * 0.25;
    const target = new THREE.Vector3(
      playerPosition.x + Math.sin(orbit) * 42,
      52 + Math.sin(elapsed * 0.7) * 4,
      playerPosition.z + Math.cos(orbit) * 42,
    );
    air.craft.position.lerp(target, Math.min(1, dt * 1.6));
    air.craft.rotation.y = Math.atan2(
      playerPosition.x - air.craft.position.x,
      playerPosition.z - air.craft.position.z,
    );
    air.mainRotor.rotation.y += dt * 34;
    air.tailRotor.rotation.x += dt * 42;

    this.spotTarget.lerp(playerPosition, Math.min(1, dt * 0.85));
    air.spotlight.position.copy(air.craft.position);
    air.spotlight.target.position.set(this.spotTarget.x, 0, this.spotTarget.z);
    air.pool.position.set(this.spotTarget.x, 0.14, this.spotTarget.z);
    air.pool.material.opacity = 0.22 + Math.sin(elapsed * 5) * 0.06;
  }

  getResponseRows(playerPosition) {
    const rows = this.units.map((unit) => ({
      name: unit.name,
      status: unit.status,
      distance: Math.round(unit.vehicle.position.distanceTo(playerPosition)),
    }));
    for (const block of this.roadblocks) {
      rows.push({
        name: block.name,
        status: block.status,
        distance: Math.round(block.barrier.position.distanceTo(playerPosition)),
      });
    }
    if (this.airUnit.craft.visible) {
      rows.push({
        name: POLICE_UNIT_NAMES.helicopter,
        status: 'SPOTLIGHT',
        distance: Math.round(this.airUnit.craft.position.distanceTo(playerPosition)),
      });
    }
    return rows.slice(0, 6);
  }
}
