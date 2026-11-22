// Costa Vela: boot, game loop, chase camera, controls and the glue between every system.

import * as THREE from 'three';
import { VEHICLE_MODELS, RADIO_STATIONS } from './config.js';
import { makeRandom, clamp, lerp } from './random.js';
import { CityWorld } from './world.js';
import { buildCarMesh, VehicleState } from './vehicles.js';
import { TrafficSystem, buildPedestrian } from './traffic.js';
import { PoliceSystem } from './police.js';
import { MissionSystem } from './missions.js';
import { CombatSystem } from './combat.js';
import { AudioSystem } from './audio.js';
import { InputController } from './input.js';
import { Hud } from './hud.js';
import { freshProgress, loadProgress, saveProgress } from './save.js';
import { shotNameFromQuery, applyShot } from './shots.js';

const query = window.location.search;
const shot = shotNameFromQuery(query);
const seed = 20261122;
const random = makeRandom(seed);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 2600);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'game';

const weatherKey = shot === 'cover' || shot === 'garage' ? 'golden' : shot === 'street' ? 'day' : shot === 'sunset' ? 'sunset' : 'golden';
const world = new CityWorld(scene, random, weatherKey);

const audio = new AudioSystem();
const hudRoot = document.createElement('div');
hudRoot.id = 'hud';
document.body.appendChild(hudRoot);
const hud = new Hud(hudRoot);
const input = new InputController(renderer.domElement);
const traffic = new TrafficSystem(scene, random);
const police = new PoliceSystem(scene, random);
const missions = new MissionSystem(scene);
const combat = new CombatSystem(scene, audio);

const player = {
  x: -190, z: -80, heading: 0, speed: 0, inCar: false,
  vehicle: null, vehicleModelIndex: 1, footSpeed: 0,
};

const footMesh = buildPedestrian(makeRandom(77));
footMesh.scale.setScalar(1.08);
footMesh.children[0].material.color.setHex(0xe8b24a);
scene.add(footMesh);

let progress = freshProgress();
let state = shot ? 'playing' : 'start';
let garageOpen = false;
let saveTimer = 0;
let elapsed = 0;
const cameraRig = { yaw: 0, pitch: 0.28, distance: 16 };
const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();

function spawnPlayerVehicle(modelIndex, x, z, heading) {
  const model = VEHICLE_MODELS[modelIndex] ?? VEHICLE_MODELS[0];
  const mesh = buildCarMesh(model.color, model.kind);
  scene.add(mesh);
  const vehicle = new VehicleState(modelIndex, mesh, x, z, heading);
  vehicle.syncMesh();
  return vehicle;
}

function setActiveVehicle(car) {
  player.vehicle = car;
  player.inCar = true;
  player.vehicleModelIndex = car.modelIndex;
  footMesh.visible = false;
  car.mesh.visible = true;
}

function enterOrExit() {
  if (!player.inCar) {
    const near = traffic.nearestCar(player.x, player.z, 7);
    if (near) {
      traffic.removeCar(near);
      const car = new VehicleState(near.modelIndex, near.mesh, near.x, near.z, near.heading);
      car.speed = 0;
      scene.add(near.mesh);
      setActiveVehicle(car);
      hud.setWheel(false, combat.slot);
      missions.showToast(`STOLEN · ${car.name}`);
    }
  } else {
    const car = player.vehicle;
    player.x = car.x + Math.sin(car.heading + Math.PI / 2) * 4;
    player.z = car.z + Math.cos(car.heading + Math.PI / 2) * 4;
    player.heading = car.heading;
    player.speed = 0;
    player.inCar = false;
    footMesh.visible = true;
    missions.showToast('ON FOOT');
  }
}

function onMissionComplete(done) {
  if (!done) return;
  progress.cash += 600 + (done.title ? missions.index * 125 : 0);
  progress.respect += 350;
  progress.missionIndex = missions.index;
  audio.playUi();
  saveProgress(progress);
}

