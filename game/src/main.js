// Costa Vela main loop: renderer, player, chase camera and the glue between
// the city, traffic, dispatch, jobs, combat, audio, HUD and the save record.
import * as THREE from 'three';
import { SPAWN, CARS, PRICES, TUNING, WEAPONS, HELPERS, rankFor } from './config.js';
import { buildCity } from './world.js';
import { createTraffic } from './traffic.js';
import { createDispatch } from './police.js';
import { createJobs } from './missions.js';
import { createArmoury } from './combat.js';
import { createEffects } from './shots.js';
import { createSound } from './audio.js';
import { createHUD } from './hud.js';
import { listen, held, pressed, cursor, clearFrameInput } from './input.js';
import { readProgress, storeProgress, forgetProgress } from './save.js';
import { createVehicle, syncVehicle, noseOf, hurtVehicle } from './vehicles.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 1400);
const city = buildCity(scene);
const effects = createEffects(scene);
const sound = createSound();
listen(canvas);

const player = {
  mode: 'start',
  x: SPAWN.x,
  z: SPAWN.z,
  heading: 0,
  onFoot: true,
  car: null,
  wanted: 0,
  cash: 450,
  respect: 0,
  jobIndex: 0,
  parts: { engine: 0, armour: 0, brakes: 0 },
  owned: {},
  health: 100,
  speed: 0,
  time: 0,
  shots: 0,
  bestRace: null,
  ability: HELPERS[0].name,
  wheelTime: 0,
};
const marks = { burned: false };
const dispatch = createDispatch(scene);
const traffic = createTraffic(scene);

function bodyMesh() {
  const person = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xb98460 });
  const shirt = new THREE.MeshLambertMaterial({ color: 0xe0a04a });
  const trousers = new THREE.MeshLambertMaterial({ color: 0x33404d });
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.05, 0.44), shirt);
  chest.position.y = 1.35;
  person.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), skin);
  head.position.y = 2.12;
  person.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), trousers);
    leg.position.set(side * 0.2, 0.45, 0);
    person.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.22), shirt);
    arm.position.set(side * 0.52, 1.35, 0);
    person.add(arm);
  }
  return person;
}

const avatar = bodyMesh();
avatar.position.set(player.x, 0, player.z);
scene.add(avatar);

const game = {
  player,
  marks,
  city,
  dispatch,
  traffic,
  effects,
  sound,
  setWanted,
  say: (line) => hud.say(line),
  toast: (message) => hud.toast(message),
  pay,
  save,
  shove,
  hurt,
  enemyFire,
  fireOrigin,
  aimDirection,
  targets,
  tune,
  takeCar,
  toggleGarage,
};
const armoury = createArmoury(game);
const jobs = createJobs(game);
const hud = createHUD(game);
game.armoury = armoury;
game.jobs = jobs;
window.__costa = { player, dispatch, traffic, city, jobs, armoury, setWanted, enterCar };

function pay(cash, respect) {
  player.cash += cash;
  player.respect += respect;
}

function setWanted(level) {
  player.wanted = Math.max(0, Math.min(5, level));
  dispatch.setWanted(player.wanted, player.x, player.z);
}

function save(announce = false) {
  const ok = storeProgress(player);
  if (announce) hud.toast(ok ? 'Game saved' : 'Save unavailable');
}

function shove(direction, force) {
  player.x += direction.x * force;
  player.z += direction.z * force;
  if (player.car) player.car.speed *= 0.88;
}

function hurt(amount) {
  if (player.car) hurtVehicle(player.car, amount * 0.45);
  else player.health -= amount;
  if (player.health <= 0) revive();
}

function enemyFire(amount) {
  hurt(amount);
  effects.spark(new THREE.Vector3(player.x, 1.5, player.z), 0xff7d7d, 5);
  sound.shot('pistol');
}

