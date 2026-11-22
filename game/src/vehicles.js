// Costa Vela vehicles: original low-poly car models, wheels, lights and arcade driving physics.

import * as THREE from 'three';
import { VEHICLE_MODELS } from './config.js';
import { clamp, lerp } from './random.js';

const TIRE = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 1 });
const GLASS = new THREE.MeshStandardMaterial({ color: 0x2a3c48, roughness: 0.22, metalness: 0.35 });
const CHROME = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: 0.3, metalness: 0.7 });
const HEAD = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe9a8, emissiveIntensity: 1.6 });
const TAIL = new THREE.MeshStandardMaterial({ color: 0xd83232, emissive: 0xc41a1a, emissiveIntensity: 1.2 });

export function buildCarMesh(color, kind = 'sedan', police = false, swat = false) {
  const group = new THREE.Group();
  const bodyColor = swat ? 0x26282e : police ? 0xe8e9ec : color;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5, metalness: 0.28 });
  const long = kind === 'truck' || kind === 'van';
  const bodyLen = long ? 6.2 : kind === 'suv' ? 5.0 : 4.6;
  const bodyW = long ? 2.5 : 2.1;
  const bodyH = kind === 'sport' ? 1.15 : 1.45;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyLen, bodyH, bodyW), bodyMat);
  body.position.y = bodyH / 2 + 0.45;
  group.add(body);

  const cabinLen = long ? 3.2 : kind === 'sport' ? 2.1 : 2.5;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinLen, 0.85, bodyW - 0.25), GLASS);
  cabin.position.set(-0.25, bodyH + 0.85, 0);
  group.add(cabin);

  const wheels = [];
  const wx = bodyLen * 0.33;
  for (const sx of [-wx, wx]) {
    for (const sz of [-bodyW / 2, bodyW / 2]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.34, 12), TIRE);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(sx, 0.55, sz);
      group.add(wheel);
      wheels.push(wheel);
    }
  }

  for (const hx of [bodyLen / 2 - 0.1]) {
    for (const hz of [-bodyW / 3, bodyW / 3]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.5), HEAD);
      head.position.set(hx, 1.2, hz);
      group.add(head);
    }
  }
  for (const hz of [-bodyW / 3, bodyW / 3]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.45), TAIL);
    tail.position.set(-bodyLen / 2 + 0.05, 1.25, hz);
    group.add(tail);
  }

  if (police || swat) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.26, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 }),
    );
    bar.position.set(-0.25, bodyH + 1.35, 0);
    group.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.92), new THREE.MeshStandardMaterial({ color: 0xff2b2b, emissive: 0xff1010, emissiveIntensity: 2 }));
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.92), new THREE.MeshStandardMaterial({ color: 0x2b7bff, emissive: 0x1040ff, emissiveIntensity: 2 }));
    red.position.set(-0.63, bodyH + 1.52, 0);
    blue.position.set(0.13, bodyH + 1.52, 0);
    group.add(red, blue);
    group.userData.flashers = [red.material, blue.material];
    if (swat) {
      const ram = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, bodyW + 0.4), CHROME);
      ram.position.set(bodyLen / 2 + 0.25, 0.9, 0);
      group.add(ram);
    }
  }

  group.userData.wheels = wheels;
  group.userData.bodyMat = bodyMat;
  group.userData.baseColor = new THREE.Color(bodyColor);
  return group;
}

export function buildHelicopter() {
  const group = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x2f3742, roughness: 0.6, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 10), shell);
  body.scale.set(1.7, 0.85, 0.9);
  group.add(body);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 10, 8), shell);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -7;
  group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.25), shell);
  fin.position.set(-11.5, 1.2, 0);
  group.add(fin);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 22), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.8 }));
  rotor.position.y = 3.0;
  group.add(rotor);
  group.userData.rotor = rotor;
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x222428 }));
  tailRotor.position.set(-11.5, 1.6, 0.4);
  group.add(tailRotor);
  group.userData.tailRotor = tailRotor;
  const spotlight = new THREE.SpotLight(0xfff4cf, 90, 160, Math.PI / 9, 0.45, 1.1);
  spotlight.position.set(2, -1, 0);
  spotlight.target.position.set(2, -60, 0);
  group.add(spotlight, spotlight.target);
  group.userData.spotlight = spotlight;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(12, 84, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  cone.position.set(2, -42, 0);
  group.add(cone);
  group.userData.cone = cone;
  return group;
}

// A car that can be driven. Steering, grip, damage and mesh sync live here.
export class VehicleState {
  constructor(modelIndex, mesh, x, z, heading = 0) {
    const model = VEHICLE_MODELS[modelIndex] ?? VEHICLE_MODELS[0];
    this.modelIndex = modelIndex;
    this.name = model.name;
    this.mesh = mesh;
    this.x = x;
    this.z = z;
    this.heading = heading;
    this.speed = 0;
    this.damage = 0;
    this.topSpeed = model.top;
    this.kind = model.kind;
    this.steer = 0;
    this.wheelSpin = 0;
  }

  drive(axes, handbrake, dt) {
    const accel = axes.z < 0 ? 1 : axes.z > 0 ? -1 : 0;
    const grip = handbrake ? 0.55 : 1;
    if (accel > 0) this.speed += 34 * dt;
    else if (accel < 0) this.speed -= 28 * dt;
    else this.speed *= 1 - 1.1 * dt;
    if (handbrake) this.speed *= 1 - 2.2 * dt;
    this.speed = clamp(this.speed, -this.topSpeed * 0.35, this.topSpeed);
    const steerInput = axes.x;
    this.steer = lerp(this.steer, steerInput, clamp(dt * 8, 0, 1));
    const speedFactor = clamp(Math.abs(this.speed) / 16, 0, 1);
    this.heading -= this.steer * 1.7 * speedFactor * (this.speed < 0 ? -1 : 1) * dt * grip;
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    this.wheelSpin += this.speed * dt * 1.6;
  }

  applyDamage(amount) {
    this.damage = clamp(this.damage + amount, 0, 100);
    return this.damage;
  }

  syncMesh() {
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading - Math.PI / 2;
    if (this.mesh.userData.wheels) {
      for (const w of this.mesh.userData.wheels) w.rotation.y = this.wheelSpin;
    }
    if (this.mesh.userData.bodyMat) {
      const base = this.mesh.userData.baseColor;
      const soot = new THREE.Color(0x3a3632);
      this.mesh.userData.bodyMat.color.copy(base).lerp(soot, this.damage / 180);
    }
  }
}
