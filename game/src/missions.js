// The eight-job story chain, its subtitle lines, and the repeatable strip race.
import { MISSIONS } from './config.js';

const LINES = {
  m1: ["Mara: Parcel's clean. Just walk it over.", "Mara: Keys are in the Vela GT. Go.", "Mara: Downstairs. I will take it from here.", "Mara: Good. You eat now, we talk later."],
  m2: ['Ivo: Any wheels will do. Nobody checks.', 'Ivo: Harbour gate, second dock. Bring it.', 'Ivo: Leave it running. Walk away slow.', 'Ivo: Welcome to the union, amigo.'],
  m3: ["Sol: Start line's yours. Ghost runs clean.", "Sol: Hold the line, do not lift. Finish is north.", "Sol: That was tidy. The strip is yours tonight."],
  m4: ['Mara: Dock yard, north side. White 4x4.', 'Mara: Now drive it like you stole it. Because you did.', 'Mara: Heat is still on you. Shake it.', 'Mara: Park it behind the motors shop. Perfect.'],
  m5: ['Sol: Tower lift is open. Take it up.', 'Sol: Roof access is on the left. Climb.', 'Sol: Hold still while I pull the signal.', 'Sol: Got it. Get down before dispatch does.'],
  m6: ["Ivo: A cruiser. Blue and white. Any one.", "Ivo: Door's open if you are quick.", "Ivo: Safe house on the west road. No lights.", "Ivo: Plates are gone. Nobody saw a thing."],
  m7: ['Mara: File drop is at the harbour. Light it.', 'Mara: That wreck will burn nicely.', 'Mara: Five stars. Keep moving, do not stop.', 'Mara: You made it. I did not doubt you.'],
  m8: ["Mara: Last run. Boulevard, then the pier.", "Mara: Wide open. Give it everything.", "Mara: Boat's at the end of the pier. Jump.", "Mara: Costa Vela is yours. See you across the water."],
};

export function createMissions(ctx) {
  let index = Math.min(ctx.state.missionIndex ?? 0, MISSIONS.length - 1);
  let stage = 0;
  let hold = 0;
  let finished = false;
  let race = null;
  let raceNumber = 0;

  function mission() {
    return MISSIONS[index];
  }

  function summary() {
    if (race) {
      return {
        title: 'Strip Race ' + raceNumber,
        client: 'DJ Sol',
        stageText: 'Stage 1 / 2',
        next: 'Reach the marker before the clock runs out',
        progress: Math.min(1, race.time / 45),
      };
    }
    if (finished) {
      return {
        title: 'Free roam · Coast is clear',
        client: 'Mara Reyes',
        stageText: 'Story complete',
        next: 'Press R for a street race, G for the garage',
        progress: 1,
      };
    }
    const current = mission();
    return {
      title: current.title,
      client: current.client,
      stageText: 'Stage ' + (stage + 1) + ' / ' + current.stages.length,
      next: current.stages[stage],
      progress: (stage + 1) / current.stages.length,
    };
  }

  function startRace() {
    const startX = ctx.state.x;
    const startZ = ctx.state.z;
    const east = startX < 0;
    raceNumber += 1;
    race = {
      start: [startX, startZ],
      goal: [Math.max(-195, Math.min(195, startX + (east ? 240 : -240))), startZ],
      time: 0,
    };
    ctx.say('DJ Sol: Strip race on. Chase the marker before the clock.');
    ctx.toast('Street race started');
  }

  function finishRace() {
    const time = race.time;
    const prize = Math.max(180, Math.round(900 - time * 12));
    ctx.addCash(prize);
    ctx.addRespect(60);
    ctx.say('DJ Sol: ' + time.toFixed(1) + ' seconds. That pays ' + prize + '.');
    ctx.toast('Race won · $' + prize);
    if (!ctx.state.bestRace || time < ctx.state.bestRace) ctx.state.bestRace = time;
    race = null;
    ctx.save();
  }

  function completeMission() {
    const current = mission();
    ctx.addCash(current.reward);
    ctx.addRespect(240);
    ctx.toast('Mission complete · ' + current.title);
    index += 1;
    stage = 0;
    ctx.state.missionIndex = index;
    if (index >= MISSIONS.length) {
      finished = true;
      ctx.world.marker.visible = false;
      ctx.toast('Story complete · Costa Vela is yours');
      ctx.say('Mara: We did it. The whole coast knows your name now.');
    } else {
      ctx.setWanted(Math.max(ctx.state.wanted, MISSIONS[index].wanted));
    }
    ctx.save();
  }

  function update(dt) {
    if (race) {
      race.time += dt;
      ctx.world.marker.visible = true;
      ctx.world.marker.position.set(race.goal[0], 0, race.goal[1]);
      const distance = Math.hypot(ctx.state.x - race.goal[0], ctx.state.z - race.goal[1]);
      if (distance < 11) finishRace();
      else if (race.time > 75) {
        ctx.say('DJ Sol: Too slow. Run it again when you are ready.');
        ctx.toast('Race failed');
        race = null;
      }
      return;
    }

    if (finished) return;

    const current = mission();
    const target = current.targets[stage];
    ctx.world.marker.visible = true;
    ctx.world.marker.position.set(target[0], 0, target[1]);
    const distance = Math.hypot(ctx.state.x - target[0], ctx.state.z - target[1]);
    let ready = distance < 11;

    if (current.id === 'm1' && stage === 1) ready = ready && Boolean(ctx.state.car);
    if (current.id === 'm4' && stage === 2) ready = ctx.state.wanted === 0;
    if (current.id === 'm5' && stage === 2) {
      hold = distance < 13 ? hold + dt : 0;
      ready = hold > 5;
    }
    if (current.id === 'm6' && stage === 1) ready = ready && Boolean(ctx.state.car?.police);
    if (current.id === 'm7' && stage === 1) ready = ready && ctx.flags.wreckBurned;

    if (!ready) return;

    const lines = LINES[current.id] ?? [];
    ctx.say(lines[Math.min(stage, lines.length - 1)] ?? current.client + ': Good work.');
    stage += 1;
    hold = 0;
    if (stage >= current.stages.length) completeMission();
  }

  return { update, summary, startRace, isFinished: () => finished, currentIndex: () => index };
}