function revive() {
  player.health = 100;
  player.x = city.depot.x;
  player.z = city.depot.z + 8;
  player.speed = 0;
  if (player.car) {
    player.car.taken = false;
    player.car = null;
    avatar.visible = true;
  }
  setWanted(0);
  hud.toast('Busted · woke up at Vela Motors');
}

function fireOrigin() {
  const pivot = player.car
    ? new THREE.Vector3(player.car.x, 1.7, player.car.z)
    : new THREE.Vector3(player.x, 1.55, player.z);
  const nose = noseOf(player.car ?? { heading: player.heading });
  return pivot.add(new THREE.Vector3(nose.x * 2.2, 0, nose.z * 2.2));
}

function aimDirection() {
  const forward = camera.getWorldDirection(new THREE.Vector3());
  const target = camera.position.clone().addScaledVector(forward, 90);
  target.y = 1.5;
  return target.sub(fireOrigin()).normalize();
}

function wreck(car, damage) {
  hurtVehicle(car, damage * 0.6);
  effects.spark(new THREE.Vector3(car.x, 1.1, car.z), 0xffc46b, 5);
  if (car.damage < 100) return;
  effects.blaze(new THREE.Vector3(car.x, 0, car.z), 14);
  sound.crash();
  marks.burned = true;
  pay(120, 25);
  scene.remove(car.mesh);
  const parked = city.parked.indexOf(car);
  if (parked >= 0) city.parked.splice(parked, 1);
  const flowing = traffic.cars.indexOf(car);
  if (flowing >= 0) traffic.cars.splice(flowing, 1);
}

function targets() {
  const list = [];
  for (const car of city.parked.concat(traffic.cars)) {
    if (car === player.car || car.taken) continue;
    list.push({ root: car.mesh, strike: (damage) => wreck(car, damage) });
  }
  for (const target of dispatch.targets()) list.push(target);
  for (const walker of traffic.walkers) {
    list.push({
      root: walker.mesh,
      strike: () => {
        walker.alarm = 1;
        if (player.wanted === 0) setWanted(1);
      },
    });
  }
  return list;
}

function closestCar() {
  let best = null;
  let nearest = 6;
  const pool = city.parked.concat(
    traffic.cars,
    dispatch.units.filter((unit) => unit.car).map((unit) => unit.car),
  );
  for (const car of pool) {
    if (car.taken) continue;
    const gap = Math.hypot(car.x - player.x, car.z - player.z);
    if (gap < nearest) {
      best = car;
      nearest = gap;
    }
  }
  return best;
}

function enterCar(car, quiet = false) {
  player.car = car;
  car.taken = true;
  player.onFoot = false;
  player.heading = car.heading;
  player.speed = Math.abs(car.speed);
  avatar.visible = false;
  const flowing = traffic.cars.indexOf(car);
  if (flowing >= 0) traffic.cars.splice(flowing, 1);
  if (!city.parked.includes(car)) city.parked.push(car);

  if (quiet) {
    hud.toast(car.spec.name + ' ready');
  } else if (car.marked) {
    setWanted(Math.max(player.wanted, 3));
    hud.say('TEO: A patrol car? Now we are doing this properly.');
  } else if (player.ability !== 'Hotwire' && player.wanted === 0) {
    setWanted(1);
    hud.toast('Car theft reported · wanted level 1');
  } else {
    hud.toast(car.spec.name + ' hotwired');
  }
}

function leaveCar() {
  const car = player.car;
  if (!car) return;
  car.taken = false;
  car.speed = 0;
  player.car = null;
  player.onFoot = true;
  player.speed = 0;
  player.x = car.x + Math.sin(car.heading + Math.PI * 0.5) * 3.4;
  player.z = car.z + Math.cos(car.heading + Math.PI * 0.5) * 3.4;
  avatar.position.set(player.x, 0, player.z);
  avatar.visible = true;
  hud.toast('Left the ' + car.spec.name);
}

