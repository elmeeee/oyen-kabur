import Phaser from 'phaser';
import type { CosmeticId } from '../progression/catalog';
// Temporary pixel geometry; anchors are measured in the normalized 64px cells.
const anchors: Record<string, number[][]> = {
  'oyen-idle': [[42, 29], [42, 29], [42, 29]],
  'oyen-run': [[45, 32], [47, 32], [46, 32], [48, 34], [44, 32], [46, 32], [44, 31]],
  'oyen-jump': [[43, 27], [46, 30]], 'oyen-fall': [[46, 30]], 'oyen-hurt': [[42, 46]],
};
export function drawCosmetic(g: Phaser.GameObjects.Graphics, sprite: Phaser.GameObjects.Sprite, id: CosmeticId | null): void {
  g.clear(); if (!id || !sprite.active) return;
  const points = anchors[sprite.texture.key] ?? anchors['oyen-idle'];
  const [ax, ay] = points[Number(sprite.frame.name) % points.length];
  g.setPosition(sprite.x, sprite.y).setScale(sprite.scaleX * (sprite.flipX ? -1 : 1), sprite.scaleY).setAlpha(sprite.alpha).setVisible(sprite.visible);
  const x = ax - 32, y = ay - 32;
  if (id === 'glasses') g.fillStyle(0x152b32).fillRect(x - 8, y, 7, 4).fillRect(x + 1, y, 7, 4).fillRect(x - 2, y + 1, 4, 1);
  if (id === 'bandana') g.fillStyle(0xd84b43).fillRect(x - 8, y + 12, 14, 3).fillTriangle(x - 5, y + 15, x + 3, y + 15, x, y + 21);
  if (id === 'hat') g.fillStyle(0xc5a66c).fillRect(x - 10, y - 7, 20, 3).fillRect(x - 6, y - 13, 12, 6);
}
