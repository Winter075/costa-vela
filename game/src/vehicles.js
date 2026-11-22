// vehicles.js — low-poly vehicle models, driving physics and damage state.

import * as THREE from 'three';
import { VEHICLE_MODELS, vehicleModel } from './config.js';

function wheelGeometry() {
  return new THREE.CylinderGeometry(0.72, 0.72, 0.42, 12);
}

export class Vehicle {
  constructor(model, position, rotation = 0, options = {}) {
    this.model = model;
    this.speed = 0;
    this.steer = 0;
    this.damage = 0;
    this.health = 100;
    this.parked = Boolean(options.parked);
    this.isPolice = Boolean(model.police);
    this.role = options.role ?? 'civilian';
    this.elapsed = 0;

    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: model.color, roughness: 0.42, metalness: 0.35 });
    const accentMat = new THREE.MeshStandardMaterial({ color: model.accent, roughness: 0.5, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2e3c, roughness: 0.15, metalness: 0.65 });
    const length = model.kind === 'truck' || model.kind === 'swat' ? 8.2 : model.kind === 'van' ? 7 : 5.6;
    const width = model.kind === 'truck' || model.kind === 'swat' ? 3.1 : 2.7;
    const bodyHeight = model.kind === 'truck' ? 2.8 : 1.5;

    const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, length), bodyMat);
    body.position.y = 1.15 + bodyHeight / 2 - 0.7;
    group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.88, 1.25, length * (model.kind === 'coupe' || model.kind === 'sports' ? 0.42 : 0.55)),
      glassMat,
    );
    cabin.position.set(0, 1.85 + (bodyHeight - 1.5) * 0.5, -length * 0.06);
    group.add(cabin);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.35, 0.45), accentMat);
    bumper.position.set(0, 0.95, length / 2 + 0.1);
    group.add(bumper);

    const wheels = [];
    const sharedWheel = wheelGeometry();
    const tyreMat = new THREE.MeshStandardMaterial({ color: 0x16191d, roughness: 0.95 });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(sharedWheel, tyreMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * (width / 2), 0.72, sz * length * 0.32);
        group.add(wheel);
        wheels.push(wheel);
      }
    }

    const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2cd });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff4949 });
    for (const sx of [-1, 1]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.12), headMat);
      head.position.set(sx * width * 0.32, 1.35, length / 2 + 0.02);
      group.add(head);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.12), tailMat);
      tail.position.set(sx * width * 0.32, 1.3, -length / 2 - 0.02);
      group.add(tail);
    }

    if (this.isPolice) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.28, 0.6), new THREE.MeshBasicMaterial({ color: 0x2f6ee0 }));
      bar.position.set(0, 3.05, -0.1);
      group.add(bar);
      this.lightBar = bar;
      if (model.kind === 'ram') {
        const plow = new THREE.Mesh(new THREE.BoxGeometry(width * 1.35, 0.9, 0.5), accentMat);
        plow.position.set(0, 0.75, length / 2 + 0.5);
        group.add(plow);
      }
    }

    group.position.copy(position);
    group.rotation.y = rotation;
    this.group = group;
    this.body = body;
    this.wheels = wheels;
    this.length = length;
  }

  get position() { return this.group.position; }
  get rotation() { return this.group.rotation; }

  getSpeedKmh() { return Math.abs(this.speed) * 3.6; }

  applyDamage(amount) {
    this.damage = Math.min(100, this.damage + amount);
    this.health = Math.max(0, 100 - this.damage);
    this.body.material.color.lerp(new THREE.Color(0x3a332f), Math.min(0.75, this.damage / 140));
    return this.health;
  }

  repair() {
    this.damage = 0;
    this.health = 100;
    this.body.material.color.setHex(this.model.color);
  }

  update(dt, controls = {}) {
    this.elapsed += dt;
    const throttle = controls.throttle ?? 0;
    const brake = controls.brake ?? 0;
    const steer = controls.steer ?? 0;
    const handbrake = controls.handbrake ?? false;
    const grip = this.model.grip * (1 - (this.upgrades?.brakes ?? 0) * 0.04);
    const top = this.model.topSpeed * (1 + (this.upgrades?.engine ?? 0) * 0.09);

    if (throttle) this.speed += throttle * 20 * dt;
    if (brake) this.speed -= brake * 26 * dt;
    if (handbrake) this.speed *= Math.pow(0.12, dt);
    this.speed *= Math.pow(0.55, dt * 0.18);
    this.speed = THREE.MathUtils.clamp(this.speed, -top * 0.35, top);

    const turnRate = (Math.abs(this.speed) > 0.5 ? 1 : 0) * (0.9 + grip * 0.7) * (handbrake ? 1.5 : 1);
    this.steer = THREE.MathUtils.lerp(this.steer, steer, dt * 7);
    this.group.rotation.y -= this.steer * turnRate * dt * Math.sign(this.speed || 1);
    this.group.position.x += Math.sin(this.group.rotation.y) * this.speed * dt;
    this.group.position.z += Math.cos(this.group.rotation.y) * this.speed * dt;

    for (const wheel of this.wheels) wheel.rotation.x += this.speed * dt * 1.7;
    if (this.lightBar) {
      const pulse = Math.sin(this.elapsed * 14) > 0;
      this.lightBar.material.color.setHex(pulse ? 0xff3b3b : 0x2f6ee0);
    }
  }
}

export class VehicleFleet {
  constructor(scene, random) {
    this.scene = scene;
    this.random = random;
    this.vehicles = [];
  }

  spawn(modelId, position, rotation = 0, options = {}) {
    const model = vehicleModel(modelId);
    const vehicle = new Vehicle(model, position, rotation, options);
    if (options.upgrades) vehicle.upgrades = options.upgrades;
    this.scene.add(vehicle.group);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  spawnParkedCars() {
    const parked = [];
    const civilian = VEHICLE_MODELS.slice(0, 12);
    for (const line of [-270, -180, -90, 0, 90, 180, 270]) {
      for (let p = -300; p < 300; p += 96) {
        if (this.random.chance(0.42)) continue;
        const model = this.random.pick(civilian);
        const alongX = this.random.chance(0.5);
        const x = alongX ? p + this.random.range(-14, 14) : line + 12;
        const z = alongX ? line + 12 : p + this.random.range(-14, 14);
        const rotation = alongX ? Math.PI / 2 : 0;
        parked.push(this.spawn(model.id, new THREE.Vector3(x, 0, z), rotation, { parked: true }));
      }
    }
    return parked;
  }

  spawnTraffic(count = 18) {
    const civilian = VEHICLE_MODELS.slice(0, 12);
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const model = this.random.pick(civilian);
      const alongX = this.random.chance(0.5);
      const line = this.random.pick([-270, -180, -90, 0, 90, 180, 270]);
      const p = this.random.range(-320, 320);
      const lane = this.random.chance(0.5) ? 1 : -1;
      const x = alongX ? p : line + lane * 4.5;
      const z = alongX ? line + lane * 4.5 : p;
      const rotation = alongX
        ? (lane > 0 ? Math.PI / 2 : -Math.PI / 2)
        : (lane > 0 ? Math.PI : 0);
      spawned.push(this.spawn(model.id, new THREE.Vector3(x, 0, z), rotation, { role: 'traffic' }));
    }
    return spawned;
  }

  findNearest(position, maxDistance = 7) {
    let best = null;
    let bestDistance = maxDistance;
    for (const vehicle of this.vehicles) {
      const d = vehicle.position.distanceTo(position);
      if (d < bestDistance) { best = vehicle; bestDistance = d; }
    }
    return best;
  }
}
