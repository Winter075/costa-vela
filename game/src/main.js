// Costa Vela entry point: builds the city, wires input, runs the frame loop and hands state to the HUD.

import * as THREE from 'three';
import { VEHICLES, RADIO } from './config.js';
import { makeRandom } from './random.js';
import { createWorld } from './world.js';
import { Input } from './input.js';
import { Vehicle } from './vehicles.js';
import { TrafficSystem } from './traffic.js';
import { PoliceSystem } from './police.js';
import { CombatSystem } from './combat.js';
import { MissionDirector } from './missions.js';
import { AudioEngine } from './audio.js';
import { HUD } from './hud.js';
import { blankSave, loadSave, writeSave, rankFor, upgradeCost } from './save.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 1400);
const raycaster = new THREE.Raycaster();
const rng = makeRandom();
const world = createWorld(scene, rng);
const input = new Input(canvas);
const hud = new HUD();
const audio = new AudioEngine();

const game = {
  started: false,
  save: blankSave(),
  orbit: 0,
  footYaw: 0,
  time: 0,
  sinceCrime: 99,
  bumpCooldown: 0,
  police: null,
  traffic: null,
  combat: null,
  missions: null,
  playerCar: null,
  car: null,
  player: null,
  hud,
  playerPos() { return this.inCar ? this.car.pos : this.player.position; },
  inCar: false,
};

const foot = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.8, 7), new THREE.MeshLambertMaterial({ color: 0xd8a83c }));
torso.position.y = 1.05;
foot.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 6), new THREE.MeshLambertMaterial({ color: 0xc99368 }));
head.position.y = 2.15;
foot.add(head);
foot.position.set(0, 0, 116);
scene.add(foot);
game.player = foot;

game.police = new PoliceSystem(scene, rng);
game.traffic = new TrafficSystem(scene, rng);
game.combat = new CombatSystem(scene, rng);
game.playerCar = new Vehicle(VEHICLES[0], rng, scene);
game.playerCar.place(0, 116, 0);
game.car = game.playerCar;
game.inCar = true;
foot.visible = false;
game.missions = new MissionDirector(game, rng);

game.combat.onHit = (target, damage) => {
  if (target.ped) {
    target.ped.mesh.position.y = -3;
    setTimeout(() => { target.ped.mesh.position.y = 0; }, 2600);
  } else if (target.vehicle) {
    target.vehicle.hit(damage);
    game.police.trigger(game.playerPos(), 0.5);
    game.sinceCrime = 0;
  }
};

function say(who, line) { hud.say(who, line); }
function refreshObjective() {
  const m = game.missions.current;
  hud.refreshObjective(m, game.missions.index);
  const t = game.missions.target();
  world.setMarker(t.x, t.z);
}
function reward(cash, respect) {
  game.save.cash += cash;
  game.save.respect += respect;
}
Object.assign(game, { say, refreshObjective, reward });

function setCar(v, driving) {
  game.car = v;
  game.inCar = !!driving;
  foot.visible = !driving;
  if (driving) v.speed = Math.max(v.speed, 0);
}
function exitCar() {
  const p = game.car.pos;
  foot.position.set(p.x + 4, 0, p.z + 2);
  game.inCar = false;
  foot.visible = true;
}
Object.assign(game, { setCar, exitCar });

function enterOrExit() {
  audio.start();
  if (game.inCar) { exitCar(); return; }
  const p = foot.position;
  let best = null;
  let bestD = 8;
  const all = [game.playerCar, ...game.traffic.cars, ...game.traffic.parked];
  for (const v of all) {
    const d = Math.hypot(v.pos.x - p.x, v.pos.z - p.z);
    if (d < bestD) { best = v; bestD = d; }
  }
  if (best) {
    game.traffic.cars = game.traffic.cars.filter((v) => v !== best);
    game.traffic.parked = game.traffic.parked.filter((v) => v !== best);
    setCar(best, true);
    game.police.trigger(p, 1);
    game.sinceCrime = 0;
    say('MARA', 'Nice. Let us see what it can do.');
  }
}

function openGarage() {
  game.garageOpen = true;
  hud.showGarage(game.save, {
    save: () => { writeSave({ ...game.save, mission: game.missions.index, weapon: game.combat.index }); say('VEX', 'Saved. Your progress is right where you left it.'); },
    close: () => { game.garageOpen = false; hud.hideGarage(); },
  });
}
game.openGarage = openGarage;

elSafe('newGame').onclick = () => begin(false);
elSafe('continueGame').onclick = () => begin(true);
function elSafe(id) { return document.getElementById(id); }

function begin(useSave) {
  audio.start();
  const loaded = useSave ? loadSave() : null;
  game.save = loaded || blankSave();
  game.missions.index = Math.min(7, game.save.mission || 0);
  game.combat.setWeapon(game.save.weapon || 0);
  game.started = true;
  hud.hideStart();
  game.missions.begin(game.missions.index);
}

const saved = loadSave();
hud.showStart(!!saved, { start: () => begin(false), continue: () => begin(true) });

