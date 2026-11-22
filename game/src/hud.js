// The readable HUD: objective, dispatch board, stars, arsenal, crew, minimap,
// subtitles and the status strip. Built once, then updated in place each frame.
import { CREW, VEHICLES, UPGRADES, rankFor, RADIO } from './config.js';
import { ROAD_X, ROAD_Z } from './world.js';

const el = (id) => document.getElementById(id);

export function createHUD(ctx) {
  const root = el('hud');
  root.innerHTML = `
    <div id="objective" class="panel">
      <div class="panel-label">CURRENT JOB</div>
      <div id="obj-title" class="panel-head"></div>
      <div id="obj-client" class="panel-sub"></div>
      <div id="obj-stage" class="panel-tag"></div>
      <div id="obj-next" class="panel-next"></div>
      <div class="bar"><div id="obj-bar"></div></div>
    </div>
    <div id="response" class="panel">
      <div class="panel-label">CVPD DISPATCH</div>
      <div id="response-level"></div>
      <div id="response-list"></div>
    </div>
    <div id="wanted-panel" class="panel">
      <div id="stars"></div>
      <div id="cash"></div>
      <div id="rank"></div>
      <div id="district"></div>
    </div>
    <div id="arsenal" class="panel">
      <div class="panel-label">ARSENAL</div>
      <div id="weapon-slots"></div>
      <div class="panel-label">CREW</div>
      <div id="crew-cards"></div>
    </div>
    <div id="wheel"></div>
    <div id="map-panel" class="panel">
      <canvas id="map" width="200" height="200"></canvas>
      <div id="map-label">COSTA VELA · LIVE MAP</div>
    </div>
    <div id="subtitle"></div>
    <div id="statusbar" class="panel">
      <div id="speed"></div>
      <div id="condition"></div>
      <div id="radio"></div>
    </div>
    <div id="toast"></div>
    <div id="garage" class="overlay hidden">
      <div class="garage-card">
        <div class="panel-label">VELA MOTORS · GARAGE</div>
        <h2>Make the car yours.</h2>
        <div class="garage-grid">
          <div>
            <div class="panel-label">CURRENT RIDE</div>
            <div id="garage-car" class="garage-big"></div>
            <div id="garage-stats" class="garage-line"></div>
            <div class="panel-label">MOTOR POOL</div>
            <div id="garage-list" class="garage-list"></div>
          </div>
          <div>
            <div class="panel-label">UPGRADES</div>
            <div id="garage-upgrades"></div>
            <div class="panel-label">PROGRESSION</div>
            <div id="garage-progress" class="garage-line"></div>
            <div class="panel-label">SAVES</div>
            <div id="garage-save" class="garage-line"></div>
            <div class="garage-hint">Click an upgrade to fit it. Click a car to take it out. G or Esc closes.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const map = el('map');
  const mapCtx = map.getContext('2d');
  const slotNodes = [];
  const wheelNodes = [];

  ctx.getWeapons().forEach((weapon, index) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML = '<span class="slot-key">' + (index + 1) + '</span><span>' + weapon.name + '</span>';
    el('weapon-slots').appendChild(slot);
    slotNodes.push(slot);
    const wheelSlot = document.createElement('div');
    wheelSlot.className = 'wheel-slot';
    wheelSlot.style.setProperty('--angle', index * 60 + 'deg');
    wheelSlot.textContent = weapon.name;
    el('wheel').appendChild(wheelSlot);
    wheelNodes.push(wheelSlot);
  });

  CREW.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'crew-card';
    card.innerHTML = '<span class="crew-dot" style="background:' + member.color + '"></span>'
      + '<div><b>' + member.name + '</b><small>' + member.ability + ' · ' + member.detail + '</small></div>';
    el('crew-cards').appendChild(card);
  });

  let toastTimer = 0;
  let subtitleTimer = 0;

  function toast(text) {
    el('toast').textContent = text;
    el('toast').classList.add('visible');
    toastTimer = 3.4;
  }

  function say(text) {
    el('subtitle').textContent = text;
    el('subtitle').classList.add('visible');
    subtitleTimer = 6;
  }

  function drawMap() {
    const width = 200;
    const scale = 200 / 470;
    const px = (x) => 100 + x * scale;
    const py = (z) => 100 + z * scale;
    mapCtx.clearRect(0, 0, width, width);
    mapCtx.fillStyle = 'rgba(18, 30, 38, 0.82)';
    mapCtx.fillRect(0, 0, width, width);

    mapCtx.fillStyle = 'rgba(46, 118, 145, 0.75)';
    mapCtx.fillRect(0, py(132), width, width - py(132));

    mapCtx.strokeStyle = 'rgba(232, 220, 184, 0.55)';
    mapCtx.lineWidth = 2.4;
    for (const x of ROAD_X) {
      mapCtx.beginPath();
      mapCtx.moveTo(px(x), py(-220));
      mapCtx.lineTo(px(x), py(132));
      mapCtx.stroke();
    }
    for (const z of ROAD_Z) {
      mapCtx.beginPath();
      mapCtx.moveTo(px(-220), py(z));
      mapCtx.lineTo(px(220), py(z));
      mapCtx.stroke();
    }

    for (const vehicle of ctx.world.parked.slice(0, 60)) {
      mapCtx.fillStyle = 'rgba(210, 210, 205, 0.4)';
      mapCtx.fillRect(px(vehicle.x) - 1, py(vehicle.z) - 1, 2, 2);
    }

    const marker = ctx.world.marker;
    if (marker.visible) {
      mapCtx.strokeStyle = '#8ef2d4';
      mapCtx.lineWidth = 2;
      mapCtx.beginPath();
      mapCtx.arc(px(marker.position.x), py(marker.position.z), 5, 0, Math.PI * 2);
      mapCtx.stroke();
    }

    for (const unit of ctx.police.units) {
      const x = unit.vehicle ? unit.vehicle.x : unit.mesh.position.x;
      const z = unit.vehicle ? unit.vehicle.z : unit.mesh.position.z;
      mapCtx.fillStyle = unit.kind === 'helicopter' ? '#ffe08a' : '#ff6b72';
      mapCtx.beginPath();
      mapCtx.arc(px(x), py(z), unit.kind === 'helicopter' ? 4 : 2.6, 0, Math.PI * 2);
      mapCtx.fill();
    }

    const heading = ctx.state.yaw;
    mapCtx.save();
    mapCtx.translate(px(ctx.state.x), py(ctx.state.z));
    mapCtx.rotate(-heading);
    mapCtx.fillStyle = '#ffffff';
    mapCtx.beginPath();
    mapCtx.moveTo(0, -7);
    mapCtx.lineTo(5, 6);
    mapCtx.lineTo(-5, 6);
    mapCtx.closePath();
    mapCtx.fill();
    mapCtx.restore();

    mapCtx.strokeStyle = 'rgba(255,255,255,0.28)';
    mapCtx.lineWidth = 1;
    mapCtx.strokeRect(0.5, 0.5, width - 1, width - 1);
  }

  function update(dt) {
    const state = ctx.state;
    const job = ctx.missions.summary();
    el('obj-title').textContent = job.title;
    el('obj-client').textContent = job.client;
    el('obj-stage').textContent = job.stageText;
    el('obj-next').textContent = job.next;
    el('obj-bar').style.width = Math.round(job.progress * 100) + '%';

    el('response-level').textContent = 'WANTED ' + state.wanted + ' / 5';
    const rows = ctx.police.units.slice(0, 6).map((unit) => {
      const x = unit.vehicle ? unit.vehicle.x : unit.mesh.position.x;
      const z = unit.vehicle ? unit.vehicle.z : unit.mesh.position.z;
      const distance = Math.round(Math.hypot(x - state.x, z - state.z));
      return '<div class="unit"><span>' + unit.name + '</span><span>' + distance + 'm</span><span class="unit-status">' + unit.status + '</span></div>';
    });
    el('response-list').innerHTML = rows.length ? rows.join('') : '<div class="unit quiet">NO ACTIVE UNITS</div>';

    el('stars').textContent = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
    el('cash').textContent = '$' + Math.round(state.cash).toLocaleString('en-US');
    el('rank').textContent = rankFor(state.respect).name + ' · ' + Math.round(state.respect) + ' RESPECT';
    el('district').textContent = ctx.world.districtAt(state.x, state.z).name;

    slotNodes.forEach((node, index) => node.classList.toggle('active', index === ctx.combat.getWeapon()));
    wheelNodes.forEach((node, index) => node.classList.toggle('active', index === ctx.combat.getWeapon()));
    el('wheel').classList.toggle('visible', state.showWheel > 0);

    const condition = state.car ? 100 - state.car.damage : state.health;
    el('speed').textContent = Math.round(Math.abs(state.speed) * 3.6) + ' KM/H';
    el('condition').textContent = (state.car ? 'CAR' : 'BODY') + ' ' + Math.round(condition) + '%';
    el('radio').textContent = RADIO.station + ' · ' + RADIO.track;
    el('map-label').textContent = ctx.world.districtAt(state.x, state.z).name.toUpperCase() + ' · LIVE MAP';

    drawMap();

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) el('toast').classList.remove('visible');
    }
    if (subtitleTimer > 0) {
      subtitleTimer -= dt;
      if (subtitleTimer <= 0) el('subtitle').classList.remove('visible');
    }
  }

  function renderGarage() {
    const state = ctx.state;
    el('garage-car').textContent = state.car ? state.car.spec.name : 'On foot';
    const car = state.car;
    el('garage-stats').textContent = car
      ? 'Top ' + Math.round(car.spec.top * (state.upgrades.engine ? 1.14 : 1)) + ' · grip '
        + (car.spec.grip * (state.upgrades.brakes ? 1.18 : 1)).toFixed(2) + ' · damage ' + Math.round(car.damage) + '%'
      : 'Steal any car, then bring it here.';

    el('garage-list').innerHTML = VEHICLES.map((vehicle, index) =>
      '<button class="garage-item" data-vehicle="' + index + '">' + (index + 1) + '. ' + vehicle.name + '</button>'
    ).join('');

    el('garage-upgrades').innerHTML = UPGRADES.map((upgrade) =>
      '<button class="upgrade" data-upgrade="' + upgrade.id + '"' + (state.upgrades[upgrade.id] ? ' data-owned="1"' : '') + '>'
      + '<b>' + upgrade.name + '</b><small>' + upgrade.detail + ' · $' + upgrade.cost + '</small></button>'
    ).join('');

    el('garage-progress').innerHTML = 'Rank <b>' + rankFor(state.respect).name + '</b><br>Cash <b>$' + Math.round(state.cash) + '</b><br>Respect <b>' + Math.round(state.respect) + '</b>';
    el('garage-save').innerHTML = 'Progress saves locally after every job.<br>Fastest strip race: '
      + (state.bestRace ? state.bestRace.toFixed(1) + 's' : 'none yet');

    root.querySelectorAll('[data-upgrade]').forEach((button) => {
      button.onclick = () => ctx.buyUpgrade(button.dataset.upgrade);
    });
    root.querySelectorAll('[data-vehicle]').forEach((button) => {
      button.onclick = () => ctx.spawnGarageVehicle(VEHICLES[Number(button.dataset.vehicle)]);
    });
  }

  function setGarageVisible(visible) {
    el('garage').classList.toggle('hidden', !visible);
    if (visible) renderGarage();
  }

  return { update, toast, say, setGarageVisible, renderGarage };
}
