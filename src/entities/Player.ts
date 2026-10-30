import { progression } from '../progression/ProgressionManager';
import { drawCosmetic } from './Cosmetics';
import Phaser from 'phaser';
export class Player extends Phaser.Physics.Arcade.Sprite {
  private overlay!: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'oyen-idle'); scene.add.existing(this); scene.physics.add.existing(this);
    this.overlay = scene.add.graphics().setDepth(7);
    const sync = () => drawCosmetic(this.overlay, this, progression.saves.data.equipped);
    scene.events.on('postupdate', sync);
    this.once('destroy', () => { scene.events.off('postupdate', sync); this.overlay.destroy(); });
    this.setSize(28, 30).setOffset(18, 30).setCollideWorldBounds(true).setDepth(5);
  }
  animate(hurt: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const state = hurt ? 'hurt' : !body.blocked.down ? (body.velocity.y < 0 ? 'jump' : 'fall') : Math.abs(body.velocity.x) > 1 ? 'run' : 'idle';
    this.play(`oyen-${state}`, true);
  }
}
