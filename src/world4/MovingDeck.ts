import Phaser from 'phaser';
import type { DeckDefinition } from './definitions';
import { deckPosition } from './mechanics';
/** Reusable kinematic boat/crane deck. Arcade friction carries grounded riders. */
export class MovingDeck {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private cables?: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, readonly definition: DeckDefinition, player: Phaser.Physics.Arcade.Sprite) {
    const d = definition, p = deckPosition(d, 0);
    this.sprite = scene.physics.add.sprite(p.x, p.y + 16, d.kind === 'boat' ? 'harbor-boat' : 'harbor-cargo').setDisplaySize(d.width, 64).setImmovable(true).setDepth(3);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setDirectControl(true);
    // Both source frames have their load-bearing surface at y=16.
    this.sprite.setSize(128, 12).setOffset(0, 16).setFriction(1, 0);
    body.checkCollision.down = false; body.checkCollision.left = false; body.checkCollision.right = false;
    scene.physics.add.collider(player, this.sprite);
    if (d.kind === 'crane') {
      this.cables = scene.add.graphics().setDepth(2);
      scene.add.image(d.x, d.y - 160, 'harbor-crane').setDepth(1);
      // Continue the source atlas lattice to the dock without stretching pixels.
      const mast = scene.add.graphics().setDepth(1);
      mast.fillStyle(0xd7b16b).fillRect(d.x - 57, d.y - 32, 11, 514 - d.y);
      mast.lineStyle(2, 0x8d593a);
      for (let y=d.y-32;y<458;y+=28) {
        mast.lineBetween(d.x-56,y,d.x-47,y+24);
        mast.lineBetween(d.x-47,y,d.x-56,y+24);
      }
    }
  }
  update(clock: number): void {
    const p = deckPosition(this.definition, clock);
    if (this.definition.kind === 'boat') this.sprite.setFrame(Math.floor(clock / 200) % 4);
    // Arcade derives motion and rider friction from the authored displacement.
    // Direct control avoids velocity-chasing oscillation as wave direction changes.
    this.sprite.setPosition(p.x, p.y + 16);
    if (this.cables) {
      this.cables.clear().lineStyle(2, 0xd7bf88);
      for (const side of [-1, 1]) this.cables.lineBetween(this.definition.x + side * 38, this.definition.y - 272, p.x + side * 38, p.y + 2);
    }
  }
}
