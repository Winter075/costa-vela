// CVPD dispatch. The wanted level picks which units answer: cruisers, a RAM
// unit, a roadblock, Air One with its spotlight, and a tactical van at five.
import * as THREE from 'three';
import { makeVehicle, placeVehicle } from './vehicles.js';
import { ROAD_X } from './world.js';
import { randomRange } from './random.js';

const CRUISER = { id: 'cvpd', name: 'CVPD cruiser', type: 'sedan', body: 0xf2f1e9, trim: 0x253043, top: 44, grip: 0.9 };
const RAM = { id: 'ram9', name: 'RAM-9 interceptor', type: 'truck', body: 0xe9e6dc, trim: 0x2a3340, top: 46, grip: 0.86 };
const TACTICAL = { id: 'swat', name: 'Tactical van', type: 'van', body: 0x303840, trim: 0x171c22, top: 42, grip: 0.88 };

const DOWN = new THREE.Vector3(0, -1, 0);

export function createPolice(scene) {
  const units = [];
  let level = 0;
  let helicopter = null;
  let rotor = null;
  let spotlight = null;
  let spotlightCone = null;
  let ramTimer = 0;
  let swatTimer = 0;
  let serial = 1;

  function addUnit(unit) {
    units.push(unit);
    return unit;
  }

  function spawnGround(kind, name, spec, status, playerX, playerZ, index) {
    const angle = (index / 4) * Math.PI * 2 + randomRange(-0.4, 0.4);
    const x = Math.max(-210, Math.min(210, playerX + Math.cos(angle) * 95));
    const z = Math.max(-195, Math.min(110, playerZ + Math.sin(angle) * 95));
    const vehicle = makeVehicle(spec, x, z, 0, true);
    scene.add(vehicle.mesh);
    return addUnit({ id: serial++, kind, name, status, vehicle, speed: 0 });
  }

  function spawnRoadblock(playerX, playerZ, count = 3) {
    let road = ROAD_X[0];
    for (const x of ROAD_X) if (Math.abs(x - playerX) < Math.abs(road - playerX)) road = x;
    const blockZ = Math.max(-190, Math.min(105, playerZ + 72));
    for (let i = 0; i < count; i += 1) {
      const lane = i - (count - 1) / 2;
      const vehicle = makeVehicle(CRUISER, road + lane * 7, blockZ, Math.PI, true);
      scene.add(vehicle.mesh);
      placeVehicle(vehicle);
      addUnit({ id: serial++, kind: 'roadblock', name: 'Roadblock unit ' + (i + 1), status: 'ROADBLOCK', vehicle, speed: 0 });
    }
  }

  function spawnHelicopter(playerX, playerZ) {
    const group = new THREE.Group();
    const shell = new THREE.MeshLambertMaterial({ color: 0x35404b });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 7.2), shell);
    group.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 7), shell);
    tail.position.z = -6.5;
    group.add(tail);
    rotor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.14, 0.42), new THREE.MeshBasicMaterial({ color: 0x22272e }));
    rotor.position.y = 1.4;
    group.add(rotor);
    const skidMaterial = new THREE.MeshLambertMaterial({ color: 0x1d2229 });
    for (const side of [-1, 1]) {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 5), skidMaterial);
      skid.position.set(side * 1.5, -1.4, 0);
      group.add(skid);
    }
    group.position.set(playerX + 50, 44, playerZ - 30);
    scene.add(group);
    helicopter = group;

    spotlight = new THREE.SpotLight(0xfff0c2, 3.2, 170, Math.PI / 7, 0.45, 1);
    spotlight.position.copy(group.position);
    scene.add(spotlight);
    scene.add(spotlight.target);

    spotlightCone = new THREE.Mesh(
      new THREE.ConeGeometry(11, 58, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff0c2, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    );
    scene.add(spotlightCone);
    addUnit({ id: serial++, kind: 'helicopter', name: 'Air One', status: 'SPOTLIGHT', mesh: group });
  }

  function removeUnit(unit) {
    if (unit.vehicle) scene.remove(unit.vehicle.mesh);
    if (unit.kind === 'helicopter') {
      scene.remove(helicopter);
      scene.remove(spotlight);
      scene.remove(spotlight.target);
      scene.remove(spotlightCone);
      helicopter = null;
      rotor = null;
      spotlight = null;
      spotlightCone = null;
    }
  }

  function desiredCounts() {
    const counts = {};
    const add = (kind, amount = 1) => { counts[kind] = (counts[kind] ?? 0) + amount; };
    if (level >= 1) add('cruiser');
    if (level >= 2) {
      add('cruiser');
      add('ram');
    }
    if (level >= 3) add('roadblock', 3);
    if (level >= 4) add('helicopter');
    if (level >= 5) add('tactical');
    return counts;
  }

  function countOf(kind) {
    return units.filter((unit) => unit.kind === kind).length;
  }

  function setWanted(next, playerX, playerZ) {
    if (next === level) return;
    level = Math.max(0, Math.min(5, next));
    const desired = desiredCounts();

    const seen = {};
    for (let i = units.length - 1; i >= 0; i -= 1) {
      const kind = units[i].kind;
      seen[kind] = (seen[kind] ?? 0) + 1;
      if (seen[kind] > (desired[kind] ?? 0)) {
        removeUnit(units[i]);
        units.splice(i, 1);
      }
    }

    for (const [kind, total] of Object.entries(desired)) {
      const missing = total - countOf(kind);
      if (missing <= 0) continue;
      if (kind === 'roadblock') {
        spawnRoadblock(playerX, playerZ, missing);
      } else if (kind === 'cruiser') {
        for (let i = 0; i < missing; i += 1) {
          spawnGround('cruiser', 'CVPD cruiser ' + (countOf('cruiser') + 1), CRUISER, 'PURSUIT', playerX, playerZ, countOf('cruiser'));
        }
      } else if (kind === 'ram') {
        spawnGround('ram', 'RAM-9 interceptor', RAM, 'CLOSING', playerX, playerZ, 2);
      } else if (kind === 'helicopter') {
        spawnHelicopter(playerX, playerZ);
      } else if (kind === 'tactical') {
        spawnGround('tactical', 'Tactical van', TACTICAL, 'ADVANCING', playerX, playerZ, 3);
      }
    }
  }

  function steer(unit, dt, ctx, targetSpeed) {
    const vehicle = unit.vehicle;
    const dx = ctx.state.x - vehicle.x;
    const dz = ctx.state.z - vehicle.z;
    const distance = Math.hypot(dx, dz) || 1;
    const desiredYaw = Math.atan2(dx, dz);
    let difference = desiredYaw - vehicle.yaw;
    while (difference > Math.PI) difference -= Math.PI * 2;
    while (difference < -Math.PI) difference += Math.PI * 2;
    vehicle.yaw += Math.max(-dt * 1.7, Math.min(dt * 1.7, difference));
    const speed = distance < 12 ? 0 : targetSpeed;
    vehicle.speed += (speed - vehicle.speed) * Math.min(1, dt * 2);
    vehicle.x += Math.sin(vehicle.yaw) * vehicle.speed * dt;
    vehicle.z += Math.cos(vehicle.yaw) * vehicle.speed * dt;
    vehicle.wheelSpin += dt * vehicle.speed * 1.4;
    placeVehicle(vehicle);
    return { distance, directX: dx / distance, directZ: dz / distance };
  }

  function update(dt, ctx) {
    const playerX = ctx.state.x;
    const playerZ = ctx.state.z;
    ramTimer -= dt;
    swatTimer -= dt;

    for (const unit of units) {
      if (unit.kind === 'helicopter') {
        if (!helicopter) continue;
        const angle = ctx.state.time * 0.34;
        helicopter.position.set(playerX + Math.cos(angle) * 52, 44, playerZ + Math.sin(angle) * 52);
        helicopter.lookAt(playerX, 6, playerZ);
        rotor.rotation.y += dt * 19;
        spotlight.position.set(helicopter.position.x, helicopter.position.y - 1, helicopter.position.z);
        spotlight.target.position.set(playerX, 0, playerZ);
        spotlightCone.position.set(helicopter.position.x, 15, helicopter.position.z);
        const towardPlayer = new THREE.Vector3(playerX - helicopter.position.x, -15, playerZ - helicopter.position.z).normalize();
        spotlightCone.quaternion.setFromUnitVectors(DOWN, towardPlayer);
        continue;
      }
      if (unit.kind === 'roadblock' || unit.vehicle?.driven) continue;

      const result = steer(unit, dt, ctx, unit.kind === 'ram' ? 34 : 29);
      if (unit.kind === 'ram') {
        unit.status = result.distance < 28 ? 'RAMMING' : 'CLOSING';
        if (result.distance < 8 && ramTimer <= 0) {
          ctx.pushPlayer({ x: result.directX, z: result.directZ }, 62 * dt);
          ctx.damagePlayer(7);
          ramTimer = 1.1;
        }
      } else if (unit.kind === 'tactical') {
        unit.status = result.distance < 48 ? 'FIRING' : 'ADVANCING';
        if (unit.status === 'FIRING' && swatTimer <= 0) {
          ctx.enemyShot(9);
          swatTimer = 1.35;
        }
      } else {
        unit.status = 'PURSUIT';
      }
    }
  }

  function targets() {
    return units.filter((unit) => unit.vehicle && !unit.vehicle.driven).map((unit) => ({
      root: unit.vehicle.mesh,
      onHit: (damage) => {
        unit.vehicle.damage = Math.min(100, unit.vehicle.damage + damage);
        if (unit.vehicle.damage >= 100) {
          scene.remove(unit.vehicle.mesh);
          const index = units.indexOf(unit);
          if (index >= 0) units.splice(index, 1);
        }
      },
    }));
  }

  return { units, setWanted, update, targets, getLevel: () => level };
}
