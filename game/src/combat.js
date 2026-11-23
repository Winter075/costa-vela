// combat.js — six weapon slots, click to fire, tracers, muzzle flash, sparks and damage.

import * as THREE from 'three';
import { WEAPONS } from './config.js';

export class CombatSystem {
  constructor(scene, camera, random, audio) {
    this.scene = scene;
    this.camera = camera;
    this.random = random;
    this.audio = audio;
    this.weapons = WEAPONS.map((weapon) => ({ ...weapon }));
    this.activeIndex = 0;
    this.ammo = Object.fromEntries(WEAPONS.map((weapon) => [weapon.id, weapon.ammo]));
    this.cooldown = 0;
    this.effects = [];
    this.damageMultiplier = 1;
    this.muzzle = new THREE.PointLight(0xffd08a, 0, 28);
    scene.add(this.muzzle);
    this.muzzleLife = 0;
    this.onExplosion = null;
  }

  get activeWeapon() {
    return this.weapons[this.activeIndex];
  }

  switchWeapon(slot) {
    const index = this.weapons.findIndex((weapon) => weapon.slot === slot);
    if (index >= 0) {
      this.activeIndex = index;
      return this.activeWeapon;
    }
    return null;
  }

  cycleWeapon(direction) {
    this.activeIndex = (this.activeIndex + direction + this.weapons.length) % this.weapons.length;
    return this.activeWeapon;
  }

  addTracer(from, to, color) {
    const path = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const line = new THREE.Line(
      path,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }),
    );
    this.scene.add(line);
    this.effects.push({ object: line, life: 0.12, kind: 'tracer' });
  }

  addSparks(point, color) {
    for (let i = 0; i < 8; i++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 + this.random.next() * 0.1, 5, 4),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
      );
      spark.position.copy(point);
      this.scene.add(spark);
      const velocity = new THREE.Vector3(
        this.random.range(-8, 8),
        this.random.range(2, 12),
        this.random.range(-8, 8),
      );
      this.effects.push({ object: spark, life: 0.48, kind: 'spark', velocity });
    }
  }

  fire(targets = []) {
    if (this.cooldown > 0) return false;
    const weapon = this.activeWeapon;
    if (this.ammo[weapon.id] <= 0) return false;
    this.ammo[weapon.id]--;
    this.cooldown = weapon.rate;

    const origin = this.camera.position.clone();
    const aimDirection = new THREE.Vector3();
    this.camera.getWorldDirection(aimDirection);
    const muzzlePoint = origin.clone()
      .addScaledVector(aimDirection, 3)
      .add(new THREE.Vector3(0.35, -0.45, 0));
    let impact = origin.clone().addScaledVector(aimDirection, weapon.range);

    let target = null;
    let bestDistance = weapon.range;
    for (const candidate of targets) {
      if (!candidate?.position) continue;
      if (candidate.health !== undefined && candidate.health <= 0) continue;
      const offset = candidate.position.clone().sub(origin);
      const distance = offset.length();
      if (distance > bestDistance || distance < 1) continue;
      if (offset.normalize().dot(aimDirection) < 0.955) continue;
      target = candidate;
      bestDistance = distance;
    }

    if (target) {
      impact = target.position.clone().add(new THREE.Vector3(0, 0.8, 0));
      target.applyDamage?.(weapon.damage * this.damageMultiplier);
      this.addSparks(impact, weapon.color);
      if (weapon.id === 'fiesta') this.onExplosion?.(impact);
    }

    this.addTracer(muzzlePoint, impact, weapon.color);
    this.muzzle.position.copy(muzzlePoint);
    this.muzzle.color.setHex(weapon.color);
    this.muzzleLife = 0.09;
    this.audio?.shot(weapon.id === 'fiesta' ? 2.2 : 1);
    return true;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.muzzleLife = Math.max(0, this.muzzleLife - dt);
    this.muzzle.intensity = this.muzzleLife > 0 ? 12 : 0;

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.life -= dt;
      if (effect.velocity) {
        effect.object.position.addScaledVector(effect.velocity, dt);
        effect.velocity.y -= 22 * dt;
      }
      if (effect.object.material) {
        const full = effect.kind === 'spark' ? 0.48 : 0.12;
        effect.object.material.opacity = Math.max(0, effect.life / full);
      }
      if (effect.life <= 0) {
        this.scene.remove(effect.object);
        effect.object.geometry?.dispose();
        effect.object.material?.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  getWeaponRows() {
    return this.weapons.map((weapon, index) => ({
      slot: weapon.slot,
      name: weapon.name,
      ammo: this.ammo[weapon.id],
      active: index === this.activeIndex,
      color: `#${weapon.color.toString(16).padStart(6, '0')}`,
    }));
  }
}
