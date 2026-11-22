// The dense HUD: objective, dispatch, wanted, weapons, crew, minimap,
// radio, subtitles, weapon wheel and the garage progression screen.

import { WEAPONS, UPGRADES, CREW, VEHICLES, RADIO, rankFor } from './config.js';

const MARKUP = `
  <div class="panel" id="objective"></div>
  <div class="panel" id="response"></div>
  <div class="panel" id="wanted"></div>
  <div class="panel" id="arsenal"></div>
  <div class="panel" id="map-panel"><canvas id="map" width="190" height="190"></canvas><div id="map-label">CITY GRID / LIVE</div></div>
  <div class="panel" id="statusbar"></div>
  <div id="wheel"></div>
  <div id="subtitle"></div>
  <div id="toast"></div>
  <div class="overlay hidden" id="garage"></div>
`;

export function createHUD(ctx) {
  const root = document.getElementById('hud');
  root.innerHTML = MARKUP;
  const el = (id) => document.getElementById(id);
  const objective = el('objective');
  const response = el('response');
  const wantedPanel = el('wanted');
  const arsenal = el('arsenal');
  const statusbar = el('statusbar');
  const subtitle = el('subtitle');
  const toastNode = el('toast');
  const wheel = el('wheel');
  const garage = el('garage');
  const map = el('map');
  const mapContext = map.getContext('2d');

  let subtitleTime = 0;
  let toastTime = 0;

  wheel.innerHTML = WEAPONS.map((weapon, i) =>
    `<div class="wheel-slot" data-weapon="${i}" style="--angle:${i * 60}deg">${i + 1} ${weapon.name}</div>`).join('');
  const wheelSlots = [...wheel.children];

  function say(text, seconds = 5) {
    subtitle.textContent = text;
    subtitle.classList.add('visible');
    subtitleTime = seconds;
  }

  function toast(text) {
    toastNode.textContent = text;
    toastNode.classList.add('visible');
    toastTime = 3;
  }

  function drawMap() {
    const size = 190;
    const state = ctx.state;
    const scale = 0.38;
    const centreX = size / 2;
    const centreY = size / 2;
    mapContext.clearRect(0, 0, size, size);
    mapContext.fillStyle = '#17242c';
    mapContext.fillRect(0, 0, size, size);
    mapContext.fillStyle = '#20566a';
    mapContext.fillRect(0, 0, size, 18);
    mapContext.strokeStyle = 'rgba(233,201,140,0.22)';
    mapContext.lineWidth = 2;
    for (let gx = -228; gx <= 228; gx += 46) {
      const px = centreX + (gx - state.x) * scale;
      mapContext.beginPath();
      mapContext.moveTo(px, 0);
      mapContext.lineTo(px, size);
      mapContext.stroke();
    }
    for (let gz = -230; gz <= 130; gz += 46) {
      const py = centreY + (state.z - gz) * scale;
      mapContext.beginPath();
      mapContext.moveTo(0, py);
      mapContext.lineTo(size, py);
      mapContext.stroke();
    }

    const spot = (x, z, color, radius = 3) => {
      const px = centreX + (x - state.x) * scale;
      const py = centreY + (state.z - z) * scale;
      if (px < 0 || px > size || py < 0 || py > size) return;
      mapContext.fillStyle = color;
      mapContext.beginPath();
      mapContext.arc(px, py, radius, 0, Math.PI * 2);
      mapContext.fill();
    };
    for (const car of ctx.world.parked) spot(car.x, car.z, '#d8cfa9', 2);
    for (const unit of ctx.police.units) spot(unit.x, unit.z, unit.type === 'HELI' ? '#ffe9a8' : '#ff6f6f', 3.5);
    const job = ctx.missions.current();
    if (job) spot(job.waypoint[0], job.waypoint[1], '#ffd166', 4.5);
    for (const ped of ctx.traffic.peds) spot(ped.x, ped.z, '#8ef0cf', 1.3);

    mapContext.save();
    mapContext.translate(centreX, centreY);
    mapContext.rotate(-state.yaw);
    mapContext.fillStyle = '#ffffff';
    mapContext.beginPath();
    mapContext.moveTo(0, -7);
    mapContext.lineTo(5, 6);
    mapContext.lineTo(-5, 6);
    mapContext.closePath();
    mapContext.fill();
    mapContext.restore();
  }

  function renderObjective() {
    const info = ctx.missions.objective();
    objective.innerHTML = `
      <div class="label">CURRENT JOB - ${info.number}</div>
      <div class="head">${info.title}</div>
      <div class="sub">Case contact: ${info.giver}</div>
      <div class="next">NEXT: ${info.next}</div>
      <div class="bar"><div style="width:${Math.min(100, (ctx.missions.index / 8) * 100)}%"></div></div>`;
  }

  function renderResponse() {
    const rows = ctx.police.responseRows();
    const level = ctx.state.wanted;
    response.innerHTML = `
      <div class="label">VELA DISPATCH</div>
      <div id="response-level">${level ? `${level} STAR RESPONSE - UNITS ACTIVE` : 'NO ACTIVE PURSUIT'}</div>
      ${rows.length ? rows.map((unit) =>
        `<div class="unit"><span>${unit.name}</span><span>${unit.distance}m</span><span class="unit-status">${unit.status}</span></div>`
      ).join('') : '<div class="unit quiet">Patrols standing by. Keep it clean.</div>'}`;
  }

  function renderWanted() {
    const state = ctx.state;
    const rank = rankFor(state.respect);
    const district = ctx.world.districtAt(state.x, state.z);
    wantedPanel.innerHTML = `
      <div class="label">WANTED</div>
      <div id="stars">${state.wanted ? '&#9733;'.repeat(state.wanted) + '&#9734;'.repeat(5 - state.wanted) : 'CLEAN'}</div>
      <div id="cash">$${state.cash.toLocaleString()}</div>
      <div id="rank">${rank.name.toUpperCase()}</div>
      <div id="district">${district.name.toUpperCase()}</div>`;
  }

  function renderArsenal() {
    const crew = CREW[stateCrewIndex()];
    arsenal.innerHTML = `
      <div class="label">ARSENAL</div>
      <div id="slots">${WEAPONS.map((weapon, i) =>
        `<div class="slot ${i === ctx.combat.index ? 'active' : ''}"><span class="slot-key">${i + 1}</span>${weapon.name}</div>`
      ).join('')}</div>
      <div class="label">CREW</div>
      ${CREW.map((member, i) =>
        `<div class="crew"><span class="crew-dot" style="background:${member.color}"></span><span><b>${member.name}</b><small>${i === stateCrewIndex() ? 'ACTIVE - ' : ''}${member.ability}</small></span></div>`
      ).join('')}
      <div class="sub">${crew.note}</div>`;
  }

  function stateCrewIndex() { return ctx.state.crewIndex ?? 0; }

  function renderStatus() {
    const state = ctx.state;
    const car = state.car;
    const condition = car ? 100 - Math.min(100, car.damage) : state.health;
    const track = RADIO.tracks[Math.floor(state.time / 24) % RADIO.tracks.length];
    statusbar.innerHTML = `
      <div class="label">VEHICLE / CONDITION</div>
      <div id="speed">${Math.round(Math.abs(state.speed) * 3.6)} <span style="font-size:12px">KM/H</span></div>
      <div id="condition">${car ? car.spec.name.toUpperCase() : 'ON FOOT'} - ${Math.round(condition)}%</div>
      <div id="radio">${RADIO.station}<br>NOW PLAYING: ${track}</div>`;
  }

  function renderGarage() {
    const state = ctx.state;
    const rank = rankFor(state.respect);
    garage.innerHTML = `
      <div class="card">
        <div class="label">VELA MOTORS / PROGRESSION</div>
        <h2>The garage</h2>
        <div class="grid">
          <div>
            <div class="big">${rank.name.toUpperCase()}</div>
            <div class="line">Cash $${state.cash.toLocaleString()} - Respect ${state.respect.toLocaleString()}<br>
            ${rank.next ? `${(rank.next - state.respect).toLocaleString()} respect to the next rank` : 'Top rank reached'}<br>
            Best race ${state.bestRace ? state.bestRace.toFixed(1) + 's' : 'not set'} - Shots fired ${state.shotsFired}</div>
            <div class="label">VEHICLE COLLECTION</div>
            <div class="list">${VEHICLES.slice(0, 12).map((spec) =>
              `<button class="item" data-car="${spec.id}">${spec.name} - ${spec.price ? '$' + spec.price.toLocaleString() : 'free'}</button>`
            ).join('')}</div>
            <div class="hint">Press G to close - B saves progress - your ride is stored with the save.</div>
          </div>
          <div>
            <div class="label">WORKSHOP UPGRADES</div>
            ${UPGRADES.map((upgrade) =>
              `<button class="upgrade" data-upgrade="${upgrade.id}" ${state.upgrades[upgrade.id] ? 'data-owned="1"' : ''}>
                <b>${upgrade.name} - ${state.upgrades[upgrade.id] ? 'FITTED' : '$' + upgrade.cost.toLocaleString()}</b>
                <small>${upgrade.note}</small>
              </button>`
            ).join('')}
            <div class="label">DISTRICT STANDING</div>
            <div class="line">${ctx.world.districts.map((d) =>
              `${d.name}: ${state.standing[d.id] ?? 0} respect`).join('<br>')}</div>
            <button class="upgrade" data-save="1"><b>SAVE PROGRESS</b><small>Keep cash, rank, upgrades and location in this browser</small></button>
          </div>
        </div>
      </div>`;

    garage.querySelectorAll('[data-car]').forEach((button) => {
      button.addEventListener('click', () => {
        const spec = VEHICLES.find((item) => item.id === button.dataset.car);
        if (!spec) return;
        if (state.cash < spec.price) { toast('Not enough cash for that ride'); return; }
        state.cash -= spec.price;
        ctx.spawnGarageVehicle(spec);
        renderGarage();
      });
    });
    garage.querySelectorAll('[data-upgrade]').forEach((button) => {
      button.addEventListener('click', () => {
        ctx.buyUpgrade(button.dataset.upgrade);
        renderGarage();
      });
    });
    const saveButton = garage.querySelector('[data-save]');
    if (saveButton) saveButton.addEventListener('click', () => { ctx.save(true); toast('Progress saved'); });
  }

  function setGarageVisible(visible) {
    garage.classList.toggle('hidden', !visible);
    if (visible) renderGarage();
  }

  let refresh = 0;
  function update(dt) {
    if (subtitleTime > 0) {
      subtitleTime -= dt;
      if (subtitleTime <= 0) subtitle.classList.remove('visible');
    }
    if (toastTime > 0) {
      toastTime -= dt;
      if (toastTime <= 0) toastNode.classList.remove('visible');
    }
    refresh -= dt;
    if (refresh <= 0) {
      refresh = 0.1;
      renderObjective();
      renderResponse();
      renderWanted();
      renderArsenal();
      renderStatus();
    }
    wheel.classList.toggle('visible', ctx.state.showWheel > 0);
    wheelSlots.forEach((slot, i) => slot.classList.toggle('active', i === ctx.combat.index));
    drawMap();
  }

  return { say, toast, update, setGarageVisible, renderGarage };
}
