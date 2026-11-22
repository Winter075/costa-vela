// Costa Vela story: eight linked missions, a waypoint marker and a street race side activity.

import * as THREE from 'three';
import { MISSIONS } from './config.js';

const GOLD = 0xffd166;

export class MissionSystem {
  constructor(scene) {
    this.scene = scene;
    this.index = 0;
    this.dialogueTimer = 0;
    this.toast = '';
    this.toastTimer = 0;
    this.race = null;
    this.marker = this.buildMarker(GOLD);
    this.scene.add(this.marker);
    this.syncMarker();
  }

  buildMarker(color) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(7, 0.6, 8, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    group.add(ring);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 4.5, 34, 14, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    );
    beam.position.y = 17;
    group.add(beam);
    group.userData = { ring, beam };
    return group;
  }

  current() { return MISSIONS[this.index] ?? null; }

  stage() {
    const total = MISSIONS.length;
    return `${String(this.index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }

  syncMarker() {
    const mission = this.current();
    if (!mission) { this.marker.visible = false; return; }
    const [x, z] = this.race ? this.race.checkpoints[this.race.step] : mission.waypoint;
    this.marker.visible = true;
    this.marker.position.set(x, 0, z);
  }

  setDialogue(text, seconds = 5) {
    this.dialogue = text;
    this.dialogueTimer = seconds;
  }

  showToast(text) {
    this.toast = text;
    this.toastTimer = 3.5;
  }

  advance(player, police) {
    const completed = this.current();
    if (completed) {
      this.showToast(`MISSION COMPLETE  +$${600 + this.index * 125}`);
      this.index = Math.min(MISSIONS.length, this.index + 1);
    }
    const next = this.current();
    if (next) {
      this.setDialogue(next.dialogue, 6);
      if (next.wanted) police.setWanted(next.wanted);
    } else {
      this.setDialogue('VEX: That is the whole coast. We did it. Drive off into the sunset.', 8);
      this.showToast('STORY COMPLETE  COSTA VELA IS YOURS');
    }
    this.syncMarker();
    return completed;
  }

  startRace() {
    const base = this.current()?.waypoint ?? [-150, 60];
    this.race = {
      checkpoints: [base, [30, 60], [30, -120], [-150, -120]],
      step: 0,
      time: 0,
      active: true,
    };
    this.setDialogue('TEO: Lights up. Three turns and you are a racing legend.', 5);
    this.showToast('STREET RACE STARTED');
    this.syncMarker();
  }

  updateRace(dt, player) {
    if (!this.race || !this.race.active) return;
    this.race.time += dt;
    const [x, z] = this.race.checkpoints[this.race.step];
    if (Math.hypot(player.x - x, player.z - z) < 16) {
      this.race.step++;
      if (this.race.step >= this.race.checkpoints.length) {
        this.race.active = false;
        this.showToast(`RACE WON  ${this.race.time.toFixed(1)}s`);
        this.setDialogue('TEO: Clean run. The pot is yours.', 5);
        this.race = null;
        this.syncMarker();
        return;
      }
      this.showToast(`CHECKPOINT ${this.race.step} / ${this.race.checkpoints.length - 1}`);
      this.syncMarker();
    }
  }

  update(dt, player, police, onMissionComplete) {
    if (this.dialogueTimer > 0) this.dialogueTimer -= dt;
    if (this.toastTimer > 0) this.toastTimer -= dt;
    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.08;
    this.marker.userData.ring.scale.setScalar(pulse);
    this.marker.userData.beam.material.opacity = 0.12 + Math.sin(performance.now() * 0.003) * 0.05;

    if (this.race) {
      this.updateRace(dt, player);
      return;
    }
    const mission = this.current();
    if (!mission) return;
    const [x, z] = mission.waypoint;
    if (Math.hypot(player.x - x, player.z - z) < 18) {
      if (mission.type === 'race') {
        this.startRace();
      } else {
        const done = this.advance(player, police);
        if (onMissionComplete) onMissionComplete(done);
      }
    }
  }
}
