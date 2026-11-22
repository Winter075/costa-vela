// Vela police response. Wanted levels 1 to 5 add cruisers, a Ram/PIT car,
// a roadblock, an observation helicopter with a spotlight and a SWAT van.

import * as THREE from 'three';
import { makeRandom } from './random.js';
import { buildCarMesh, buildHelicopter, placeVehicle } from './vehicles.js';
import { WORLD } from './config.js';

const ROSTER = {
  CRUISER: ['BLUE UNIT', 'COAST PATROL', 'DISTRICT CAR'],
  RAM: ['PIT UNIT 12'],
  ROADBLOCK: ['TACTICAL BARRIER'],
  HELI: ['AIR ONE'],
  SWAT: ['SWAT BREAKER'],
};

const COMPOSITION = [
  {},
  { CRUISER: 1 },
  { CRUISER: 2 },
  { CRUISER: 2, HELI: 1 },
  { CRUISER: 3, RAM: 1, HELI: 1, ROADBLOCK: 1 },
  { CRUISER: 3, RAM: 1, HELI: 1, ROADBLOCK: 1, SWAT: 1 },
];

export function createPolice(scene, world) {
  const random = makeRandom(50113);
  const units = [];
  let wanted = 0;
  let nextId = 1;
  let cooldown = 0;
  let flash = 0;
  let escape = 0;
  let roadblock = null;
  let target = { x: 0, z: 0 };

  function nameFor(type, id) {
    const list = ROSTER[type] ?? ['UNIT'];
    const base = list[(id - 1) % list.length];
    return type === 'CRUISER' ? `${base} ${String.fromCharCode(64 + id)}` : base;
  }

  function makeRoadblock(x, z) {
    const group = new THREE.Group();
    const nearestX = Math.round(x / WORLD.gridStep) * WORLD.gridStep;
    const nearestZ = Math.round((z - 60) / WORLD.gridStep) * WORLD.gridStep;
    const acrossX = Math.abs(x - nearestX) < Math.abs(z - nearestZ);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff862f, emissive: 0x8f3600, emissiveIntensity: 0.5 });
    for (const offset of [-14, 0, 14]) {
      const car = buildCarMesh(0xe9edef, 'sedan', true);
      if (acrossX) {
        car.position.set(nearestX + offset, 0, nearestZ);
        car.rotation.y = Math.PI / 2;
      } else {
        car.position.set(nearestX, 0, nearestZ + offset);
      }
      group.add(car);
      for (const side of [-1, 1]) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 8), coneMat);
        cone.position.set(
          acrossX ? nearestX + offset + side * 4 : nearestX + side * 4,
          1,
          acrossX ? nearestZ + 5 : nearestZ + offset + 5,
        );
        group.add(cone);
      }
    }
    group.userData.center = { x: nearestX, z: nearestZ };
    return group;
  }

  function spawn(type) {
    const angle = random.range(0, Math.PI * 2);
    const radius = random.range(75, 115);
    const x = target.x + Math.sin(angle) * radius;
    const z = target.z + Math.cos(angle) * radius;
    const unit = {
      type, id: nextId++, name: nameFor(type, nextId - 1), x, z, y: 0,
      heading: Math.atan2(target.x - x, target.z - z),
      speed: type === 'SWAT' ? 23 : type === 'RAM' ? 32 : 27,
      status: type === 'HELI' ? 'SPOTLIGHT' : type === 'RAM' ? 'INTERCEPT' : 'PATROL',
      orbit: random.range(0, Math.PI * 2),
    };

    if (type === 'HELI') {
      unit.mesh = buildHelicopter();
      unit.y = 24;
      unit.speed = 25;
      scene.add(unit.mesh);
    } else if (type === 'ROADBLOCK') {
      unit.mesh = makeRoadblock(x, z);
      unit.x = unit.mesh.userData.center.x;
      unit.z = unit.mesh.userData.center.z;
      unit.speed = 0;
      unit.status = 'ROADBLOCK';
      roadblock = unit;
      scene.add(unit.mesh);
    } else {
      const swat = type === 'SWAT';
      const color = swat ? 0x262a2f : type === 'RAM' ? 0x3d454b : 0xeef1f3;
      unit.mesh = buildCarMesh(color, swat ? 'van' : type === 'RAM' ? 'muscle' : 'sedan', true);
      scene.add(unit.mesh);
      if (type === 'RAM') {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.7, 3),
          new THREE.MeshStandardMaterial({ color: 0xc2c8cc, metalness: 0.7, roughness: 0.4 }),
        );
        bar.position.set(2.5, 1, 0);
        unit.mesh.add(bar);
      }
    }
    placeVehicle(unit.mesh);
    unit.mesh.position.set(unit.x, unit.y, unit.z);
    units.push(unit);
    return unit;
  }

  function reconcile(x, z) {
    target = { x, z };
    const wantedList = COMPOSITION[wanted] ?? {};
    for (const [type, count] of Object.entries(wantedList)) {
      const have = units.filter((unit) => unit.type === type).length;
      for (let i = have; i < count; i += 1) spawn(type);
    }
    const keep = new Set(Object.keys(wantedList));
    for (let i = units.length - 1; i >= 0; i -= 1) {
      if (!keep.has(units[i].type)) {
        scene.remove(units[i].mesh);
        units.splice(i, 1);
      }
    }
  }

  function setWanted(level, x = target.x, z = target.z) {
    const next = Math.max(0, Math.min(5, Math.round(level)));
    if (next > wanted) escape = 0;
    wanted = next;
    if (wanted === 0) {
      for (const unit of units) scene.remove(unit.mesh);
      units.length = 0;
      roadblock = null;
    } else {
      reconcile(x, z);
    }
  }

  function moveHeli(unit, dt, dx, dz) {
    unit.orbit += dt * 0.45;
    const goalX = target.x + Math.sin(unit.orbit) * 58;
    const goalZ = target.z + Math.cos(unit.orbit) * 58;
    unit.x += (goalX - unit.x) * Math.min(1, dt * 0.9);
    unit.z += (goalZ - unit.z) * Math.min(1, dt * 0.9);
    unit.y += (22 - unit.y) * Math.min(1, dt * 0.8);
    unit.mesh.position.set(unit.x, unit.y, unit.z);
    unit.mesh.rotation.y = Math.atan2(-dx, -dz);
    if (unit.mesh.userData.rotor) unit.mesh.userData.rotor.rotation.y += dt * 24;
    if (unit.mesh.userData.tailRotor) unit.mesh.userData.tailRotor.rotation.x += dt * 30;
    const light = unit.mesh.userData.spotlight;
    if (light) {
      unit.mesh.updateMatrixWorld();
      light.target.position.copy(unit.mesh.worldToLocal(new THREE.Vector3(target.x, 0, target.z)));
      light.intensity = 110;
    }
  }

  function moveGround(unit, dt, dx, dz, distance, lit) {
    let separationX = 0;
    let separationZ = 0;
    for (const other of units) {
      if (other === unit || other.type === 'ROADBLOCK' || other.type === 'HELI') continue;
      const ox = unit.x - other.x;
      const oz = unit.z - other.z;
      const od = Math.hypot(ox, oz);
      if (od > 0.1 && od < 13) { separationX += ox / od; separationZ += oz / od; }
    }
    const desired = Math.atan2(dx + separationX * 7, dz + separationZ * 7);
    let diff = desired - unit.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    unit.heading += diff * Math.min(1, dt * 2.4);
    const push = unit.type === 'RAM' && distance < 45 ? 1.2 : 1;
    unit.x += Math.sin(unit.heading) * unit.speed * push * dt;
    unit.z += Math.cos(unit.heading) * unit.speed * push * dt;
    unit.mesh.position.set(unit.x, 0, unit.z);
    unit.mesh.rotation.y = unit.heading - Math.PI / 2;
    if (unit.mesh.userData.wheels) {
      for (const wheel of unit.mesh.userData.wheels) wheel.rotation.y += unit.speed * dt * 1.5;
    }
    const lamps = unit.mesh.userData.flashers;
    if (lamps && lamps.length === 2) {
      lamps[0].emissiveIntensity = lit ? 3.2 : 0.2;
      lamps[1].emissiveIntensity = lit ? 0.2 : 3.2;
    }
    if (unit.type === 'RAM') unit.status = distance < 40 ? 'RAMMING' : 'INTERCEPT';
    else if (unit.type === 'SWAT') unit.status = distance < 65 ? 'FIRING' : 'ADVANCING';
    else unit.status = distance < 35 ? 'PURSUIT' : 'PATROL';

    if (distance > 330) {
      const angle = random.range(0, Math.PI * 2);
      unit.x = target.x + Math.sin(angle) * 100;
      unit.z = target.z + Math.cos(angle) * 100;
    }
  }

  function update(dt, ctx) {
    target = { x: ctx.state.x, z: ctx.state.z };
    reconcile(target.x, target.z);
    cooldown -= dt;
    flash += dt;
    if (cooldown > 0 || wanted === 0) return;
    cooldown = 0.5;
    const lit = flash % 0.7 < 0.35;
    for (const unit of units) {
      if (unit.type === 'ROADBLOCK') continue;
      const dx = target.x - unit.x;
      const dz = target.z - unit.z;
      const distance = Math.hypot(dx, dz);
      if (unit.type === 'HELI') moveHeli(unit, dt, dx, dz);
      else moveGround(unit, dt, dx, dz, distance, lit);
    }
    const ground = units.filter((unit) => unit.type !== 'ROADBLOCK' && unit.type !== 'HELI');
    const nearest = ground.length ? Math.min(...ground.map((unit) => Math.hypot(unit.x - target.x, unit.z - target.z))) : 999;
    const fade = ctx.state.crewAbility === 'Fixer' ? 0.85 : 0.5;
    if (nearest > 85) escape += 0.5; else escape = Math.max(0, escape - fade);
    if (escape > 14 && wanted > 0) setWanted(wanted - 1, target.x, target.z);
  }

  function responseRows() {
    return units.map((unit) => ({
      name: unit.name,
      status: unit.status,
      distance: Math.round(Math.hypot(unit.x - target.x, unit.z - target.z)),
      type: unit.type,
    })).sort((a, b) => a.distance - b.distance).slice(0, 6);
  }

  function targets() {
    return units.filter((unit) => unit.type !== 'HELI' && unit.type !== 'ROADBLOCK').map((unit) => ({
      root: unit.mesh,
      onHit: (damage) => {
        unit.x += Math.sin(unit.heading) * damage * 0.35;
        unit.z += Math.cos(unit.heading) * damage * 0.35;
      },
    }));
  }

  return {
    units,
    get wanted() { return wanted; },
    get roadblock() { return roadblock; },
    setWanted, update, responseRows, targets,
  };
}
