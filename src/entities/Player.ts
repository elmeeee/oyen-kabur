import Phaser from 'phaser';
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'oyen-idle'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setSize(28, 30).setOffset(18, 30).setCollideWorldBounds(true).setDepth(5);
  }
  animate(hurt: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const state = hurt ? 'hurt' : !body.blocked.down ? (body.velocity.y < 0 ? 'jump' : 'fall') : Math.abs(body.velocity.x) > 1 ? 'run' : 'idle';
    this.play(`oyen-${state}`, true);
  }
}
