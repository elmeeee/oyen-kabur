import Phaser from 'phaser';
import manifest from '../../public/assets/asset-manifest.json';
export function preloadAssets(scene: Phaser.Scene): void {
  for (const a of manifest.assets) {
    const url = import.meta.env.BASE_URL + a.path;
    if (a.kind === 'spritesheet') scene.load.spritesheet(a.key, url, { frameWidth: a.frame_size[0], frameHeight: a.frame_size[1] });
    else scene.load.image(a.key, url);
  }
}
export function generateTextures(scene: Phaser.Scene): void {
  for (const a of manifest.assets) {
    scene.textures.get(a.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (a.animation && !scene.anims.exists(a.key)) scene.anims.create({ key: a.key, frames: scene.anims.generateFrameNumbers(a.key, { start: 0, end: a.frame_count - 1 }), frameRate: a.animation.frame_rate, repeat: a.animation.repeat });
  }
}