function tune(id) {
  const part = TUNING.find((item) => item.id === id);
  if (!part) return;
  const level = player.parts[id] ?? 0;
  if (level >= 3) {
    hud.toast('Already maxed');
    return;
  }
  if (player.cash < part.cost) {
    hud.toast('Not enough cash');
    return;
  }
  player.cash -= part.cost;
  player.parts[id] = level + 1;
  hud.toast(part.name + ' LV ' + (level + 1) + ' fitted');
  hud.renderGarage();
  save();
}

function takeCar(spec, index) {
  const price = PRICES[index] ?? 0;
  if (!player.owned[spec.id] && player.cash < price) {
    hud.toast('Not enough cash');
    return;
  }
  if (!player.owned[spec.id]) {
    player.cash -= price;
    player.owned[spec.id] = true;
  }
  if (player.car) scene.remove(player.car.mesh);
  const car = createVehicle(spec, city.depot.x + 7, city.depot.z + 2, Math.PI);
  scene.add(car.mesh);
  syncVehicle(car);
  enterCar(car, true);
  player.mode = 'play';
  hud.showGarage(false);
  document.getElementById('start').classList.add('hidden');
  hud.toast(spec.name + ' is yours');
  save();
}

function toggleGarage() {
  if (player.mode === 'play') {
    player.mode = 'garage';
    hud.showGarage(true);
  } else if (player.mode === 'garage') {
    player.mode = 'play';
    hud.showGarage(false);
  }
}

function actions(dt) {
  if (pressed('KeyE')) {
    if (player.car) leaveCar();
    else {
      const car = closestCar();
      if (car) enterCar(car);
      else hud.toast('No vehicle within reach');
    }
  }
  if (pressed('KeyG') || pressed('Escape')) toggleGarage();
  if (pressed('KeyR')) jobs.launchRace();
  if (pressed('KeyB')) save(true);
  if (pressed('KeyC')) {
    const index = (HELPERS.findIndex((member) => member.name === player.ability) + 1) % HELPERS.length;
    player.ability = HELPERS[index].name;
    hud.toast(HELPERS[index].name + ' · ' + HELPERS[index].role);
  }
  if (pressed('KeyQ')) player.wheelTime = 1.8;
  else player.wheelTime = Math.max(0, player.wheelTime - dt);
  for (let i = 0; i < WEAPONS.length; i += 1) {
    if (pressed('Digit' + (i + 1))) armoury.choose(i);
  }
  if (cursor.firing) armoury.fire();
}

function collision(oldX, oldZ, radius) {
  let hit = false;
  for (const box of city.barriers) {
    if (player.x > box.x1 - radius && player.x < box.x2 + radius
      && player.z > box.z1 - radius && player.z < box.z2 + radius) {
      player.x = oldX;
      player.z = oldZ;
      hit = true;
      break;
    }
  }
  if (player.z > 130) { player.z = 130; hit = true; }
  if (Math.abs(player.x) > 228) { player.x = Math.sign(player.x) * 228; hit = true; }
  if (player.z < -225) { player.z = -225; hit = true; }
  return hit;
}

