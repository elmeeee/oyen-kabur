import Phaser from 'phaser';
import type { BridgeDefinition } from './definitions';
import { bridgePosition } from './mechanics';
/** Kinematic, one-way, level deck with drawn swinging suspension ropes. */
export class SwingingBridge {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private ropes: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, readonly definition: BridgeDefinition, player: Phaser.Physics.Arcade.Sprite) {
    const d = definition;
    this.ropes = scene.add.graphics().setDepth(2);
    this.sprite = scene.physics.add.sprite(d.x, d.y + 13, 'forest-bamboo').setDisplaySize(d.width, 32).setImmovable(true);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.sprite.setSize(32, 12).setOffset(0, 3).setFriction(1, 0);
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    scene.physics.add.collider(player, this.sprite);
  }
  update(elapsed: number, delta: number): void {
    const d = this.definition, p = bridgePosition(d, elapsed);
    // Set velocity before the physics step: Arcade carries the rider using friction.
    this.sprite.setVelocity((p.x - this.sprite.x) * 1000 / Math.max(delta, 1), (p.y + 13 - this.sprite.y) * 1000 / Math.max(delta, 1));
    this.ropes.clear().lineStyle(2, 0xb8cf78);
    for (const side of [-1, 1]) {
      this.ropes.lineBetween(d.x + side * (d.width / 2 - 8), d.y - 110, p.x + side * (d.width / 2 - 8), p.y + 2);
    }
  }
  destroy(): void { this.ropes.destroy(); this.sprite.destroy(); }
}
