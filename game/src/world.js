// world.js — constructs the coastal city: four districts, roads, palms, docks, water and sky.
// Window strips are instanced so the skyline stays dense without hundreds of draw calls.

import * as THREE from 'three';
import { WORLD, PALETTE, DISTRICTS, PERFORMANCE } from './config.js';

function solidBox(width, height, depth, color, x, y, z, parent, glow = 0) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.05,
    emissive: glow || color,
    emissiveIntensity: glow ? 0.8 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function createSky(scene) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(PALETTE.skyTop) },
      horizonColor: { value: new THREE.Color(PALETTE.skyHorizon) },
    },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      varying vec3 vDirection;
      void main() {
        float heightMix = clamp(normalize(vDirection).y * 1.8 + 0.32, 0.0, 1.0);
        vec3 colorNow = mix(horizonColor, topColor, pow(heightMix, 0.75));
        gl_FragColor = vec4(colorNow, 1.0);
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), material);
  scene.add(dome);

  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(34, 20, 12),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }),
  );
  sunDisc.position.set(-420, 210, -780);
  scene.add(sunDisc);
  return { dome, sun: sunDisc };
}

function createWater(scene) {
  const geometry = new THREE.PlaneGeometry(1400, 900, 42, 30);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 },
      deep: { value: new THREE.Color(PALETTE.water) },
      shine: { value: new THREE.Color(0xffc98a) },
    },
    vertexShader: `
      uniform float time;
      varying float vWave;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float swell = sin(p.x * 0.045 + time * 1.3) * 1.1 + cos(p.y * 0.07 - time * 0.9) * 0.8;
        p.z += swell;
        vWave = swell;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 deep;
      uniform vec3 shine;
      varying float vWave;
      varying vec2 vUv;
      void main() {
        float shimmer = smoothstep(0.9, 2.0, vWave) * 0.5;
        vec3 colorNow = mix(deep, shine, shimmer + (1.0 - vUv.y) * 0.16);
        gl_FragColor = vec4(colorNow, 0.94);
      }`,
  });
  const water = new THREE.Mesh(geometry, material);
  water.rotation.x = -Math.PI / 2;
  water.position.set(180, WORLD.seaLevel, 430);
  scene.add(water);
  return water;
}

function createGround(group) {
  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.halfExtent * 2 + 120, WORLD.halfExtent * 2 + 120),
    new THREE.MeshStandardMaterial({ color: 0x6e7773, roughness: 1 }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.06;
  group.add(base);

  for (const district of DISTRICTS) {
    const b = district.bounds;
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(b.maxX - b.minX, b.maxZ - b.minZ),
      new THREE.MeshStandardMaterial({ color: district.ground, roughness: 1 }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set((b.minX + b.maxX) / 2, -0.02, (b.minZ + b.maxZ) / 2);
    group.add(patch);
  }

  const beachStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 110),
    new THREE.MeshStandardMaterial({ color: PALETTE.beach, roughness: 1 }),
  );
  beachStrip.rotation.x = -Math.PI / 2;
  beachStrip.position.set(0, 0.01, 340);
  group.add(beachStrip);
}

