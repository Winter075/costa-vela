// Short-lived visuals: tracers, impact sparks, muzzle flashes, fire and smoke.

import * as THREE from 'three';

export function createEffects(scene) {
  const live = [];

  function keep(object, life, animate) {
    scene.add(object);
    live.push({ object, life, age: 0, animate });
  }

  function tracer(from, to, color = 0xffd479) {
    const geometry = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }));
    keep(line, 0.14, (effect) => {
      effect.object.material.opacity = 1 - effect.age / effect.life;
    });
  }

  function burst(at, color = 0xffc46b, count = 6) {
    const shape = new THREE.SphereGeometry(0.16, 5, 4);
    for (let i = 0; i < count; i += 1) {
      const piece = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
      piece.position.copy(at);
      const angle = (i / count) * Math.PI * 2;
      const drift = new THREE.Vector3(Math.cos(angle) * 4, 2 + (i % 3), Math.sin(angle) * 4);
      keep(piece, 0.42, (effect) => {
        effect.object.position.addScaledVector(drift, 0.016);
        effect.object.material.opacity = 1 - effect.age / effect.life;
      });
    }
  }

  function flash(at) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffdd96, transparent: true, opacity: 0.95 }),
    );
    glow.position.copy(at);
    keep(glow, 0.09, (effect) => {
      effect.object.scale.setScalar(1 + effect.age * 12);
      effect.object.material.opacity = 1 - effect.age / effect.life;
    });
  }

  function fire(at, life = 12) {
    const group = new THREE.Group();
    group.position.copy(at);
    for (let i = 0; i < 5; i += 1) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.55 + i * 0.07, 2.6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff8b2e, transparent: true, opacity: 0.85 }),
      );
      flame.position.set((i - 2) * 0.3, 1.5 + (i % 2) * 0.4, ((i % 3) - 1) * 0.3);
      group.add(flame);
    }
    for (let i = 0; i < 3; i += 1) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(1 + i * 0.35, 7, 5),
        new THREE.MeshBasicMaterial({ color: 0x3b3633, transparent: true, opacity: 0.5 }),
      );
      smoke.position.set((i - 1) * 0.5, 3.5 + i * 1.2, 0);
      group.add(smoke);
    }
    keep(group, life, (effect) => {
      const phase = effect.age * 8;
      effect.object.children.forEach((part, index) => {
        if (index < 5) {
          part.scale.y = 0.75 + Math.sin(phase + index) * 0.28;
          part.material.opacity = 0.85 - effect.age / (effect.life * 1.6);
        } else {
          part.position.y += 0.012;
          part.material.opacity = Math.max(0, 0.5 - effect.age / (effect.life * 1.5));
        }
      });
    });
    return group;
  }

  function update(dt) {
    for (let i = live.length - 1; i >= 0; i -= 1) {
      const effect = live[i];
      effect.age += dt;
      effect.animate(effect);
      if (effect.age >= effect.life) {
        scene.remove(effect.object);
        live.splice(i, 1);
      }
    }
  }

  return { tracer, burst, flash, fire, update };
}
