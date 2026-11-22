// main.js — Costa Vela: third-chase camera, controls, systems loop, garage and persistence.

import * as THREE from 'three';
import { CREW, RADIO_STATIONS, RESPECT_RANKS, rankForRespect } from './config.js';
import { makeRandom } from './random.js';
import { buildWorld } from './world.js';
import { VehicleFleet } from './vehicles.js';
import { TrafficSystem } from './traffic.js';
import { PoliceResponse } from './police.js';
import { StoryDirector } from './missions.js';
import { CombatSystem } from './combat.js';
import { HUDController } from './hud.js';
import { InputController } from './input.js';
import { ProceduralAudio } from './audio.js';
import { SaveGame } from './save.js';
import { applyShotPreset, readShotPreset, seedFromUrl } from './shots.js';

function createPlayerAvatar() {
  const group = new THREE.Group();
  const jacket = new THREE.MeshStandardMaterial({ color: 0x2f8fa2, roughness: 0.85 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd4a276, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.25, 4, 8), jacket);
  torso.position.y = 1.45;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), skin);
  head.position.y = 2.55;
  group.add(head);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1.2, 6), jacket);
    arm.position.set(side * 0.62, 1.5, 0);
    group.add(arm);
    arms.push(arm);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.05, 6), jacket);
    leg.position.set(side * 0.23, 0.53, 0);
    group.add(leg);
  }
  group.userData.arms = arms;
  return group;
}

class CostaVelaGame {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(64, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 2600);
    this.camera.position.set(0, 12, 32);

    this.random = makeRandom(seedFromUrl(7));
    this.world = buildWorld(this.scene, this.random);
    this.fleet = new VehicleFleet(this.scene, this.random);
    this.fleet.spawnParkedCars();
    this.traffic = new TrafficSystem(this.scene, this.fleet, this.random);
    this.police = new PoliceResponse(this.scene, this.fleet, this.random);
    this.audio = new ProceduralAudio();
    this.combat = new CombatSystem(this.scene, this.camera, this.random, this.audio);
    this.hud = new HUDController();
    this.input = new InputController(this.canvas);
    this.save = new SaveGame();
    this.director = new StoryDirector((mission) => this.onMissionComplete(mission));

    this.player = {
      position: new THREE.Vector3(-40, 0, 125),
      mesh: createPlayerAvatar(),
      yaw: 0,
      health: 100,
      upgrades: { engine: 0, armor: 0, brakes: 0 },
    };
    this.scene.add(this.player.mesh);
    this.playerVehicle = null;
    this.playerCash = 1200;
    this.playerRespect = 0;
    this.ownedVehicle = 'solamar';
    this.radioIndex = 0;
    this.started = false;
    this.garageOpen = false;
    this.weaponWheelOpen = false;
    this.autoStarted = false;
    this.stoleVehicle = false;
    this.cameraYaw = 0;
    this.cameraPitch = 0.26;
    this.elapsed = 0;
    this.walkPhase = 0;
    this.fireEffects = [];
    this.elapsedAtSave = null;
    this.lastSaveTime = null;

