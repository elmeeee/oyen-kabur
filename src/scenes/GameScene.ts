import { MarketRuntime } from '../world2/MarketRuntime';
import { LevelLoader } from '../progression/registry';
import { progression } from '../progression/ProgressionManager';
import { highScore } from '../highScore';
import { Player } from '../entities/Player';
import Phaser from 'phaser';
import { GRAVITY, JUMP, RunState, SPEED } from '../level';
import { label, village } from './presentation';
export class GameScene extends Phaser.Scene {
  private level = LevelLoader.load('w1-l1');
  private bossCycle = -1;
  private bossHits = 0;
  private bossWarning!: Phaser.GameObjects.Text;
  init(data: { levelId?: string }): void {
    const id = data.levelId ?? this.level.id;
    this.level = LevelLoader.load(progression.unlocked(id) ? id : 'w1-l1');
  }
  private market?: MarketRuntime;
  private checkpointY = 430;
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
  private damageTaken = 0;
  private sandals: { sprite: Phaser.Physics.Arcade.Sprite; x: number; y: number; range: number; phase: number }[] = [];
  constructor() { super('GameScene'); }
  create(): void {
    const { platforms, fish: fishSpawns, hazards: sandalRoutes, width: WORLD_WIDTH, goal: finish } = this.level;
    this.bossCycle = -1; this.bossHits = 0; this.damageTaken = 0;
    this.state = new RunState(); this.finished = false; this.checkpoint = 90; this.sandals = [];
    this.checkpointIndex = 0; this.groundedAt = -Infinity; this.jumpAt = -Infinity;
    this.wasGrounded = false; this.hitUntil = 0; this.paused = false; this.elapsed = 0;
    this.time.paused = false; this.physics.resume(); this.tweens.resumeAll(); this.anims.resumeAll();
    this.market = undefined; this.checkpointY = 430;
    village(this, WORLD_WIDTH);
    if(this.level.market) this.add.tileSprite(0, 0, WORLD_WIDTH, 540, 'market-background').setOrigin(0).setScrollFactor(0.3);
    this.physics.world.setBounds(0, (this.level.market?.top ?? 0)-100, WORLD_WIDTH, 900-(this.level.market?.top ?? 0));
    const ground = this.physics.add.staticGroup();
    for (const p of platforms) {
      if (p.y < 482) {
        this.add.rectangle(p.x + p.w / 2, p.y + 16, p.w - 16, 482 - p.y, 0xc5b681).setOrigin(0.5, 0);
        this.add.rectangle(p.x + p.w / 2, p.y + 65, 26, 42, 0x416766);
      }
      const tile = this.add.tileSprite(p.x, p.y, p.w, p.y === 482 ? 58 : 16, this.level.market ? 'market-stone' : p.y === 482 ? 'ground' : 'roof').setOrigin(0);
      ground.add(tile); (tile.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    }
    // Finish landmark, visible from the ground route and final roof.
    this.add.rectangle(finish, 425, 135, 114, 0x6e8b69);
    this.add.triangle(finish, 351, 0, 40, 90, 0, 180, 40, 0x9c503b);
    label(this, finish, 385, 'POS RONDA', 16, '#fff0c0').setOrigin(0.5);
    label(this, finish, 414, 'FINISH →', 16, '#fff0c0').setOrigin(0.5);
    this.add.image(finish, 445, 'wall-facade').setDisplaySize(100, 70);
    const chili = this.physics.add.sprite(Math.min(1530, finish - 300), 450, 'chili').play('chili');
    chili.body.setAllowGravity(false); chili.setSize(22, 22);
    const goal = this.add.zone(finish, this.level.market?.goalY ?? 430, 120, 104); this.physics.add.existing(goal, true);
    this.player = new Player(this, 90, 445);
    if(this.level.market) {
      this.market = new MarketRuntime(this, this.level, this.player, () => this.hurt());
      label(this, finish, this.level.market.goalY-60, 'PASAR EXIT →', 20);
      const saved = progression.saves.data.checkpoints?.[this.level.id];
      const cp = this.level.market.checkpoints[saved ?? 0];
      if(cp) { this.player.setPosition(cp.x,cp.y); this.checkpoint=cp.x; this.checkpointY=cp.y; this.checkpointIndex=saved ?? 0; }
    }
    this.player.setMaxVelocity(SPEED, 700);
    this.physics.add.collider(this.player, ground);
    this.physics.add.overlap(this.player, chili, () => { chili.disableBody(true, true); this.state.invulnerableUntil = this.time.now + 5000; });
    for (let i = 0; i < 3; i++) {
      const heart = this.add.sprite(365 + i * 26, 32, 'heart').play('heart').setScrollFactor(0).setDepth(21);
      this.events.on('update', () => heart.setAlpha(i < this.state.lives ? 1 : 0.2));
    }
    const fish = this.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite });
    fishSpawns.forEach(p => {
      const f = fish.create(p.x, p.y, this.level.market ? 'market-fish' : 'fish') as Phaser.Physics.Arcade.Sprite;
      if(!this.level.market) f.play('fish'); f.setSize(24, 18); this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: 700, yoyo: true, repeat: -1 });
    });
    this.physics.add.overlap(this.player, fish, (_player, item) => {
      const f = item as Phaser.Physics.Arcade.Sprite;
      if (!f.active) return;
      this.state.collect();
      const unlocked = progression.saves.collectFish();
      if (unlocked.length) { const toast = label(this, 480, 150, 'ACHIEVEMENT: 100 FISH!', 22).setOrigin(0.5).setScrollFactor(0).setDepth(30); this.time.delayedCall(2200, () => toast.destroy()); }
      highScore(this.state.score); f.disableBody(true, true);
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
    this.physics.add.overlap(this.player, goal, () => { if (!this.level.boss || (this.market ? this.market.defeated : this.bossHits >= 5)) this.end(true); });
    this.bossWarning = label(this, 480, 115, '', 22, '#ffe7a0').setOrigin(0.5).setScrollFactor(0).setDepth(22);
    this.cameras.main.setBounds(0, this.level.market?.top ?? 0, WORLD_WIDTH, 540-(this.level.market?.top ?? 0)).startFollow(this.player, true, 0.08, 0.1, -80, 0).setDeadzone(100, 80);
    this.add.rectangle(480, 31, 912, 42, 0x193b3c, 0.94).setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0x6f9177);
    this.hud = label(this, 42, 21, '', 18).setScrollFactor(0).setDepth(21);
    label(this, 918, 22, 'SPACE JUMP   ESC PAUSE   R RETRY', 14, '#b6caaa').setOrigin(1, 0).setScrollFactor(0).setDepth(21);
    const hint = label(this, 90, 370, `${this.level.name} →\nStars: finish • ${this.level.objectives.fish} fish • ${this.level.objectives.lives}+ lives`, 14, '#243f3b');
    this.time.delayedCall(6000, () => hint.destroy());
    this.keys = this.input.keyboard!.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', space: 'SPACE', up: 'UP' }) as typeof this.keys;
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.pauseOverlay = label(this, 480, 260, 'PAUSED / JEDA\n\nESC resume  •  R restart', 28).setOrigin(0.5).setScrollFactor(0).setDepth(100).setBackgroundColor('#193b3c').setPadding(30).setVisible(false);
    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      if (event.repeat) return;
      this.paused = !this.paused;
      this.pauseOverlay.setVisible(this.paused);
      if (this.paused) { this.pauseAt = this.time.now; this.time.paused = true; this.physics.pause(); this.tweens.pauseAll(); this.anims.pauseAll(); }
      else {
        const gap = this.time.now - this.pauseAt;
        this.state.invulnerableUntil += gap; this.hitUntil += gap;
        this.groundedAt = -Infinity; this.jumpAt = -Infinity;
        this.input.keyboard!.resetKeys();
        this.time.paused = false; this.physics.resume(); this.tweens.resumeAll(); this.anims.resumeAll();
      }
    });
  }
  private hurt(fall = false): void {
    if (this.finished || !this.state.damage(this.time.now)) return;
    this.damageTaken++;
    this.hitUntil = this.time.now + 220;
    this.player.setTintFill(0xffe8bf);
    this.time.delayedCall(100, () => this.player.clearTint());
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.cameras.main.shake(100, 0.002);
    if (this.state.lives === 0) { this.end(false); return; }
    if (fall) { this.player.setPosition(this.checkpoint, this.checkpointY); this.player.setVelocity(0, 0); }
    else this.player.setVelocity(this.player.flipX ? 160 : -160, -210);
  }
  private end(won: boolean): void {
    if (this.finished) return;
    this.finished = true; this.physics.pause();
    const previousAchievements = [...progression.saves.data.achievements];
    const stars = won ? progression.complete(this.level.id, this.state.score, this.state.lives, this.damageTaken) : 0;
    this.scene.start('ResultScene', { levelId: this.level.id, won, score: this.state.score, stars, achievements: progression.saves.data.achievements.filter(a => !previousAchievements.includes(a)) });
  }
  update(_time: number, delta: number): void {
    if (!this.player || this.finished || this.paused) return;
    const time = this.time.now; this.elapsed += delta;
    this.market?.update(delta);
    const platforms = this.level.platforms.filter(p => p.y === 482);
    if (!this.market && this.level.boss && this.player.x > this.level.width - 650 && this.bossHits < 5) {
      const cycle = Math.floor(this.elapsed / 2400), phase = this.elapsed % 2400;
      this.bossWarning.setText(phase < 1500 ? 'EMAK: AWAS! Jump over the low sandal!' : `DODGE! ${this.bossHits}/5`);
      if (phase >= 1500 && cycle !== this.bossCycle) {
        this.bossCycle = cycle;
        const shot = this.physics.add.sprite(this.level.goal, 455, 'sandal-spin').play('sandal-spin');
        shot.body.setAllowGravity(false); shot.setSize(26, 12).setVelocityX(-260);
        this.physics.add.overlap(this.player, shot, () => this.hurt());
        this.time.delayedCall(1800, () => { shot.destroy(); this.bossHits++; });
      }
    } else if (!this.market && this.level.boss && this.bossHits >= 5) this.bossWarning.setText('EMAK CAPEK! Reach the finish →');
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const direction = Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown);
    if (time >= this.hitUntil) this.player.setVelocityX(Phaser.Math.Linear(body.velocity.x, direction * SPEED, Math.min(1, delta / (this.level.market?.slippery && body.blocked.down ? (direction ? 140 : 350) : direction ? 65 : 45))));
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
    if(this.level.market && body.blocked.down) {
      this.level.market.checkpoints.forEach((cp,i)=>{if(i>this.checkpointIndex&&Math.abs(this.player.x-cp.x)<70&&Math.abs(this.player.y-cp.y)<40){
        this.checkpointIndex=i;this.checkpoint=cp.x;this.checkpointY=cp.y;
        progression.saves.data.checkpoints[this.level.id]=i;progression.saves.save();
        const text=label(this,this.player.x,this.player.y-70,'CHECKPOINT ✓',16);this.time.delayedCall(1500,()=>text.destroy());
      }});
    }
    if (!this.level.market && body.blocked.down && this.player.y > 420) {
      const index = platforms.findIndex(p => this.player.x > p.x + 30 && this.player.x < p.x + p.w - 30);
      if (index > this.checkpointIndex) {
        this.checkpointIndex = index; this.checkpoint = platforms[index].x + 60;
        const notice = label(this, 480, 90, 'CHECKPOINT AMAN ✓', 22).setOrigin(0.5).setScrollFactor(0).setDepth(25);
        this.tweens.add({ targets: notice, alpha: 0, delay: 1100, duration: 400, onComplete: () => notice.destroy() });
      }
    }
    if (this.player.y > 580) {
      // Falls must recover even during an existing sandal cooldown.
      if (this.time.now < this.state.invulnerableUntil) { this.player.setPosition(this.checkpoint, this.checkpointY).setVelocity(0, 0); }
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
