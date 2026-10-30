import Phaser from 'phaser';
// Add production assets here. Procedural fallbacks are always available offline.
export const assetManifest: {
  spritesheets: { key: string; url: string; frameWidth: number; frameHeight: number }[];
  images: { key: string; url: string }[];
} = { spritesheets: [], images: [] };
export function preloadAssets(scene: Phaser.Scene): void {
  for (const a of assetManifest.spritesheets) scene.load.spritesheet(a.key, a.url, { frameWidth: a.frameWidth, frameHeight: a.frameHeight });
  for (const a of assetManifest.images) scene.load.image(a.key, a.url);
}
export function generateTextures(scene: Phaser.Scene): void {
  const texture = (key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }); draw(g); g.generateTexture(key, w, h); g.destroy();
  };
  texture('oyen', 40, 36, g => {
    g.fillStyle(0x703e29).fillRect(4, 10, 32, 22).fillRect(8, 2, 9, 12).fillRect(26, 2, 9, 12);
    g.fillStyle(0xf69d3b).fillRect(6, 12, 30, 18).fillRect(10, 7, 24, 19).fillRect(10, 4, 5, 8).fillRect(28, 4, 5, 8).fillRect(2, 19, 8, 7);
    g.fillStyle(0xffd58a).fillRect(15, 22, 16, 8).fillRect(10, 30, 8, 4).fillRect(27, 30, 8, 4);
    g.fillStyle(0xba602a).fillRect(13, 9, 4, 5).fillRect(21, 8, 4, 6).fillRect(6, 17, 5, 3);
    g.fillStyle(0x203537).fillRect(19, 17, 3, 4).fillRect(30, 17, 3, 4).fillRect(26, 23, 3, 2);
  });
  texture('fish', 26, 16, g => {
    g.fillStyle(0x315c68).fillRect(1, 3, 7, 10).fillRect(7, 1, 16, 14);
    g.fillStyle(0x9de0dc).fillRect(8, 3, 15, 10).fillRect(2, 5, 6, 6);
    g.fillStyle(0xe6f4cb).fillRect(10, 4, 10, 3); g.fillStyle(0x203537).fillRect(19, 5, 2, 2);
  });
  texture('sandal', 32, 16, g => {
    g.fillStyle(0x412f38).fillRoundedRect(0, 2, 32, 13, 5);
    g.fillStyle(0xe77c78).fillRoundedRect(2, 1, 28, 11, 4);
    g.lineStyle(3, 0xffdab0).lineBetween(9, 3, 18, 9).lineBetween(18, 9, 25, 3);
  });
  texture('roof', 32, 16, g => {
    g.fillStyle(0x713f36).fillRect(0, 0, 32, 16); g.fillStyle(0xc66b4d).fillRect(0, 0, 32, 5);
    g.fillStyle(0xe39562).fillRect(0, 0, 32, 2); g.fillStyle(0x9e4f3c).fillRect(2, 6, 12, 3).fillRect(18, 11, 12, 3);
  });
  texture('ground', 32, 32, g => {
    g.fillStyle(0x746047).fillRect(0, 0, 32, 32); g.fillStyle(0x91a45e).fillRect(0, 0, 32, 6);
    g.fillStyle(0x544b3b).fillRect(5, 14, 6, 3).fillRect(23, 24, 5, 3);
  });
}
