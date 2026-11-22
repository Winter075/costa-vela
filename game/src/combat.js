// Costa Vela combat: six weapon slots, hitscan fire, muzzle flash, impact sparks and explosions.

import * as THREE from 'three';
import { WEAPONS } from './config.js';

const SPARK_MAT = new THREE.MeshBasicMaterial({ color: 0xffd27a });
const SMOKE_MAT = new THREE.MeshBasicMaterial({ color: 0x4a4238, transparent: true, opacity: 0.55, depthWrite: false });

export class CombatSystem {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.slot = 1;
    this.cooldown = 0;
    this.wheelOpen = false;
    this.effects = [];
    this.explosions = [];
    this.shotsFired = 0;
    this.hits = 0;
    this.raycaster = new THREE.Raycaster();

    this.muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.9 }),
    );
    this.muzzle.visible = false;
    scene.add(this.muzzle);
    this.muzzleLight = new THREE.PointLight(0xffcc70, 0, 26);
    scene.add(this.muzzleLight);
    this.flashTimer = 0;
  }

  get weapon() { return WEAPONS[this.slot - 1] ?? WEAPONS[0]; }

  selectSlot(slot) {
    if (slot < 1 || slot > WEAPONS.length) return;
    this.slot = slot;
    this.wheelOpen = false;
  }

  cycle(dir) {
    this.slot = ((this.slot - 1 + dir + WEAPONS.length) % WEAPONS.length) + 1;
  }

  toggleWheel(force) {
    this.wheelOpen = force === undefined ? !this.wheelOpen : force;
  }

  fire(origin, direction, targets) {
    if (this.cooldown > 0) return null;
    const weapon = this.weapon;
    this.cooldown = weapon.rate;
    this.shotsFired++;
    this.audio.playShot();
    this.flashTimer = 0.07;
    this.muzzle.position.copy(origin).addScaledVector(direction, 2.2);
    this.muzzle.visible = true;
    this.muzzleLight.position.copy(this.muzzle.position);
    this.muzzleLight.intensity = 18;

    this.raycaster.set(origin, direction.clone().normalize());
    this.raycaster.far = weapon.range;
    const meshes = targets.map((t) => t.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    let result = null;
    if (hits.length) {
      const hit = hits[0];
      const target = targets.find((t) => isDescendant(hit.object, t.mesh));
      this.spawnSparks(hit.point);
      if (target && target.onHit) {
        target.onHit(weapon.damage, hit.point);
        this.hits++;
      }
      result = { point: hit.point.clone(), target };
    } else {
      result = { point: origin.clone().addScaledVector(direction, weapon.range * 0.5), target: null };
    }

    if (weapon.slot === 6) this.spawnExplosion(result.point.x, result.point.z, 1);
    return result;
  }

  spawnSparks(point) {
    for (let i = 0; i < 7; i++) {
      const spark = new THREE.Mesh(new THREE.TetrahedronGeometry(0.35), SPARK_MAT);
      spark.position.copy(point);
      spark.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 12 + 3,
        (Math.random() - 0.5) * 16,
      );
      spark.userData.life = 0.5;
      this.scene.add(spark);
      this.effects.push(spark);
    }
  }

  spawnExplosion(x, z, scale = 1) {
    const group = new THREE.Group();
    const colors = [0xffd166, 0xff7a2f, 0xd93a1f];
    for (let i = 0; i < 5; i++) {
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry((5 - i) * 1.5 * scale, 10, 8),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.85, depthWrite: false }),
      );
      ball.position.set((Math.random() - 0.5) * 4 * scale, (3 + i * 1.5) * scale, (Math.random() - 0.5) * 4 * scale);
      group.add(ball);
    }
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(3 * scale, 8, 6), SMOKE_MAT.clone());
      puff.position.set((Math.random() - 0.5) * 10 * scale, (8 + Math.random() * 10) * scale, (Math.random() - 0.5) * 10 * scale);
      group.add(puff);
    }
    const light = new THREE.PointLight(0xff8a3c, 120 * scale, 90 * scale);
    light.position.y = 8 * scale;
    group.add(light);
    group.position.set(x, 0, z);
    group.userData = { life: 2.4, maxLife: 2.4, scale };
    this.scene.add(group);
    this.explosions.push(group);
    this.audio.playImpact();
    return group;
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) { this.muzzle.visible = false; this.muzzleLight.intensity = 0; }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.userData.life -= dt;
      fx.userData.velocity.y -= 32 * dt;
      fx.position.addScaledVector(fx.userData.velocity, dt);
      fx.scale.setScalar(Math.max(0.05, fx.userData.life * 2));
      if (fx.userData.life <= 0) { this.scene.remove(fx); this.effects.splice(i, 1); }
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.userData.life -= dt;
      const t = 1 - ex.userData.life / ex.userData.maxLife;
      ex.scale.setScalar(1 + t * 1.6);
      for (const child of ex.children) {
        if (child.isLight) child.intensity = Math.max(0, 120 * (1 - t));
        else if (child.material) child.material.opacity = Math.max(0, 0.85 * (1 - t));
      }
      if (ex.userData.life <= 0) { this.scene.remove(ex); this.explosions.splice(i, 1); }
    }
  }
}

function isDescendant(object, ancestor) {
  let node = object;
  while (node) {
    if (node === ancestor) return true;
    node = node.parent;
  }
  return false;
}
