// vehicles.js — original low-poly car shapes, arcade driving physics and damage.
// A car that reaches zero health calls onDestroyed so the city can show a wreck fire.

import * as THREE from 'three';
import { VEHICLE_MODELS, vehicleModel } from './config.js';

function sharedWheelGeometry() {
  return new THREE.CylinderGeometry(0.72, 0.72, 0.42, 12);
}

export class Vehicle {
  constructor(model, position, rotation = 0, options = {}) {
    this.model = model;
    this.speed = 0;
    this.steering = 0;
    this.damage = 0;
    this.health = 100;
    this.parked = Boolean(options.parked);
    this.isPolice = Boolean(model.police);
    this.role = options.role ?? 'civilian';
    this.elapsed = 0;
    this.destroyed = false;
    this.onDestroyed = null;

    const chassis = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: model.color, roughness: 0.42, metalness: 0.35 });
    const trim = new THREE.MeshStandardMaterial({ color: model.accent, roughness: 0.5, metalness: 0.2 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x1a2e3c, roughness: 0.15, metalness: 0.65 });

    const isHeavy = model.kind === 'truck' || model.kind === 'swat';
    const length = isHeavy ? 8.2 : model.kind === 'van' ? 7 : 5.6;
    const width = isHeavy ? 3.1 : 2.7;
    const bodyHeight = model.kind === 'truck' ? 2.8 : 1.5;

    const shell = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, length), paint);
    shell.position.y = 1.15 + bodyHeight / 2 - 0.7;
    chassis.add(shell);

    const cabinDepth = model.kind === 'coupe' || model.kind === 'sports' ? 0.42 : 0.55;
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.88, 1.25, length * cabinDepth),
      glass,
    );
    cabin.position.set(0, 1.85 + (bodyHeight - 1.5) * 0.5, -length * 0.06);
    chassis.add(cabin);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(width * 1.04, 0.35, 0.45), trim);
    bumper.position.set(0, 0.95, length / 2 + 0.1);
    chassis.add(bumper);

    const tyre = new THREE.MeshStandardMaterial({ color: 0x16191d, roughness: 0.95 });
    const wheelShape = sharedWheelGeometry();
    const wheels = [];
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        const wheel = new THREE.Mesh(wheelShape, tyre);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sideX * (width / 2), 0.72, sideZ * length * 0.32);
        chassis.add(wheel);
        wheels.push(wheel);
      }
    }

    const headlight = new THREE.MeshBasicMaterial({ color: 0xfff2cd });
    const taillight = new THREE.MeshBasicMaterial({ color: 0xff4949 });
    for (const side of [-1, 1]) {
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.12), headlight);
      front.position.set(side * width * 0.32, 1.35, length / 2 + 0.02);
      chassis.add(front);
      const rear = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.12), taillight);
      rear.position.set(side * width * 0.32, 1.3, -length / 2 - 0.02);
      chassis.add(rear);
    }

    if (this.isPolice) {
      const lightBar = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.7, 0.28, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x2f6ee0 }),
      );
      lightBar.position.set(0, 3.05, -0.1);
      chassis.add(lightBar);
      this.lightBar = lightBar;
      if (model.kind === 'ram') {
        const plow = new THREE.Mesh(new THREE.BoxGeometry(width * 1.35, 0.9, 0.5), trim);
        plow.position.set(0, 0.75, length / 2 + 0.5);
        chassis.add(plow);
      }
    }

    chassis.position.copy(position);
    chassis.rotation.y = rotation;
    this.group = chassis;
    this.shell = shell;
    this.wheels = wheels;
    this.length = length;
  }

  get position() {
    return this.group.position;
  }

  get rotation() {
    return this.group.rotation;
  }

  getSpeedKmh() {
    return Math.abs(this.speed) * 3.6;
  }

  applyDamage(amount) {
    if (this.destroyed) return 0;
    this.damage = Math.min(100, this.damage + amount);
    this.health = Math.max(0, 100 - this.damage);
    this.shell.material.color.lerp(new THREE.Color(0x3a332f), Math.min(0.75, this.damage / 140));
    if (this.health <= 0) {
      this.destroyed = true;
      this.onDestroyed?.(this);
    }
    return this.health;
  }

  repair() {
    this.damage = 0;
    this.health = 100;
    this.destroyed = false;
    this.shell.material.color.setHex(this.model.color);
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
    this.steering = THREE.MathUtils.lerp(this.steering, steer, dt * 7);
    this.group.rotation.y -= this.steering * turnRate * dt * Math.sign(this.speed || 1);
    this.group.position.x += Math.sin(this.group.rotation.y) * this.speed * dt;
    this.group.position.z += Math.cos(this.group.rotation.y) * this.speed * dt;

    for (const wheel of this.wheels) wheel.rotation.x += this.speed * dt * 1.7;
    if (this.lightBar) {
      this.lightBar.material.color.setHex(Math.sin(this.elapsed * 14) > 0 ? 0xff3b3b : 0x2f6ee0);
    }
  }
}

export class VehicleFleet {
  constructor(scene, random) {
    this.scene = scene;
    this.random = random;
    this.vehicles = [];
    this.onDestroyed = null;
  }

  spawn(modelId, position, rotation = 0, options = {}) {
    const model = vehicleModel(modelId);
    const vehicle = new Vehicle(model, position, rotation, options);
    if (options.upgrades) vehicle.upgrades = options.upgrades;
    vehicle.onDestroyed = (wreck) => this.onDestroyed?.(wreck);
    this.scene.add(vehicle.group);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  spawnParkedCars() {
    const parked = [];
    const civilian = VEHICLE_MODELS.slice(0, 12);
    for (const line of [-270, -180, -90, 0, 90, 180, 270]) {
      for (let along = -300; along < 300; along += 96) {
        if (this.random.chance(0.42)) continue;
        const model = this.random.pick(civilian);
        const alongX = this.random.chance(0.5);
        const x = alongX ? along + this.random.range(-14, 14) : line + 12;
        const z = alongX ? line + 12 : along + this.random.range(-14, 14);
        const heading = alongX ? Math.PI / 2 : 0;
        parked.push(this.spawn(model.id, new THREE.Vector3(x, 0, z), heading, { parked: true }));
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
      const along = this.random.range(-320, 320);
      const lane = this.random.chance(0.5) ? 1 : -1;
      const x = alongX ? along : line + lane * 4.5;
      const z = alongX ? line + lane * 4.5 : along;
      const heading = alongX
        ? (lane > 0 ? Math.PI / 2 : -Math.PI / 2)
        : (lane > 0 ? Math.PI : 0);
      spawned.push(this.spawn(model.id, new THREE.Vector3(x, 0, z), heading, { role: 'traffic' }));
    }
    return spawned;
  }

  findNearest(position, maxDistance = 7) {
    let nearest = null;
    let shortest = maxDistance;
    for (const vehicle of this.vehicles) {
      const distance = vehicle.position.distanceTo(position);
      if (distance < shortest) {
        nearest = vehicle;
        shortest = distance;
      }
    }
    return nearest;
  }
}
