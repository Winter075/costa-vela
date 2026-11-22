// Six weapon slots, hitscan fire, muzzle flashes and vehicle damage.
import * as THREE from 'three';
import { WEAPONS } from './config.js';

export function createCombat(ctx) {
  let selected = 0;
  let cooldown = 0;
  const raycaster = new THREE.Raycaster();

  function setWeapon(index) {
    if (index < 0 || index >= WEAPONS.length) return;
    selected = index;
    ctx.toast(WEAPONS[selected].name + ' equipped');
  }

  function resolveHit(targets, origin, direction, range) {
    raycaster.set(origin, direction);
    raycaster.far = range;
    const roots = targets.map((target) => target.root);
    const intersections = raycaster.intersectObjects(roots, true);
    if (intersections.length === 0) return null;
    const hit = intersections[0];
    let object = hit.object;
    let target = null;
    while (object && !target) {
      target = targets.find((candidate) => candidate.root === object) ?? null;
      object = object.parent;
    }
    return target ? { target, point: hit.point, distance: hit.distance } : null;
  }

  function fire() {
    if (cooldown > 0 || ctx.state.mode !== 'play') return;
    const weapon = WEAPONS[selected];
    cooldown = weapon.rate;
    const origin = ctx.getFireOrigin();
    const direction = ctx.getAimDirection();
    const targets = ctx.getTargets();
    const hit = resolveHit(targets, origin, direction, weapon.range);
    const end = hit ? hit.point : origin.clone().addScaledVector(direction, weapon.range * 0.65);

    ctx.effects.tracer(origin, end, new THREE.Color(weapon.color));
    ctx.effects.burst(origin.clone().addScaledVector(direction, 1.4), 0xfff0b0, 3);
    ctx.audio.shot(weapon.kind);
    ctx.state.shotsFired += 1;

    if (hit) {
      ctx.effects.burst(hit.point, 0xffc46b, weapon.kind === 'launcher' ? 12 : 6);
      if (weapon.kind === 'launcher') {
        for (const target of targets) {
          const center = target.root.position;
          if (center.distanceTo(hit.point) < 14) target.onHit(weapon.damage);
        }
        ctx.effects.fire(hit.point, 6);
        ctx.audio.crash();
      } else {
        hit.target.onHit(weapon.damage);
      }
    }

    if (ctx.state.wanted === 0) ctx.setWanted(1);
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
  }

  return {
    fire,
    update,
    setWeapon,
    getWeapon: () => selected,
    getWeaponName: () => WEAPONS[selected].name,
    getWeapons: () => WEAPONS,
  };
}

export { WEAPONS };
