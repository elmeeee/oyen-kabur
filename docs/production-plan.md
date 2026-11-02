# Oyen Kabur production plan

Current implementation: Worlds 1–5 are playable. World 5 delivery and automated
verification are recorded below; the human playtest release gate remains open.
Earlier checkpoints are retained as history and superseded by runtime deliveries.

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
- [x] World 2 runtime: slippery ground, projectiles, moving carts, vertical nets, three-phase Juragan Lele.
- [x] World 3 runtime: bamboo platforms, swinging bridges, water currents, monkeys, Monyet Sultan.
- [x] World 4 runtime: docks, moving ships, wind/rain, cranes/cargo, Kapten Bebek.
- [x] World 5 runtime: guards, traps, vertical tower, gauntlet, four-phase Raja Kucing Hitam, ending and credits.
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

## World 3 runtime delivery — Hutan Bambu

Branch `production/world3-hutan-bambu` starts at **d749af8**, the merge of PR #8.
Remote `main` was verified at that exact commit. Both World 2 staging (PR #7) and
its runtime delivery (PR #8, implementation 2733de4) are ancestors; the staging-only
notes above are historical. No World 2 branch was assumed merged or cherry-picked.

Five new stable IDs, w3-l1..w3-l5 (campaign levels 11–15), extend the registry:

| Level | Main mechanics | Optional challenge |
| --- | --- | --- |
| Gerbang Bambu | Bamboo shelves and layered forest | Foliage reveals a hidden fish path |
| Jembatan Goyang | Three swinging bridge decks | Two warning/collapse/respawn platforms |
| Air Terjun | Opposing directional currents, slippery rock bands | Collectibles behind waterfall foliage |
| Sarang Monyet | Vertical canopy, warned aimed banana throws | Bridge, fragile platform and current combinations |
| Monyet Sultan | Nine-hit, three-phase state machine | Existing fish/lives star objectives |

`ForestRuntime` is isolated from `MarketRuntime`. Shared GameScene changes add an
optional forest definition, checkpoint handling, camera bounds and goal gate, and
recognize Arcade `touching.down` when jumping from dynamic decks. Existing W1–2
content, cosmetics, achievements and economy remain in place. Main ground routes
are forgiving; the vertical level's exit requires the canopy climb. Dynamic paths
are collectible challenges, so waiting on a respawn never strands the player.

Mechanic rules:
- `SwingingBridge` uses an immovable dynamic Arcade body and velocity-based rider
  transport. The deck remains horizontal; the suspension ropes describe the swing.
- Fragile decks warn for 1000ms after the first landing, disappear for at least
  3500ms, then return only when the respawn space is clear. Pause freezes timers.
- Current zones add bounded acceleration after input. They do not teleport or
  replace input. Slippery areas retain momentum and are marked with wet rock art.
- Monkeys show a 950ms banana warning after 2200ms idle, then aim at the player's
  release-time position. Projectiles leave the scene and their colliders clean up.
- Sultan: 1300ms telegraph, 850ms attack, 1900ms recovery, 700ms cooldown. One contact
  hit per recovery. Three health per phase: two-lane bananas, low slam waves, then
  two marked summoned monkeys plus a slam. Summons are replaced, not accumulated.
  HP bar, pose/tint feedback and a surrender transition make the gate readable.
  Defeat removes all boss attacks and summons before the exit can complete.

Save format remains version 2. Optional forest checkpoints are validated against
the loaded definition. Version-1 and older version-2 records/economy/cosmetics are
preserved. Retry/reload retains the attempt checkpoint; successful forest completion
clears it for a full replay. World 3 completion unlocks World 4 persistently, while
World 4 remains unavailable until its actual content exists.

Art/audio: `scripts/generate_forest_art.py` reproducibly draws 14 original atlases
and synthesizes four mono PCM effects. Terrain uses 32px cells, monkeys 64px and
Sultan 128px. The manifest records palette, origins, frame counts, animations and
limitations. The full contact sheet and nine-pose boss contact sheet are shipped.
Nearest filtering and shared player/cosmetic anchors remain unchanged. Forest SFX
have conservative gain and a persisted M/click mute control with storage fallback.
No music is included. These are original programmatic pixel assets, not a claim
of hand-polished final animation or a finished soundtrack.

### World 3 verification and remaining human QA

Automated coverage includes all 15 registered levels, forest route geometry and
safe checkpoints; version-1/2 compatibility; stars, replay economy, World 4 unlock;
Sultan phases/cooldowns/vulnerability/defeat; bridge bounds; fragile warning and
occupied respawn rules; currents; monkey warning timing. Chromium smoke is designed
to exercise all five forest scenes, keyboard movement/jumps, dynamic deck transport,
collapse/respawn/pause, input against currents, real-gravity vertical shelf jumps,
monkey projectiles, persistent checkpoint retry/fall recovery, natural Sultan attack
cycles and nine recovery contacts, gate completion, unlock reload and replay.
The browser harness places the player at test fixtures and boss recovery contacts;
it does not prove a complete unassisted playthrough or a naturally balanced fight.

Required human sign-off remains open: traverse all five levels from start to
finish without fixtures; test every hidden route, collectible and three-star run;
judge bridge/fragile timing at varying frame rates; test current stopping distance,
monkey accuracy and all boss phases without harness repositioning; inspect Oyen's
cosmetics at every height; assess audio comfort and reduced-motion behavior.
Review the programmatic art for palette/animation polish and commission music if
desired. Automated verification does not close the plan's human release gate.

Verified on this branch: Node 24.19.0, Chromium, Pillow 12.3.0; TypeScript + Vite
production build; 20/20 unit tests; 2/2 sequential Chromium smoke tests; 37 asset
atlases, four original source hashes and four PCM effects. The W3 browser test
uses Canvas fallback to avoid headless software WebGL stalls; the existing W1–2
smoke retains the default renderer. Representative forest, boss recovery and defeat screenshots, plus the original
contact sheets, were inspected. The browser boss harness
uses actual jump input for slam waves and supported waiting perches between
cycles; boss health, phases and timers are never forced in the committed smoke.

## World 4 runtime delivery — Pelabuhan Oyen

Branch `production/world4-pelabuhan-oyen` starts from **9c7b445**, remote main's merge
of World 3 PR #9. World 3 implementation 73ded00 is a verified ancestor. Existing
World 1–3 definitions and their physics constants remain unchanged. World 3 tests
now expect the implemented World 4 to be available; their earlier-world fixtures
explicitly complete Worlds 1–2 instead of accidentally including later worlds.

Five stable definitions w4-l1..w4-l5 (campaign levels 16–20) are registered:

| Level | Implemented behavior |
| --- | --- |
| Dermaga Pagi | Dock gaps, small bobbing boats, water recovery, warned anchor sentries |
| Kapal Bergoyang | Traveling boats with independent wave bob, upper collectible routes |
| Badai Laut | Opposing wind zones, animated rain, fixed warned lightning columns |
| Gudang Pelabuhan | Ascending cargo shelves, vertical camera, two moving crane decks |
| Kapten Bebek | Nine-hit encounter with anchor, water-wave and ship-charge phases |

`HarborRuntime` is separate from the market and forest runtimes. GameScene adds only
an optional harbor theme/runtime, shared checkpoint selection, goal gate and water
recovery hook. `MovingDeck` supports boats and cranes through the same deterministic
translation model and direct-controlled immovable Arcade bodies, friction-based rider transport and
one-way collisions. Decks never rotate their collision rectangles. Crane art extends
its lattice without stretching source pixels; cables join the source boom. Static
cargo shelves provide a reachable critical route alongside bonus crane paths.
Ground-route gaps stay within the actual SPEED/JUMP/GRAVITY reachability envelope.

Water hazards are explicit rectangles below dock gaps. Recovery applies the existing
life/damage rules and still returns Oyen safely during invulnerability. Wind adds
bounded acceleration after input rather than replacing controls. Lightning uses
2800ms nearby idle, a full 1500ms visible warning, and a 250ms fixed column strike;
a stalled frame cannot skip the warning. Lightning has no random last-second aiming,
full-screen flash or camera shake. Rain, decks, projectiles and weather clocks pause.
Duck sentries use an 1100ms anchor warning after 2400ms idle and a ballistic throw.

Kapten Bebek: three health per phase, 1500ms telegraph, 1100ms attack, 2000ms recovery,
650ms cooldown. Phase 1 throws a gravity-driven anchor; phase 2 sends a low wave;
phase 3 launches a larger charging ship. All attacks use readable unique art and
physical overlap hitboxes. Only one contact hit counts per exposed recovery;
attack contact hurts Oyen. The HP bar, attack cues, hurt pose/tint and surrendered
pose expose encounter state. Defeat destroys remaining attacks before opening the
exit. The browser harness waits through actual clocks and never forces boss state
or health; it positions the player at fixtures and recovery contacts, so it does not
establish unassisted fight balance.

Save version 2 remains compatible with versions 1 and 2. Harbor checkpoint indexes
are validated against their definitions. Existing W1–3 records, forest checkpoints,
owned cosmetics, equipment, achievements and fish economy are preserved. Completion
clears only the finished harbor attempt's checkpoint. Ratings/replays use the existing
three-star and protected completion-reward rules. Kapten completion unlocks World 5
persistently; World 5 stays unavailable until five actual levels are implemented.

Art: 17 original reproducible Pillow-generated atlases, a full contact sheet and a
nine-pose boss sheet in `public/assets/harbor/`. The manifest records palette,
32px terrain cells, 64px sailors, 128px boss frames, center origins, animation counts
and limitations. Docks, crates, containers, boats, cargo, lattice crane, anchors,
water waves, rain, lightning, sailors, Captain, hostile ships, ocean/distant ships,
harbor buildings, buoys and exit gate are integrated with nearest filtering. The
player and shared fish/chili/hearts remain the existing assets. No external source
art, credentials, audio or services are required. New music/audio and hand-polished
animation remain unfinished; these are original programmatic assets, not final-art
or soundtrack claims.

Required human QA remains open: traverse all five levels without fixtures; inspect
critical takeoff margins and every fish/star route; ride/jump from boats and cranes
through full motion cycles and varying frame rates; judge wind responsiveness,
lightning reaction time and the natural three-phase boss fight; test pause/retry/
reload around water, lightning and boss attacks; inspect cosmetics, sprite feet,
parallax and rain readability. Automated tests do not close the human release gate.

### World 4 verified results

Final checks passed on Node 24.19.0 with Chromium and Pillow 12.3.0:
- `npm run build`: strict TypeScript and production Vite bundle.
- `npm test`: 26/26 tests, including all earlier-world suites.
- `npm run validate:assets`: 54 atlases, four original source hashes, four existing
  PCM effects, plus harbor animation/origin references.
- `npm run test:browser`: 3/3 sequential smoke tests across Worlds 1–4. The harbor
  run verifies all five goals, boat/crane transport and jumping, water/cooldown
  recovery, opposing wind input, the full lightning warning and strike, pause,
  real-gravity cargo shelf jumps, checkpoint retry/fall recovery, all three natural
  Captain attack types and nine recovery hits, attack-contact damage, surrender,
  persistent World 5 unlock and replay. No boss state or health is forced.
- Harbor generator rerun reproduced every atlas, manifest and contact sheet
  byte-for-byte. Contact sheets and representative boat, storm, warehouse and
  Captain recovery/defeat screenshots were inspected.

Browser fixtures deliberately reposition Oyen for focused collision/progression
checks. They do not replace the unassisted traversal and balance QA listed above.
The older browser smoke now waits for actual menu readiness and simulated movement
instead of assuming asset loading or software rendering completes within a fixed
wall-clock delay. Harbor/forest smoke uses Canvas fallback; the earlier-world smoke
keeps the default renderer. The lower second boat in Kapal Bergoyang preserves rider
headroom beneath a container shelf; tests check all boat/crane motion phases for
standing clearance. Moving decks use Phaser direct control to avoid velocity-chasing
oscillation around wave turns. Parallax backgrounds keep a fixed vertical horizon
and integer pixel scaling during the warehouse climb.

## World 5 runtime and campaign ending — Kerajaan Meong

Branch `production/world5-kerajaan-meong` starts at **e74c377**, main's merge of
World 4 PR #10. World 4 implementation 6f76cb2 and its stable build/unit/asset/browser
results are verified ancestors. Existing World 1–4 level data, player physics,
shop and cosmetics remain intact. All 25 stable campaign IDs are now registered.

| Level | Implemented behavior |
| --- | --- |
| Gerbang Kerajaan | Patrolling royal cat guards, castle gate, moving gold/stone decks |
| Lorong Istana | Warned arrow launchers, a collapsing gap floor, hidden door/fish route |
| Menara Meong | Vertical stone shelves, direct-controlled elevators, ranged guard perches |
| Ruang Tahta | Combined traps, fragile platforms, shadow wind, three-hit royal sentinel and final approach checkpoint |
| Raja Kucing Hitam | Cinematic intro, four-phase twelve-hit encounter, defeat animation and automatic homecoming |

`PalaceRuntime` remains separate from market, forest and harbor runtimes. It reuses
the existing fragile-platform lifecycle and bounded wind impulse, plus Phaser direct
control for translating stone decks. RoyalTrap clocks retain a full 1100ms visible
warning before arrows or aimed guard magic; stalled frames cannot skip that warning.
Patrol bodies can be jumped over. Ranged guards stand on collidable bonus perches
outside the critical tower shelf landings. Checkpoints remain on permanent safe
supports, retry/reload persists the attempt index, and successful completion clears
that level's checkpoint for a full replay. Static route checks use SPEED/JUMP/GRAVITY;
the collapsing 128px gap also has a jumpable fallback while its floor respawns.

### Raja Kucing Hitam

The deterministic state machine has intro → telegraph → attack → recovery → cooldown,
then a 1200ms defeat animation and victory transition. Intro is a 2400ms dimmed
throne-room dialogue with movement/jumping locked; Escape still pauses it. HP is
visible after the intro. One contact hit counts per exposed recovery window.

1. **Royal Claws**, health 12–10: alternates a low claw swipe and a 160px dash.
2. **Shadow Magic**, health 9–7: a visible ghost marks the next teleport location;
   the king relocates and releases low magic orbs in both directions.
3. **Dark Kingdom**, health 6–4: a stone refuge rises and marked floor lanes warn
   before becoming damaging shadow zones. Leaving a lane or jumping avoids damage.
4. **Last Meow**, health 3–1: dash, teleport magic and shadow-floor attacks mix with
   faster 1100ms telegraphs and 400ms cooldowns. Earlier telegraphs are 1500ms;
   recovery is 1800ms, shortened to 1500ms in the last phase.

Attacks have physical Arcade overlap bodies or explicit warned floor bounds. The
king's dash body is low enough to clear with the unchanged player jump. Teleports
use fixed arena anchors, not last-moment player tracking. Tired/hurt poses, gold hit
particles, attack frames and a dropped-crown defeat pose expose encounter state.
Defeat removes attacks and transitions automatically to the ending after the defeat
animation. The sentinel uses a three-hit Royal Claws variant and opens the level-24
exit rather than starting the campaign ending.

### Ending, replay and saves

Three original four-second pixel panels show the king surrendering, Oyen returning
home safely with fish, and a welcome home. Enter, Space or click advances a panel.
The completion summary displays levels, stars, best-score total, lifetime pickups
and spendable fish. Credits acknowledge engine/tooling, original generators and
shared project artwork, then provide world map and main menu buttons. The map's
**TAMAT • ENDING [C]** link replays the ending/credits after a reload.

Save format **3** loads versions 1, 2 and 3. Existing records, fish balances,
owned/equipped cosmetics, achievements and checkpoint indexes are retained under
the existing validation rules. `campaign.completed` derives from a validated final
level record; a standalone flag cannot manufacture a win. `campaign.endingSeen` is
stored only after all three panels and cannot survive without completion. A reload
mid-ending keeps the win and allows replay from the map. Every validated completed
level remains replayable; finishing again does not duplicate completion currency.
Reset clears completion and ending flags. Storage failure retains these states for
the session and the summary clearly reports that limitation.

### Assets and release limits

`generate_palace_art.py` authors 18 original palace atlases, including terrain,
gold/fragile platforms, purple banners, gate, arrow traps, guards, sentinel, spell
orbs, claws, floor shadows, hit particles, twelve 128px king poses, throne, two
parallax layers and three 320×180 ending panels. Terrain uses 32px cells and guards
64px frames. The manifest records palette, origins, animations and limitations;
two contact sheets are included. Integer scaling, transparent sprites and nearest
filtering are retained. Ending panels use a fixed original illustration of Oyen;
equipped cosmetics remain saved and visible in gameplay rather than being painted
into each ending panel. No final soundtrack, voice acting or fully animated film is
claimed. Programmatic art, cinematography and animation still require human polish.

Final release QA remains separate: unassisted traversals of all 25 levels, all fish
and three-star routes, every boss under human input, difficulty/accessibility tuning,
low/high frame-rate moving-platform checks, cosmetics and art review, audio/music,
complete save/ending/replay flows across browsers and devices, and shipping review.
World 1's planned chase/final art and the broader achievement/settings backlog are
still open. Implementing World 5 does not make the entire game production-ready.

### World 5 verified results

- Strict TypeScript and Vite production build passed on Node 24.19.0.
- All 33 unit tests passed, including v1/v2/v3 migration, campaign/ending flags,
  prior-world state, purchases, replay rewards, reset and blocked-storage behavior.
- The full four-smoke Chromium suite passed across Worlds 1–5. It verifies World 1's
  actual five-cycle survival completion, earlier bosses, all five palace levels,
  patrol damage, moving decks/jumps, warned arrows, floor collapse/respawn/pause,
  secret fish, real tower jumps, checkpoint retry/fall recovery and sentinel defeat.
- Raja's twelve hits across all four natural phases were completed with real keyboard
  movement/jumps and physical contact during recovery. There is one encounter-entry
  fixture; no player repositioning, boss-state override, health override or invincibility
  mutation occurs during the final fight. This establishes physics feasibility, not
  human difficulty balance.
- The ending, safe-home panel, summary, credits, return to map, mid-ending reload,
  viewed-ending persistence and a fresh boss replay all passed browser checks.
- A fifth focused browser regression passed after the final compatibility fix:
  a sparse version-2 save containing a validated final completion is reachable via
  the actual world-map and level-select buttons, preserves the equipped bandana,
  and supports credits-to-main-menu navigation. Completed records also prove their
  own world's replay access; missing earlier records cannot strand a completed level.
- Asset validation passed for 72 atlases, four original source hashes and four
  existing PCM effects. Palace generation reproduced every atlas, ending panel,
  manifest and contact sheet byte-for-byte. Boss/contact sheets and representative
  palace, ending, summary and credits screenshots were inspected.

The palace/earlier-level browser harnesses use focused entry/checkpoint fixtures,
except for the final fight's actual keyboard controller. Complete human traversal
and release sign-off remain open. No production-ready release claim is made.
