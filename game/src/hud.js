// Costa Vela HUD: objective, response panel, wanted stars, weapons, crew, minimap,
// subtitles, speed and radio, plus the start screen, garage and weapon wheel.

import { WORLD, VEHICLE_MODELS, WEAPONS, CREW, RADIO_STATIONS } from './config.js';
import { rankFor, nextRank } from './save.js';

const CSS = `
:root { --gold:#ffcf6b; --cyan:#7ce8ff; --red:#ff6a6a; --panel:rgba(12,18,28,.78); --edge:rgba(255,207,107,.45); }
* { box-sizing:border-box; }
html,body { margin:0; height:100%; overflow:hidden; background:#0c121c; font-family:'Arial Narrow','Segoe UI',Arial,sans-serif; color:#f4f1e8; user-select:none; }
#game { position:fixed; inset:0; width:100%; height:100%; display:block; touch-action:none; }
.panel { position:absolute; background:var(--panel); border:1px solid var(--edge); border-radius:4px; box-shadow:0 6px 24px rgba(0,0,0,.45); backdrop-filter:blur(3px); }
.lbl { font-size:10px; letter-spacing:2px; color:var(--gold); opacity:.85; text-transform:uppercase; }
.val { font-size:14px; letter-spacing:.5px; }
#objective { left:16px; top:16px; width:300px; padding:10px 12px; border-left:3px solid var(--gold); }
#obj-title { font-size:16px; font-weight:bold; letter-spacing:1px; color:var(--gold); margin:2px 0 6px; }
#obj-line { font-size:13px; margin:3px 0; }
#obj-next { font-size:11px; color:#bcd0dd; margin-top:6px; }
#obj-stage { float:right; font-size:11px; color:var(--cyan); }
#response { left:16px; top:152px; width:300px; padding:8px 12px; }
#response .row { display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,.07); }
#response .row .st { color:var(--red); letter-spacing:1px; }
#response .row .ds { color:#9fb3c0; }
#wanted { right:16px; top:16px; width:298px; padding:8px 12px; text-align:right; }
#stars { font-size:22px; letter-spacing:3px; color:var(--gold); height:26px; }
#cash { font-size:20px; font-weight:bold; color:#b6f0c0; }
#rankline { font-size:10px; letter-spacing:1.5px; color:#c9d6de; }
#weapons { right:16px; top:92px; width:186px; padding:8px 10px; }
.wslot { display:flex; align-items:center; gap:8px; font-size:11px; padding:3px 5px; margin:2px 0; border:1px solid transparent; border-radius:3px; }
.wslot .k { width:16px; height:16px; line-height:16px; text-align:center; background:rgba(255,255,255,.12); font-size:10px; border-radius:2px; }
.wslot.active { border-color:var(--gold); background:rgba(255,207,107,.14); color:var(--gold); }
#crew { right:16px; top:294px; width:226px; padding:8px 10px; }
.crewcard { display:flex; align-items:center; gap:8px; font-size:11px; padding:3px 0; }
.dot { width:9px; height:9px; border-radius:50%; }
#minimap-wrap { left:16px; bottom:16px; width:190px; height:190px; padding:5px; }
#minimap { display:block; width:180px; height:180px; }
#subtitle { left:50%; transform:translateX(-50%); bottom:20px; width:600px; min-height:44px; padding:8px 14px; text-align:center; font-size:14px; line-height:1.35; letter-spacing:.4px; }
#speedo { right:16px; bottom:16px; width:268px; padding:8px 12px; text-align:right; }
#speed { font-size:40px; font-weight:bold; line-height:1; color:#f7f4ec; }
#speed small { font-size:11px; color:#9fb3c0; letter-spacing:2px; }
#condbar { height:7px; background:rgba(255,255,255,.14); margin:5px 0 4px; border-radius:4px; overflow:hidden; }
#condfill { height:100%; width:100%; background:linear-gradient(90deg,#7ce8ff,#8ff0a8); }
#radio { font-size:11px; color:var(--cyan); letter-spacing:1px; }
#toast { position:absolute; left:50%; transform:translateX(-50%); top:22px; padding:8px 18px; background:rgba(16,24,34,.88); border:1px solid var(--gold); border-radius:3px; color:var(--gold); font-size:13px; letter-spacing:2px; display:none; }
#wheel { position:absolute; left:50%; top:50%; width:420px; height:420px; transform:translate(-50%,-50%) scale(.9); display:none; pointer-events:none; }
#wheel .hub { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:88px; height:88px; border:2px solid var(--gold); border-radius:50%; background:rgba(10,16,24,.92); text-align:center; line-height:84px; font-size:12px; letter-spacing:1px; color:var(--gold); }
#wheel .ws { position:absolute; width:92px; height:46px; margin:-23px 0 0 -46px; background:rgba(12,20,30,.92); border:1px solid rgba(255,255,255,.25); border-radius:4px; text-align:center; padding-top:6px; font-size:11px; letter-spacing:1px; }
#wheel .ws.active { border-color:var(--gold); color:var(--gold); box-shadow:0 0 18px rgba(255,207,107,.4); }
#wheel .ws .num { font-size:9px; opacity:.65; }
.overlay { position:absolute; inset:0; display:none; align-items:center; justify-content:center; background:radial-gradient(ellipse at center,rgba(12,18,28,.55),rgba(6,10,16,.94)); z-index:20; }
.card { width:760px; max-width:94vw; max-height:92vh; overflow:auto; background:rgba(11,17,26,.96); border:1px solid var(--edge); border-radius:6px; padding:26px 32px; box-shadow:0 20px 70px rgba(0,0,0,.7); }
#start-card { width:640px; text-align:center; }
#game-title { font-size:56px; letter-spacing:10px; color:var(--gold); text-shadow:0 4px 30px rgba(255,160,60,.35); margin:6px 0 0; }
#game-sub { font-size:13px; letter-spacing:4px; color:var(--cyan); margin-bottom:22px; }
.btn { display:inline-block; min-width:180px; margin:6px; padding:12px 18px; background:rgba(255,207,107,.12); border:1px solid var(--gold); color:var(--gold); font-size:13px; letter-spacing:2px; cursor:pointer; border-radius:3px; }
.btn:hover { background:rgba(255,207,107,.28); }
.btn.small { min-width:110px; padding:8px 12px; font-size:11px; }
#controls { font-size:11px; color:#9fb3c0; line-height:1.7; margin-top:18px; letter-spacing:.5px; }
#garage-card h2 { color:var(--gold); letter-spacing:4px; margin:0 0 4px; font-size:24px; }
.ghead { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid var(--edge); padding-bottom:8px; margin-bottom:14px; }
.cols { display:flex; gap:20px; }
.col { flex:1; }
.col h3 { font-size:12px; letter-spacing:2px; color:var(--cyan); margin:0 0 8px; }
.vrow { display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:6px 8px; margin:3px 0; border:1px solid rgba(255,255,255,.1); border-radius:3px; cursor:pointer; }
.vrow:hover { background:rgba(255,255,255,.06); }
.vrow.owned { color:#9ff0b4; }
.vrow.active { border-color:var(--gold); color:var(--gold); }
.uprow { display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.07); }
.progline { font-size:12px; margin:6px 0; }
.bar { height:8px; background:rgba(255,255,255,.12); border-radius:5px; overflow:hidden; margin:4px 0 10px; }
.bar > div { height:100%; background:linear-gradient(90deg,var(--gold),#ff9a4a); }
`;

