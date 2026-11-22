// The overlay: objective, dispatch board, wanted panel, weapons, crew, minimap and menus.

import { CITY, CREW, WEAPONS, RADIO, VEHICLES, UPGRADES } from './config.js';
import { rankFor, nextRank, upgradeCost } from './save.js';

const el = (id) => document.getElementById(id);
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

export class HUD {
  constructor() {
    this.objective = el('objective');
    this.missionCount = el('missionCount');
    this.missionTitle = el('missionTitle');
    this.missionTask = el('missionTask');
    this.missionNext = el('missionNext');
    this.response = el('responseRows');
    this.stars = el('stars');
    this.cash = el('cash');
    this.rank = el('rank');
    this.weapons = el('weapons');
    this.crew = el('crew');
    this.subtitle = el('subtitle');
    this.speed = el('speedValue');
    this.health = el('healthFill');
    this.radio = el('radio');
    this.wheel = el('wheel');
    this.garage = el('garage');
    this.start = el('start');
    this.flashLayer = el('flash');
    this.map = el('mapCanvas').getContext('2d');
    this.subtitleTimer = 0;

    this.weapons.innerHTML = '<div class="eyebrow" style="margin-bottom:4px">Weapons</div>' +
      WEAPONS.map((w, i) => `<div class="slot" data-slot="${i}"><span class="num">${i + 1}</span><span>${w.name}</span></div>`).join('');
    this.crew.innerHTML = '<div class="eyebrow" style="margin-bottom:4px">Crew</div>' +
      CREW.map((c) => `<div class="row"><span class="dot" style="background:${c.color}"></span><span class="name">${c.name}</span><span class="role">${c.role}</span><span class="state">READY</span></div>`).join('');
    this.wheel.innerHTML += WEAPONS.map((w, i) => {
      const pos = [[150, 92], [224, 122], [250, 200], [224, 270], [148, 292], [72, 238]][i];
      return `<div class="ring" data-wheel="${i}" style="left:${pos[0]}px;top:${pos[1]}px">${i + 1} ${w.name}</div>`;
    }).join('');
  }

  refreshObjective(m, index = 0) {
    this.missionCount.textContent = `${String(index + 1).padStart(2, '0')} / 08`;
    this.missionTitle.textContent = m.title;
    this.missionTask.textContent = m.task;
    this.missionNext.textContent = m.next;
  }

  say(who, line, seconds = 5) {
    this.subtitle.innerHTML = `<span class="gold">${who}:</span> ${line}`;
    this.subtitleTimer = seconds;
  }

  tickSubtitle(dt) {
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) this.subtitle.innerHTML = '';
    }
  }

  flash() {
    this.flashLayer.style.opacity = '1';
    setTimeout(() => { this.flashLayer.style.opacity = '0'; }, 100);
  }

  update(s) {
    this.stars.innerHTML = [0, 1, 2, 3, 4].map((i) => `<span class="${i < s.stars ? 'on' : ''}">&#9733;</span>`).join('');
    this.cash.textContent = money(s.cash);
    this.rank.textContent = s.rank;
    this.response.innerHTML = s.response.length
      ? s.response.map((r) => `<div class="row ${r.active ? '' : 'calm'}"><span class="unit">${r.name}</span><span class="status">${r.status}</span><span class="dist">${r.dist}m</span></div>`).join('')
      : '<div class="row calm"><span class="unit">NO ACTIVE RESPONSE</span><span class="status">CLEAR</span><span class="dist">--</span></div>';
    this.speed.innerHTML = `${Math.round(s.speed)}<small>KM/H</small>`;
    this.health.style.width = `${Math.max(0, 100 - s.damage)}%`;
    this.health.style.background = s.damage > 60 ? '#e46d5c' : '#6fd7a7';
    this.radio.textContent = s.radio;
    for (let i = 0; i < WEAPONS.length; i++) {
      this.weapons.children[i + 1].className = i === s.weaponIndex ? 'slot active' : 'slot';
      const ring = this.wheel.querySelector(`[data-wheel="${i}"]`);
      if (ring) ring.className = i === s.weaponIndex ? 'ring on' : 'ring';
    }
    this.wheel.className = s.wheelOpen ? 'open on' : '';
  }

  drawMap(pos, heading, units, marker) {
    const c = this.map;
    const k = 200 / (CITY.limit * 2);
    const px = (x) => (x + CITY.limit) * k;
    c.clearRect(0, 0, 200, 200);
    c.fillStyle = '#16222f';
    c.fillRect(0, 0, 200, 200);
    c.strokeStyle = 'rgba(140,175,200,.20)';
    c.lineWidth = 7;
    for (const g of CITY.grid) {
      c.beginPath(); c.moveTo(px(g), 0); c.lineTo(px(g), 200); c.stroke();
      c.beginPath(); c.moveTo(0, px(g)); c.lineTo(200, px(g)); c.stroke();
    }
    c.strokeStyle = 'rgba(190,215,235,.12)';
    c.lineWidth = 1;
    for (let i = 0; i <= 200; i += 25) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 200); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(200, i); c.stroke();
    }
    if (marker) {
      c.fillStyle = '#f2c14e';
      c.beginPath(); c.arc(px(marker.x), px(marker.z), 3.5, 0, Math.PI * 2); c.fill();
    }
    for (const u of units) {
      c.fillStyle = u.kind === 'heli' ? '#ffd76a' : '#e05a54';
      c.fillRect(px(u.pos.x) - 2, px(u.pos.z) - 2, 4, 4);
    }
    c.save();
    c.translate(px(pos.x), px(pos.z));
    c.rotate(-heading);
    c.fillStyle = '#f4f7fb';
    c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 6); c.lineTo(0, 3); c.lineTo(-5, 6); c.closePath(); c.fill();
    c.restore();
  }

  showGarage(data, handlers) {
    const roster = el('roster');
    roster.innerHTML = VEHICLES.slice(0, 12).map((v, i) =>
      `<div><span>${String(i + 1).padStart(2, '0')}- ${v.name}</span><span>${i < data.owned ? 'OWNED' : money(340 + i * 20)}</span></div>`).join('');
    el('upgradeList').innerHTML = UPGRADES.map((u) =>
      `<div><span>${u.label} : LV ${data.upgrades[u.key]}/3</span><span>${data.upgrades[u.key] >= 3 ? 'MAX' : money(upgradeCost(data.upgrades[u.key], u.base))}</span></div>`).join('');
    const nr = nextRank(data.respect);
    el('respectText').innerHTML = `${rankFor(data.respect)} &middot; ${data.respect} RESPECT<br>NEXT: ${nr ? `${nr.name} AT ${nr.at}` : 'TOP RANK REACHED'}`;
    el('radioList').innerHTML = `<div><span>STATION</span><span>&nbsp;&nbsp;${RADIO[data.radio % RADIO.length]}</span></div>`;
    el('garageCash').textContent = money(data.cash);
    this.garage.classList.add('open');
    el('saveBtn').onclick = handlers.save;
    el('closeGarage').onclick = handlers.close;
  }

  hideGarage() { this.garage.classList.remove('open'); }

  showStart(hasSave, handlers) {
    this.start.classList.remove('hidden');
    el('continueGame').style.display = hasSave ? '' : 'none';
    el('newGame').onclick = handlers.start;
    el('continueGame').onclick = handlers.continue;
  }

  hideStart() { this.start.classList.add('hidden'); }
}
