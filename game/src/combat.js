// Six weapon slots, hitscan shots, muzzle flashes, sparks and vehicle damage.

import * as THREE from 'three';
import { WEAPONS } from './config.js';

export class CombatSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.index = 0;
    this.wheelOpen = false;
    this.cooldown = 0;
    this.shots = [];
    this.sparks = [];
    this.targets = [];
    this.onHit = null;
  }

  setWeapon(index) {
    this.index = Math.max(0, Math.min(WEAPONS.length - 1, index));
  }

  get weapon() { return WEAPONS[this.index]; }

  registerTargets(list) { this.targets = list; }

  fire(origin, direction) {
    if (this.cooldown > 0) return false;
    const w = this.weapon;
    this.cooldown = w.rate;
    const dir = direction.clone().normalize();
    const mat = new THREE.MeshBasicMaterial({ color: w.color });
    const shot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 5, 4), mat);
    shot.position.copy(origin);
    this.scene.add(shot);
    this.shots.push({ mesh: shot, dir, life: 0.9, damage: w.damage });

    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.55, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    flash.position.copy(origin);
    this.scene.add(flash);
    this.sparks.push({ mesh: flash, life: 0.09, vel: new THREE.Vector3() });
    return true;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.mesh.position.addScaledVector(s.dir, 150 * dt);
      s.life -= dt;
      let hit = false;
      for (const t of this.targets) {
        if (!t.pos) continue;
        if (s.mesh.position.distanceTo(t.pos) < (t.radius || 3)) {
          if (this.onHit) this.onHit(t, s.damage);
          this.burst(s.mesh.position, t.color || 0xffb35c);
          hit = true;
          break;
        }
      }
      if (hit || s.life <= 0) {
        this.scene.remove(s.mesh);
        this.shots.splice(i, 1);
      }
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.sparks.splice(i, 1);
      }
    }
  }

  burst(position, color) {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 4, 3), new THREE.MeshBasicMaterial({ color }));
      m.position.copy(position);
      this.scene.add(m);
      this.sparks.push({
        mesh: m, life: 0.35,
        vel: new THREE.Vector3((this.rng() - 0.5) * 18, this.rng() * 12, (this.rng() - 0.5) * 18),
      });
    }
  }
}
