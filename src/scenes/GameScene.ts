import { highScore } from '../highScore';
import { Player } from '../entities/Player';
import Phaser from 'phaser';
import { fishSpawns, GRAVITY, JUMP, platforms, RunState, sandalRoutes, SPEED, WORLD_WIDTH } from '../level';
import { label, village } from './presentation';
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private keys!: Record<'left' | 'right' | 'a' | 'd' | 'space' | 'up', Phaser.Input.Keyboard.Key>;
  private hud!: Phaser.GameObjects.Text;
  private state = new RunState();
  private finished = false;
  private checkpoint = 90;
  private checkpointIndex = 0;
  private groundedAt = -Infinity;
  private jumpAt = -Infinity;
  private wasGrounded = false;
  private hitUntil = 0;
  private paused = false;
  private pauseAt = 0;
  private pauseOverlay!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private sandals: { sprite: Phaser.Physics.Arcade.Sprite; x: number; y: number; range: number; phase: number }[] = [];
  constructor() { super('GameScene'); }
  create(): void {
    this.state = new RunState(); this.finished = false; this.checkpoint = 90; this.sandals = [];
    this.checkpointIndex = 0; this.groundedAt = -Infinity; this.jumpAt = -Infinity;
    this.wasGrounded = false; this.hitUntil = 0; this.paused = false; this.elapsed = 0;
    this.physics.resume(); this.tweens.resumeAll(); this.anims.resumeAll();
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
    this.add.image(3480, 445, 'wall-facade').setDisplaySize(100, 70);
    const chili = this.physics.add.sprite(1530, 450, 'chili').play('chili');
    chili.body.setAllowGravity(false); chili.setSize(22, 22);
    const goal = this.add.zone(3480, 430, 120, 104); this.physics.add.existing(goal, true);
    this.player = new Player(this, 90, 445);
    this.player.setMaxVelocity(SPEED, 700);
    this.physics.add.collider(this.player, ground);
    this.physics.add.overlap(this.player, chili, () => { chili.disableBody(true, true); this.state.invulnerableUntil = this.time.now + 5000; });
    for (let i = 0; i < 3; i++) {
      const heart = this.add.sprite(365 + i * 26, 32, 'heart').play('heart').setScrollFactor(0).setDepth(21);
      this.events.on('update', () => heart.setAlpha(i < this.state.lives ? 1 : 0.2));
    }
    const fish = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite });
    fishSpawns.forEach(p => {
      const f = fish.create(p.x, p.y, 'fish') as Phaser.Physics.Arcade.Sprite;
      f.play('fish'); f.setSize(24, 18); this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1 });
    });
    this.physics.add.overlap(this.player, fish, (_player, item) => {
      const f = item as Phaser.Physics.Arcade.Sprite;
      if (!f.active) return;
      this.state.collect(); highScore(this.state.score); f.disableBody(true, true);
      const effect = this.add.sprite(f.x, f.y, 'spark').play('spark').setDepth(8);
      effect.once('animationcomplete', () => effect.destroy());
      for (let i = 0; i < 5; i++) {
        const spark = this.add.image(f.x, f.y, 'spark', 0).setScale(0.45).setDepth(8);
        this.tweens.add({ targets: spark, x: f.x + Math.cos(i * 1.26) * 28, y: f.y + Math.sin(i * 1.26) * 24 - 10, alpha: 0, duration: 350, onComplete: () => spark.destroy() });
      }
      const pop = label(this, f.x, f.y - 10, '+10', 16, '#fff2b8').setOrigin(0.5);
      this.tweens.add({ targets: pop, y: pop.y - 35, alpha: 0, duration: 650, onComplete: () => pop.destroy() });
    });
    for (let i = 0; i < sandalRoutes.length; i++) {
      const r = sandalRoutes[i];
      const sprite = this.physics.add.sprite(r.x, r.y, 'sandal-spin').play(i % 2 ? 'sandal-fly' : 'sandal-spin').setDepth(4);
      sprite.body.setAllowGravity(false);
      sprite.setImmovable(true).setSize(26, 12);
      this.sandals.push({ sprite, ...r, phase: i * 1.7 });
      this.physics.add.overlap(this.player, sprite, () => this.hurt());
    }
    this.physics.add.overlap(this.player, goal, () => this.end(true));
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 540).startFollow(this.player, true, 0.08, 0.1, -80, 0).setDeadzone(100, 80);
    this.add.rectangle(480, 31, 912, 42, 0x193b3c, 0.94).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x6f9177);
    this.hud = label(this, 42, 21, '', 18).setScrollFactor(0).setDepth(21);
    label(this, 918, 22, 'SPACE JUMP   ESC PAUSE   R RETRY', 14, '#b6caaa').setOrigin(1, 0).setScrollFactor(0).setDepth(21);
    const hint = label(this, 90, 370, 'IKANNYA DIBAWA! →\nHop onto the roofs for extra fish.', 14, '#243f3b');
    this.time.delayedCall(6000, () => hint.destroy());
    this.keys = this.input.keyboard!.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', space: 'SPACE', up: 'UP' }) as typeof this.keys;
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.pauseOverlay = label(this, 480, 260, 'PAUSED / JEDA\n\nESC resume  •  R restart', 28).setOrigin(0.5).setScrollFactor(0).setDepth(100).setBackgroundColor('#193b3c').setPadding(30).setVisible(false);
    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      if (event.repeat) return;
      this.paused = !this.paused;
      this.pauseOverlay.setVisible(this.paused);
      if (this.paused) { this.pauseAt = this.time.now; this.physics.pause(); this.tweens.pauseAll(); this.anims.pauseAll(); }
      else {
        const gap = this.time.now - this.pauseAt;
        this.state.invulnerableUntil += gap; this.hitUntil += gap;
        this.groundedAt = -Infinity; this.jumpAt = -Infinity;
        this.input.keyboard!.resetKeys();
        this.physics.resume(); this.tweens.resumeAll(); this.anims.resumeAll();
      }
    });
  }
  private hurt(fall = false): void {
    if (this.finished || !this.state.damage(this.time.now)) return;
    this.hitUntil = this.time.now + 220;
    this.player.setTintFill(0xffe8bf);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.cameras.main.shake(100, 0.002);
    if (this.state.lives === 0) { this.end(false); return; }
    if (fall) { this.player.setPosition(this.checkpoint, 430); this.player.setVelocity(0, 0); }
    else this.player.setVelocity(this.player.flipX ? 160 : -160, -210);
  }
  private end(won: boolean): void {
    if (this.finished) return;
    this.finished = true; this.physics.pause();
    this.scene.start(won ? 'VictoryScene' : 'GameOverScene', { score: this.state.score });
  }
  update(_time: number, delta: number): void {
    if (!this.player || this.finished || this.paused) return;
    const time = this.time.now; this.elapsed += delta;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const direction = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown);
    if (time >= this.hitUntil) this.player.setVelocityX(Phaser.Math.Linear(body.velocity.x, direction * SPEED, Math.min(1, delta / (direction ? 65 : 45))));
    if (direction) this.player.setFlipX(direction < 0);
    const grounded = body.blocked.down;
    if (grounded) this.groundedAt = time;
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) || Phaser.Input.Keyboard.JustDown(this.keys.up)) this.jumpAt = time;
    if (time - this.jumpAt <= 120 && time - this.groundedAt <= 100 && time >= this.hitUntil) {
      this.player.setVelocityY(-JUMP); this.jumpAt = -Infinity; this.groundedAt = -Infinity;
    }
    if (!this.keys.space.isDown && !this.keys.up.isDown && body.velocity.y < -220) this.player.setVelocityY(-220);
    if (grounded && !this.wasGrounded) {
      // Visual-only duplicate anchored at the feet; the physics sprite never scales.
      const squash = this.add.sprite(this.player.x, this.player.y + 28, this.player.texture.key, this.player.frame.name).setOrigin(0.5, 60 / 64).setScale(1.06, 0.94).setFlipX(this.player.flipX).setDepth(6);
      this.tweens.add({ targets: squash, scaleX: 1, scaleY: 1, alpha: 0, duration: 100, onComplete: () => squash.destroy() });
    }
    this.wasGrounded = grounded;
    this.player.animate(time < this.hitUntil);
    this.player.setAlpha(time < this.state.invulnerableUntil ? 0.65 : 1);
    if (body.blocked.down && this.player.y > 420) {
      const index = platforms.slice(0, 4).findIndex(p => this.player.x > p.x + 30 && this.player.x < p.x + p.w - 30);
      if (index > this.checkpointIndex) {
        this.checkpointIndex = index; this.checkpoint = platforms[index].x + 60;
        const notice = label(this, 480, 90, 'CHECKPOINT AMAN ✓', 22).setOrigin(0.5).setScrollFactor(0).setDepth(25);
        this.tweens.add({ targets: notice, alpha: 0, delay: 1100, duration: 400, onComplete: () => notice.destroy() });
      }
    }
    if (this.player.y > 580) {
      // Falls must recover even during an existing sandal cooldown.
      if (this.time.now < this.state.invulnerableUntil) { this.player.setPosition(this.checkpoint, 430).setVelocity(0, 0); }
      else this.hurt(true);
    }
    for (const s of this.sandals) {
      const t = this.elapsed / 900 + s.phase;
      s.sprite.setPosition(s.x + Math.sin(t) * s.range, s.y + Math.sin(t * 1.7) * 15).setAngle(Math.sin(t) * 25);
    }
    this.hud.setText(`FISH ${String(this.state.score).padStart(3, '0')}    LIVES ${'♥'.repeat(this.state.lives)}`);
  }
}
export const arcadeGravity = GRAVITY;
