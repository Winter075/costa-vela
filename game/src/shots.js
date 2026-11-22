// Costa Vela screenshot presets. Each mode arranges a real, running game into a
// frame that shows several systems at once; nothing here edits the captured image.

export const SHOT_PRESETS = {
  cover: {
    weather: 'golden', wanted: 4, missionIndex: 3,
    x: -192, z: -128, heading: 0, inCar: true, vehicleModel: 0,
    wheel: false, garage: false, explosion: false, extraUnits: 2,
    orbitYaw: 0, orbitPitch: 0.26, cash: 4820, respect: 3100,
  },
  street: {
    weather: 'day', wanted: 0, missionIndex: 0,
    x: -256, z: -64, heading: 0, inCar: false, vehicleModel: 3,
    wheel: false, garage: false, explosion: false, extraUnits: 0,
    orbitYaw: 0, orbitPitch: 0.22, cash: 1250, respect: 0,
  },
  sunset: {
    weather: 'sunset', wanted: 5, missionIndex: 6,
    x: 128, z: 256, heading: -0.4, inCar: false, vehicleModel: 4,
    wheel: true, garage: false, explosion: true, extraUnits: 1,
    orbitYaw: 0.2, orbitPitch: 0.26, cash: 6140, respect: 5200,
  },
  garage: {
    weather: 'golden', wanted: 0, missionIndex: 4,
    x: 0, z: 0, heading: 0, inCar: false, vehicleModel: 0,
    wheel: false, garage: true, explosion: false, extraUnits: 0,
    orbitYaw: 0.6, orbitPitch: 0.25, cash: 9820, respect: 6400,
  },
};

export function shotNameFromQuery(query) {
  const name = new URLSearchParams(query).get('shot');
  return name && SHOT_PRESETS[name] ? name : null;
}

export function applyShot(name, ctx) {
  const preset = SHOT_PRESETS[name];
  if (!preset) return null;
  const { player, police, missions, combat, progress, hud, cameraRig, traffic } = ctx;

  progress.cash = preset.cash;
  progress.respect = preset.respect;
  if (name === 'garage') {
    progress.ownedVehicles = [0, 1, 2, 3, 4, 5, 6];
    progress.upgrades = { engine: 2, armour: 2, brakes: 1 };
  }

  player.x = preset.x;
  player.z = preset.z;
  player.heading = preset.heading;
  player.inCar = preset.inCar;
  player.vehicleModelIndex = preset.vehicleModel;
  player.speed = preset.inCar ? 26 : 0;

  missions.index = preset.missionIndex;
  missions.setDialogue(missions.current()?.dialogue ?? 'MARA: Stay sharp.', 999);
  missions.syncMarker();

  police.setWanted(preset.wanted);
  police.ensureUnits(player);
  for (let i = 0; i < preset.extraUnits; i++) police.spawnUnit('CRUISER', player);

  // Put the helicopter in front of the camera so its spotlight reads in the frame.
  const heli = police.units.find((u) => u.type === 'HELI');
  if (heli) {
    heli.orbit = 0;
    heli.x = player.x + Math.sin(player.heading) * 60;
    heli.z = player.z + Math.cos(player.heading) * 60;
    heli.y = 20;
    heli.mesh.position.set(heli.x, heli.y, heli.z);
  }

  if (name === 'cover' || name === 'sunset') {
    const ground = police.units.filter((u) => u.y === 0 && u.type !== 'ROADBLOCK');
    ground.forEach((unit, i) => {
      unit.speed = 7;
      unit.x = player.x + (i % 2 === 0 ? -3.5 : 3.5);
      unit.z = player.z + 26 + i * 14;
      unit.heading = Math.PI;
      unit.mesh.position.set(unit.x, 0, unit.z);
      unit.mesh.rotation.y = unit.heading - Math.PI / 2;
    });
  }

  if (name === 'street' && traffic) {
    const peds = traffic.pedestrians;
    const spots = [[-8, 12], [8, 16], [-14, 22], [14, 24], [-3, 10], [5, 28]];
    peds.forEach((ped, i) => {
      if (i >= spots.length) return;
      ped.x = player.x + spots[i][0];
      ped.z = player.z + spots[i][1];
      ped.walkLine = ped.alongZ ? ped.x : ped.z;
      ped.fleeTimer = 0;
      ped.mesh.position.set(ped.x, 0, ped.z);
    });
    const cars = traffic.cars;
    [[12, -8], [-18, 6], [22, 14]].forEach(([dx, dz], i) => {
      if (!cars[i]) return;
      cars[i].x = player.x + dx;
      cars[i].z = player.z + dz;
      cars[i].mesh.position.set(cars[i].x, 0, cars[i].z);
    });
  }

  if (preset.explosion) {
    combat.spawnExplosion(player.x + 16, player.z + 22, 0.85);
    combat.spawnExplosion(player.x - 20, player.z + 36, 0.55);
  }
  combat.toggleWheel(preset.wheel);
  hud.setWheel(preset.wheel, combat.slot);
  if (preset.garage) hud.showGarage(progress, ctx.garageHandlers);

  if (cameraRig) {
    cameraRig.yaw = preset.orbitYaw;
    cameraRig.pitch = preset.orbitPitch;
  }
  return preset;
}
