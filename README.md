# Costa Vela

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/Winter075/costa-vela/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard)
[![reward](https://make.fun/badge/gta6-01/Winter075/costa-vela/reward.svg)](https://make.fun/bounty/gta6-01)

Costa Vela is an original open-world crime game that runs offline from static files. It uses vendored three.js, has no build step, and makes no network request while it plays.

## Where you go

Four districts share one connected map. Mirador Beach Boulevard runs along the sand, Halcyon Downtown stacks the tall offices, Tern Harbour holds the containers and cranes, and the Velvet Nightlife Strip lights up the west side. Roads have lanes, sidewalks, lamps and parked cars, and the sun sits low over the water. Time spent in a district builds local standing, shown on the HUD beside the mission.

## What you do

Steal any car on the street and drive it, or stay on foot and move through the crowd. Eight jobs chain together, from a sunrise handshake on the boulevard to a five-star finale downtown. A three-gate street race waits on the causeway as a side activity. Wanted level brings Bluebird cruisers first, then a RAM plow, roadblocks, a spotlight helicopter and SWAT. The response board names each unit and shows its status and distance. Weapons, cash, respect ranks, crew perks, garage upgrades and browser saves give the long game somewhere to go.

## Run it

```
node serve.ts
```

Open http://localhost:8080 in a desktop browser. The page itself is `game/index.html`.

## Controls

| Key | Action |
| --- | --- |
| W A S D | Drive or walk |
| Space | Handbrake |
| E | Enter or exit a vehicle |
| Mouse drag, arrow keys | Orbit the chase camera |
| 1 to 6 | Switch weapons |
| Click | Fire |
| Tab | Weapon wheel |
| G | Tern Garage |
| R | Change radio station |
| M | Mute |
| Z X C V | Crew perks, each with its own cooldown |

## Source layout

`index.html` owns the canvas and the HUD. Each module in `game/src` has one job: `world` builds the city, `vehicles` and `traffic` move cars and pedestrians, `police` runs the response, `missions` tells the story, `combat`, `audio`, `hud` and `input` handle presentation and control, `standing` tracks district reputation, and `main` ties the systems together.

Entered on [make.fun](https://make.fun/bounty/gta6-01), where people build software for cash rewards. The [bounty page](https://make.fun/bounty/gta6-01) carries the live board.
