# Asset pipeline

The game runs offline with procedural pixel textures in `src/assets/pipeline.ts`.
Place future sheets in `sprites/` and tilesets in `tilesets/`, then add their public
URLs to `assetManifest`. Images use `{ key, url }`; sheets also require frameWidth
and frameHeight. Existing keys (oyen, fish, sandal, roof, ground) replace fallbacks
automatically. MainMenuScene preloads the manifest before generating fallbacks.
Use transparent PNGs, integer frame sizes, and nearest-neighbor export. Add Phaser
animations when introducing multi-frame player art. Tilesets can be loaded through
the image manifest and consumed by a future Tiled map loader in GameScene.

## Process the supplied concept sheets

Run `python3 -m pip install -r scripts/requirements.txt`, then
`python3 scripts/process_assets.py` from the repository root. Outputs are checked
in, so Python is only needed when reprocessing artwork. Source files stay intact.
The processor uses individually reviewed source rectangles, preserves existing
RGBA and antialiased pixels, and scales with nearest-neighbor resampling.

Inspect `previews/contact-sheet.png` and the four `*-regions.png` overlays.
`asset-manifest.json` records source dimensions, alpha statistics, hashes, exact
regions, output cells, frame counts, scaling, and limitations. Phaser loads this
manifest directly. Oyen uses one shared scale and baseline across all five states;
the 28×30 physics body is independent of the 64×64 visual cells.

Manual review remains appropriate for the unused crouch/landing pose, connected
third-row sandal trails, and opaque kampung plant/prop silhouettes. The last
flying sandal is clipped in the original sheet and is excluded. Fall explicitly
reuses the second airborne pose; no new frames were invented. The opaque terrain
bands have visible repeat seams and are not a complete seamless tile set.
Kampung panels retain their original opaque artwork rather than deleting black
outlines. See the manifest for all limitations.

The chili pickup grants five seconds of damage protection. Heart icons reflect
remaining lives. Sparkles play on fish collection.