function drive(dt) {
  const car = player.car;
  if (!car) return;
  const gas = (held('KeyW') ? 1 : 0) - (held('KeyS') ? 1 : 0);
  const wheel = (held('KeyD') ? 1 : 0) - (held('KeyA') ? 1 : 0);
  const brake = held('Space');
  const ceiling = car.spec.top * (1 + player.parts.engine * 0.14);
  const shielding = 1 - player.parts.armour * 0.35;

  if (gas > 0) car.speed += 19 * dt;
  else if (gas < 0) car.speed -= 26 * dt;
  if (brake && player.parts.nitro && gas > 0) car.speed += 26 * dt;
  car.speed *= brake && !player.parts.nitro ? 0.94 : 0.988;
  car.speed = Math.max(-ceiling * 0.35, Math.min(ceiling, car.speed));

  const turning = (1.45 + Math.abs(car.speed) * 0.035) * (1 + player.parts.brakes * 0.18);
  car.heading += wheel * turning * dt * (car.speed >= 0 ? 1 : -1) * (brake ? 1.35 : 1);
  const oldX = car.x;
  const oldZ = car.z;
  car.x += Math.sin(car.heading) * car.speed * dt;
  car.z += Math.cos(car.heading) * car.speed * dt;
  car.spin += dt * car.speed * 1.5;

  player.x = car.x;
  player.z = car.z;
  player.heading = car.heading;
  player.speed = car.speed;

  if (collision(oldX, oldZ, 1.6)) {
    const impact = Math.abs(car.speed);
    if (impact > 6) {
      hurtVehicle(car, impact * 0.55 * shielding);
      effects.spark(new THREE.Vector3(car.x, 1, car.z), 0xffc46b, 7);
      sound.crash();
    }
    car.speed *= -0.22;
    player.speed = car.speed;
  }
  if (car.damage >= 100 && !car.flames) {
    car.flames = true;
    effects.blaze(new THREE.Vector3(car.x, 0, car.z), 18);
    marks.burned = true;
    sound.crash();
  }
  if (car.damage >= 100) car.speed *= 0.85;
  syncVehicle(car);
}

function walk(dt) {
  const forward = (held('KeyW') ? 1 : 0) - (held('KeyS') ? 1 : 0);
  const sideways = (held('KeyD') ? 1 : 0) - (held('KeyA') ? 1 : 0);
  const ahead = camera.getWorldDirection(new THREE.Vector3());
  ahead.y = 0;
  ahead.normalize();
  const right = new THREE.Vector3(-ahead.z, 0, ahead.x);
  const step = new THREE.Vector3()
    .addScaledVector(ahead, forward)
    .addScaledVector(right, sideways);
  if (step.lengthSq() > 0) step.normalize().multiplyScalar(7.5 * dt);

  const oldX = player.x;
  const oldZ = player.z;
  player.x += step.x;
  player.z += step.z;
  collision(oldX, oldZ, 0.6);
  if (step.lengthSq() > 0) player.heading = Math.atan2(step.x, step.z);
  player.speed = step.length() / Math.max(dt, 0.001);
  avatar.position.set(player.x, 0, player.z);
  avatar.rotation.y = player.heading;
}

let orbitYaw = 0;
let orbitPitch = 0.32;

function followCamera(dt) {
  if (cursor.orbiting) {
    orbitYaw -= cursor.dx * 0.004;
    orbitPitch = Math.max(0.08, Math.min(0.85, orbitPitch + cursor.dy * 0.003));
  }
  if (held('ArrowLeft')) orbitYaw += dt * 1.6;
  if (held('ArrowRight')) orbitYaw -= dt * 1.6;
  if (held('ArrowUp')) orbitPitch = Math.min(0.85, orbitPitch + dt * 0.9);
  if (held('ArrowDown')) orbitPitch = Math.max(0.08, orbitPitch - dt * 0.9);

  const gap = player.onFoot ? 9 : 13.5;
  const yaw = player.heading + orbitYaw;
  const flat = Math.cos(orbitPitch) * gap;
  const wanted = new THREE.Vector3(
    player.x - Math.sin(yaw) * flat,
    2.2 + Math.sin(orbitPitch) * gap,
    player.z - Math.cos(yaw) * flat,
  );
  camera.position.lerp(wanted, 1 - Math.exp(-dt * 6.5));
  const look = new THREE.Vector3(player.x, player.onFoot ? 1.5 : 1.2, player.z);
  look.x += Math.sin(player.heading) * 3;
  look.z += Math.cos(player.heading) * 3;
  camera.lookAt(look);
}

