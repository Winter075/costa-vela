// The eight-job objective chain, a waypoint beam and the street race side activity.

import * as THREE from 'three';
import { MISSIONS } from './config.js';

export function createMissions(ctx) {
  const scene = ctx.scene;
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(7, 0.55, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.6;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 4.5, 34, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 17;
  marker.add(ring, beam);
  scene.add(marker);

  let index = 0;
  let dialogueTimer = 0;
  let toastTimer = 0;
  let race = null;

  function current() { return MISSIONS[index] ?? null; }

  function stage() {
    return `${String(index + 1).padStart(2, '0')} / ${String(MISSIONS.length).padStart(2, '0')}`;
  }

  function syncMarker() {
    const mission = current();
    if (race) {
      const point = race.checkpoints[race.step];
      marker.position.set(point[0], 0, point[1]);
      marker.visible = true;
      return;
    }
    if (!mission) { marker.visible = false; return; }
    marker.position.set(mission.waypoint[0], 0, mission.waypoint[1]);
    marker.visible = true;
  }

  function say(text, seconds = 5) {
    ctx.hud.say(text);
    dialogueTimer = seconds;
  }

  function toast(text) {
    ctx.hud.toast(text);
    toastTimer = 3.5;
  }

  function advance() {
    const done = current();
    if (done) {
      const payout = 600 + index * 125;
      ctx.addCash(payout);
      ctx.addRespect(120 + index * 30);
      index = Math.min(MISSIONS.length, index + 1);
      toast(`JOB COMPLETE  +$${payout}`);
    }
    const next = current();
    if (next) {
      say(next.dialogue, 6);
      if (next.wanted) ctx.setWanted(next.wanted);
    } else {
      say('NADIA: That is the whole coast. Nobody takes it from us now.', 8);
      toast('STORY COMPLETE  COSTA VELA IS YOURS');
    }
    syncMarker();
    return done;
  }

  function startRace() {
    const base = current()?.waypoint ?? [138, 62];
    race = {
      checkpoints: [base, [30, 62], [30, -120], [-138, -120]],
      step: 0,
      time: 0,
    };
    say('KITO: Lights up. Three turns and the pot is yours.', 5);
    toast('STREET RACE STARTED');
    syncMarker();
  }

  function updateRace(dt) {
    if (!race) return;
    race.time += dt;
    const point = race.checkpoints[race.step];
    if (Math.hypot(ctx.state.x - point[0], ctx.state.z - point[1]) > 16) return;
    race.step += 1;
    if (race.step >= race.checkpoints.length) {
      const time = race.time;
      if (!ctx.state.bestRace || time < ctx.state.bestRace) ctx.state.bestRace = time;
      ctx.addCash(1800);
      ctx.addRespect(260);
      toast(`RACE WON  ${time.toFixed(1)}s`);
      say('KITO: Clean run. Nobody saw us coming.', 5);
      race = null;
      syncMarker();
      return;
    }
    toast(`CHECKPOINT ${race.step} / ${race.checkpoints.length - 1}`);
    syncMarker();
  }

  function update(dt) {
    if (dialogueTimer > 0) dialogueTimer -= dt;
    if (toastTimer > 0) toastTimer -= dt;
    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.08;
    ring.scale.setScalar(pulse);
    beam.material.opacity = 0.12 + Math.sin(performance.now() * 0.003) * 0.05;
    if (race) { updateRace(dt); return; }
    const mission = current();
    if (!mission) return;
    if (Math.hypot(ctx.state.x - mission.waypoint[0], ctx.state.z - mission.waypoint[1]) > 18) return;
    if (mission.kind === 'race') startRace();
    else {
      const done = advance();
      if (done && index === MISSIONS.length) ctx.setWanted(0);
    }
  }

  function objective() {
    const mission = current();
    if (race) return {
      title: 'Street race', number: 'SIDE', giver: 'KITO',
      next: `Checkpoint ${race.step + 1} of ${race.checkpoints.length - 1}`,
    };
    if (!mission) return { title: 'Coast is yours', number: 'DONE', giver: 'CREW', next: 'Free roam - press G for the garage' };
    return {
      title: mission.title, number: stage(), giver: mission.giver, next: mission.next,
    };
  }

  syncMarker();
  return { update, startRace, objective, current: () => current(), get index() { return index; } };
}
