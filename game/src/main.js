// Costa Vela: renderer, player, chase camera and the glue between city, traffic,
// police, missions, combat, audio, HUD and saves.
import * as THREE from 'three';
import { START, VEHICLES, UPGRADES, CREW, WEAPONS } from './config.js';
import { buildWorld } from './world.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createCombat } from './combat.js';
import { createEffects } from './shots.js';
import { createAudio } from './audio.js';
import { createHUD } from './hud.js';
import { initInput, isDown, wasPressed, getPointer, endFrame } from './input.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { createVehicle, placeVehicle, vehicleForward, damageVehicle } from './vehicles.js';
import { clamp } from './random.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 1400);
const world = buildWorld(scene);
const effects = createEffects(scene);
const audio = createAudio();
initInput(canvas);

const state = {
  mode: 'start',
  x: START.x,
  z: START.z,
  yaw: 0,
  onFoot: true,
  car: null,
  wanted: 0,
  cash: 450,
  respect: 0,
  missionIndex: 0,
  upgrades: { engine: false, brakes: false, armor: false, nitro: false },
  standing: { palm: 0, core: 0, docks: 0, neon: 0 },
  health: 100,
  speed: 0,
  time: 0,
  shotsFired: 0,
  hitCount: 0,
  bestRace: null,
  crewIndex: 0,
  crewAbility: CREW[0].ability,
  showWheel: 0,
};

function buildPlayer() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xbb8b66, roughness: 0.9 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe4a24c, roughness: 0.8 });
  const jeans = new THREE.MeshStandardMaterial({ color: 0x35414e, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.44), shirt);
  body.position.y = 1.35;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), skin);
  head.position.y = 2.12;
  group.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), jeans);
    leg.position.set(side * 0.2, 0.45, 0);
    group.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.22), shirt);
    arm.position.set(side * 0.52, 1.35, 0);
    group.add(arm);
  }
  return group;
}

const playerMesh = buildPlayer();
playerMesh.position.set(state.x, 0, state.z);
scene.add(playerMesh);

const police = createPolice(scene, world);
const traffic = createTraffic(scene, world);

let hud;
let missions;
let combat;

const ctx = {
  state, scene, world, effects, audio, police, traffic,
  getWeapons: () => WEAPONS,
  getFireOrigin, getAimDirection, getTargets,
  say: (text, seconds) => hud.say(text, seconds),
  toast: (text) => hud.toast(text),
  addCash, addRespect, setWanted,
  save: (announce) => saveGame(announce),
  pushPlayer, damagePlayer, enemyShot, buyUpgrade, spawnGarageVehicle,
};

combat = createCombat(ctx);
ctx.combat = combat;
missions = createMissions(ctx);
ctx.missions = missions;
hud = createHUD(ctx);
ctx.hud = hud;

window.__costa = { state, police, traffic, world, missions, combat, setWanted, enterVehicle };

function addCash(amount) { state.cash += amount; }

function addRespect(amount) {
  state.respect += amount;
  const district = world.districtAt(state.x, state.z);
  state.standing[district.id] = (state.standing[district.id] ?? 0) + amount;
}

function setWanted(level) {
  state.wanted = clamp(Math.round(level), 0, 5);
  police.setWanted(state.wanted, state.x, state.z);
}

function saveGame(announce = false) {
  const ok = writeSave(state);
  if (announce) hud.toast(ok ? 'Progress saved' : 'Save unavailable');
}

function pushPlayer(direction, force) {
  state.x += direction.x * force;
  state.z += direction.z * force;
  if (state.car) state.car.speed *= 0.88;
}

function damagePlayer(amount) {
  if (state.car) damageVehicle(state.car, amount * 0.45);
  else state.health -= amount;
  if (state.health <= 0) respawn();
}

function enemyShot(amount) {
  damagePlayer(amount);
  effects.burst(new THREE.Vector3(state.x, 1.5, state.z), 0xff7d7d, 5);
  audio.shot(0);
}

function respawn() {
  state.health = 100;
  state.x = world.garage.x;
  state.z = world.garage.z + 8;
  state.speed = 0;
  if (state.car) {
    state.car.driven = false;
    state.car = null;
    playerMesh.visible = true;
  }
  setWanted(0);
  hud.toast('Woke up at Vela Motors - heat cleared');
}

function getFireOrigin() {
  const pivot = state.car
    ? new THREE.Vector3(state.car.x, 1.7, state.car.z)
    : new THREE.Vector3(state.x, 1.55, state.z);
  const forward = vehicleForward(state.car ?? { yaw: state.yaw });
  return pivot.add(new THREE.Vector3(forward.x * 2.2, 0, forward.z * 2.2));
}

function getAimDirection() {
  const heading = camera.getWorldDirection(new THREE.Vector3());
  const point = camera.position.clone().addScaledVector(heading, 90);
  point.y = 1.5;
  return point.sub(getFireOrigin()).normalize();
}