export class Hud {
  constructor(root) {
    this.root = root;
    this.wheelOpen = false;
    this.style = document.createElement('style');
    this.style.textContent = CSS;
    document.head.appendChild(this.style);
    this.el = {};
    this.build();
    this.wheelItems = [];
    this.buildWheel();
  }

  panel(id, cls = '') {
    const el = document.createElement('div');
    el.id = id;
    el.className = `panel ${cls}`.trim();
    this.root.appendChild(el);
    this.el[id] = el;
    return el;
  }

  build() {
    const objective = this.panel('objective');
    objective.innerHTML = `<div class="lbl">CURRENT JOB <span id="obj-stage"></span></div><div id="obj-title"></div><div id="obj-line"></div><div id="obj-next"></div>`;
    const response = this.panel('response');
    response.innerHTML = `<div class="lbl">POLICE RESPONSE</div><div id="response-rows"></div>`;
    const wanted = this.panel('wanted');
    wanted.innerHTML = `<div id="stars"></div><div id="cash"></div><div id="rankline"></div>`;
    const weapons = this.panel('weapons');
    weapons.innerHTML = `<div class="lbl">WEAPONS</div><div id="weapon-slots"></div>`;
    const crew = this.panel('crew');
    crew.innerHTML = `<div class="lbl">CREW</div><div id="crew-cards"></div>`;
    const mapWrap = this.panel('minimap-wrap');
    mapWrap.innerHTML = `<canvas id="minimap" width="180" height="180"></canvas>`;
    const subtitle = this.panel('subtitle');
    subtitle.innerHTML = `<span id="subtitle-text"></span>`;
    const speedo = this.panel('speedo');
    speedo.innerHTML = `<div id="speed">0 <small>KM/H</small></div><div id="condbar"><div id="condfill"></div></div><div id="radio"></div>`;
    const toast = document.createElement('div');
    toast.id = 'toast';
    this.root.appendChild(toast);
    this.el.toast = toast;

    this.el['obj-stage'] = objective.querySelector('#obj-stage');
    this.el['obj-title'] = objective.querySelector('#obj-title');
    this.el['obj-line'] = objective.querySelector('#obj-line');
    this.el['obj-next'] = objective.querySelector('#obj-next');
    this.el['response-rows'] = response.querySelector('#response-rows');
    this.el.stars = wanted.querySelector('#stars');
    this.el.cash = wanted.querySelector('#cash');
    this.el.rankline = wanted.querySelector('#rankline');
    this.el['weapon-slots'] = weapons.querySelector('#weapon-slots');
    this.el['crew-cards'] = crew.querySelector('#crew-cards');
    this.canvas = mapWrap.querySelector('#minimap');
    this.ctx = this.canvas.getContext('2d');
    this.el['subtitle-text'] = subtitle.querySelector('#subtitle-text');
    this.el.speed = speedo.querySelector('#speed');
    this.el.condfill = speedo.querySelector('#condfill');
    this.el.radio = speedo.querySelector('#radio');

    this.el['weapon-slots'].innerHTML = WEAPONS.map((w) =>
      `<div class="wslot" data-slot="${w.slot}"><span class="k">${w.slot}</span><span>${w.name}</span></div>`).join('');
    this.el['crew-cards'].innerHTML = CREW.map((c) =>
      `<div class="crewcard"><span class="dot" style="background:${c.color}"></span><b>${c.name}</b><span style="opacity:.65">${c.role}</span><span style="margin-left:auto;color:#8ff0a8">READY</span></div>`).join('');
  }

