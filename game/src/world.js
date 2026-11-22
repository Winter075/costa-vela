// world.js — builds the coastal city: districts, roads, palms, docks, sunset sky and water.

import * as THREE from 'three';
import { WORLD, PALETTE, DISTRICTS } from './config.js';

function makeBox(width, height, depth, color, x, y, z, parent, emissive = 0) {
  const material = new THREE.MeshStandardMaterial({
    color, roughness: 0.82, metalness: 0.05,
    emissive: emissive || color, emissiveIntensity: emissive ? 0.8 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function buildSky(scene) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(PALETTE.skyTop) },
        horizonColor: { value: new THREE.Color(PALETTE.skyHorizon) },
      },
      vertexShader: `varying vec3 vWorld; void main(){ vWorld = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 vWorld;
        void main(){ float h = clamp(normalize(vWorld).y * 1.8 + 0.32, 0.0, 1.0);
        vec3 c = mix(horizonColor, topColor, pow(h, 0.75)); gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  scene.add(sky);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(34, 20, 12),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }),
  );
  sun.position.set(-420, 210, -780);
  scene.add(sun);
  return { sky, sun };
}

function buildWater(scene) {
  const geometry = new THREE.PlaneGeometry(1400, 900, 42, 30);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 },
      deep: { value: new THREE.Color(PALETTE.water) },
      shine: { value: new THREE.Color(0xffc98a) },
    },
    vertexShader: `uniform float time; varying float vWave; varying vec2 vUv;
      void main(){ vUv = uv; vec3 p = position;
        float w = sin(p.x * 0.045 + time * 1.3) * 1.1 + cos(p.y * 0.07 - time * 0.9) * 0.8;
        p.z += w; vWave = w; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 deep; uniform vec3 shine; varying float vWave; varying vec2 vUv;
      void main(){ float shimmer = smoothstep(0.9, 2.0, vWave) * 0.5;
        vec3 c = mix(deep, shine, shimmer + (1.0 - vUv.y) * 0.16); gl_FragColor = vec4(c, 0.94); }`,
  });
  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.position.set(180, WORLD.seaLevel, 430);
  scene.add(water);
  return water;
}

function buildRoadGrid(group) {
  const asphalt = new THREE.MeshStandardMaterial({ color: PALETTE.asphalt, roughness: 0.95 });
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.lane });
  const walkMat = new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 0.9 });
  const span = WORLD.halfExtent * 2;

  for (const line of WORLD.roadLines) {
    const eastWest = new THREE.Mesh(new THREE.PlaneGeometry(span, WORLD.roadWidth), asphalt);
    eastWest.rotation.x = -Math.PI / 2;
    eastWest.position.set(0, 0.03, line);
    group.add(eastWest);

    const northSouth = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, span), asphalt);
    northSouth.rotation.x = -Math.PI / 2;
    northSouth.position.set(line, 0.032, 0);
    group.add(northSouth);

    for (let p = -WORLD.halfExtent; p < WORLD.halfExtent; p += 22) {
      const dashA = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.45), lineMat);
      dashA.rotation.x = -Math.PI / 2;
      dashA.position.set(p, 0.05, line);
      group.add(dashA);
      const dashB = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 9), lineMat);
      dashB.rotation.x = -Math.PI / 2;
      dashB.position.set(line, 0.052, p);
      group.add(dashB);
    }

    for (const side of [-1, 1]) {
      const walkA = new THREE.Mesh(new THREE.PlaneGeometry(span, WORLD.sidewalkWidth), walkMat);
      walkA.rotation.x = -Math.PI / 2;
      walkA.position.set(0, 0.08, line + side * (WORLD.roadWidth / 2 + WORLD.sidewalkWidth / 2));
      group.add(walkA);
      const walkB = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.sidewalkWidth, span), walkMat);
      walkB.rotation.x = -Math.PI / 2;
      walkB.position.set(line + side * (WORLD.roadWidth / 2 + WORLD.sidewalkWidth / 2), 0.081, 0);
      group.add(walkB);
    }
  }
}

function buildDistrictGround(group) {
  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.halfExtent * 2 + 120, WORLD.halfExtent * 2 + 120),
    new THREE.MeshStandardMaterial({ color: 0x6e7773, roughness: 1 }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.06;
  group.add(base);

  for (const d of DISTRICTS) {
    const w = d.bounds.maxX - d.bounds.minX;
    const h = d.bounds.maxZ - d.bounds.minZ;
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color: d.ground, roughness: 1 }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set((d.bounds.minX + d.bounds.maxX) / 2, -0.02, (d.bounds.minZ + d.bounds.maxZ) / 2);
    group.add(patch);
  }

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 110),
    new THREE.MeshStandardMaterial({ color: PALETTE.beach, roughness: 1 }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.01, 340);
  group.add(sand);
}

function buildingSlots(random) {
  const slots = [];
  for (const district of DISTRICTS) {
    const b = district.bounds;
    for (let x = b.minX + 45; x < b.maxX - 25; x += WORLD.blockSize) {
      for (let z = b.minZ + 45; z < b.maxZ - 25; z += WORLD.blockSize) {
        if (WORLD.roadLines.some((r) => Math.abs(x - r) < 26 || Math.abs(z - r) < 26)) continue;
        if (district.id === 'beach' && z > 300) continue;
        if (district.id === 'harbour' && x > 285 && z < 70) continue;
        slots.push({
          x: x + random.range(-6, 6),
          z: z + random.range(-6, 6),
          district,
          floors: random.int(district.minFloors, district.maxFloors),
          width: random.range(22, 34),
          depth: random.range(22, 34),
          color: random.pick(district.wall),
        });
      }
    }
  }
  return slots;
}

function buildBuildings(group, random) {
  const slots = buildingSlots(random);
  const windowMeshes = [];
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.16 });
  const instanced = new THREE.InstancedMesh(boxGeometry, material, slots.length);
  const dummy = new THREE.Object3D();

  slots.forEach((slot, index) => {
    const height = slot.floors * 8.5;
    dummy.position.set(slot.x, height / 2, slot.z);
    dummy.scale.set(slot.width, height, slot.depth);
    dummy.updateMatrix();
    instanced.setMatrixAt(index, dummy.matrix);
    instanced.setColorAt(index, new THREE.Color(slot.color));

    const glowColor = slot.district.id === 'nightlife'
      ? random.pick([PALETTE.neonPink, PALETTE.neonBlue, 0xffd166])
      : (slot.district.id === 'downtown' ? 0xbfe4ff : 0xffe1a8);
    for (let floor = 1; floor < slot.floors; floor++) {
      if (!random.chance(0.68)) continue;
      const y = floor * 8.5 + 3;
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(slot.width * 0.78, 1.5, 0.35),
        new THREE.MeshBasicMaterial({ color: glowColor }),
      );
      strip.position.set(slot.x, y, slot.z + slot.depth / 2 + 0.2);
      group.add(strip);
      windowMeshes.push(strip);
    }
    if (slot.district.id === 'nightlife' && random.chance(0.45)) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(slot.width * 0.7, 2.6, 0.6),
        new THREE.MeshBasicMaterial({ color: glowColor }),
      );
      sign.position.set(slot.x, Math.min(height - 4, 14), slot.z + slot.depth / 2 + 0.8);
      group.add(sign);
    }
  });
  instanced.instanceMatrix.needsUpdate = true;
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  group.add(instanced);
  return slots;
}

function buildPalms(group, random) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6a46, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: PALETTE.foliage, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 54; i++) {
    const onBeach = i < 26;
    const x = random.range(-350, 350);
    const z = onBeach ? random.range(205, 330) : random.range(-260, 140);
    if (!onBeach && WORLD.roadLines.some((r) => Math.abs(x - r) < 16 || Math.abs(z - r) < 16)) continue;
    const height = random.range(9, 15);
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.8, height, 6), trunkMat);
    trunk.position.y = height / 2;
    palm.add(trunk);
    for (let f = 0; f < 6; f++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(1.7, 8, 4), leafMat);
      frond.position.set(Math.cos(f * 1.05) * 2.6, height + 0.4, Math.sin(f * 1.05) * 2.6);
      frond.rotation.z = Math.cos(f * 1.05) * 1.15;
      frond.rotation.x = Math.sin(f * 1.05) * 1.15;
      palm.add(frond);
    }
    palm.position.set(x, 0, z);
    group.add(palm);
  }
}

function buildStreetFurniture(group, random) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x404a52, metalness: 0.5, roughness: 0.5 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffdca8 });
  for (const line of WORLD.roadLines) {
    for (let p = -WORLD.halfExtent; p < WORLD.halfExtent; p += 60) {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 10, 6), poleMat);
      pole.position.y = 5;
      lamp.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 0.25, 0.25), poleMat);
      arm.position.set(1.8, 9.8, 0);
      lamp.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), bulbMat);
      bulb.position.set(3.6, 9.5, 0);
      lamp.add(bulb);
      lamp.position.set(p + random.range(-5, 5), 0, line + 12);
      group.add(lamp);
    }
  }
}

function buildHarbour(group) {
  const containerColors = [0xc45d43, 0x3f8296, 0xe0b64f, 0x667b5e, 0x9d5d80];
  for (let i = 0; i < 34; i++) {
    const x = 190 + (i % 6) * 27;
    const z = -235 + Math.floor(i / 6) * 30;
    const container = makeBox(22, 5.5, 9, containerColors[i % containerColors.length], x, 3, z, group);
    container.castShadow = false;
    if (i % 4 === 0) makeBox(22, 5.5, 9, containerColors[(i + 2) % containerColors.length], x, 8.6, z, group);
  }
  for (const z of [-210, -105, 20]) {
    const crane = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 26, 5), new THREE.MeshStandardMaterial({ color: 0xe3a23e }));
    base.position.y = 13;
    crane.add(base);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(70, 2.5, 3), new THREE.MeshStandardMaterial({ color: 0xe3a23e }));
    boom.position.set(22, 26, 0);
    crane.add(boom);
    crane.position.set(330, 0, z);
    group.add(crane);
  }
  makeBox(120, 1, 16, 0x6c7276, 265, 0.5, 128, group);
}

export function buildWorld(scene, random) {
  const group = new THREE.Group();
  scene.add(group);

  scene.fog = new THREE.FogExp2(0xe6a476, 0.00175);
  scene.add(new THREE.HemisphereLight(0xffe0b8, 0x35506a, 1.15));
  const sunLight = new THREE.DirectionalLight(0xffd6a0, 2.15);
  sunLight.position.set(-320, 260, -420);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x9fb6d0, 0.35));

  const sky = buildSky(scene);
  const water = buildWater(scene);
  buildDistrictGround(group);
  buildRoadGrid(group);
  const buildings = buildBuildings(group, random);
  buildPalms(group, random);
  buildStreetFurniture(group, random);
  buildHarbour(group);

  return {
    group, buildings, water, sky,
    districtAt(x, z) {
      return DISTRICTS.find((d) => {
        const b = d.bounds;
        return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
      }) ?? DISTRICTS[0];
    },
    isOnRoad(x, z) {
      return WORLD.roadLines.some((line) => Math.abs(x - line) < WORLD.roadWidth / 2 || Math.abs(z - line) < WORLD.roadWidth / 2);
    },
    update(dt, elapsed) {
      water.material.uniforms.time.value = elapsed;
      sky.sun.position.y = 210 + Math.sin(elapsed * 0.06) * 2;
    },
  };
}
