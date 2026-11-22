# costa-vela

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Winter075/costa-vela/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Winter075/costa-vela/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Costa Vela is an original 3D open-world crime game that runs entirely from static files in a desktop browser. Drive or walk through a coastal city with four distinct districts, steal one of twelve cars, outrun a wanted level that escalates from patrol cruisers to a helicopter spotlight, roadblock and SWAT unit, work through eight story missions and a street race, and spend your cash on garage upgrades. It has a full HUD with a canvas minimap, procedural WebAudio engine, siren, shots and radio, and it saves your progress to localStorage.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. WASD drives or walks, Space is the handbrake, E enters or exits a vehicle, mouse drag or the arrow keys orbit the camera, 1-6 switch weapons, click fires, Q opens the weapon wheel, G opens the garage, R changes the radio station.

The game loads no network resources. `three.js` is vendored as `game/vendor/three.min.js` and the import map in `game/index.html` maps the bare specifier `three` to it.

## Build the entry locally

```sh
New-Item -ItemType Directory -Force out
$env:MAKEFUN_OUTPUT_DIR = "out"
node main.ts
```

This writes `out/game`, `out/screenshots` and `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