  buildWheel() {
    const wheel = document.createElement('div');
    wheel.id = 'wheel';
    const hub = document.createElement('div');
    hub.className = 'hub';
    hub.textContent = 'COSTA VELA';
    wheel.appendChild(hub);
    const angles = [-90, -30, 30, 90, 150, 210];
    WEAPONS.forEach((w, i) => {
      const item = document.createElement('div');
      item.className = 'ws';
      const a = angles[i] * Math.PI / 180;
      item.style.left = `${210 + Math.cos(a) * 150}px`;
      item.style.top = `${210 + Math.sin(a) * 150}px`;
      item.innerHTML = `<div class="num">${w.slot} · ${w.short}</div><div>${w.name}</div>`;
      wheel.appendChild(item);
      this.wheelItems.push(item);
    });
    this.root.appendChild(wheel);
    this.el.wheel = wheel;
  }

  setWheel(open, slot) {
    this.el.wheel.style.display = open ? 'block' : 'none';
    this.wheelItems.forEach((item, i) => item.classList.toggle('active', i + 1 === slot));
  }

  update(state) {
    const { mission, police, progress, player, radio, vehicle } = state;
    const job = mission.current() ?? {};
    this.el['obj-stage'].textContent = mission.stage();
    this.el['obj-title'].textContent = job.title ?? '';
    this.el['obj-line'].textContent = job.objective ?? '';
    this.el['obj-next'].textContent = `NEXT: ${job.next ?? ''}`;

    const rows = police.responseRows(player);
    this.el['response-rows'].innerHTML = rows.length
      ? rows.map((r) => `<div class="row"><span>${r.name}</span><span class="st">${r.status}</span><span class="ds">${r.distance}m</span></div>`).join('')
      : `<div class="row"><span style="opacity:.6">NO ACTIVE RESPONSE</span><span class="st">CLEAR</span><span class="ds">--</span></div>`;

    this.el.stars.textContent = '★'.repeat(police.wanted) + '☆'.repeat(5 - police.wanted);
    this.el.stars.style.opacity = police.wanted ? 1 : 0.45;
    this.el.cash.textContent = `$${progress.cash.toLocaleString()}`;
    this.el.rankline.textContent = rankFor(progress.respect).name;

    for (const slot of this.el['weapon-slots'].children) {
      slot.classList.toggle('active', Number(slot.dataset.slot) === state.weaponSlot);
    }

    this.el['subtitle-text'].textContent = mission.dialogueTimer > 0 && mission.dialogue ? mission.dialogue : '';
    this.el.subtitle.style.opacity = mission.dialogueTimer > 0 ? 1 : 0;

    const speedKmh = Math.round(Math.abs(player.speed ?? 0) * 3.2);
    this.el.speed.innerHTML = `${speedKmh} <small>KM/H</small>`;
    const cond = 100 - (vehicle?.damage ?? 0);
    this.el.condfill.style.width = `${cond}%`;
    this.el.condfill.style.background = cond > 55 ? 'linear-gradient(90deg,#7ce8ff,#8ff0a8)' : cond > 25 ? 'linear-gradient(90deg,#ffcf6b,#ff9a4a)' : 'linear-gradient(90deg,#ff6a6a,#ff3a3a)';
    this.el.radio.textContent = `${radio.station}  ♫  ${radio.track}`;

    if (mission.toastTimer > 0) {
      this.el.toast.textContent = mission.toast;
      this.el.toast.style.display = 'block';
    } else this.el.toast.style.display = 'none';
  }

