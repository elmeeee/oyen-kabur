# Oyen Kabur production plan

## Audited baseline

Starting commit: d25d745. Phaser 3.90, strict TypeScript, Vite. Five World 1 JSON
levels exist, plus one survival boss. Worlds 2–5 are unavailable registry entries.
Working systems: movement grace/buffering, variable jump, checkpoints, pause,
progression, version-2 saves with version-1 migration, shop, cosmetic overlays,
three achievements, menus, processed concept art, browser smoke test.

Artwork: four raw sheets, 15 processed outputs, Pillow extraction script,
manifest and contact sheets. These are preserved. Cosmetic geometry is temporary.
Kampung tiles are reviewed interior bands with visible seams, not a final 32px
production tileset. No original audio or settings screen exists yet.

## Ordered delivery checklist

- [x] Inspect actual baseline and preserve existing content.
- [x] Establish asset validation and campaign geometry regression checks.
- [x] Correct World 1 finish placement where the goal falls in a gap.
- [x] Use production world names while preserving IDs and save keys.
- [ ] World 1: true chase mechanic, explicit boss state machine and final art.
- [ ] World 2: slippery ground, projectiles, moving carts, vertical nets, three-phase Juragan Lele.
- [ ] World 3: bamboo platforms, swinging bridges, water currents, monkeys, Monyet Sultan.
- [ ] World 4: docks, moving ships, wind/rain, cranes/cargo, Kapten Bebek.
- [ ] World 5: guards, traps, vertical tower, gauntlet, multi-phase Raja Kucing Hitam.
- [ ] Fifteen achievements, settings/audio controls and original SFX.
- [ ] Five-world art generation, metadata, contact sheets, integration and validation.
- [ ] Full 25-level browser transition/completion/replay and reload coverage.
- [ ] Human playtest pass across every critical jump and boss recovery window.

## Production contracts

Keep IDs w1-l1 through w5-l5 stable. Register worlds only as available when their
five levels, assets and mechanics pass validation. Level files must specify clear
spawn, finish, checkpoints, mechanic parameters and explicit boss definitions.
Introduce optional schema fields with defaults for existing levels rather than
rewriting GameScene. New movement mechanics must use the actual player constants.

Art: preserve current raw and processed sources. New generated art needs source
scripts, palette, frame metadata and transparent aligned outputs. Target terrain
32×32, enemies 64×64 and bosses 128×128; do not force existing art into these cells.
Use configured image generation only for selected original art that benefits from
it, then inspect and process output before integration. No unreviewed concept sheet
may become a runtime atlas. Placeholder art must be identified by asset and world.

Audio: synthesize short original local SFX, with gain limits and mute/volume
controls. Background music is currently missing; never describe it as complete.

Save changes require migration fixtures for versions 1 and 2, preservation of
ownership/equipment/progression, and economy tests. Currency remains separate from
score. Preserve one-time completion credit and repeatable pickup rewards.

## Per-world release gate

1. Implement five distinct mechanics/layouts plus a boss with explicit telegraph,
   attack, recovery and defeat states.
2. Validate JSON identity, bounds, routes, asset references and animation frames.
3. Run type/build, save/economy/progression tests and browser smoke.
4. Play every level manually and record actual evidence, not inferred success.
5. Commit stable world; update this checklist and known issues before proceeding.

## Current checkpoint / next task

This branch is a production foundation checkpoint, not the complete game.
Continue with World 1 chase and boss state-machine work, then validate and commit
World 1 before expanding World 2. Do not regenerate the existing campaign or art.

Known gaps: only five playable levels, one survival boss rather than five unique
boss state machines, three achievements, no audio/settings, no final world 2–5
art, no complete vertical-level camera support. Geometry checks establish a ground
route, not full human verification of timing, cosmetics, or boss fairness.

## World 2 task checkpoint

Branch: production/world2-pasar-ikan, based on cae80ae.

Implemented staging components:
- `src/world2/JuraganLele.ts`: deterministic six-hit, three-phase state machine,
  with 1400ms telegraph, 1000ms attack, 1800ms recovery; only one hit per recovery.
  Attack identities: fish volley, cart charge, falling nets. No scene integration yet.
- `scripts/generate_market_art.py`: original stone tile, fish cart, vendor, net,
  and 128px Juragan phase portraits. Metadata and contact sheet under
  `public/assets/market/`. Art explicitly marked staged, not loaded by Phaser.
- Boss phase/timing/defeat/invalid-delta unit tests.

World 2 is NOT complete and remains unavailable. No World 2 level is implemented
in this checkpoint. Existing campaign, runtime assets, save schema and economy
are unchanged. Continue on this branch without regenerating the foundation.

Remaining exact work:
1. Add w2-l1..w2-l5 JSON with safe spawn/goal/checkpoints and distinct mechanics.
2. Implement slippery surfaces + moving carts; vendor projectiles + crates;
   rideable moving platforms; vertical camera/respawn + falling-net warnings.
3. Bind boss state machine to attack spawning, recovery hit detection and defeat.
4. Generate backdrop, crate, collectible and tile variants; integrate and visually
   review all staged art. Phase portraits still need attack/recovery animation.
5. Extend selector to the chosen world; enable w2 only after all five levels pass.
6. Test v1/v2 save preservation and World 2 completion unlocking World 3.
7. Extend asset validator to market manifest and add per-level browser transitions,
   completion/replay, vertical route checks and real-physics jump coverage.
8. Manually playtest all five levels and boss fairness; none visually verified yet.

This checkpoint runs existing asset validation, strict production build, unit tests
including the boss model, and the existing browser gameplay smoke. These checks do
not validate unimplemented World 2 gameplay or staged market textures at runtime.

## World 2 runtime delivery (supersedes staging checkpoint above)

Implemented all five definitions in `src/data/world2.json` and enabled World 2:
Pasar Pagi (slippery ground, carts), Gang Pedagang (vendor projectiles, collidable
crates), Gerobak Gila (rideable carts and elevated routes), Gudang Ikan (ascending
shelves, vertical camera and warned falling nets), Juragan Lele (three phases:
fish volleys, cart charge, falling nets; recovery contact deals damage).
The reusable MarketRuntime keeps these mechanics separate from World 1 logic.
World 2 checkpoints persist as validated optional fields in version-2 saves;
version-1/older version-2 saves remain accepted. Boss completion unlocks World 3,
which remains unavailable future content. Shop and achievement tests pass.

Art: eight original generated assets are loaded with nearest filtering and included
in asset validation. Generator, manifest and contact sheet remain reproducible.
Simple geometric pixel style is intentional; boss has three phase portraits with
runtime motion/tint animation, not a full hand-drawn attack animation set. Market
background is repeated with parallax; shared kampung structural decorations remain.

Validation: strict production build, 14 unit tests, 23 asset validations and four
source hashes, plus expanded Chromium smoke pass. Browser smoke enters/completes
all five levels and verifies World 3 unlock after reload. Boss smoke explicitly
sets recovery windows to test contact damage: it does NOT prove natural fight
balance. Warehouse shelf reachability is checked against jump/gravity constants.
Contact sheet and warehouse/boss screenshots inspected. Full manual traversal of
all routes, cart riding under input, slippery stopping distances, net fairness,
boss timing and cosmetic alignment still require human QA. Gerobak's ground route
is forgiving and permits bypassing optional moving-platform bonuses.

Remaining polish: dedicated slippery visual variant, richer boss animation, market
replacement for shared structural scenery, difficulty tuning and full manual QA.
All five levels and boss runtime now exist; do not describe manual QA as complete.
