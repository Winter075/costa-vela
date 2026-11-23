// hud.js — the readable in-game overlay, including the canvas minimap and garage menu.

import { WORLD, DISTRICTS, VEHICLE_MODELS, rankForRespect } from './config.js';

function node(id) {
  return document.getElementById(id);
}

function cash(value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export class HUDController {
  constructor() {
    this.objectiveNumber = node('obj-number');
    this.objectiveTitle = node('obj-title');
    this.objectiveStage = node('obj-stage');
    this.objectiveNext = node('obj-next');
    this.objectiveCharacter = node('obj-character');
    this.responseRows = node('response-rows');
    this.responsePanel = node('response-panel');
    this.stars = node('wanted-stars');
    this.cash = node('hud-cash');
    this.respect = node('hud-respect');
    this.rank = node('hud-rank');
    this.weaponSlots = node('weapon-slots');
    this.crewCards = node('crew-cards');
    this.subtitle = node('subtitle');
    this.speed = node('speed-value');
    this.conditionFill = node('condition-fill');
    this.conditionText = node('condition-text');
    this.vehicleName = node('vehicle-name');
    this.radioStation = node('radio-station');
    this.radioTrack = node('radio-track');
    this.toast = node('toast');
    this.racePanel = node('race-panel');
    this.raceText = node('race-text');
    this.damageVignette = node('damage-vignette');
    this.weaponWheel = node('weapon-wheel');
    this.garage = node('garage-screen');
    this.startScreen = node('start-screen');
    this.minimap = node('minimap-canvas');
    this.minimapLabel = node('minimap-label');
    this.mapContext = this.minimap.getContext('2d');
    this.lastNotice = '';
  }

  showStart(hasSave) {
    this.startScreen.classList.remove('hidden');
    node('btn-continue').disabled = !hasSave;
  }

  hideStart() {
    this.startScreen.classList.add('hidden');
  }

  setGarageOpen(open, state = null) {
    this.garage.classList.toggle('hidden', !open);
    if (open && state) this.renderGarage(state);
  }

  setWeaponWheelOpen(open, weapons = null) {
    this.weaponWheel.classList.toggle('hidden', !open);
    if (!open || !weapons) return;
    node('weapon-wheel-slots').innerHTML = weapons.map((weapon) => `
      <div class="wheel-slot ${weapon.active ? 'wheel-active' : ''}" style="--slot-color:${weapon.color}">
        <span class="wheel-key">${weapon.slot}</span><span>${weapon.name}</span><small>${weapon.ammo}</small>
      </div>`).join('');
  }

  renderGarage(state) {
    node('garage-cash').textContent = cash(state.cash);
    node('garage-respect').textContent = `${state.respect} · ${rankForRespect(state.respect).name}`;
    node('garage-save-time').textContent = state.savedAt
      ? `Saved ${new Date(state.savedAt).toLocaleString()}`
      : 'Not saved yet';

    node('garage-list').innerHTML = VEHICLE_MODELS.slice(0, 12).map((model, index) => `
      <button class="vehicle-card ${state.ownedVehicle === model.id ? 'owned' : ''}" data-vehicle="${model.id}">
        <span class="vehicle-swatch" style="background:#${model.color.toString(16).padStart(6, '0')}"></span>
        <span><strong>${model.name}</strong><small>${model.kind} · ${index % 3 === 0 ? 'tuned' : 'street'}</small></span>
      </button>`).join('');

    const upgrades = [
      ['engine', 'Engine tune', 600],
      ['armor', 'Reinforced panels', 500],
      ['brakes', 'Race brakes', 400],
    ];
    node('upgrade-list').innerHTML = upgrades.map(([key, label, base]) => {
      const level = state.upgrades[key] ?? 0;
      return `
        <div class="upgrade-row">
          <span>${label}</span>
          <span class="upgrade-level">${'▮'.repeat(level)}${'▯'.repeat(3 - level)}</span>
          <button class="upgrade-button" data-upgrade="${key}" data-cost="${base}">${cash(base * (level + 1))}</button>
        </div>`;
    }).join('');
  }

  flashDamage() {
    this.damageVignette.classList.remove('damage-pulse');
    void this.damageVignette.offsetWidth;
    this.damageVignette.classList.add('damage-pulse');
  }

  update(state) {
    const objective = state.objective;
    this.objectiveNumber.textContent =
      `${String(objective.number).padStart(2, '0')} / ${String(objective.total).padStart(2, '0')}`;
    this.objectiveTitle.textContent = objective.title;
    this.objectiveStage.textContent = objective.stage;
    this.objectiveNext.textContent = `NEXT · ${objective.next}`;
    this.objectiveCharacter.textContent = objective.character;

    this.responsePanel.classList.toggle('quiet', state.wanted === 0);
    this.responseRows.innerHTML = state.rows.length
      ? state.rows.map((row) => `
          <div class="response-row">
            <span class="unit-name">${row.name}</span>
            <span class="unit-status">${row.status}</span>
            <span class="unit-distance">${row.distance}m</span>
          </div>`).join('')
      : '<div class="response-row empty">NO ACTIVE RESPONSE · CITY PATROL</div>';

    this.stars.textContent = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
    this.cash.textContent = cash(state.cash);
    this.respect.textContent = String(state.respect);
    this.rank.textContent = `${rankForRespect(state.respect).name.toUpperCase()} · ${state.standing}`;

    this.weaponSlots.innerHTML = state.weapons.map((weapon) => `
      <div class="weapon-slot ${weapon.active ? 'active' : ''}" style="--slot-color:${weapon.color}">
        <b>${weapon.slot}</b><span>${weapon.name}</span><i>${weapon.ammo}</i>
      </div>`).join('');
    if (!this.crewCards.dataset.filled) {
      this.crewCards.dataset.filled = '1';
      this.crewCards.innerHTML = state.crew.map((member, index) => `
        <div class="crew-card" style="--crew-color:${member.color}" title="${state.abilities[index].detail}">
          <span class="crew-initials">${member.initials}</span>
          <span><strong>${member.name}</strong><small>${member.role}</small></span>
        </div>`).join('');
    }

    this.subtitle.textContent = state.subtitle || '';
    this.subtitle.classList.toggle('hidden', !state.subtitle);
    this.speed.textContent = String(Math.round(state.speed));
    const condition = Math.max(0, Math.min(100, state.condition));
    this.conditionFill.style.width = `${condition}%`;
    this.conditionFill.style.background =
      condition > 55 ? '#6de3b0' : condition > 25 ? '#ffd36b' : '#ff6b6b';
    this.conditionText.textContent = state.inVehicle
      ? `VEHICLE ${Math.round(condition)}%`
      : `HEALTH ${Math.round(condition)}%`;
    this.vehicleName.textContent = state.vehicleName;
    this.radioStation.textContent = state.radio.name;
    this.radioTrack.textContent = `♪ ${state.radio.track}`;

    if (state.notice && state.notice !== this.lastNotice) {
      this.toast.textContent = state.notice;
      this.lastNotice = state.notice;
    }
    if (!state.notice) this.lastNotice = '';
    this.toast.classList.toggle('hidden', !state.notice);

    this.racePanel.classList.toggle('hidden', !state.race.active);
    this.raceText.textContent = state.race.status;
    this.damageVignette.style.opacity = condition < 35 ? String((35 - condition) / 70) : '0';

    this.drawMinimap(state);
  }

  drawMinimap(state) {
    const ctx = this.mapContext;
    const size = this.minimap.width;
    const scale = size / (WORLD.halfExtent * 2);
    const toX = (x) => size / 2 + x * scale;
    const toY = (z) => size / 2 + z * scale;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, size, size);

    for (const district of DISTRICTS) {
      const b = district.bounds;
      ctx.fillStyle = district.id === 'beach' ? '#5c5b45'
        : district.id === 'downtown' ? '#35404c'
          : district.id === 'harbour' ? '#3e5457' : '#4b3b52';
      ctx.fillRect(toX(b.minX), toY(b.minZ), (b.maxX - b.minX) * scale, (b.maxZ - b.minZ) * scale);
    }

    ctx.strokeStyle = '#89959d';
    ctx.lineWidth = 2;
    for (const line of WORLD.roadLines) {
      ctx.beginPath();
      ctx.moveTo(0, toY(line));
      ctx.lineTo(size, toY(line));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX(line), 0);
      ctx.lineTo(toX(line), size);
      ctx.stroke();
    }

    if (state.race.active || state.race.finished) {
      ctx.strokeStyle = '#ffd15c';
      for (const gate of state.race.gates) {
        ctx.strokeRect(toX(gate.x) - 4, toY(gate.z) - 4, 8, 8);
      }
    }

    for (const blip of state.blips) {
      ctx.fillStyle = blip.hostile ? '#ff5a5a' : '#8fd7ff';
      ctx.beginPath();
      ctx.arc(toX(blip.x), toY(blip.z), blip.hostile ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const target = state.target;
    ctx.fillStyle = '#5ef2cf';
    ctx.beginPath();
    ctx.moveTo(toX(target.x), toY(target.z) - 6);
    ctx.lineTo(toX(target.x) + 6, toY(target.z));
    ctx.lineTo(toX(target.x), toY(target.z) + 6);
    ctx.lineTo(toX(target.x) - 6, toY(target.z));
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(toX(state.player.x), toY(state.player.z));
    ctx.rotate(-state.player.yaw);
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.minimapLabel.textContent = `${state.district.toUpperCase()} · CITY MAP`;
  }
}
