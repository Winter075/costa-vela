// Costa Vela's coastal city: districts, roads, palms, water and sunset sky.

import * as THREE from 'three';
import { CITY, DISTRICTS } from './config.js';
import { pick, range, tint } from './random.js';

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2b4f7a');
  grad.addColorStop(0.42, '#d97b50');
  grad.addColorStop(0.7, '#f0ad61');
  grad.addColorStop(1, '#f6d39a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function palm(scene, x, z, rng, height) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.44, height, 6),
    new THREE.MeshLambertMaterial({ color: 0x7a5a3c }),
  );
  trunk.position.y = height / 2;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: tint(0x3f7a46, Math.floor(range(rng, -18, 18))), side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.7, 5.5, 3), leafMat);
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 1.9, height + 0.6, Math.sin(a) * 1.9);
    leaf.rotation.set(Math.PI / 2.6, a, 0);
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

function streetLamp(scene, x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 8, 5), new THREE.MeshLambertMaterial({ color: 0x3d4148 }));
  pole.position.y = 4;
  g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.2), new THREE.MeshLambertMaterial({ color: 0x3d4148 }));
  arm.position.set(1.4, 7.9, 0);
  g.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
  bulb.position.set(2.7, 7.6, 0);
  g.add(bulb);
  g.position.set(x, 0, z);
  scene.add(g);
}

export function districtAt(x, z) {
  for (const d of DISTRICTS) if (d.zone(x, z)) return d;
  return DISTRICTS[DISTRICTS.length - 1];
}

export function createWorld(scene, rng) {
  scene.background = new THREE.Color(0xe6a269);
  scene.fog = new THREE.Fog(0xe0a06c, 150, 560);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 20, 12),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }),
  );
  scene.add(sky);

  const sun = new THREE.DirectionalLight(0xffd2a0, 2.1);
  sun.position.set(-180, 150, 220);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffd9b0, 0x40454f, 1.1));

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.MeshLambertMaterial({ color: 0xcbb08a }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = -0.25;
  scene.add(sand);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 900),
    new THREE.MeshLambertMaterial({ color: 0x2d8fa6, transparent: true, opacity: 0.94 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, CITY.waterLevel, 660);
  scene.add(ocean);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0x34363b });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xb9b1a3 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xe4d6a6 });
  const limit = CITY.limit;

  for (const c of CITY.grid) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(limit * 2, CITY.road), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0.01, c); scene.add(h);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(CITY.road, limit * 2), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(c, 0.012, 0); scene.add(v);
    const lh = new THREE.Mesh(new THREE.PlaneGeometry(limit * 2, 0.28), lineMat);
    lh.rotation.x = -Math.PI / 2; lh.position.set(0, 0.03, c); scene.add(lh);
    const lv = new THREE.Mesh(new THREE.PlaneGeometry(0.28, limit * 2), lineMat);
    lv.rotation.x = -Math.PI / 2; lv.position.set(c, 0.032, 0); scene.add(lv);
  }

  const mats = DISTRICTS.map((d) => new THREE.MeshLambertMaterial({ color: d.tint }));
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x2c3948 });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const slabGeo = new THREE.BoxGeometry(1, 1, 1);
  const buildingMeshes = [];
  let buildings = 0;

  for (let i = 0; i < CITY.grid.length - 1; i++) {
    for (let j = 0; j < CITY.grid.length - 1; j++) {
      const x0 = CITY.grid[i], x1 = CITY.grid[i + 1];
      const z0 = CITY.grid[j], z1 = CITY.grid[j + 1];
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const d = districtAt(cx, cz);
      const idx = DISTRICTS.indexOf(d);
      const slab = new THREE.Mesh(slabGeo, walkMat);
      slab.scale.set(CITY.block - CITY.road - 1, 0.4, CITY.block - CITY.road - 1);
      slab.position.set(cx, 0.2, cz);
      scene.add(slab);

      const count = rng() > 0.45 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const h = range(rng, d.height * 0.55, d.height * 1.4);
        const w = range(rng, 11, 19);
        const dep = range(rng, 11, 19);
        const b = new THREE.Mesh(boxGeo, mats[idx]);
        b.scale.set(w, h, dep);
        const ox = count === 1 ? 0 : (k === 0 ? -9 : 9);
        b.position.set(cx + ox, h / 2 + 0.4, cz + range(rng, -6, 6));
        scene.add(b);
        buildingMeshes.push(b);
        const cap = new THREE.Mesh(boxGeo, glassMat);
        cap.scale.set(w * 0.92, 1.2, dep * 0.92);
        cap.position.set(b.position.x, h + 0.4, b.position.z);
        scene.add(cap);
        buildings++;
      }
    }
  }

  for (const c of CITY.grid) {
    for (let t = -192; t <= 192; t += 48) {
      if (rng() > 0.5) palm(scene, c + 10, t + 14, rng, range(rng, 8, 12));
      if (rng() > 0.55) streetLamp(scene, c - 10, t - 12);
    }
  }

  const dock = new THREE.Mesh(new THREE.BoxGeometry(180, 1.2, 26), new THREE.MeshLambertMaterial({ color: 0x8b8378 }));
  dock.position.set(-168, 0.4, 228);
  scene.add(dock);
  for (let i = 0; i < 8; i++) {
    const crate = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: pick(rng, [0x9c5c3c, 0x3f6b84, 0x7c8b58]) }));
    crate.scale.set(8, 5, 7);
    crate.position.set(-230 + i * 18, 3, 228 + (i % 2) * 6);
    scene.add(crate);
  }

  const markerGeo = new THREE.RingGeometry(6, 7.2, 24);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xf2c14e, side: THREE.DoubleSide });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.08;
  scene.add(marker);

  return {
    group: scene,
    marker,
    buildings,
    buildingMeshes,
    districtAt,
    setMarker(x, z) { marker.position.set(x, 0.08, z); },
    update(time) { marker.material.opacity = 0.55 + 0.45 * Math.sin(time * 4) ** 2; marker.material.transparent = true; },
  };
}