function createRoadGrid(group) {
  const asphalt = new THREE.MeshStandardMaterial({ color: PALETTE.asphalt, roughness: 0.95 });
  const paint = new THREE.MeshBasicMaterial({ color: PALETTE.lane });
  const pavement = new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 0.9 });
  const span = WORLD.halfExtent * 2;
  const offset = WORLD.roadWidth / 2 + WORLD.sidewalkWidth / 2;

  for (const line of WORLD.roadLines) {
    const eastWest = new THREE.Mesh(new THREE.PlaneGeometry(span, WORLD.roadWidth), asphalt);
    eastWest.rotation.x = -Math.PI / 2;
    eastWest.position.set(0, 0.03, line);
    group.add(eastWest);

    const northSouth = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.roadWidth, span), asphalt);
    northSouth.rotation.x = -Math.PI / 2;
    northSouth.position.set(line, 0.032, 0);
    group.add(northSouth);

    for (let along = -WORLD.halfExtent; along < WORLD.halfExtent; along += 22) {
      const dashAlongX = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.45), paint);
      dashAlongX.rotation.x = -Math.PI / 2;
      dashAlongX.position.set(along, 0.05, line);
      group.add(dashAlongX);

      const dashAlongZ = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 9), paint);
      dashAlongZ.rotation.x = -Math.PI / 2;
      dashAlongZ.position.set(line, 0.052, along);
      group.add(dashAlongZ);
    }

    for (const side of [-1, 1]) {
      const walkX = new THREE.Mesh(new THREE.PlaneGeometry(span, WORLD.sidewalkWidth), pavement);
      walkX.rotation.x = -Math.PI / 2;
      walkX.position.set(0, 0.08, line + side * offset);
      group.add(walkX);

      const walkZ = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.sidewalkWidth, span), pavement);
      walkZ.rotation.x = -Math.PI / 2;
      walkZ.position.set(line + side * offset, 0.081, 0);
      group.add(walkZ);
    }
  }
}

function chooseBuildingSlots(random) {
  const slots = [];
  for (const district of DISTRICTS) {
    const b = district.bounds;
    for (let x = b.minX + 45; x < b.maxX - 25; x += WORLD.blockSize) {
      for (let z = b.minZ + 45; z < b.maxZ - 25; z += WORLD.blockSize) {
        const onRoad = WORLD.roadLines.some((line) => Math.abs(x - line) < 26 || Math.abs(z - line) < 26);
        if (onRoad) continue;
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

function createBuildings(group, random) {
  const slots = chooseBuildingSlots(random);
  const towers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.16 }),
    slots.length,
  );
  const transform = new THREE.Object3D();

  const litStrips = [];
  const neonSigns = [];

  slots.forEach((slot, index) => {
    const height = slot.floors * 8.5;
    transform.position.set(slot.x, height / 2, slot.z);
    transform.scale.set(slot.width, height, slot.depth);
    transform.updateMatrix();
    towers.setMatrixAt(index, transform.matrix);
    towers.setColorAt(index, new THREE.Color(slot.color));

    let glowColor = 0xffe1a8;
    if (slot.district.id === 'nightlife') {
      glowColor = random.pick([PALETTE.neonPink, PALETTE.neonBlue, 0xffd166]);
    } else if (slot.district.id === 'downtown') {
      glowColor = 0xbfe4ff;
    }

    for (let floor = 1; floor < slot.floors; floor += PERFORMANCE.windowStride) {
      if (!random.chance(0.68)) continue;
      litStrips.push({
        x: slot.x,
        y: floor * 8.5 + 3,
        z: slot.z + slot.depth / 2 + 0.2,
        width: slot.width * 0.78,
        color: glowColor,
      });
    }

    if (slot.district.id === 'nightlife' && random.chance(0.45)) {
      neonSigns.push({
        x: slot.x,
        y: Math.min(height - 4, 14),
        z: slot.z + slot.depth / 2 + 0.8,
        width: slot.width * 0.7,
        color: glowColor,
      });
    }
  });

  towers.instanceMatrix.needsUpdate = true;
  if (towers.instanceColor) towers.instanceColor.needsUpdate = true;
  group.add(towers);

  // One instanced mesh stands in for every glowing window band.
  const windows = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    litStrips.length,
  );
  litStrips.forEach((strip, index) => {
    transform.position.set(strip.x, strip.y, strip.z);
    transform.scale.set(strip.width, 1.5, 0.35);
    transform.updateMatrix();
    windows.setMatrixAt(index, transform.matrix);
    windows.setColorAt(index, new THREE.Color(strip.color));
  });
  windows.instanceMatrix.needsUpdate = true;
  if (windows.instanceColor) windows.instanceColor.needsUpdate = true;
  group.add(windows);

  for (const sign of neonSigns) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(sign.width, 2.6, 0.6),
      new THREE.MeshBasicMaterial({ color: sign.color }),
    );
    plate.position.set(sign.x, sign.y, sign.z);
    group.add(plate);
  }

  return slots;
}

