// hud.js — the readable in-game overlay and its canvas minimap.

import { WORLD, DISTRICTS, VEHICLE_MODELS, RESPECT_RANKS, rankForRespect } from './config.js';

function element(id) { return document.getElementById(id); }
function money(value) { return `$${Math.round(value).toLocaleString('en-US')}`; }

export class HUDController {
  constructor() {
    this.root = element('hud');
    this.objNumber = element('obj-number');
    this.objTitle = element('obj-title');
    this.objStage = element('obj-stage');
    this.objNext = element('obj-next');
    this.objCharacter = element('obj-character');
    this.responseRows = element('response-rows');
    this.responsePanel = element('response-panel');
    this.stars = element('wanted-stars');
    this.cash = element('hud-cash');
    this.respect = element('hud-respect');
    this.rank = element('hud-rank');
    this.weaponSlots = element('weapon-slots');
    this.crewCards = element('crew-cards');
    this.subtitle = element('subtitle');
    this.speed = element('speed-value');
    this.conditionFill = element('condition-fill');
    this.conditionText = element('condition-text');
    this.vehicleName = element('vehicle-name');
    this.radioStation = element('radio-station');
    this.radioTrack = element('radio-track');
    this.toast = element('toast');
    this.racePanel = element('race-panel');
    this.raceText = element('race-text');
    this.damageVignette = element('damage-vignette');
    this.weaponWheel = element('weapon-wheel');
    this.garage = element('garage-screen');
    this.startScreen = element('start-screen');
    this.minimap = element('minimap-canvas');
    this.mapContext = this.minimap.getContext('2d');
    this.lastToast = '';
  }

  showStart(hasSave) {
    this.startScreen.classList.remove('hidden');
    element('btn-continue').disabled = !hasSave;
  }

  hideStart() { this.startScreen.classList.add('hidden'); }

  setGarageOpen(open, state = null) {
    this.garage.classList.toggle('hidden', !open);
    if (open && state) this.renderGarage(state);
  }

  setWeaponWheelOpen(open, weapons = null) {
    this.weaponWheel.classList.toggle('hidden', !open);
    if (open && weapons) {
      element('weapon-wheel-slots').innerHTML = weapons.map((w) => `
        <div class="wheel-slot ${w.active ? 'wheel-active' : ''}" style="--slot-color:${w.color}">
          <span class="wheel-key">${w.slot}</span><span>${w.name}</span><small>${w.ammo}</small>
        </div>`).join('');
    }
  }

  renderGarage(state) {
    element('garage-cash').textContent = money(state.cash);
    element('garage-respect').textContent = `${state.respect} · ${rankForRespect(state.respect).name}`;
    element('garage-save-time').textContent = state.savedAt ? `Saved ${new Date(state.savedAt).toLocaleString()}` : 'Not saved yet';
    element('garage-list').innerHTML = VEHICLE_MODELS.slice(0, 12).map((v, i) => `
      <button class="vehicle-card ${state.ownedVehicle === v.id ? 'owned' : ''}" data-vehicle="${v.id}">
        <span class="vehicle-swatch" style="background:#${v.color.toString(16).padStart(6, '0')}"></span>
        <span><strong>${v.name}</strong><small>${v.kind} · ${i % 3 === 0 ? 'tuned' : 'street'}</small></span>
      </button>`).join('');
    const upgrades = [
      ['engine', 'Engine tune', 600], ['armor', 'Reinforced panels', 500], ['brakes', 'Race brakes', 400],
    ];
    element('upgrade-list').innerHTML = upgrades.map(([key, name, cost]) => `
      <div class="upgrade-row">
        <span>${name}</span>
        <span class="upgrade-level">${'▮'.repeat(state.upgrades[key] ?? 0)}${'▯'.repeat(3 - (state.upgrades[key] ?? 0))}</span>
        <button class="upgrade-button" data-upgrade="${key}" data-cost="${cost}">${money(cost * ((state.upgrades[key] ?? 0) + 1))}</button>
      </div>`).join('');
  }

  flashDamage() {
    this.damageVignette.classList.remove('damage-pulse');
    void this.damageVignette.offsetWidth;
    this.damageVignette.classList.add('damage-pulse');
  }

