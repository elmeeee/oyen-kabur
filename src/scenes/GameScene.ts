import Phaser from 'phaser';
import { fishSpawns, GRAVITY, JUMP, platforms, RunState, sandalRoutes, SPEED, WORLD_WIDTH } from '../level';
import { label, village } from './presentation';
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'space' | 'up', Phaser.Input.Keyboard.Key>;
  private hud!: Phaser.GameObjects.Text;
  private state = new RunState();
  private finished = false;
  private checkpoint = 90;
  private sandals: { sprite: Phaser.Physics.Arcade.Image; x: number; y: number; range: number; phase: number }[] = [];
  constructor() { super('GameScene'); }
  create(): void {
    this.state = new RunState(); this.finished = false; this.checkpoint = 90; this.sandals = [];
    village(this, WORLD_WIDTH);
    this.physics.world.setBounds(0, -100, WORLD_WIDTH, 800);
    const ground = this.physics.add.staticGroup();
    for (const p of platforms) {
      if (p.y < 482) {
        this.add.rectangle(p.x + p.w / 2, p.y + 16, p.w - 16, 482 - p.y, 0xc5b681).setOrigin(0.5, 0);
        this.add.rectangle(p.x + p.w / 2, p.y + 65, 26, 42, 0x416766);
      }
      const tile = this.add.tileSprite(p.x, p.y, p.w, p.y === 482 ? 58 : 16, p.y === 482 ? 'ground' : 'roof').setOrigin(0);
      ground.add(tile); (tile.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
    // Finish landmark, visible from the ground route and final roof.
    this.add.rectangle(3480, 425, 135, 114, 0x6e8b69);
    this.add.triangle(3480, 351, 0, 40, 90, 0, 180, 40, 0x9c503b);
    label(this, 3480, 385, 'POS RONDA', 16, '#fff0c0').setOrigin(0.5);
    label(this, 3480, 414, 'FINISH →', 16, '#fff0c0').setOrigin(0.5);
    const goal = this.add.zone(3480, 430, 120, 104); this.physics.add.existing(goal, true);
    this.player = this.physics.add.sprite(90, 445, 'oyen').setDepth(5).setCollideWorldBounds(true);
    this.player.setSize(28, 30).setOffset(7, 4).setMaxVelocity(SPEED, 700);
    this.physics.add.collider(this.player, ground);
    const fish = this.physics.add.staticGroup();
    fishSpawns.forEach(p => {
      const f = fish.create(p.x, p.y, 'fish') as Phaser.Physics.Arcade.Image;
      f.setSize(24, 18); this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1 });
    });
    this.physics.add.overlap(this.player, fish, (_player, item) => {
      const f = item as Phaser.Physics.Arcade.Image;
      if (!f.active) return;
      this.state.collect(); f.disableBody(true, true);
      const pop = label(this, f.x, f.y - 10, '+10', 16, '#fff2b8').setOrigin(0.5);
      this.tweens.add({ targets: pop, y: pop.y - 35, alpha: 0, duration: 650, onComplete: () => pop.destroy() });
    });
    for (let i = 0; i < sandalRoutes.length; i++) {
      const r = sandalRoutes[i];
      const sprite = this.physics.add.image(r.x, r.y, 'sandal').setDepth(4);
      sprite.body.setAllowGravity(false);
      sprite.setImmovable(true).setSize(26, 12);
      this.sandals.push({ sprite, ...r, phase: i * 1.7 });
      this.physics.add.overlap(this.player, sprite, () => this.hurt());
    }
    this.physics.add.overlap(this.player, goal, () => this.end(true));
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 540).startFollow(this.player, true, 0.1, 0.1, -110, 0);
    this.add.rectangle(480, 31, 912, 42, 0x193b3c, 0.94).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x6f9177);
    this.hud = label(this, 42, 21, '', 18).setScrollFactor(0).setDepth(21);
    label(this, 918, 22, 'A/D  MOVE   SPACE  JUMP   R  RETRY', 14, '#b6caaa').setOrigin(1, 0).setScrollFactor(0).setDepth(21);
    const hint = label(this, 90, 370, 'IKANNYA DIBAWA! →\nHop onto the roofs for extra fish.', 14, '#243f3b');
    this.time.delayedCall(6000, () => hint.destroy());
    this.keys = this.input.keyboard!.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', space: 'SPACE', up: 'UP' }) as typeof this.keys;
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
  private hurt(fall = false): void {
    if (this.finished || !this.state.damage(this.time.now)) return;
    this.cameras.main.shake(130, 0.005);
    if (this.state.lives === 0) { this.end(false); return; }
    if (fall) { this.player.setPosition(this.checkpoint, 430); this.player.setVelocity(0, 0); }
    else this.player.setVelocity(this.player.flipX ? 160 : -160, -210);
  }
  private end(won: boolean): void {
    if (this.finished) return;
    this.finished = true; this.physics.pause();
    this.scene.start(won ? 'VictoryScene' : 'GameOverScene', { score: this.state.score });
  }
  update(time: number): void {
    if (!this.player || this.finished) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const direction = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown);
    this.player.setVelocityX(direction * SPEED);
    if (direction) this.player.setFlipX(direction < 0);
    if ((Phaser.Input.Keyboard.JustDown(this.keys.space) || Phaser.Input.Keyboard.JustDown(this.keys.up)) && body.blocked.down) this.player.setVelocityY(-JUMP);
    this.player.setAngle(body.blocked.down && direction ? Math.sin(time / 65) * 4 : 0);
    this.player.setAlpha(time < this.state.invulnerableUntil ? (Math.floor(time / 90) % 2 ? 0.35 : 1) : 1);
    if (body.blocked.down && this.player.y > 420) this.checkpoint = this.player.x;
    if (this.player.y > 580) {
      // Falls must recover even during an existing sandal cooldown.
      if (this.time.now < this.state.invulnerableUntil) { this.player.setPosition(this.checkpoint, 430).setVelocity(0, 0); }
      else this.hurt(true);
    }
    for (const s of this.sandals) {
      const t = time / 900 + s.phase;
      s.sprite.setPosition(s.x + Math.sin(t) * s.range, s.y + Math.sin(t * 1.7) * 15).setAngle(Math.sin(t) * 25);
    }
    this.hud.setText(`FISH ${String(this.state.score).padStart(3, '0')}    LIVES ${'♥'.repeat(this.state.lives)}`);
  }
}
export const arcadeGravity = GRAVITY;
