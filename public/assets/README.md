# Asset pipeline

The game runs offline with procedural pixel textures in `src/assets/pipeline.ts`.
Place future sheets in `sprites/` and tilesets in `tilesets/`, then add their public
URLs to `assetManifest`. Images use `{ key, url }`; sheets also require frameWidth
and frameHeight. Existing keys (oyen, fish, sandal, roof, ground) replace fallbacks
automatically. MainMenuScene preloads the manifest before generating fallbacks.
Use transparent PNGs, integer frame sizes, and nearest-neighbor export. Add Phaser
animations when introducing multi-frame player art. Tilesets can be loaded through
the image manifest and consumed by a future Tiled map loader in GameScene.
