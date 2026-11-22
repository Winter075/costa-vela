// shots.js — deterministic presentation presets used for the four browser captures.

import * as THREE from 'three';

export const SHOT_PRESETS = ['cover', 'street', 'sunset', 'garage'];

export function readShotPreset() {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const shot = params.get('shot');
  return SHOT_PRESETS.includes(shot) ? shot : null;
}

export function seedFromUrl(fallback = 7) {
  const params = new URLSearchParams(globalThis.location?.search ?? '');
  const value = Number.parseInt(params.get('seed') ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

export function applyShotPreset(game, shot) {
  if (!shot) return;
  game.autoStarted = true;
  game.startGame(false, true);

  if (shot === 'cover') {
    game.player.position.set(-30, 0, 60);
    game.playerCash = 15450;
    game.playerRespect = 640;
    const car = game.fleet.spawn('ember', new THREE.Vector3(-30, 0, 60), 0.35, { upgrades: game.player.upgrades });
    game.enterVehicle(car);
    car.speed = 24;
    game.police.setWanted(4);
    game.cameraYaw = 0.45;
    game.director.index = 0;
    game.director.say('Mira: They found us. Drive, and do not stop!', 9);
  } else if (shot === 'street') {
    game.player.position.set(-215, 0, -45);
    game.playerCash = 2380;
    game.playerRespect = 190;
    game.police.setWanted(0);
    game.director.index = 2;
    game.director.showLine();
    game.cameraYaw = 1.1;
  } else if (shot === 'sunset') {
    game.player.position.set(70, 0, -70);
    game.playerCash = 42100;
    game.playerRespect = 1310;
    const car = game.fleet.spawn('slate', new THREE.Vector3(70, 0, -70), 0.1, { upgrades: game.player.upgrades });
    game.enterVehicle(car);
    car.speed = 13;
    game.police.setWanted(5);
    game.director.index = 7;
    game.director.markFinaleStart(0);
    game.director.say('Mira: Every unit they have is rolling. Hold the line!', 12);
    game.hud.setWeaponWheelOpen(true, game.combat.getWeaponRows());
    game.spawnExplosion(new THREE.Vector3(95, 0, -55));
    game.cameraYaw = 0.8;
  } else if (shot === 'garage') {
    game.playerCash = 18750;
    game.playerRespect = 780;
    game.police.setWanted(0);
    game.director.index = 4;
    game.toggleGarage(true);
  }
}