const garageHandlers = {
  onVehicle(index) {
    if (progress.ownedVehicles.includes(index)) {
      if (player.vehicle) {
        scene.remove(player.vehicle.mesh);
        player.vehicle = spawnPlayerVehicle(index, player.x, player.z, player.heading);
      } else {
        player.vehicle = spawnPlayerVehicle(index, player.x, player.z, player.heading);
        player.vehicle.mesh.visible = false;
      }
      player.vehicleModelIndex = index;
      if (player.inCar) player.vehicle.mesh.visible = true;
      progress.activeVehicle = index;
      missions.showToast(`${VEHICLE_MODELS[index].name} SELECTED`);
    } else {
      const price = 1800 + index * 220;
      if (progress.cash >= price) {
        progress.cash -= price;
        progress.ownedVehicles.push(index);
        missions.showToast(`${VEHICLE_MODELS[index].name} BOUGHT`);
        audio.playUi();
      } else missions.showToast('NOT ENOUGH CASH');
    }
    hud.refreshGarage(progress);
  },
  onUpgrade(kind) {
    const level = progress.upgrades[kind] ?? 0;
    if (level < 3 && progress.cash >= 900) {
      progress.cash -= 900;
      progress.upgrades[kind] = level + 1;
      if (kind === 'engine' && player.vehicle) player.vehicle.topSpeed += 6;
      missions.showToast(`${kind.toUpperCase()} UPGRADED`);
      audio.playUi();
      hud.refreshGarage(progress);
    } else missions.showToast(level >= 3 ? 'MAX LEVEL' : 'NOT ENOUGH CASH');
  },
  onStation() {
    progress.radioStation = (progress.radioStation + 1) % RADIO_STATIONS.length;
    audio.setStation(progress.radioStation);
    hud.refreshGarage(progress);
  },
  onSave() {
    saveProgress(progress);
    missions.showToast('GAME SAVED');
    audio.playUi();
  },
};

function beginGame(useSave) {
  audio.start();
  audio.setStation(progress.radioStation);
  progress = useSave ? (loadProgress() ?? freshProgress()) : freshProgress();
  if (!useSave) saveProgress(progress);
  missions.index = Math.min(progress.missionIndex ?? 0, 7);
  missions.syncMarker();
  state = 'playing';
  hud.setHudVisible(true);
  footMesh.visible = !player.inCar;
}

if (state === 'start') {
  hud.setHudVisible(false);
  hud.showStart(Boolean(loadProgress()), { onNew: () => beginGame(false), onContinue: () => beginGame(true) });
} else {
  hud.setHudVisible(true);
}

const preset = shot ? applyShot(shot, {
  player, police, missions, combat, progress, hud, cameraRig, garageHandlers, traffic,
}) : null;
if (preset) {
  if (preset.inCar) {
    player.vehicle = spawnPlayerVehicle(preset.vehicleModel, player.x, player.z, player.heading);
    player.vehicle.speed = 24;
    player.vehicle.syncMesh();
    footMesh.visible = false;
  } else {
    player.vehicle = spawnPlayerVehicle(preset.vehicleModel, player.x + 5, player.z + 5, player.heading);
    player.vehicle.mesh.visible = false;
    footMesh.visible = true;
    footMesh.position.set(player.x, 0, player.z);
  }
  hud.setHudVisible(!preset.garage || true);
}

function updatePlayer(dt) {
  const axes = input.axes();
  if (input.consume('KeyE')) enterOrExit();

  if (player.inCar && player.vehicle) {
    const car = player.vehicle;
    car.drive(axes, input.isDown('Space'), dt);
    car.x = clamp(car.x, -350, 350);
    car.z = clamp(car.z, -350, 350);
    car.syncMesh();
    player.x = car.x;
    player.z = car.z;
    player.heading = car.heading;
    player.speed = car.speed;
  } else {
    const yaw = cameraRig.yaw;
    const fx = -(axes.z * Math.sin(yaw) + axes.x * Math.cos(yaw));
    const fz = -(axes.z * Math.cos(yaw) - axes.x * Math.sin(yaw));
    const mag = Math.hypot(fx, fz);
    const target = mag > 0 ? 9 : 0;
    player.footSpeed = lerp(player.footSpeed, target, clamp(dt * 9, 0, 1));
    if (mag > 0) {
      player.x += (fx / mag) * player.footSpeed * dt;
      player.z += (fz / mag) * player.footSpeed * dt;
      player.heading = Math.atan2(fx, fz);
    }
    player.speed = player.footSpeed;
    player.x = clamp(player.x, -350, 350);
    player.z = clamp(player.z, -350, 350);
    footMesh.position.set(player.x, 0, player.z);
    footMesh.rotation.y = player.heading - Math.PI / 2;
    const swing = Math.sin(elapsed * 10) * (player.footSpeed / 9) * 0.5;
    if (footMesh.userData.legs) {
      footMesh.userData.legs[0].rotation.z = swing;
      footMesh.userData.legs[1].rotation.z = -swing;
    }
  }
}

