// shots.js — deterministic scene states behind the four captured views.
// The ?shot= query key is a capture aid; normal play ignores it.

import * as THREE from 'three';

const PRESETS = ['cover', 'street', 'sunset', 'garage'];

export function readShotPreset() {
  const requested = new URLSearchParams(globalThis.location?.search ?? '').get('shot');
  return PRESETS.includes(requested) ? requested : null;
}

export function seedFromUrl(fallback = 7) {
  const raw = new URLSearchParams(globalThis.location?.search ?? '').get('seed');
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positionPlayer(game, x, z, money, respect, missionIndex) {
  game.player.position.set(x, 0, z);
  game.playerCash = money;
  game.playerRespect = respect;
  game.police.setWanted(0);
  game.director.index = missionIndex;
}

function takeWheel(game, model, x, z, heading, speed, stars, line) {
  const car = game.fleet.spawn(model, new THREE.Vector3(x, 0, z), heading, {
    upgrades: game.player.upgrades,
  });
  game.enterVehicle(car);
  car.speed = speed;
  game.police.setWanted(stars);
  game.director.say(line, 11);
}

const SCENES = {
  cover(game) {
    positionPlayer(game, -30, 60, 15450, 640, 0);
    takeWheel(game, 'ember', -30, 60, 0.35, 24, 4, 'Mira: They found us. Drive, and do not stop!');
    game.cameraYaw = 0.45;
  },
  street(game) {
    positionPlayer(game, -215, -45, 2380, 190, 2);
    game.director.showLine();
    game.cameraYaw = 1.1;
  },
  sunset(game) {
    positionPlayer(game, 70, -70, 42100, 1310, 7);
    takeWheel(game, 'slate', 70, -70, 0.1, 13, 5, 'Mira: Every unit they have is rolling. Hold the line!');
    game.director.markFinaleStart(0);
    game.hud.setWeaponWheelOpen(true, game.combat.getWeaponRows());
    game.spawnExplosion(new THREE.Vector3(95, 0, -55));
    game.cameraYaw = 0.8;
  },
  garage(game) {
    positionPlayer(game, game.player.position.x, game.player.position.z, 18750, 780, 4);
    game.toggleGarage(true);
  },
};

export function applyShotPreset(game, shot) {
  if (!shot || !SCENES[shot]) return;
  game.autoStarted = true;
  game.startGame(false, true);
  SCENES[shot](game);
}
