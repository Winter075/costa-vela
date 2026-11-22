// Four reproducible compositions. The ?shot=1..4 query sets the state the captures use.

import { VEHICLES } from './config.js';
import { rankFor } from './save.js';

export const SHOTS = [
  { name: '01-cover', note: 'Golden hour chase: cruisers, helicopter, objective and full HUD' },
  { name: '02-street', note: 'On foot along the boulevard with pedestrians and traffic' },
  { name: '03-sunset', note: 'Five-star roadblock with the weapon wheel open' },
  { name: '04-garage', note: 'Garage, vehicle roster, upgrades and respect' },
];

export function applyShot(game, number) {
  const n = Math.max(1, Math.min(4, number));
  game.started = true;
  game.sinceCrime = 0;
  game.hud.hideStart();
  if (n === 1) {
    game.missions.index = 4;
    game.save.cash = 9820;
    game.save.respect = 640;
    game.setCar(game.playerCar, true);
    game.playerCar.place(24, 48, 0);
    game.playerCar.speed = 12;
    game.police.setWanted(4);
    game.missions.begin(4);
    game.hud.say('MARA', 'Headlights behind us. Lose them before we reach the strip.', 30);
  } else if (n === 2) {
    game.missions.index = 0;
    game.save.cash = 1250;
    game.save.respect = 0;
    game.exitCar();
    game.player.position.set(6, 0, 120);
    game.police.setWanted(0);
    game.missions.begin(0);
    game.hud.say('MARA', 'Keep it smooth. The coastline looks better at speed.', 30);
  } else if (n === 3) {
    game.missions.index = 6;
    game.save.cash = 6140;
    game.save.respect = 1400;
    game.setCar(game.playerCar, true);
    game.playerCar.place(-96, -96, 0);
    game.playerCar.speed = 0;
    game.police.setWanted(5);
    game.missions.begin(6);
    game.combat.wheelOpen = true;
    game.hud.say('MARA', 'They closed the roads. Keep moving and mind the barricades.', 30);
  } else {
    game.missions.index = 3;
    game.save.cash = 9820;
    game.save.respect = 640;
    game.exitCar();
    game.openGarage();
  }
  game.hud.refreshObjective(game.missions.current, game.missions.index);
}