  update(s) {
    const o = s.objective;
    this.objNumber.textContent = `${String(o.number).padStart(2, '0')} / ${String(o.total).padStart(2, '0')}`;
    this.objTitle.textContent = o.title;
    this.objStage.textContent = o.stage;
    this.objNext.textContent = `NEXT · ${o.next}`;
    this.objCharacter.textContent = o.character;

    this.responsePanel.classList.toggle('quiet', s.wanted === 0);
    this.responseRows.innerHTML = s.rows.length
      ? s.rows.map((r) => `<div class="response-row"><span class="unit-name">${r.name}</span><span class="unit-status">${r.status}</span><span class="unit-distance">${r.distance}m</span></div>`).join('')
      : '<div class="response-row empty">NO ACTIVE RESPONSE · CITY PATROL</div>';

    this.stars.textContent = '★'.repeat(s.wanted) + '☆'.repeat(5 - s.wanted);
    this.cash.textContent = money(s.cash);
    this.respect.textContent = String(s.respect);
    this.rank.textContent = rankForRespect(s.respect).name;

    this.weaponSlots.innerHTML = s.weapons.map((w) => `
      <div class="weapon-slot ${w.active ? 'active' : ''}" style="--slot-color:${w.color}">
        <b>${w.slot}</b><span>${w.name}</span><i>${w.ammo}</i>
      </div>`).join('');
    if (!this.crewCards.dataset.filled) {
      this.crewCards.dataset.filled = '1';
      this.crewCards.innerHTML = s.crew.map((c) => `
        <div class="crew-card" style="--crew-color:${c.color}"><span class="crew-initials">${c.initials}</span><span><strong>${c.name}</strong><small>${c.role}</small></span></div>`).join('');
    }

    this.subtitle.textContent = s.subtitle || '';
    this.subtitle.classList.toggle('hidden', !s.subtitle);
    this.speed.textContent = String(Math.round(s.speed));
    this.conditionFill.style.width = `${Math.max(0, Math.min(100, s.condition))}%`;
    this.conditionFill.style.background = s.condition > 55 ? '#6de3b0' : s.condition > 25 ? '#ffd36b' : '#ff6b6b';
    this.conditionText.textContent = s.inVehicle ? `VEHICLE ${Math.round(s.condition)}%` : `HEALTH ${Math.round(s.condition)}%`;
    this.vehicleName.textContent = s.vehicleName;
    this.radioStation.textContent = s.radio.name;
    this.radioTrack.textContent = `♪ ${s.radio.track}`;

    if (s.notice && s.notice !== this.lastToast) {
      this.toast.textContent = s.notice;
      this.lastToast = s.notice;
    }
    if (!s.notice) this.lastToast = '';
    this.toast.classList.toggle('hidden', !s.notice);

    this.racePanel.classList.toggle('hidden', !s.race.active);
    this.raceText.textContent = s.race.status;

    this.damageVignette.style.opacity = s.condition < 35 ? String((35 - s.condition) / 70) : '0';
    this.drawMinimap(s);
  }

  drawMinimap(s) {
    const ctx = this.mapContext;
    const size = this.minimap.width;
    const scale = size / (WORLD.halfExtent * 2);
    const toX = (x) => size / 2 + x * scale;
    const toY = (z) => size / 2 + z * scale;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, size, size);
    for (const d of DISTRICTS) {
      ctx.fillStyle = d.id === 'beach' ? '#5c5b45' : d.id === 'downtown' ? '#35404c' : d.id === 'harbour' ? '#3e5457' : '#4b3b52';
      ctx.fillRect(toX(d.bounds.minX), toY(d.bounds.minZ), (d.bounds.maxX - d.bounds.minX) * scale, (d.bounds.maxZ - d.bounds.minZ) * scale);
    }
    ctx.strokeStyle = '#89959d';
    ctx.lineWidth = 2;
    for (const line of WORLD.roadLines) {
      ctx.beginPath(); ctx.moveTo(0, toY(line)); ctx.lineTo(size, toY(line)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(toX(line), 0); ctx.lineTo(toX(line), size); ctx.stroke();
    }
    for (const gate of s.race.gates) {
      if (!s.race.active && !s.race.finished) continue;
      ctx.strokeStyle = '#ffd15c';
      ctx.strokeRect(toX(gate.x) - 4, toY(gate.z) - 4, 8, 8);
    }
    for (const blip of s.blips) {
      ctx.fillStyle = blip.hostile ? '#ff5a5a' : '#8fd7ff';
      ctx.beginPath(); ctx.arc(toX(blip.x), toY(blip.z), blip.hostile ? 3 : 2, 0, Math.PI * 2); ctx.fill();
    }
    const target = s.target;
    ctx.fillStyle = '#5ef2cf';
    ctx.beginPath();
    ctx.moveTo(toX(target.x), toY(target.z) - 6);
    ctx.lineTo(toX(target.x) + 6, toY(target.z));
    ctx.lineTo(toX(target.x), toY(target.z) + 6);
    ctx.lineTo(toX(target.x) - 6, toY(target.z));
    ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(toX(s.player.x), toY(s.player.z));
    ctx.rotate(-s.player.yaw);
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
