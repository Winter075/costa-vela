// Six weapon slots, hitscan fire, muzzle flashes and vehicle damage.

import * as THREE from 'three';
import { WEAPONS } from './config.js';

export function createCombat(ctx) {
  let index = 0;
  let cooldown = 0;
  const raycaster = new THREE.Raycaster();

  function setWeapon(next) {
    index = Math.max(0, Math.min(WEAPONS.length - 1, next));
    ctx.hud.toast(WEAPONS[index].name + ' selected');
  }

  function fire() {
    if (cooldown > 0 || ctx.state.mode !== 'play') return;
    const weapon = WEAPONS[index];
    cooldown = weapon.rate;
    ctx.state.shotsFired += 1;
    const origin = ctx.getFireOrigin();
    const direction = ctx.getAimDirection();
    const end = origin.clone().addScaledVector(direction, weapon.range);
    ctx.effects.flash(origin);
    ctx.effects.tracer(origin, end, index === 4 ? 0x8be6ff : 0xffd479);
    ctx.audio.shot(index);
    ctx.state.showWheel = Math.max(ctx.state.showWheel, 0.35);

    raycaster.set(origin, direction);
    raycaster.far = weapon.range;
    const roots = ctx.getTargets().map((target) => target.root);
    const hits = raycaster.intersectObjects(roots, true);
    if (!hits.length) return;
    const hit = hits[0];
    const target = ctx.getTargets().find((item) => isDescendant(hit.object, item.root));
    if (!target) return;
    if (hit.distance > weapon.range) return;
    target.onHit(weapon.damage);
    ctx.effects.burst(hit.point, index === 4 ? 0x9fe8ff : 0xffc46b, weapon.id === 'launcher' ? 14 : 6);
    if (weapon.id === 'launcher') ctx.effects.fire(hit.point, 9);
    ctx.state.hitCount = (ctx.state.hitCount ?? 0) + 1;
  }

  function isDescendant(object, root) {
    let node = object;
    while (node) {
      if (node === root) return true;
      node = node.parent;
    }
    return false;
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
  }

  return { fire, setWeapon, update, get index() { return index; }, get weapon() { return WEAPONS[index]; } };
}