const shotParam = new URLSearchParams(location.search).get('shot');
if (shotParam) applyShot(game, Number(shotParam));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;

  if (game.started && !game.garageOpen) {
    if (input.take('e')) enterOrExit();
    if (input.take('g')) openGarage();
    if (input.take('q')) game.combat.wheelOpen = !game.combat.wheelOpen;
    for (let i = 0; i < 6; i++) if (input.take(String(i + 1))) game.combat.setWeapon(i);
    if (input.take('arrowleft')) game.orbit -= 0.35;
    if (input.take('arrowright')) game.orbit += 0.35;
    game.orbit += (input.down('arrowup') ? -0.3 : 0) * dt + (input.down('arrowdown') ? 0.3 : 0) * dt;
    game.orbit = Math.max(-1.2, Math.min(1.2, game.orbit));

    const throttle = input.down('w');
    const brake = input.down('s');
    const steer = (input.down('d') ? 1 : 0) - (input.down('a') ? 1 : 0);
    const handbrake = input.down(' ');

    if (game.inCar) {
      game.car.drive(dt, { throttle, brake, steer, handbrake });
      game.sinceCrime += dt;
      if ((throttle && Math.abs(game.car.speed) > 22) || handbrake) game.sinceCrime = Math.min(game.sinceCrime, 8);
    } else {
      const speed = 7 * dt;
      const yaw = game.footYaw + game.orbit;
      const fwd = (input.down('w') ? 1 : 0) - (input.down('s') ? 1 : 0);
      const side = (input.down('d') ? 1 : 0) - (input.down('a') ? 1 : 0);
      foot.position.x += Math.sin(yaw) * fwd * speed + Math.cos(yaw) * side * speed;
      foot.position.z += Math.cos(yaw) * fwd * speed - Math.sin(yaw) * side * speed;
      foot.rotation.y = yaw;
      foot.position.x = Math.max(-214, Math.min(214, foot.position.x));
      foot.position.z = Math.max(-214, Math.min(214, foot.position.z));
    }

    if (input.fire) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const origin = game.playerPos().clone().add(new THREE.Vector3(0, 1.7, 0)).addScaledVector(dir, 2.2);
      if (game.combat.fire(origin, dir)) {
        audio.shot();
        game.police.trigger(game.playerPos(), 0.55);
        game.sinceCrime = 0;
      }
    }

    game.traffic.update(dt, game.playerPos(), game.time);
    game.police.update(dt, game.playerPos(), game.inCar, game.time);
    if (game.police.wanted >= 3 && game.bumpCooldown <= 0) {
      game.police.deployRoadblock(game.playerPos());
      game.bumpCooldown = 12;
    }
    game.bumpCooldown -= dt;
    if (game.sinceCrime > 12) game.police.calm(dt);

    const targets = [];
    for (const u of game.police.units) {
      if (u.vehicle) targets.push({ pos: u.vehicle.pos, radius: 3.2, vehicle: u.vehicle });
    }
    for (const v of game.traffic.cars) targets.push({ pos: v.pos, radius: 3, vehicle: v });
    for (const p of game.traffic.peds) targets.push({ pos: p.mesh.position, radius: 1.4, ped: p });
    game.combat.registerTargets(targets);
    game.combat.update(dt);

    if (game.inCar) {
      for (const u of game.police.units) {
        if (!u.vehicle) continue;
        const d = Math.hypot(u.vehicle.pos.x - game.car.pos.x, u.vehicle.pos.z - game.car.pos.z);
        if (d < 4.6 && Math.abs(game.car.speed) > 9 && game.bumpCooldown < 10) {
          game.car.hit(6);
          u.vehicle.hit(8);
          game.police.trigger(game.playerPos(), 0.8);
          game.sinceCrime = 0;
          hud.flash();
          game.bumpCooldown = 11;
        }
      }
    }

    game.missions.update(game.playerPos());
    world.update(game.time);
    audio.setEngine(game.inCar ? game.car.kmh : 0, game.inCar);
    audio.setSiren(game.police.wanted);
    audio.updateRadio(dt, true);
  }

  const p = game.playerPos();
  const yaw = (game.inCar ? game.car.heading : game.footYaw) + game.orbit;
  const dist = game.inCar ? 14 : 8;
  const height = game.inCar ? 6.5 : 4.2;
  const desired = new THREE.Vector3(p.x - Math.sin(yaw) * dist, p.y + height, p.z - Math.cos(yaw) * dist);
  const eye = new THREE.Vector3(p.x, p.y + 2, p.z);
  const toCamera = desired.clone().sub(eye);
  const camDist = toCamera.length();
  raycaster.set(eye, toCamera.normalize());
  raycaster.far = camDist;
  const blocking = raycaster.intersectObjects(world.buildingMeshes, false);
  if (blocking.length) desired.copy(eye).addScaledVector(toCamera, Math.max(2.5, blocking[0].distance - 1.2));
  camera.position.lerp(desired, 1 - Math.exp(-6 * dt));
  const look = new THREE.Vector3(p.x + Math.sin(yaw) * 6, p.y + 1.8, p.z + Math.cos(yaw) * 6);
  camera.lookAt(look);

  if (game.police.wanted >= 5) {
    scene.background.setHex(0xb83f33);
    scene.fog.color.setHex(0xb04a35);
  } else if (game.police.wanted >= 3) {
    scene.background.setHex(0xdd7c50);
    scene.fog.color.setHex(0xd07b52);
  } else {
    scene.background.setHex(0xe6a269);
    scene.fog.color.setHex(0xe0a06c);
  }

  hud.tickSubtitle(dt);
  hud.update({
    stars: game.police.wanted,
    cash: game.save.cash,
    rank: rankFor(game.save.respect),
    response: game.police.report(p),
    weaponIndex: game.combat.index,
    wheelOpen: game.combat.wheelOpen,
    speed: game.inCar ? game.car.kmh : 0,
    damage: game.inCar ? game.car.damage : 0,
    radio: RADIO[game.save.radio % RADIO.length],
  });
  const mapUnits = game.police.units.map((u) => ({
    kind: u.kind,
    pos: u.kind === 'heli' ? u.mesh.position : u.vehicle.pos,
  }));
  hud.drawMap(p, yaw + Math.PI, mapUnits, game.missions.target());
  input.endFrame();
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
