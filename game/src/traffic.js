// Moving traffic, parked cars and pedestrians who get out of the way.

import * as THREE from 'three';
import { CITY, VEHICLES } from './config.js';
import { Vehicle } from './vehicles.js';
import { pick, range } from './random.js';

const pedestrianColours = [0x6d4f9c, 0xe0b134, 0x2a6ea8, 0x2f8d69, 0xb5573d, 0xd8d3c4];

function makePedestrian(rng, x, z) {
  const g = new THREE.Group();
  const colour = pick(rng, pedestrianColours);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.7, 6), new THREE.MeshLambertMaterial({ color: colour }));
  body.position.y = 1.0;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 6), new THREE.MeshLambertMaterial({ color: 0xc99368 }));
  head.position.y = 2.1;
  g.add(head);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.4), new THREE.MeshLambertMaterial({ color: 0x25252b }));
  legs.position.y = 0.35;
  g.add(legs);
  g.position.set(x, 0, z);
  return g;
}

export class TrafficSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.cars = [];
    this.peds = [];
    this.parked = [];

    for (let i = 0; i < 20; i++) {
      const spec = pick(rng, VEHICLES);
      const v = new Vehicle(spec, rng, scene);
      const axis = rng() > 0.5 ? 'x' : 'z';
      const line = pick(rng, CITY.grid);
      const dir = rng() > 0.5 ? 1 : -1;
      const lane = dir > 0 ? -3.4 : 3.4;
      const pos = range(rng, -192, 192);
      if (axis === 'x') v.place(line + lane, pos, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      else v.place(pos, line + lane, dir > 0 ? 0 : Math.PI);
      v.speed = range(rng, 7, 13);
      v.axis = axis; v.dir = dir; v.line = line;
      this.cars.push(v);
    }

    for (let i = 0; i < 12; i++) {
      const spec = pick(rng, VEHICLES);
      const v = new Vehicle(spec, rng, scene);
      const road = pick(rng, CITY.grid);
      const along = pick(rng, CITY.grid.filter((g) => Math.abs(g - road) > 40));
      const side = pick(rng, [-9.5, 9.5]);
      if (rng() > 0.5) v.place(road + side, along + range(rng, -12, 12), pick(rng, [0, Math.PI]));
      else v.place(along + range(rng, -12, 12), road + side, pick(rng, [Math.PI / 2, -Math.PI / 2]));
      this.parked.push(v);
    }

    for (let i = 0; i < 36; i++) {
      const road = pick(rng, CITY.grid);
      const along = range(rng, -190, 190);
      const side = pick(rng, [-11, 11]);
      const x = rng() > 0.5 ? road + side : along;
      const z = rng() > 0.5 ? along : road + side;
      const mesh = makePedestrian(rng, x, z);
      scene.add(mesh);
      this.peds.push({ mesh, dir: range(rng, 0, Math.PI * 2), speed: range(rng, 1.1, 2.2), flee: 0 });
    }
  }

  update(dt, playerPos, time) {
    for (const v of this.cars) {
      v.drive(dt, { throttle: false, brake: false, steer: 0, handbrake: false });
      const atIntersection = Math.min(
        Math.abs(((v.pos.x + 24) % 48) - 24),
        Math.abs(((v.pos.z + 24) % 48) - 24),
      ) < 1.6;
      if (atIntersection && this.rng() < dt * 0.7) {
        const old = v.axis;
        v.axis = old === 'x' ? 'z' : 'x';
        v.line = v.axis === 'x' ? Math.round(v.pos.z / 48) * 48 : Math.round(v.pos.x / 48) * 48;
        v.dir = this.rng() > 0.5 ? 1 : -1;
        v.heading = v.axis === 'x' ? (v.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (v.dir > 0 ? 0 : Math.PI);
        const lane = v.dir > 0 ? -3.4 : 3.4;
        if (v.axis === 'x') v.pos.z = v.line + lane;
        else v.pos.x = v.line + lane;
        v.mesh.rotation.y = v.heading;
      }
      if (Math.abs(v.pos.x) > 230 || Math.abs(v.pos.z) > 230) {
        const road = pick(this.rng, CITY.grid);
        v.place(road, road, v.heading);
      }
    }

    for (const p of this.peds) {
      const dx = p.mesh.position.x - playerPos.x;
      const dz = p.mesh.position.z - playerPos.z;
      const near = dx * dx + dz * dz < 196;
      if (near) {
        p.dir = Math.atan2(dx, dz);
        p.flee = 1.6;
      }
      p.flee = Math.max(0, p.flee - dt);
      p.mesh.position.x += Math.sin(p.dir) * p.speed * dt * (p.flee ? 2 : 1);
      p.mesh.position.z += Math.cos(p.dir) * p.speed * dt * (p.flee ? 2 : 1);
      p.mesh.rotation.y = p.dir;
      p.mesh.children[0].rotation.z = Math.sin(time * 7 + p.dir) * 0.08;
      if (Math.abs(p.mesh.position.x) > 215 || Math.abs(p.mesh.position.z) > 215) p.dir += Math.PI;
    }
  }
}
