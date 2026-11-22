// Transient combat visuals: tracers, sparks, fragments and burning wrecks.
import * as THREE from 'three';

export function createEffects(scene) {
  const active = [];

  function remember(object, life, tick) {
    scene.add(object);
    active.push({ object, life, age: 0, tick });
  }

  function tracer(from, to, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geometry, material);
    remember(line, 0.13, (entry) => {
      entry.object.material.opacity = 1 - entry.age / entry.life;
    });
  }

  function burst(position, color = 0xffc46b, count = 7) {
    const geometry = new THREE.SphereGeometry(0.18, 5, 4);
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const spark = new THREE.Mesh(geometry, material);
      spark.position.copy(position);
      const angle = (i / count) * Math.PI * 2;
      const rise = 1.5 + (i % 3);
      const drift = new THREE.Vector3(Math.cos(angle) * 3, rise, Math.sin(angle) * 3);
      remember(spark, 0.45, (entry) => {
        entry.object.position.addScaledVector(drift, 0.016);
        entry.object.material.opacity = 1 - entry.age / entry.life;
      });
    }
  }

  function fire(position, life = 10) {
    const group = new THREE.Group();
    group.position.copy(position);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8b2e, transparent: true, opacity: 0.85 });
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x3b3633, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 5; i += 1) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5 + i * 0.08, 2.5, 6), flameMat.clone());
      flame.position.set((i - 2) * 0.28, 1.4 + (i % 2) * 0.4, (i % 3 - 1) * 0.3);
      group.add(flame);
    }
    for (let i = 0; i < 3; i += 1) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(1.1 + i * 0.35, 7, 5), smokeMat.clone());
      smoke.position.set((i - 1) * 0.5, 3.4 + i * 1.2, 0);
      group.add(smoke);
    }
    remember(group, life, (entry) => {
      const phase = entry.age * 8;
      entry.object.children.forEach((child, index) => {
        if (index < 5) {
          child.scale.y = 0.75 + Math.sin(phase + index) * 0.28;
          child.material.opacity = 0.85 - entry.age / (entry.life * 1.6);
        } else {
          child.position.y += 0.012;
          child.material.opacity = Math.max(0, 0.5 - entry.age / (entry.life * 1.5));
        }
      });
    });
    return group;
  }

  function update(dt) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      const entry = active[i];
      entry.age += dt;
      if (entry.tick) entry.tick(entry);
      if (entry.age >= entry.life) {
        scene.remove(entry.object);
        active.splice(i, 1);
      }
    }
  }

  return { tracer, burst, fire, update };
}
