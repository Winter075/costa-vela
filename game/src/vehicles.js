// Vehicle models, colour variants and the simple arcade driving model.

import * as THREE from 'three';
import { range, tint } from './random.js';

export function buildCarMesh(spec, rng, extra = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: spec.body });
  const darkMat = new THREE.MeshLambertMaterial({ color: spec.accent });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x25313c });
  const box = new THREE.BoxGeometry(1, 1, 1);

  const body = new THREE.Mesh(box, bodyMat);
  body.scale.set(2.5, 0.8, 4.8);
  body.position.y = 1.0;
  g.add(body);

  const cabin = new THREE.Mesh(box, glassMat);
  cabin.scale.set(2.2, 0.72, 2.2);
  cabin.position.set(0, 1.72, -0.25);
  g.add(cabin);

  const stripe = new THREE.Mesh(box, darkMat);
  stripe.scale.set(2.54, 0.16, 4.3);
  stripe.position.y = 0.72;
  g.add(stripe);

  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.34, 8);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  for (const sx of [-1.25, 1.25]) {
    for (const sz of [-1.55, 1.55]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(sx, 0.56, sz);
      g.add(w);
      wheels.push(w);
    }
  }

  const lampMat = new THREE.MeshBasicMaterial({ color: extra.police ? 0x66aaff : 0xffedb8 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xd83a34 });
  for (const sx of [-0.82, 0.82]) {
    const head = new THREE.Mesh(box, lampMat);
    head.scale.set(0.5, 0.24, 0.12);
    head.position.set(sx, 1.15, 2.43);
    g.add(head);
    const tail = new THREE.Mesh(box, tailMat);
    tail.scale.set(0.5, 0.22, 0.12);
    tail.position.set(sx, 1.12, -2.43);
    g.add(tail);
  }

  if (extra.police) {
    const bar = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x3f6fd8 }));
    bar.scale.set(1.6, 0.22, 0.45);
    bar.position.set(0, 2.25, 0);
    g.add(bar);
    g.userData.lightBar = bar;
  }
  if (extra.roadblock) {
    const arm = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0xe4a33c }));
    arm.scale.set(3.2, 0.3, 0.2);
    arm.position.set(0, 1.9, 0);
    g.add(arm);
  }

  g.userData.wheels = wheels;
  g.userData.bodyMat = bodyMat;
  if (rng) tint(spec.body, Math.floor(range(rng, -6, 6)));
  return g;
}

export class Vehicle {
  constructor(spec, rng, scene, extra = {}) {
    this.spec = spec;
    this.mesh = buildCarMesh(spec, rng, extra);
    this.pos = this.mesh.position;
    this.heading = 0;
    this.speed = 0;
    this.damage = 0;
    this.wheels = this.mesh.userData.wheels;
    scene.add(this.mesh);
  }

  place(x, z, heading = 0) {
    this.pos.set(x, 0, z);
    this.heading = heading;
    this.mesh.rotation.y = heading;
  }

  drive(dt, controls) {
    const grip = this.spec.grip || 1;
    const top = (this.spec.top || 160) / 3.6;
    if (controls.throttle) this.speed += 26 * dt * grip * (1 + 0.4 * (this.spec.engineBoost || 0));
    if (controls.brake) this.speed -= 38 * dt;
    if (controls.handbrake) this.speed *= Math.max(0, 1 - 3.2 * dt);
    this.speed *= Math.max(0, 1 - 0.75 * dt);
    if (controls.throttle && controls.brake) this.speed *= 0.96;
    this.speed = Math.max(-top * 0.35, Math.min(top, this.speed));
    const turn = (controls.steer || 0) * Math.min(1.5, Math.abs(this.speed) / 12) * 1.5 * dt * grip;
    this.heading += turn * Math.sign(this.speed || 1);
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;
    this.pos.y = 0;
    this.mesh.rotation.y = this.heading;
    for (const w of this.wheels) w.rotation.x += this.speed * dt * 0.6;
    if (this.mesh.userData.lightBar) {
      this.mesh.userData.lightBar.material.color.setHex(Math.floor(Date.now() / 140) % 2 ? 0x3f6fd8 : 0xe04545);
    }
  }

  hit(amount) {
    this.damage = Math.min(100, this.damage + amount);
    const f = 1 - this.damage / 150;
    this.mesh.userData.bodyMat.color.multiplyScalar(Math.max(0.55, f));
    return this.damage;
  }

  get kmh() { return Math.round(Math.abs(this.speed) * 3.6); }
}
