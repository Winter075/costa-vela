// missions.js — the eight-mission story chain, dialogue subtitles and the street race side activity.

import * as THREE from 'three';
import { MISSION_CHAIN, STREET_RACE_GATES } from './config.js';

export class StreetRace {
  constructor() {
    this.gates = STREET_RACE_GATES;
    this.active = false;
    this.finished = false;
    this.currentGate = 0;
    this.elapsed = 0;
    this.rivalProgress = 0;
    this.bestTime = null;
  }

  start() {
    this.active = true;
    this.finished = false;
    this.currentGate = 0;
    this.elapsed = 0;
    this.rivalProgress = 0;
  }

  update(dt, playerPosition) {
    if (!this.active) return false;
    this.elapsed += dt;
    this.rivalProgress += dt * (STREET_RACE_GATES.reduce((sum, gate, i) => sum + Math.hypot(gate.x - (i ? STREET_RACE_GATES[i - 1].x : 0), gate.z - (i ? STREET_RACE_GATES[i - 1].z : 0)), 0) / 260);
    const gate = this.gates[this.currentGate];
    if (gate && Math.hypot(playerPosition.x - gate.x, playerPosition.z - gate.z) < gate.radius) {
      this.currentGate++;
      if (this.currentGate >= this.gates.length) {
        this.active = false;
        this.finished = true;
        this.bestTime = this.elapsed;
        return true;
      }
    }
    return false;
  }

  getStatus() {
    if (!this.active && !this.finished) return 'Street race available at Causeway';
    if (this.active) return `Gate ${this.currentGate + 1}/3 · ${this.elapsed.toFixed(1)}s · rival ${this.rivalProgress.toFixed(0)}%`;
    return `Race won in ${this.bestTime.toFixed(1)}s`;
  }
}

export class StoryDirector {
  constructor(onComplete) {
    this.chain = MISSION_CHAIN;
    this.index = 0;
    this.onComplete = onComplete;
    this.subtitle = '';
    this.subtitleTimer = 0;
    this.lineIndex = 0;
    this.race = new StreetRace();
    this.notice = '';
    this.noticeTimer = 0;
    this.showLine();
  }

  get mission() { return this.chain[Math.min(this.index, this.chain.length - 1)]; }

  showLine() {
    const line = this.mission.lines[Math.min(this.lineIndex, this.mission.lines.length - 1)];
    this.subtitle = line;
    this.subtitleTimer = 6.5;
  }

  say(text, seconds = 4) {
    this.subtitle = text;
    this.subtitleTimer = seconds;
  }

  getObjective() {
    return {
      number: this.index + 1,
      total: this.chain.length,
      title: this.mission.title,
      stage: this.mission.stage,
      next: this.mission.next,
      character: this.mission.character,
    };
  }

  advance() {
    const completed = this.mission;
    this.onComplete?.(completed);
    this.index = Math.min(this.index + 1, this.chain.length - 1);
    this.lineIndex = 0;
    this.showLine();
    this.notice = `Mission complete · +$${completed.reward}`;
    this.noticeTimer = 5;
  }

  update(dt, context) {
    this.subtitleTimer = Math.max(0, this.subtitleTimer - dt);
    this.noticeTimer = Math.max(0, this.noticeTimer - dt);
    if (this.subtitleTimer <= 0 && this.lineIndex < this.mission.lines.length - 1) {
      this.lineIndex++;
      this.showLine();
    }

    const mission = this.mission;
    const target = new THREE.Vector3(mission.target.x, 0, mission.target.z);
    const distance = context.playerPosition.distanceTo(target);

    if (mission.type === 'steal' && context.stoleVehicle && distance < 32) {
      this.advance();
      return;
    }
    if (mission.type === 'race') {
      if (!this.race.active && !this.race.finished && distance < 34) {
        this.race.start();
        this.say('Rook: Gates lit. Go!', 3);
      }
      if (this.race.update(dt, context.playerPosition)) {
        this.advance();
      }
      return;
    }
    if (mission.type === 'heat') {
      if (context.wanted >= 3 && distance < 28) this.advance();
      return;
    }
    if (mission.type === 'finale') {
      if (context.wanted >= 5 && distance < 34 && context.elapsed - this.finaleStart > 3) this.advance();
      return;
    }
    if (distance < 22) {
      if (mission.type === 'drive') this.advance();
    }
  }

  markFinaleStart(elapsed) { if (this.finaleStart === undefined) this.finaleStart = elapsed; }

  getSubtitle() { return this.subtitleTimer > 0 ? this.subtitle : ''; }
}
