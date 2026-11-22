# Build instructions for this repository

You are building the make.fun bounty entry "Make GTA 6" (gta6-01) for account @winter-2. The account is already connected, and a make.fun recording of this session is already running. Do not run login, do not start or stop any recording, and do not submit the entry. The parent agent submits it.

The first user message is the person's formal opening prompt and must be answered in the run record. The actual work to perform in this session is the build specified below, not another login or another analysis. Work in the current repository directory.

## Repository state

The repository currently contains only the untouched gta6-01 starter, plus four already-captured screenshots in screenshots/ (01-cover.jpg through 04-garage.jpg). Keep those four screenshots byte-for-byte as they are and delete the starter screenshots. They are genuine captures of the game from an earlier build made by this same account.

## What to build

Read E:\make.fun\gta6-build-brief.md in full and follow it exactly. It specifies the game "Costa Vela", the source layout, the HUD, the README with live make.fun badges, and the verification steps. The kit's RULES.txt is at E:\make.fun\gta6-01-kit\gta6-01-kit\RULES.txt; read "The task", "The gate", "The dossier", "The judge" and "Before you submit".

Hard requirements from the transcript gate:

- Write every counted source file yourself in this session. Give main.ts at least one line you write yourself.
- Have at least five assistant turns that contain text or thinking, not only tool calls.
- Write at least one file in two separate assistant messages, create it then improve it, so the revision check passes.
- Do not modify vendor/makefun-game.ts.
- README.md must carry the three live make.fun badge images for Winter075/costa-vela with no placeholders, and a link to the bounty page.
- Never delete or rewrite a message in your own session log (no revert or undo).

At the end, verify with MAKEFUN_OUTPUT_DIR=out node main.ts that out/dossier.json is produced, then commit and push everything to origin/main. Report the full commit sha.