  drawMinimap(state) {
    const ctx = this.ctx;
    const size = 180;
    const scale = size / 700;
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#1d2730';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = WORLD.roadWidth * scale;
    for (let i = WORLD.gridMin; i <= WORLD.gridMax; i++) {
      const c = i * WORLD.gridStep * scale;
      ctx.beginPath(); ctx.moveTo(cx + c, 0); ctx.lineTo(cx + c, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + c); ctx.lineTo(size, cy + c); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(124,232,255,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 46 * scale, cy); ctx.lineTo(cx + 46 * scale, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 46 * scale); ctx.lineTo(cx, cy + 46 * scale); ctx.stroke();

    const put = (x, z, color, r) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx + x * scale, cy + z * scale, r, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const car of state.traffic) put(car.x, car.z, 'rgba(210,218,224,.55)', 2);
    for (const unit of state.police.units) {
      if (unit.type === 'HELI') continue;
      put(unit.x, unit.z, unit.type === 'ROADBLOCK' ? '#ffcf6b' : '#ff5b5b', unit.type === 'ROADBLOCK' ? 4 : 3);
    }
    const waypoint = state.markerPosition;
    if (waypoint) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(cx + waypoint[0] * scale, cy + waypoint[1] * scale, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-(state.player.heading ?? 0));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  showStart(hasSave, handlers) {
    const o = document.createElement('div');
    o.id = 'start-overlay';
    o.className = 'overlay';
    o.style.display = 'flex';
    o.innerHTML = `<div class="card" id="start-card">
      <div class="lbl">MAKE.FUN · GTA6-01 ENTRY</div>
      <div id="game-title">COSTA VELA</div>
      <div id="game-sub">SUN, SALT &amp; SIX STARS</div>
      <div>
        <button class="btn" id="btn-new">NEW GAME</button>
        ${hasSave ? '<button class="btn" id="btn-continue">CONTINUE SAVED GAME</button>' : ''}
      </div>
      <div id="controls">WASD DRIVE / WALK &nbsp;·&nbsp; SPACE HANDBRAKE &nbsp;·&nbsp; E ENTER OR EXIT VEHICLE<br>
      MOUSE DRAG OR ARROWS ORBIT CAMERA &nbsp;·&nbsp; 1-6 SWITCH WEAPON &nbsp;·&nbsp; CLICK FIRE<br>
      Q WEAPON WHEEL &nbsp;·&nbsp; G GARAGE &nbsp;·&nbsp; R RADIO &nbsp;·&nbsp; H HORN / ATTRACT</div>
    </div>`;
    this.root.appendChild(o);
    this.el.startOverlay = o;
    o.querySelector('#btn-new').onclick = () => { this.hideStart(); handlers.onNew(); };
    const cont = o.querySelector('#btn-continue');
    if (cont) cont.onclick = () => { this.hideStart(); handlers.onContinue(); };
  }

  hideStart() {
    if (this.el.startOverlay) { this.el.startOverlay.remove(); this.el.startOverlay = null; }
  }

  showGarage(progress, handlers) {
    this.garageHandlers = handlers;
    const rank = rankFor(progress.respect);
    const next = nextRank(progress.respect);
    const o = document.createElement('div');
    o.id = 'garage-overlay';
    o.className = 'overlay';
    o.style.display = 'flex';
    const vehicles = VEHICLE_MODELS.map((v, i) => {
      const owned = progress.ownedVehicles.includes(i);
      return `<div class="vrow ${owned ? 'owned' : ''}" data-vehicle="${i}"><span>${String(i + 1).padStart(2, '0')} · ${v.name}</span><span>${owned ? (i === progress.activeVehicle ? 'IN USE' : 'OWNED') : '$' + (1800 + i * 220)}</span></div>`;
    }).join('');
    const upgrades = ['engine', 'armour', 'brakes'].map((k) =>
      `<div class="uprow"><span>${k.toUpperCase()} · LV ${progress.upgrades[k]}/3</span><button class="btn small" data-upgrade="${k}">UPGRADE $900</button></div>`).join('');
    o.innerHTML = `<div class="card" id="garage-card">
      <div class="ghead"><div><h2>THE GARAGE</h2><div class="lbl">COSTA VELA MOTOR WORKS</div></div><div><div class="lbl">CASH</div><div style="font-size:22px;color:#b6f0c0">$${progress.cash.toLocaleString()}</div></div></div>
      <div class="cols">
        <div class="col"><h3>VEHICLE ROSTER</h3>${vehicles}</div>
        <div class="col"><h3>UPGRADES</h3>${upgrades}
          <h3 style="margin-top:18px">RESPECT</h3>
          <div class="progline">${rank.name} · ${progress.respect} RESPECT</div>
          <div class="bar"><div style="width:${next ? Math.min(100, (progress.respect - rank.min) / (next.min - rank.min) * 100) : 100}%"></div></div>
          <div class="progline" style="opacity:.7">${next ? `NEXT: ${next.name} AT ${next.min}` : 'MAX RANK REACHED'}</div>
          <h3 style="margin-top:18px">RADIO</h3>
          <div class="vrow" data-station="1"><span>STATION</span><span>${RADIO_STATIONS[progress.radioStation].name}</span></div>
          <button class="btn small" id="btn-save" style="margin-top:16px">SAVE GAME</button>
          <button class="btn small" id="btn-close">CLOSE</button>
        </div>
      </div>
    </div>`;
    this.root.appendChild(o);
    this.el.garageOverlay = o;
    o.querySelectorAll('[data-vehicle]').forEach((row) => {
      row.onclick = () => handlers.onVehicle(Number(row.dataset.vehicle));
    });
    o.querySelectorAll('[data-upgrade]').forEach((b) => {
      b.onclick = () => handlers.onUpgrade(b.dataset.upgrade);
    });
    o.querySelector('[data-station]').onclick = () => handlers.onStation();
    o.querySelector('#btn-save').onclick = () => handlers.onSave();
    o.querySelector('#btn-close').onclick = () => this.hideGarage();
  }

  refreshGarage(progress) {
    if (this.el.garageOverlay) {
      this.hideGarage();
      this.showGarage(progress, this.garageHandlers);
    }
  }

  hideGarage() {
    if (this.el.garageOverlay) { this.el.garageOverlay.remove(); this.el.garageOverlay = null; }
  }

  setHudVisible(visible) {
    const ids = ['objective', 'response', 'wanted', 'weapons', 'crew', 'minimap-wrap', 'subtitle', 'speedo'];
    for (const id of ids) this.el[id].style.display = visible ? '' : 'none';
  }
}
