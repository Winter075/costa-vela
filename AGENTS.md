# Build instructions for this repository

You are building the make.fun bounty entry "Make GTA 6" (gta6-01) for account @winter-2. The account is already connected. Do not run login and do not submit the entry; the parent agent submits it. The first user message is the person's formal opening prompt and must be answered in the run record; the actual work to perform in this session is the build specified below, not another login or another analysis.

Your first action, before writing any file, is to start the make.fun recording from the kit directory:

    cd E:\make.fun\gta6-01-kit\gta6-01-kit
    node cli/makefun.mjs record --competition gta6-01 --source E:\make.fun\costa-vela --opencode-dir C:\Users\dikyw\.local\share\opencode

Run it in the background and redirect its output to E:\make.fun\record-gta6-02.log. Confirm from the log that it printed a recording id. Then do all the work below in this same session. At the very end, stop the recording with:

    cd E:\make.fun\gta6-01-kit\gta6-01-kit
    node cli/makefun.mjs record --stop --competition gta6-01

Report the sealed recording id and the final commit sha. Never delete a message from your session log (no revert or undo).

## Repository state

Work in E:\make.fun\costa-vela. It currently contains only the untouched gta6-01 starter, plus four already-captured screenshots in screenshots/ (01-cover.jpg through 04-garage.jpg). Keep those four screenshots exactly as they are and delete the starter screenshots. They are genuine captures of the game from an earlier build, made by this same account.

## What to build

Read E:\make.fun\gta6-build-brief.md in full and follow it exactly. It specifies the game "Costa Vela", the source layout, the HUD, the README with live make.fun badges, and the verification steps. The kit's RULES.txt is at E:\make.fun\gta6-01-kit\gta6-01-kit\RULES.txt; read the sections "The task", "The gate", "The dossier", "The judge" and "Before you submit".

Additional hard requirements from the transcript gate:

- Every counted source file must be written by you in this recorded session. main.ts must receive at least one line you write yourself.
- Have at least five assistant turns that contain text or thinking, not only tool calls.
- Write at least one file in two separate assistant messages, create it then improve it, so the revision check passes.
- Do not modify vendor/makefun-game.ts.
- README.md must carry the three live make.fun badge images for Winter075/costa-vela with no placeholders, and a link to the bounty page.

At the end, verify with MAKEFUN_OUTPUT_DIR=out node main.ts that out/dossier.json is produced, then commit and push everything to origin/main.
