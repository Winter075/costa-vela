// Eight linked jobs, a street race and the subtitle line that carries each one.

import { MISSIONS } from './config.js';

export class MissionDirector {
  constructor(game, rng) {
    this.game = game;
    this.rng = rng;
    this.index = 0;
    this.checkpoints = [];
    this.done = false;
  }

  get current() { return MISSIONS[Math.min(this.index, MISSIONS.length - 1)]; }

  begin(index = this.index) {
    this.index = Math.max(0, Math.min(MISSIONS.length - 1, index));
    this.done = false;
    const m = this.current;
    this.checkpoints = m.race ? [
      { x: 144, z: 48 }, { x: 192, z: -48 }, { x: 96, z: -144 },
    ] : [];
    this.game.police.setWanted(m.stars || 0);
    if (m.stars >= 3) this.game.police.deployRoadblock(this.game.playerPos());
    this.game.say(m.who, m.line);
    this.game.refreshObjective();
  }

  target() {
    if (this.checkpoints.length) return this.checkpoints[0];
    return this.current.goal;
  }

  update(playerPos) {
    if (this.done) return;
    const t = this.target();
    const d = Math.hypot(playerPos.x - t.x, playerPos.z - t.z);
    if (d > (t.radius || 18)) return;
    if (this.checkpoints.length) {
      this.checkpoints.shift();
      this.game.say('TEO', 'Checkpoint clear. Next one, now.');
      this.game.refreshObjective();
      return;
    }
    const m = this.current;
    this.game.reward(m.pay, m.respect);
    this.done = true;
    this.game.say('VEX', 'That is the job. Cash is in the account.');
    if (this.index < MISSIONS.length - 1) {
      this.index++;
      setTimeout(() => this.begin(), 2200);
    }
    this.game.refreshObjective();
  }
}