function getTargets() {
  const list = [];
  for (const vehicle of world.parked.concat(traffic.cars)) {
    if (vehicle === state.car || vehicle.driven) continue;
    list.push({ root: vehicle.mesh, onHit: (damage) => {
      damageVehicle(vehicle, damage * 0.6);
      effects.burst(new THREE.Vector3(vehicle.x, 1.1, vehicle.z), 0xffc46b, 5);
      if (vehicle.damage >= 100 && !vehicle.burning) {
        vehicle.burning = true;
        effects.fire(new THREE.Vector3(vehicle.x, 0, vehicle.z), 14);
        audio.crash();
        addCash(120);
        addRespect(25);
      }
    } });
  }
  for (const target of police.targets()) list.push(target);
  for (const target of traffic.targets()) list.push(target);
  return list;
}

function nearestVehicle() {
  let closest = null;
  let distance = 6;
  for (const vehicle of world.parked.concat(traffic.cars)) {
    if (vehicle.driven) continue;
    const gap = Math.hypot(vehicle.x - state.x, vehicle.z - state.z);
    if (gap < distance) { closest = vehicle; distance = gap; }
  }
  return closest;
}

function enterVehicle(vehicle, silent = false) {
  state.car = vehicle;
  vehicle.driven = true;
  state.onFoot = false;
  state.yaw = vehicle.yaw;
  state.speed = Math.abs(vehicle.speed);
  playerMesh.visible = false;
  const moving = traffic.cars.indexOf(vehicle);
  if (moving >= 0) traffic.cars.splice(moving, 1);
  if (!world.parked.includes(vehicle)) world.parked.push(vehicle);

  if (silent) {
    hud.toast(vehicle.spec.name + ' ready');
  } else if (vehicle.police) {
    setWanted(Math.max(state.wanted, 3));
    hud.say('ROSA: A patrol car? Now we are doing this properly.');
  } else if (state.crewAbility !== 'Hotwire' && state.wanted === 0) {
    setWanted(1);
    hud.toast('Theft reported - wanted level 1');
  } else {
    hud.toast(vehicle.spec.name + ' hotwired - ' + state.crewAbility);
  }
}

function exitVehicle() {
  const vehicle = state.car;
  if (!vehicle) return;
  vehicle.driven = false;
  vehicle.speed = 0;
  state.car = null;
  state.onFoot = true;
  state.speed = 0;
  state.x = vehicle.x + Math.sin(vehicle.yaw + Math.PI / 2) * 3.4;
  state.z = vehicle.z + Math.cos(vehicle.yaw + Math.PI / 2) * 3.4;
  playerMesh.position.set(state.x, 0, state.z);
  playerMesh.visible = true;
  hud.toast('Left the ' + vehicle.spec.name);
}

function buyUpgrade(id) {
  const upgrade = UPGRADES.find((item) => item.id === id);
  if (!upgrade) return;
  if (state.upgrades[id]) { hud.toast('Already fitted'); return; }
  if (state.cash < upgrade.cost) { hud.toast('Not enough cash'); return; }
  state.cash -= upgrade.cost;
  state.upgrades[id] = true;
  hud.toast(upgrade.name + ' fitted');
  saveGame();
}

function spawnGarageVehicle(spec) {
  if (state.car) scene.remove(state.car.mesh);
  state.car = null;
  const vehicle = createVehicle(spec, world.garage.x + 7, world.garage.z + 2, Math.PI);
  scene.add(vehicle.mesh);
  placeVehicle(vehicle);
  world.parked.push(vehicle);
  enterVehicle(vehicle, true);
  state.mode = 'play';
  document.getElementById('start').classList.add('hidden');
  hud.setGarageVisible(false);
  hud.toast(spec.name + ' is yours');
  saveGame();
}

function toggleGarage() {
  if (state.mode === 'play') {
    state.mode = 'garage';
    hud.setGarageVisible(true);
  } else if (state.mode === 'garage') {
    state.mode = 'play';
    hud.setGarageVisible(false);
  }
}

function handleActions(dt) {
  if (wasPressed('KeyE')) {
    if (state.car) exitVehicle();
    else {
      const vehicle = nearestVehicle();
      if (vehicle) enterVehicle(vehicle);
      else hud.toast('No vehicle within reach');
    }
  }
  if (wasPressed('KeyG') || wasPressed('Escape')) toggleGarage();
  if (wasPressed('KeyR')) missions.startRace();
  if (wasPressed('KeyB')) saveGame(true);
  if (wasPressed('KeyC')) {
    state.crewIndex = (state.crewIndex + 1) % CREW.length;
    state.crewAbility = CREW[state.crewIndex].ability;
    hud.toast(CREW[state.crewIndex].name + ' - ' + state.crewAbility);
  }
  if (wasPressed('KeyQ')) state.showWheel = 1.8;
  else state.showWheel = Math.max(0, state.showWheel - dt);
  for (let i = 0; i < WEAPONS.length; i += 1) {
    if (wasPressed('Digit' + (i + 1))) combat.setWeapon(i);
  }
  if (getPointer().left) combat.fire();
}