function begin(useSave) {
  sound.start();
  if (useSave) {
    const record = readProgress();
    if (record) {
      player.cash = record.cash ?? player.cash;
      player.respect = record.respect ?? 0;
      player.jobIndex = Math.min(record.job ?? 0, 8);
      player.parts = { ...player.parts, ...(record.tuning ?? {}) };
      player.owned = { ...player.owned, ...(record.owned ?? {}) };
      player.x = record.x ?? SPAWN.x;
      player.z = record.z ?? SPAWN.z;
      player.bestRace = record.bestRace ?? null;
      if (record.car) {
        const spec = CARS.find((item) => item.id === record.car);
        if (spec) takeCar(spec, CARS.indexOf(spec));
      }
    }
  } else {
    forgetProgress();
  }
  player.mode = 'play';
  document.getElementById('start').classList.add('hidden');
  avatar.position.set(player.x, 0, player.z);
  hud.toast('Welcome to Costa Vela');
  hud.say('MARA: Keep it smooth. The coastline looks better at speed.');
}

const continueButton = document.getElementById('continue-game');
continueButton.disabled = !readProgress();
document.getElementById('new-game').addEventListener('click', () => begin(false));
continueButton.addEventListener('click', () => begin(true));

const shot = Number(new URLSearchParams(window.location.search).get('shot') ?? 0);

function placeCar(spec, x, z, heading) {
  const car = createVehicle(spec, x, z, heading);
  scene.add(car.mesh);
  syncVehicle(car);
  city.parked.push(car);
  enterCar(car, true);
  return car;
}

function composeShot() {
  if (!shot) return;
  document.getElementById('start').classList.add('hidden');
  player.mode = 'play';
  orbitYaw = 0;
  orbitPitch = 0.25;

  if (shot === 1) {
    const car = placeCar(CARS[0], 0, 80, Math.PI);
    car.speed = 24;
    player.speed = 24;
    setWanted(5);
    hud.say('MARA: Headlights behind us. Lose them before we reach the strip.');
  } else if (shot === 2) {
    player.x = 0;
    player.z = 0;
    player.heading = 0.4;
    player.onFoot = true;
    avatar.position.set(player.x, 0, player.z);
    avatar.visible = true;
    hud.say('MARA: Keep it smooth. The coastline looks better at speed.');
  } else if (shot === 3) {
    player.x = 152;
    player.z = 40;
    player.heading = -0.8;
    player.onFoot = true;
    avatar.position.set(player.x, 0, player.z);
    avatar.visible = true;
    setWanted(5);
    effects.blaze(new THREE.Vector3(160, 0, 48), 18);
    marks.burned = true;
    player.wheelTime = 30;
    hud.say('MARA: They closed the roads. Keep moving and mind the barricades.');
  } else if (shot === 4) {
    player.x = -120;
    player.z = -80;
    player.cash = 9820;
    player.respect = 6400;
    player.parts = { engine: 2, armour: 2, brakes: 1 };
    player.mode = 'garage';
    hud.showGarage(true);
  }
  camera.position.set(player.x - Math.sin(player.heading) * 12, 7, player.z - Math.cos(player.heading) * 12);
  camera.lookAt(player.x, 1.4, player.z);
}

composeShot();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

camera.position.set(SPAWN.x - 12, 8, SPAWN.z - 14);
camera.lookAt(SPAWN.x, 1, SPAWN.z);

let previousFrame = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - previousFrame) / 1000);
  previousFrame = now;
  player.time += dt;

  if (player.mode === 'play') {
    actions(dt);
    if (player.onFoot) walk(dt);
    else drive(dt);
    traffic.update(dt, game);
    dispatch.update(dt, game);
    jobs.update(dt);
    armoury.update(dt);
  }
  city.animate(player.time);
  effects.update(dt);
  followCamera(dt);
  sound.update(player.onFoot ? 0 : Math.abs(player.speed), player.wanted);
  hud.update(dt);
  clearFrameInput();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
