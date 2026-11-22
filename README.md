# costa-vela

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Winter075/costa-vela/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Winter075/costa-vela/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Costa Vela is a 3D open-world crime game that runs from static files in a desktop browser. Drive or walk through a coastal city with four districts, steal cars from traffic, take jobs from Mara, Teo and Vex, and deal with a wanted level that climbs from cruisers to a helicopter, roadblocks and SWAT. Eight missions, a street race, six weapons, a garage with upgrades, cash, respect ranks and local saves are all in the build. The HUD shows the current job, police response, wanted stars, weapons, crew, a minimap, dialogue and the radio station in one frame.

Everything is original to this project: the city, the characters, the vehicles, the dialogue and the sound. three.js is vendored under game/vendor, and the page makes no network request at runtime.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. WASD moves or drives, Space is the handbrake, E enters and leaves a car, keys 1 to 6 switch weapons, Q opens the weapon wheel, G opens the garage, and mouse drag or the arrow keys orbit the camera. Add `?shot=1` through `?shot=4` to the URL to replay the four screenshot setups.

The entrypoint is `main.ts`. It copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with the kit's library:

```sh
New-Item -ItemType Directory -Force out
$env:MAKEFUN_OUTPUT_DIR = 'out'
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=tamdp7j6&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