function resolveCollision(previousX, previousZ, radius) {
  let hit = false;
  for (const box of world.colliders) {
    if (state.x > box.x1 - radius && state.x < box.x2 + radius
      && state.z > box.z1 - radius && state.z < box.z2 + radius) {
      state.x = previousX;
      state.z = previousZ;
      hit = true;
      break;
    }
  }
  if (state.z > 132) { state.z = 132; hit = true; }
  if (state.z < -226) { state.z = -226; hit = true; }
  if (Math.abs(state.x) > 228) { state.x = Math.sign(state.x) * 228; hit = true; }
  return hit;
}

function updateDriving(dt) {
  const vehicle = state.car;
  if (!vehicle) return;
  const throttle = (isDown('KeyW') ? 1 : 0) - (isDown('KeyS') ? 1 : 0);
  const steering = (isDown('KeyD') ? 1 : 0) - (isDown('KeyA') ? 1 : 0);
  const braking = isDown('Space');
  const top = vehicle.spec.top * (state.upgrades.engine ? 1.14 : 1);
  const armor = state.upgrades.armor ? 0.65 : 1;

  if (throttle > 0) vehicle.speed += 19 * dt;
  else if (throttle < 0) vehicle.speed -= 26 * dt;
  if (braking && state.upgrades.nitro && throttle > 0) vehicle.speed += 26 * dt;
  vehicle.speed *= braking && !state.upgrades.nitro ? 0.94 : 0.988;
  vehicle.speed = Math.max(-top * 0.35, Math.min(top, vehicle.speed));

  const turn = (1.45 + Math.abs(vehicle.speed) * 0.035) * (state.upgrades.brakes ? 1.18 : 1);
  vehicle.yaw += steering * turn * dt * (vehicle.speed >= 0 ? 1 : -1) * (braking ? 1.35 : 1);
  const previousX = vehicle.x;
  const previousZ = vehicle.z;
  vehicle.x += Math.sin(vehicle.yaw) * vehicle.speed * dt;
  vehicle.z += Math.cos(vehicle.yaw) * vehicle.speed * dt;
  vehicle.wheelSpin += dt * vehicle.speed * 1.5;

  state.x = vehicle.x;
  state.z = vehicle.z;
  state.yaw = vehicle.yaw;
  state.speed = vehicle.speed;

  if (resolveCollision(previousX, previousZ, 1.6)) {
    const impact = Math.abs(vehicle.speed);
    if (impact > 6) {
      damageVehicle(vehicle, impact * 0.55 * armor);
      effects.burst(new THREE.Vector3(vehicle.x, 1, vehicle.z), 0xffc46b, 7);
      audio.crash();
    }
    vehicle.speed *= -0.22;
    state.speed = vehicle.speed;
  }
  if (vehicle.damage >= 100 && !vehicle.burning) {
    vehicle.burning = true;
    effects.fire(new THREE.Vector3(vehicle.x, 0, vehicle.z), 18);
    audio.crash();
  }
  if (vehicle.burning) vehicle.speed *= 0.85;
  placeVehicle(vehicle);
}

function updateWalking(dt) {
  const forwardInput = (isDown('KeyW') ? 1 : 0) - (isDown('KeyS') ? 1 : 0);
  const sideInput = (isDown('KeyD') ? 1 : 0) - (isDown('KeyA') ? 1 : 0);
  const look = camera.getWorldDirection(new THREE.Vector3());
  look.y = 0;
  look.normalize();
  const right = new THREE.Vector3(-look.z, 0, look.x);
  const move = new THREE.Vector3()
    .addScaledVector(look, forwardInput)
    .addScaledVector(right, sideInput);
  if (move.lengthSq() > 0) move.normalize().multiplyScalar(7.5 * dt);
  const previousX = state.x;
  const previousZ = state.z;
  state.x += move.x;
  state.z += move.z;
  resolveCollision(previousX, previousZ, 0.6);
  if (move.lengthSq() > 0) state.yaw = Math.atan2(move.x, move.z);
  state.speed = move.length() / Math.max(dt, 0.001);
  playerMesh.position.set(state.x, 0, state.z);
  playerMesh.rotation.y = state.yaw;
}

let orbitYaw = 0;
let orbitPitch = 0.32;