function updateCamera(dt) {
  const orbit = input.takeOrbit();
  if (input.isDown('ArrowLeft')) cameraRig.yaw -= dt * 1.4;
  if (input.isDown('ArrowRight')) cameraRig.yaw += dt * 1.4;
  if (input.isDown('ArrowUp')) cameraRig.pitch = clamp(cameraRig.pitch + dt * 0.8, 0.08, 0.95);
  if (input.isDown('ArrowDown')) cameraRig.pitch = clamp(cameraRig.pitch - dt * 0.8, 0.08, 0.95);
  cameraRig.yaw -= orbit.x * 0.004;
  cameraRig.pitch = clamp(cameraRig.pitch + orbit.y * 0.003, 0.08, 0.95);

  const dist = player.inCar ? 17 : 10.5;
  const angle = player.heading + Math.PI + cameraRig.yaw;
  const height = 1.8 + Math.sin(cameraRig.pitch) * dist;
  const flat = Math.cos(cameraRig.pitch) * dist;
  camDesired.set(player.x + Math.sin(angle) * flat, height, player.z + Math.cos(angle) * flat);
  if (shot) camera.position.copy(camDesired);
  else camera.position.lerp(camDesired, 1 - Math.exp(-dt * 7));
  camTarget.set(player.x, 2.0, player.z);
  camera.lookAt(camTarget);
}

function buildTargets() {
  const list = [];
  for (const car of traffic.cars) {
    list.push({
      mesh: car.mesh,
      onHit: (dmg) => {
        car.damage += dmg;
        car.mesh.userData.bodyMat.color.multiplyScalar(0.82);
        if (car.damage > 100) {
          combat.spawnExplosion(car.x, car.z);
          traffic.removeCar(car);
          traffic.respawnCar(car);
          scene.add(car.mesh);
        }
      },
    });
  }
  for (const unit of police.units) {
    if (unit.y > 0 || unit.type === 'ROADBLOCK') continue;
    list.push({
      mesh: unit.mesh,
      onHit: (dmg) => {
        if (dmg > 30 && police.wanted > 0) {
          scene.remove(unit.mesh);
          police.units.splice(police.units.indexOf(unit), 1);
        }
      },
    });
  }
  return list;
}

function updateCombat(dt) {
  if (input.consume('KeyQ')) combat.toggleWheel();
  combat.toggleWheel(combat.wheelOpen);
  for (let i = 1; i <= 6; i++) if (input.consume(`Digit${i}`)) combat.selectSlot(i);
  hud.setWheel(combat.wheelOpen, combat.slot);

  if ((input.firePressed || input.fireHeld) && !garageOpen && state === 'playing') {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = new THREE.Vector3(player.x, 1.8, player.z).addScaledVector(dir, 1.5);
    combat.fire(origin, dir, buildTargets());
  }
  combat.update(dt);
}

function handleHotkeys() {
  if (input.consume('KeyG')) {
    garageOpen = !garageOpen;
    if (garageOpen) hud.showGarage(progress, garageHandlers);
    else hud.hideGarage();
  }
  if (input.consume('KeyR')) {
    progress.radioStation = (progress.radioStation + 1) % RADIO_STATIONS.length;
    audio.setStation(progress.radioStation);
    missions.showToast(RADIO_STATIONS[progress.radioStation].name);
  }
  if (input.consume('KeyH')) missions.showToast('COSTA VELA · EAGLE ROCK RADIO');
  if (input.consume('KeyB')) police.addWanted(1);
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;

  if (state === 'playing') {
    handleHotkeys();
    updatePlayer(dt);
    updateCamera(dt);
    world.update(dt);
    traffic.update(dt, player);
    police.update(dt, player);
    missions.update(dt, player, police, onMissionComplete);
    updateCombat(dt);
    audio.updateEngine(player.speed, player.inCar, dt);
    audio.updateSiren(police.wanted > 0, dt);
    audio.updateRadio(dt, true);

    const radio = audio.currentTrack();
    hud.update({ mission: missions, police, progress, player, radio, vehicle: player.vehicle, weaponSlot: combat.slot });
    hud.drawMinimap({
      player,
      traffic: traffic.cars,
      police,
      markerPosition: missions.marker.visible ? [missions.marker.position.x, missions.marker.position.z] : null,
    });

    saveTimer += dt;
    if (saveTimer > 18) { saveProgress(progress); saveTimer = 0; }
  } else {
    updateCamera(dt);
  }

  input.endFrame();
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// A small hook lets the browser harness arrange deterministic screenshot scenes.
window.__costaVela = { scene, camera, renderer, player, police, missions, combat, traffic, progress, hud, world };
