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
