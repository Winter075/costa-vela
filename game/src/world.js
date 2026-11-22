// Costa Vela city: districts, roads, buildings, palms, harbour, water and the sunset dome.
// One job only: build the static world and animate the water and the lights.

import * as THREE from 'three';
import { WORLD, DISTRICTS, WEATHER } from './config.js';
import { pick, range } from './random.js';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

function districtAt(x, z) {
  return DISTRICTS.find((d) => x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) ?? DISTRICTS[1];
}

function makeWindowTexture(base, lit, cols, rows, seedRandom) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 256);
  const cw = 128 / cols;
  const ch = 256 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = seedRandom() > 0.42;
      ctx.fillStyle = on ? lit : '#1b2230';
      ctx.fillRect(c * cw + 2, r * ch + 3, cw - 4, ch - 6);
      if (on) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(c * cw + 2, r * ch + 3, cw - 4, 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeSignTexture(text, bg, fg) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = fg;
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class CityWorld {
  constructor(scene, random, weatherKey = 'golden') {
    this.scene = scene;
    this.random = random;
    this.weatherKey = weatherKey;
    this.weather = WEATHER[weatherKey] ?? WEATHER.golden;
    this.time = 0;
    this.water = null;
    this.waterBase = [];
    this.lampBulbs = [];
    this.neonMaterials = [];
    this.groups = {};
    this.buildSky();
    this.buildGround();
    this.buildRoads();
    this.buildBuildings();
    this.buildPalms();
    this.buildStreetlights();
    this.buildParkedCars();
    this.buildHarbour();
    this.buildNightlife();
    this.buildSigns();
  }

  buildSky() {
    const w = this.weather;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1100, 32, 18),
      new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(w.skyTop) },
          bottomColor: { value: new THREE.Color(w.skyBottom) },
          exponent: { value: 0.72 },
        },
        vertexShader: 'varying vec3 vWorld; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float exponent; varying vec3 vWorld; void main(){ float h = normalize(vWorld).y; float t = clamp(pow(max(h,0.0), exponent), 0.0, 1.0); gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0); }',
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    );
    sky.renderOrder = -10;
    this.scene.add(sky);
    this.scene.fog = new THREE.FogExp2(w.fog, 0.0026);

    const sunDir = new THREE.Vector3(...w.sunPos).normalize();
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(34, 16, 12),
      new THREE.MeshBasicMaterial({ color: w.sun, fog: false }),
    );
    sun.position.copy(sunDir.multiplyScalar(900));
    this.scene.add(sun);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(78, 16, 12),
      new THREE.MeshBasicMaterial({ color: w.sun, transparent: true, opacity: 0.16, depthWrite: false, fog: false }),
    );
    halo.position.copy(sun.position);
    this.scene.add(halo);

    this.scene.add(new THREE.HemisphereLight(w.skyBottom, 0x4a4436, 1.25));
    const key = new THREE.DirectionalLight(w.sun, w.intensity);
    key.position.set(...w.sunPos);
    this.scene.add(key);
    this.fillLight = new THREE.DirectionalLight(0x88aaff, 0.35);
    this.fillLight.position.set(180, 160, 200);
    this.scene.add(this.fillLight);
  }

  buildGround() {
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(1600, 1600),
      new THREE.MeshStandardMaterial({ color: 0xc9a978, roughness: 1 }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -0.08;
    this.scene.add(sand);

    const land = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1100),
      new THREE.MeshStandardMaterial({ color: 0x8d8d84, roughness: 1 }),
    );
    land.rotation.x = -Math.PI / 2;
    land.position.set(90, -0.04, 0);
    this.scene.add(land);

    const waterGeo = new THREE.PlaneGeometry(620, 1300, 28, 48);
    const water = new THREE.Mesh(
      waterGeo,
      new THREE.MeshStandardMaterial({ color: 0x2e7c9b, roughness: 0.35, metalness: 0.18, transparent: true, opacity: 0.92, flatShading: true }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(WORLD.waterEdge - 300, -0.35, 0);
    this.scene.add(water);
    this.water = water;
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) this.waterBase.push(pos.getX(i), pos.getY(i));

    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 1200),
      new THREE.MeshStandardMaterial({ color: 0xe3cf9c, roughness: 1 }),
    );
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(WORLD.waterEdge + 8, -0.02, 0);
    this.scene.add(beach);
  }

  buildRoads() {
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.95 });
    const walk = new THREE.MeshStandardMaterial({ color: 0xb9b6ac, roughness: 1 });
    const line = new THREE.MeshStandardMaterial({ color: 0xe8e2c8, roughness: 1 });
    const span = (WORLD.gridMax - WORLD.gridMin + 1) * WORLD.gridStep + 120;
    const g = new THREE.Group();
    for (let i = WORLD.gridMin; i <= WORLD.gridMax; i++) {
      const c = i * WORLD.gridStep;
      const ns = new THREE.Mesh(new THREE.BoxGeometry(WORLD.roadWidth, 0.12, span), asphalt);
      ns.position.set(c, 0.02, 0);
      g.add(ns);
      const ew = new THREE.Mesh(new THREE.BoxGeometry(span, 0.12, WORLD.roadWidth), asphalt);
      ew.position.set(0, 0.02, c);
      g.add(ew);
      for (const side of [-1, 1]) {
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.32, span), walk);
        s1.position.set(c + side * (WORLD.roadWidth / 2 + 1), 0.16, 0);
        g.add(s1);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(span, 0.32, 2), walk);
        s2.position.set(0, 0.16, c + side * (WORLD.roadWidth / 2 + 1));
        g.add(s2);
      }
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, span), line);
      l1.position.set(c, 0.085, 0);
      g.add(l1);
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(span, 0.02, 0.35), line);
      l2.position.set(0, 0.085, c);
      g.add(l2);
    }
    this.scene.add(g);
    this.groups.roads = g;
  }

  buildBuildings() {
    const seed = this.random;
    const groups = { downtown: [], beach: [], harbour: [], nightlife: [] };
    const windowMats = [
      new THREE.MeshStandardMaterial({ map: makeWindowTexture('#5a6b78', '#ffe6a8', 6, 16, seed), roughness: 0.8, emissive: 0x221a0e, emissiveIntensity: 0.5 }),
      new THREE.MeshStandardMaterial({ map: makeWindowTexture('#7d6b62', '#ffd18a', 5, 12, seed), roughness: 0.9, emissive: 0x1a140a, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ map: makeWindowTexture('#5d5566', '#bff0ff', 7, 20, seed), roughness: 0.7, emissive: 0x0b1620, emissiveIntensity: 0.6 }),
    ];
    const plainMats = [0xb3a48f, 0xcbb79b, 0x9aa7ad, 0xb9a7a0, 0xa8b0a2].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
    );
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x6b6b66, roughness: 1 });
    const g = new THREE.Group();
    for (let ix = WORLD.gridMin; ix < WORLD.gridMax; ix++) {
      for (let iz = WORLD.gridMin; iz < WORLD.gridMax; iz++) {
        const cx = (ix + 0.5) * WORLD.gridStep;
        const cz = (iz + 0.5) * WORLD.gridStep;
        const district = districtAt(cx, cz);
        const number = district.id === 'downtown' ? 3 : 2;
        for (let n = 0; n < number; n++) {
          const w = range(seed, 12, 22);
          const d = range(seed, 12, 20);
          let h;
          if (district.id === 'downtown') h = range(seed, 34, 112);
          else if (district.id === 'nightlife') h = range(seed, 16, 42);
          else h = range(seed, 11, 34);
          const ox = number === 1 ? 0 : (n - 0.5) * 24;
          const oz = number === 1 ? 0 : (n % 2 === 0 ? -9 : 9);
          const mat = h > 26 ? pick(seed, windowMats) : pick(seed, plainMats);
          const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          b.position.set(cx + ox, h / 2 + 0.2, cz + oz);
          g.add(b);
          if (h > 26 && seed() > 0.55) {
            const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 2, d + 1), roofMat);
            cap.position.set(b.position.x, h + 1.2, b.position.z);
            g.add(cap);
          }
          if (district.id === 'nightlife' && n === 0 && seed() > 0.35) {
            const neon = new THREE.Mesh(
              new THREE.BoxGeometry(w * 0.7, 3.5, 0.7),
              new THREE.MeshStandardMaterial({ color: pick(seed, [0xff5fa2, 0x56e0ff, 0xffd166]), emissive: 0xff3f88, emissiveIntensity: 0.9 }),
            );
            neon.position.set(b.position.x, 8 + (n % 2) * 6, b.position.z + d / 2 + 0.4);
            g.add(neon);
            this.neonMaterials.push(neon.material);
          }
          groups[district.id].push(b);
        }
      }
    }
    this.scene.add(g);
    this.groups.buildings = g;
    this.buildingGroups = groups;
  }

  buildPalms() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6b47, roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x3f7a45, roughness: 1, side: THREE.DoubleSide });
    const g = new THREE.Group();
    const spots = [];
    for (let i = WORLD.gridMin; i <= WORLD.gridMax; i++) spots.push([WORLD.waterEdge + 30, i * WORLD.gridStep + 12]);
    for (let i = WORLD.gridMin; i <= WORLD.gridMax; i++) spots.push([-185, i * WORLD.gridStep - 16]);
    for (const [x, z] of spots) {
      const h = range(this.random, 9, 15);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, h, 6), trunkMat);
      trunk.position.set(x, h / 2, z);
      g.add(trunk);
      for (let f = 0; f < 5; f++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(2.6, 8, 4), frondMat);
        frond.position.set(x, h + 0.6, z);
        frond.rotation.z = Math.PI / 2.6;
        frond.rotation.y = (f / 5) * Math.PI * 2;
        frond.scale.set(1, 1, 0.28);
        g.add(frond);
      }
    }
    this.scene.add(g);
    this.groups.palms = g;
  }

  buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x40444a, roughness: 0.8, metalness: 0.3 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd98a, emissiveIntensity: 1.3 });
    const g = new THREE.Group();
    for (let ix = WORLD.gridMin; ix <= WORLD.gridMax; ix += 1) {
      for (let iz = WORLD.gridMin; iz <= WORLD.gridMax; iz += 2) {
        const x = ix * WORLD.gridStep + WORLD.roadWidth / 2 + 3;
        const z = iz * WORLD.gridStep + WORLD.roadWidth / 2 + 3;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 8, 6), poleMat);
        pole.position.set(x, 4, z);
        g.add(pole);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), bulbMat.clone());
        bulb.position.set(x, 8.1, z);
        g.add(bulb);
        this.lampBulbs.push(bulb);
      }
    }
    this.scene.add(g);
    this.groups.streetlights = g;
  }

  buildParkedCars() {
    const g = new THREE.Group();
    const tire = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 1 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x2b3b46, roughness: 0.25, metalness: 0.3 });
    const colors = [0xd94f3d, 0x2e6fb7, 0xf2c14e, 0x6f7d56, 0x2b2f3a, 0xbf6bb0, 0x36b3a6, 0xe0e4e8];
    for (let i = WORLD.gridMin; i <= WORLD.gridMax; i++) {
      for (let j = WORLD.gridMin; j <= WORLD.gridMax; j += 2) {
        if (this.random() > 0.62) continue;
        const alongX = this.random() > 0.5;
        const lane = i * WORLD.gridStep + (this.random() > 0.5 ? 1 : -1) * (WORLD.roadWidth / 2 - 2);
        const along = j * WORLD.gridStep + range(this.random, -18, 18);
        const color = pick(this.random, colors);
        const car = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 2), new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25 }));
        body.position.y = 1.05;
        car.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.8), glass);
        cabin.position.set(-0.2, 2.0, 0);
        car.add(cabin);
        for (const wx of [-1.35, 1.35]) {
          for (const wz of [-1.05, 1.05]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.32, 10), tire);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(wx, 0.55, wz);
            car.add(wheel);
          }
        }
        car.position.set(alongX ? along : lane, 0, alongX ? lane : along);
        car.rotation.y = alongX ? 0 : Math.PI / 2;
        g.add(car);
      }
    }
    this.scene.add(g);
    this.groups.parked = g;
  }

  buildHarbour() {
    const g = new THREE.Group();
    const containerColors = [0xbf4f3f, 0x2f6f8f, 0xd0a13c, 0x4f7d54, 0x9a5151];
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x8a7157, roughness: 1 });
    const dock = new THREE.Mesh(new THREE.BoxGeometry(120, 1.6, 48), dockMat);
    dock.position.set(80, 0.8, 268);
    g.add(dock);
    for (let i = 0; i < 26; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(12, 4, 4.5),
        new THREE.MeshStandardMaterial({ color: pick(this.random, containerColors), roughness: 0.9 }),
      );
      const layer = i % 3;
      c.position.set(40 + (i % 9) * 11, 3.8 + layer * 4, 250 + Math.floor(i / 9) * 8);
      g.add(c);
    }
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xd8a13c, roughness: 0.7, metalness: 0.35 });
    for (const x of [20, 100, 180]) {
      const mast = new THREE.Mesh(new THREE.BoxGeometry(3, 46, 3), craneMat);
      mast.position.set(x, 23, 300);
      g.add(mast);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(60, 2.5, 2.5), craneMat);
      arm.position.set(x - 18, 44, 300);
      g.add(arm);
    }
    const boatMat = new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.6 });
    for (const [x, z] of [[250, 210], [-260, 330]]) {
      const boat = new THREE.Mesh(new THREE.BoxGeometry(28, 5, 9), boatMat);
      boat.position.set(x, 1, z);
      g.add(boat);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 7), boatMat);
      cabin.position.set(x - 4, 6, z);
      g.add(cabin);
    }
    this.scene.add(g);
    this.groups.harbour = g;
  }

  buildNightlife() {
    const g = new THREE.Group();
    const colors = [0xff5fa2, 0x56e0ff, 0xffd166, 0x9d7bff, 0x65ffb0];
    for (let i = 0; i < 22; i++) {
      const x = range(this.random, -240, 240);
      const z = range(this.random, -270, -160);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(range(this.random, 4, 9), range(this.random, 1.4, 3), 0.4),
        new THREE.MeshStandardMaterial({ color: colors[i % colors.length], emissive: colors[i % colors.length], emissiveIntensity: 1.4 }),
      );
      sign.position.set(x, range(this.random, 4, 13), z);
      g.add(sign);
      this.neonMaterials.push(sign.material);
    }
    this.scene.add(g);
    this.groups.nightlife = g;
  }

  buildSigns() {
    const g = new THREE.Group();
    const boards = [
      { text: 'COSTA VELA', x: 0, z: -300, y: 26, bg: '#20283c', fg: '#ffcf7a', w: 96 },
      { text: 'SUNSET FM 104.2', x: -250, z: -200, y: 17, bg: '#3a1f3f', fg: '#7ff0ff', w: 70 },
      { text: 'HARBOUR MARKET', x: 190, z: 235, y: 20, bg: '#1f3a3f', fg: '#ffd97a', w: 78 },
      { text: 'NIGHTLINE', x: 60, z: -255, y: 16, bg: '#2b1f3d', fg: '#ff8fc8', w: 64 },
    ];
    for (const b of boards) {
      const mat = new THREE.MeshBasicMaterial({ map: makeSignTexture(b.text, b.bg, b.fg), side: THREE.DoubleSide });
      const board = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.w / 4), mat);
      board.position.set(b.x, b.y, b.z);
      board.rotation.y = Math.PI;
      g.add(board);
    }
    this.scene.add(g);
    this.groups.signs = g;
  }

  update(dt) {
    this.time += dt;
    if (this.water) {
      const pos = this.water.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = this.waterBase[i * 2];
        const y = this.waterBase[i * 2 + 1];
        pos.setZ(i, Math.sin(x * 0.03 + this.time * 1.3) * 1.1 + Math.cos(y * 0.045 + this.time * 0.9) * 0.7);
      }
      pos.needsUpdate = true;
      this.water.geometry.computeVertexNormals();
    }
    for (const bulb of this.lampBulbs) bulb.material.emissiveIntensity = 1.1 + Math.sin(this.time * 2 + bulb.position.x) * 0.2;
    if (this.weatherKey === 'night' || this.weatherKey === 'sunset') {
      for (const mat of this.neonMaterials) mat.emissiveIntensity = 1.0 + Math.sin(this.time * 4 + mat.id) * 0.35;
    }
  }
}