    this.combat.onExplosion = (point) => this.spawnExplosion(point);
    this.bindInterface();
    this.hud.showStart(this.save.hasSave());
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (event) => { if (event.code === 'Tab') event.preventDefault(); });
  }

  bindInterface() {
    document.getElementById('btn-new').addEventListener('click', () => this.startGame(false));
    document.getElementById('btn-continue').addEventListener('click', () => this.startGame(true));
    document.getElementById('btn-close-garage').addEventListener('click', () => this.toggleGarage(false));
    document.getElementById('btn-save').addEventListener('click', () => this.saveProgress(true));

    document.getElementById('upgrade-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-upgrade]');
      if (!button) return;
      const key = button.dataset.upgrade;
      const level = this.player.upgrades[key] ?? 0;
      const price = Number(button.dataset.cost) * (level + 1);
      if (level >= 3 || this.playerCash < price) {
        this.director.say('Sable: Not enough cash, or that bench is already maxed.', 3.5);
        return;
      }
      this.playerCash -= price;
      this.player.upgrades[key] = level + 1;
      if (this.playerVehicle) this.playerVehicle.upgrades = this.player.upgrades;
      this.audio.shot(0.4);
      this.saveProgress(false);
      this.hud.setGarageOpen(true, this.garageState());
    });

    document.getElementById('garage-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-vehicle]');
      if (!button) return;
      this.ownedVehicle = button.dataset.vehicle;
      if (this.playerVehicle) this.playerVehicle.repair();
      this.director.say(`Rook: ${this.ownedVehicle} is parked and ready. Keys are under the mat.`, 4);
      this.saveProgress(false);
      this.hud.setGarageOpen(true, this.garageState());
    });
  }

  startGame(continueSave = false, fromShot = false) {
    if (this.started && !fromShot) return;
    const state = continueSave ? this.save.read() : this.save.defaults();
    this.playerCash = state.cash;
    this.playerRespect = state.respect;
    this.ownedVehicle = state.ownedVehicle;
    this.radioIndex = state.radioIndex ?? 0;
    this.player.upgrades = { ...state.upgrades };
    this.director.index = Math.min(state.missionIndex ?? 0, this.director.chain.length - 1);
    this.director.showLine();
    this.audio.setStation(this.radioIndex);
    if (!fromShot) {
      const starter = this.fleet.spawn(this.ownedVehicle, new THREE.Vector3(-40, 0, 118), 0, { upgrades: this.player.upgrades });
      starter.parked = false;
    }
    this.started = true;
    this.input.enabled = true;
    this.hud.hideStart();
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('hud-help').classList.remove('hidden');
    this.audio.start();
  }

  enterVehicle(vehicle) {
    if (!vehicle || this.playerVehicle === vehicle) return;
    this.playerVehicle = vehicle;
    vehicle.parked = false;
    this.player.mesh.visible = false;
    this.stoleVehicle = vehicle.role !== 'police' && vehicle.role !== 'roadblock';
    vehicle.upgrades = this.player.upgrades;
    this.audio.setEngine(0, true);
  }

  exitVehicle() {
    if (!this.playerVehicle) return;
    const vehicle = this.playerVehicle;
    const side = new THREE.Vector3(Math.cos(vehicle.group.rotation.y), 0, -Math.sin(vehicle.group.rotation.y));
    this.player.position.copy(vehicle.position).addScaledVector(side, 4).setY(0);
    vehicle.speed = 0;
    this.playerVehicle = null;
    this.player.mesh.visible = true;
    this.audio.setEngine(0, false);
  }

  toggleGarage(force = null) {
    if (!this.started && force !== true) return;
    this.garageOpen = force === null ? !this.garageOpen : force;
    if (this.garageOpen && this.playerVehicle) this.playerVehicle.speed = 0;
    this.hud.setGarageOpen(this.garageOpen, this.garageState());
  }

  garageState() {
    return {
      cash: this.playerCash,
      respect: this.playerRespect,
      ownedVehicle: this.ownedVehicle,
      upgrades: this.player.upgrades,
      savedAt: this.lastSaveTime,
    };
  }

  saveProgress(showNotice = false) {
    const payload = this.save.write({
      cash: this.playerCash,
      respect: this.playerRespect,
      missionIndex: this.director.index,
      ownedVehicle: this.ownedVehicle,
      upgrades: this.player.upgrades,
      radioIndex: this.radioIndex,
      wins: this.director.race.finished ? 1 : 0,
    });
    this.lastSaveTime = payload.savedAt;
    if (showNotice) this.director.say('Sable: Progress written to the safehouse drive.', 3.5);
  }

  onMissionComplete(mission) {
    this.playerCash += mission.reward;
    this.playerRespect += mission.respect;
    this.audio.explosion();
    this.saveProgress(false);
  }

  spawnExplosion(position) {
    const group = new THREE.Group();
    group.position.copy(position);
    for (let i = 0; i < 7; i++) {
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + this.random.range(0, 2.2), 7, 5),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff5a2f : 0xffc45a, transparent: true, opacity: 0.95 }),
      );
      flame.position.set(this.random.range(-3, 3), this.random.range(0.5, 5), this.random.range(-3, 3));
      group.add(flame);
    }
    const light = new THREE.PointLight(0xff8a3a, 30, 70);
    light.position.y = 3;
    group.add(light);
    this.scene.add(group);
    this.fireEffects.push({ group, life: 2.2 });
    this.audio.explosion();
  }

  handleKeys() {
    const input = this.input;
    if (input.wasPressed('KeyG')) this.toggleGarage();
    if (input.wasPressed('Escape') && this.garageOpen) this.toggleGarage(false);
    if (input.wasPressed('Tab') && !this.garageOpen) {
      this.weaponWheelOpen = !this.weaponWheelOpen;
      this.hud.setWeaponWheelOpen(this.weaponWheelOpen, this.combat.getWeaponRows());
    }
    for (const weapon of this.combat.weapons) {
      if (input.wasPressed(`Digit${weapon.slot}`)) this.combat.switchWeapon(weapon.slot);
    }
    if (input.wasPressed('KeyR')) {
      this.radioIndex = (this.radioIndex + 1) % RADIO_STATIONS.length;
      this.audio.setStation(this.radioIndex);
    }
    if (input.wasPressed('KeyM')) this.audio.toggleMute();
    if (input.wasPressed('KeyE') && !this.garageOpen) {
      if (this.playerVehicle) this.exitVehicle();
      else this.enterVehicle(this.fleet.findNearest(this.player.position, 8));
    }
  }

  updatePlayer(dt) {
    const input = this.input;
    const throttle = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const steer = (input.isDown('KeyA') ? 1 : 0) - (input.isDown('KeyD') ? 1 : 0);

    if (this.garageOpen) return 0;

    if (this.playerVehicle) {
      this.playerVehicle.update(dt, { throttle, brake: input.isDown('KeyS') ? Math.max(0, -throttle) : 0, steer, handbrake: input.isDown('Space') });
      this.player.position.copy(this.playerVehicle.position);
      this.player.yaw = this.playerVehicle.group.rotation.y;
      return this.playerVehicle.getSpeedKmh();
    }

    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
    const move = forward.multiplyScalar(throttle).addScaledVector(right, steer);
    if (move.lengthSq() > 0) {
      move.normalize();
      const speed = input.isDown('ShiftLeft') ? 13 : 8.2;
      this.player.position.addScaledVector(move, speed * dt);
      this.player.yaw = Math.atan2(move.x, move.z);
      this.walkPhase += dt * 10;
    }
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -350, 350);
    this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -350, 350);
    this.player.mesh.position.copy(this.player.position);
    this.player.mesh.rotation.y = this.player.yaw;
    const arms = this.player.mesh.userData.arms;
    arms[0].rotation.x = Math.sin(this.walkPhase) * 0.6;
    arms[1].rotation.x = -Math.sin(this.walkPhase) * 0.6;
    return move.lengthSq() > 0 ? 8.2 * 3.6 : 0;
  }

  updateCamera(dt) {
    const orbit = this.input.consumeOrbit();
    this.cameraYaw += orbit.x * 0.005;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + orbit.y * 0.0032, 0.08, 0.78);
    const inVehicle = Boolean(this.playerVehicle);
    const focus = this.player.position.clone().add(new THREE.Vector3(0, inVehicle ? 2.9 : 2.1, 0));
    const distance = inVehicle ? 17 : 9.5;
    const desired = focus.clone().add(new THREE.Vector3(
      Math.sin(this.cameraYaw) * distance * Math.cos(this.cameraPitch),
      distance * Math.sin(this.cameraPitch) + 2.2,
      Math.cos(this.cameraYaw) * distance * Math.cos(this.cameraPitch),
    ));
    const smoothing = 1 - Math.exp(-dt * 6.5);
    this.camera.position.lerp(desired, smoothing);
    const speedShake = inVehicle ? Math.min(this.playerVehicle.getSpeedKmh() / 150, 1) : 0;
    const shake = speedShake * (this.police.wanted > 0 ? 0.16 : 0.07);
    this.camera.position.x += (Math.random() - 0.5) * shake;
    this.camera.position.y += (Math.random() - 0.5) * shake;
    const lookAhead = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).multiplyScalar(inVehicle ? 10 : 4);
    this.camera.lookAt(focus.add(lookAhead));
  }

  updateFireEffects(dt) {
    for (let i = this.fireEffects.length - 1; i >= 0; i--) {
      const effect = this.fireEffects[i];
      effect.life -= dt;
      const scale = Math.max(0.1, effect.life / 2.2);
      effect.group.scale.setScalar(0.5 + (1 - scale) * 1.8);
      effect.group.children.forEach((child) => {
        if (child.material?.opacity !== undefined) child.material.opacity = Math.min(0.95, scale * 1.4);
      });
      if (effect.life <= 0) {
        this.scene.remove(effect.group);
        this.fireEffects.splice(i, 1);
      }
    }
  }

  update(dt) {
    this.elapsed += dt;
    this.world.update(dt, this.elapsed);
    this.updateFireEffects(dt);
    this.audio.updateRadio(dt);

    if (this.started && !this.garageOpen) {
      this.handleKeys();
      const speedKmh = this.updatePlayer(dt);
      if (this.input.consumeFire()) {
        const targets = this.fleet.vehicles.filter((v) => v !== this.playerVehicle);
        if (this.combat.fire(targets)) this.police.addHeat(5);
      }
      this.traffic.update(dt, this.elapsed, this.player.position, speedKmh);
      this.police.update(dt, this.player.position, this.elapsed);
      this.combat.update(dt);

      if (this.police.wanted > 0) {
        this.police.heat = Math.max(0, this.police.heat - dt * 0.32);
        const floor = this.police.thresholds[this.police.wanted] - 9;
        if (this.police.heat < floor) {
          this.police.wanted--;
          this.police.trimUnits?.();
        }
      }
      this.audio.setEngine(speedKmh / 3.6, Boolean(this.playerVehicle));
      this.audio.setSiren(this.police.wanted);

      const mission = this.director.mission;
      if (mission.type === 'finale') this.director.markFinaleStart(this.elapsed);
      this.director.update(dt, {
        playerPosition: this.player.position,
        wanted: this.police.wanted,
        stoleVehicle: this.stoleVehicle,
        elapsed: this.elapsed,
      });
      this.stoleVehicle = false;
      if (this.police.wanted >= 5 && this.random.chance(dt * 0.25)) {
        this.spawnExplosion(this.player.position.clone().add(new THREE.Vector3(this.random.range(-25, 25), 0, this.random.range(-25, 25))));
      }
      this.updateHud(speedKmh);
      this.input.endFrame();
    } else if (this.started) {
      this.handleKeys();
      this.input.endFrame();
    }
    this.updateCamera(dt);
  }

  updateHud(speedKmh) {
    const objective = this.director.getObjective();
    const mission = this.director.mission;
    const target = this.director.race.active && this.director.race.gates[this.director.race.currentGate]
      ? this.director.race.gates[this.director.race.currentGate]
      : mission.target;
    const blips = this.fleet.vehicles
      .filter((v) => v.isPolice || this.random.chance(0.25))
      .slice(0, 18)
      .map((v) => ({ x: v.position.x, z: v.position.z, hostile: v.isPolice }));
    for (const ped of this.traffic.pedestrians.slice(0, 12)) blips.push({ x: ped.group.position.x, z: ped.group.position.z, hostile: false });

    this.hud.update({
      objective,
      rows: this.police.getResponseRows(this.player.position),
      wanted: this.police.wanted,
      cash: this.playerCash,
      respect: this.playerRespect,
      rank: rankForRespect(this.playerRespect).name,
      weapons: this.combat.getWeaponRows(),
      crew: CREW,
      subtitle: this.director.getSubtitle() || (this.director.noticeTimer > 0 ? this.director.notice : ''),
      notice: this.director.noticeTimer > 0 ? this.director.notice : '',
      speed: speedKmh,
      condition: this.playerVehicle ? this.playerVehicle.health : this.player.health,
      inVehicle: Boolean(this.playerVehicle),
      vehicleName: this.playerVehicle ? this.playerVehicle.model.name.toUpperCase() : 'ON FOOT · MIRA’S CONTACT',
      radio: RADIO_STATIONS[this.radioIndex],
      race: { active: this.director.race.active, gates: this.director.race.gates, status: this.director.race.getStatus() },
      target,
      player: { x: this.player.position.x, z: this.player.position.z, yaw: this.player.yaw },
      blips,
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  run() {
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

const game = new CostaVelaGame();
window.costaVela = game;
window.__gameReady = true;
game.run();

const shot = readShotPreset();
if (shot) applyShotPreset(game, shot);
