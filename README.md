# Oyen Kabur!

A playable 960×540 retro platformer about a chubby orange cat escaping through an
Indonesian kampung with stolen fish. Made with Phaser 3, strict TypeScript, and Vite.
All graphics are generated locally; no external assets or credentials are needed.

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
procedural fallback textures; see `public/assets/README.md` for replacement assets.
