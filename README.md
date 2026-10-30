# Oyen Kabur!

A playable 960×540 retro platformer about a chubby orange cat escaping through an
Indonesian kampung with stolen fish. Made with Phaser 3, strict TypeScript, and Vite.
Graphics are processed from the supplied concept sheets; no remote assets or credentials are needed.

## Develop

Requires Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm install
npm run dev
```

Open the address printed by Vite. The canvas fits the window while preserving its
16:9 aspect ratio and crisp pixel rendering. Desktop keyboard required.
If your environment has an unwritable npm home cache, use
`npm install --cache /workspace/.npm-cache`.

## Play

- Enter or click **Mulai / Start** to begin.
- A/D or left/right arrows move; Space or up arrow jumps. Release and press again
  for each jump.
- Collect fish for **10 points each**. Rooftops form a reachable bonus route;
  the ground route is also traversable by jumping across drainage gaps.
- Avoid flying sandals. You have three lives and 1.5 seconds of protection after
  damage. Falling returns you to your most recent safe ground position.
- Reach the **pos ronda** at the far right to win. Fish are optional.
- R restarts immediately; Escape returns to the menu. On result screens, Enter
  or R plays again.

## Validate and ship

```sh
npm run build     # strict type check and production bundle in dist/
npm test          # state and level reachability tests
npm run test:browser # Chromium integration checks; requires Chromium installed
npm run preview   # serve the production build
```

The browser checks use `/usr/bin/chromium` by default; override with
`CHROMIUM_PATH`. They start and stop their own Vite server on port 4178 and exercise
movement, jumping, fish collection, damage cooldown, defeat, restart, and victory.
Production hosting can serve `dist/` as static files, including under a subpath.

## Project map

`src/scenes/` contains menu, gameplay and result scenes. `src/level.ts` defines
platforms, physics constants, fish, sandal patrols and run state. The camera follows
Oyen across a 3600-pixel village with layered parallax scenery. Arcade physics
handles platforms and overlaps. `src/assets/pipeline.ts` provides a manifest and
reviewed concept-sheet extraction; see `public/assets/README.md` for replacement assets.

Asset regeneration and manual-review limitations are documented in `public/assets/README.md`. Run `python3 scripts/process_assets.py` after editing reviewed source regions.

## v0.2 manual playtest

- Walk off a roof and press jump immediately (100 ms grace); press jump just before landing (120 ms buffer).
- Compare a quick tap with a held Space/Up jump. Check acceleration, reversal, and stopping near edges.
- Land repeatedly: feet should remain aligned and collisions should stay consistent.
- Collect fish: check sparkle bursts, +10 text, and score. Take a sandal hit: check brief flash, knockback and 1.5-second protection.
- Reach the next ground section: check checkpoint notice; fall and confirm recovery at its safe starting point.
- Escape pauses/resumes; verify enemies and player remain still. R restarts even while paused.
- Finish or lose, check BEST score, then reload. With browser storage blocked, gameplay should still work with a session-only record.
- Enable OS reduced-motion preference: hit camera shake should be disabled.

During gameplay Escape now pauses instead of returning to the menu. Result screens retain Escape-to-menu.