function createPalms(group, random) {
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8a6a46, roughness: 1 });
  const frondMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.foliage, roughness: 0.9, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 54; i++) {
    const onBeach = i < 26;
    const x = random.range(-350, 350);
    const z = onBeach ? random.range(205, 330) : random.range(-260, 140);
    if (!onBeach && WORLD.roadLines.some((line) => Math.abs(x - line) < 16 || Math.abs(z - line) < 16)) continue;

    const height = random.range(9, 15);
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.8, height, 6), trunkMaterial);
    trunk.position.y = height / 2;
    palm.add(trunk);

    for (let frondIndex = 0; frondIndex < 6; frondIndex++) {
      const angle = frondIndex * 1.05;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(1.7, 8, 4), frondMaterial);
      frond.position.set(Math.cos(angle) * 2.6, height + 0.4, Math.sin(angle) * 2.6);
      frond.rotation.z = Math.cos(angle) * 1.15;
      frond.rotation.x = Math.sin(angle) * 1.15;
      palm.add(frond);
    }
    palm.position.set(x, 0, z);
    group.add(palm);
  }
}

function createStreetLights(group, random) {
  const metal = new THREE.MeshStandardMaterial({ color: 0x404a52, metalness: 0.5, roughness: 0.5 });
  const bulb = new THREE.MeshBasicMaterial({ color: 0xffdca8 });
  for (const line of WORLD.roadLines) {
    for (let along = -WORLD.halfExtent; along < WORLD.halfExtent; along += 60) {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 10, 6), metal);
      pole.position.y = 5;
      lamp.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 0.25, 0.25), metal);
      arm.position.set(1.8, 9.8, 0);
      lamp.add(arm);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), bulb);
      globe.position.set(3.6, 9.5, 0);
      lamp.add(globe);
      lamp.position.set(along + random.range(-5, 5), 0, line + 12);
      group.add(lamp);
    }
  }
}

function createHarbour(group) {
  const containerColors = [0xc45d43, 0x3f8296, 0xe0b64f, 0x667b5e, 0x9d5d80];
  for (let i = 0; i < 34; i++) {
    const x = 190 + (i % 6) * 27;
    const z = -235 + Math.floor(i / 6) * 30;
    const color = containerColors[i % containerColors.length];
    solidBox(22, 5.5, 9, color, x, 3, z, group);
    if (i % 4 === 0) {
      solidBox(22, 5.5, 9, containerColors[(i + 2) % containerColors.length], x, 8.6, z, group);
    }
  }
  for (const z of [-210, -105, 20]) {
    const crane = new THREE.Group();
    const yellow = new THREE.MeshStandardMaterial({ color: 0xe3a23e });
    const column = new THREE.Mesh(new THREE.BoxGeometry(5, 26, 5), yellow);
    column.position.y = 13;
    crane.add(column);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(70, 2.5, 3), yellow);
    boom.position.set(22, 26, 0);
    crane.add(boom);
    crane.position.set(330, 0, z);
    group.add(crane);
  }
  solidBox(120, 1, 16, 0x6c7276, 265, 0.5, 128, group);
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

  const sky = createSky(scene);
  const water = createWater(scene);
  createGround(group);
  createRoadGrid(group);
  const buildings = createBuildings(group, random);
  createPalms(group, random);
  createStreetLights(group, random);
  createHarbour(group);

  return {
    group,
    buildings,
    water,
    sky,
    districtAt(x, z) {
      return DISTRICTS.find((district) => {
        const b = district.bounds;
        return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
      }) ?? DISTRICTS[0];
    },
    isOnRoad(x, z) {
      return WORLD.roadLines.some(
        (line) => Math.abs(x - line) < WORLD.roadWidth / 2 || Math.abs(z - line) < WORLD.roadWidth / 2,
      );
    },
    update(dt, elapsed) {
      water.material.uniforms.time.value = elapsed;
      sky.sun.position.y = 210 + Math.sin(elapsed * 0.06) * 2;
    },
  };
}