function updateCamera(dt) {
  const pointer = getPointer();
  if (pointer.dragging) {
    orbitYaw -= pointer.dx * 0.004;
    orbitPitch = clamp(orbitPitch + pointer.dy * 0.003, 0.08, 0.85);
  }
  if (isDown('ArrowLeft')) orbitYaw += dt * 1.6;
  if (isDown('ArrowRight')) orbitYaw -= dt * 1.6;
  if (isDown('ArrowUp')) orbitPitch = Math.min(0.85, orbitPitch + dt * 0.9);
  if (isDown('ArrowDown')) orbitPitch = Math.max(0.08, orbitPitch - dt * 0.9);

  const distance = state.onFoot ? 9 : 13.5;
  const yaw = state.yaw + orbitYaw;
  const horizontal = Math.cos(orbitPitch) * distance;
  const desired = new THREE.Vector3(
    state.x - Math.sin(yaw) * horizontal,
    2.2 + Math.sin(orbitPitch) * distance,
    state.z - Math.cos(yaw) * horizontal,
  );
  camera.position.lerp(desired, 1 - Math.exp(-dt * 6.5));
  const focus = new THREE.Vector3(
    state.x + Math.sin(state.yaw) * 3,
    state.onFoot ? 1.5 : 1.2,
    state.z + Math.cos(state.yaw) * 3,
  );
  camera.lookAt(focus);
}

function startGame(useSave) {
  audio.start();
  if (useSave) {
    const record = loadSave();
    if (record) {
      state.cash = record.cash ?? state.cash;
      state.respect = record.respect ?? 0;
      state.upgrades = { ...state.upgrades, ...(record.upgrades ?? {}) };
      state.x = record.x ?? START.x;
      state.z = record.z ?? START.z;
      state.bestRace = record.bestRace ?? null;
      if (record.carId) {
        const spec = VEHICLES.find((item) => item.id === record.carId);
        if (spec) spawnGarageVehicle(spec);
      }
    }
  } else {
    clearSave();
  }
  state.mode = 'play';
  document.getElementById('start').classList.add('hidden');
  playerMesh.position.set(state.x, 0, state.z);
  hud.toast('Welcome to Costa Vela');
  hud.say('ROSA: You made it. Stick close and keep the engine warm.');
}

const continueButton = document.getElementById('continue-game');
continueButton.disabled = !loadSave();
document.getElementById('new-game').addEventListener('click', () => startGame(false));
continueButton.addEventListener('click', () => startGame(true));

function placeShotCar(spec, x, z, yaw) {
  const car = createVehicle(spec, x, z, yaw);
  scene.add(car.mesh);
  placeVehicle(car);
  world.parked.push(car);
  enterVehicle(car, true);
  return car;
}

const shotSetting = new URLSearchParams(window.location.search).get('shot');
const shotNumber = shotSetting === null ? 0 : Number(shotSetting);

function applyShotSetup() {
  if (!shotNumber) return;
  document.getElementById('start').classList.add('hidden');
  state.mode = 'play';
  orbitYaw = 0;
  orbitPitch = 0.25;
  if (shotNumber === 1) {
    const car = placeShotCar(VEHICLES[0], 0, 80, Math.PI);
    car.speed = 24;
    state.speed = 24;
    setWanted(5);
    hud.say('ROSA: Keep moving. Air One is on us.');
  } else if (shotNumber === 2) {
    state.x = 0;
    state.z = 0;
    state.yaw = 0.4;
    hud.say('KITO: The boulevard is busy. Stay close.');
  } else if (shotNumber === 3) {
    state.x = 152;
    state.z = 40;
    state.yaw = -0.8;
    setWanted(5);
    effects.fire(new THREE.Vector3(160, 0, 48), 18);
    state.showWheel = 30;
    hud.say('ROSA: Five stars. Do not stop.');
  } else if (shotNumber === 4) {
    state.x = -120;
    state.z = -80;
    state.cash = 6400;
    state.respect = 5200;
    state.upgrades.engine = true;
    state.upgrades.brakes = true;
    state.mode = 'garage';
    hud.setGarageVisible(true);
  }
  camera.position.set(state.x - Math.sin(state.yaw) * 12, 7, state.z - Math.cos(state.yaw) * 12);
  camera.lookAt(state.x, 1.4, state.z);
}

applyShotSetup();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.set(START.x - 12, 8, START.z - 14);
camera.lookAt(START.x, 1, START.z);

let lastFrame = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  state.time += dt;
  if (state.mode === 'play') {
    handleActions(dt);
    if (state.onFoot) updateWalking(dt);
    else updateDriving(dt);
    traffic.update(dt, ctx);
    police.update(dt, ctx);
    missions.update(dt);
    combat.update(dt);
  }
  world.update(state.time);
  effects.update(dt);
  updateCamera(dt);
  audio.update(state.onFoot ? 0 : Math.abs(state.speed), state.wanted, dt);
  hud.update(dt);
  endFrame();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
