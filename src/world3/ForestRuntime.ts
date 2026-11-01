import Phaser from 'phaser';
import type { LevelDefinition } from '../progression/registry';
import { MonyetSultan } from './MonyetSultan';
import { currentImpulse, FragilePlatform, MonkeyAttack } from './mechanics';
import { SwingingBridge } from './SwingingBridge';
import type { Point } from './definitions';
interface Monkey {
  sprite: Phaser.GameObjects.Sprite;
  warning: Phaser.GameObjects.Text;
  attack: MonkeyAttack;
  summoned: boolean;
}
export class ForestRuntime {
  readonly boss = new MonyetSultan();
  readonly bridges: SwingingBridge[] = [];
  readonly fragile: { sprite: Phaser.Physics.Arcade.Image; model: FragilePlatform }[] = [];
  private shots = new Set<Phaser.Physics.Arcade.Sprite>();
  private monkeys: Monkey[] = [];
  private secrets: { sprite: Phaser.GameObjects.TileSprite; revealed: boolean }[] = [];
  private clock = 0;
  private waterEffects: Phaser.GameObjects.TileSprite[] = [];
  private bossSprite?: Phaser.GameObjects.Sprite;
  private bossStarted = false;
  private hurtUntil = 0;
  private warning: Phaser.GameObjects.Text;
  private health: Phaser.GameObjects.Graphics;
  private slamMarks: Phaser.GameObjects.Text[] = [];
  private muteLabel: Phaser.GameObjects.Text;
  private muted = false;
  constructor(private scene: Phaser.Scene, private level: LevelDefinition, private player: Phaser.Physics.Arcade.Sprite, private hurt: () => void) {
    const f = level.forest!;
    this.warning = scene.add.text(480, 88, '', { fontFamily: 'monospace', fontSize: '17px', color: '#f5dfaa', backgroundColor: '#193833', align: 'center' }).setOrigin(.5).setScrollFactor(0).setDepth(26);
    this.health = scene.add.graphics().setScrollFactor(0).setDepth(27);
    try { this.muted = localStorage.getItem('oyen-forest-muted') === 'true'; } catch { /* session fallback */ }
    this.muteLabel = scene.add.text(940, 508, '', { fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#193833', color: '#f5dfaa' }).setOrigin(1, 0).setScrollFactor(0).setDepth(27).setInteractive({ useHandCursor: true });
    const toggle = () => {
      this.muted = !this.muted; this.updateMuteLabel();
      if (this.muted) for (const key of ['forest-crack', 'forest-boss-hit', 'forest-roar', 'forest-clear']) scene.sound.stopByKey(key);
      try { localStorage.setItem('oyen-forest-muted', String(this.muted)); } catch { /* session fallback */ }
    };
    this.updateMuteLabel();
    this.muteLabel.on('pointerdown', toggle);
    scene.input.keyboard?.on('keydown-M', toggle);
    for (const cp of f.checkpoints) {
      scene.add.image(cp.x, cp.y - 14, 'forest-stalks').setScale(.45).setDepth(1);
      scene.add.text(cp.x, cp.y - 70, '⚑', { color: '#f5dfaa', fontSize: '18px' }).setOrigin(.5);
    }
    for (let x = 160; x < level.width; x += 260) scene.add.image(x, 430, 'forest-stalks').setDepth(1);
    for (const d of f.bridges) this.bridges.push(new SwingingBridge(scene, d, player));
    for (const d of f.fragile) {
      const sprite = scene.physics.add.staticImage(d.x + d.width / 2, d.y + 7, 'forest-fragile').setDisplaySize(d.width, 16).refreshBody();
      const model = new FragilePlatform(d.warningMs, d.respawnMs);
      scene.physics.add.collider(player, sprite, () => { if (player.body!.touching.down) { if (model.state === 'solid') this.sound('forest-crack'); model.touch(); } });
      this.fragile.push({ sprite, model });
    }
    for (const c of f.currents) {
      this.waterEffects.push(scene.add.tileSprite(c.x, c.y, c.width, c.height, 'forest-water', 0).setOrigin(0).setAlpha(.48).setDepth(3));
      scene.add.text(c.x + 20, c.y + 20, `${c.forceX > 0 ? '→' : '←'} CURRENT`, { color: '#b1e4cf', fontSize: '16px', backgroundColor: '#193833' });
    }
    for (const z of f.slippery) scene.add.tileSprite(z.x, 482, z.width, 32, 'forest-rock').setOrigin(0).setDepth(1);
    for (const c of f.currents) this.waterEffects.push(scene.add.tileSprite(c.x + c.width / 2, f.top + 15, 96, 467 - f.top, 'forest-water', 1).setOrigin(.5, 0).setAlpha(.35).setDepth(2));
    for (const s of f.secrets) this.secrets.push({ sprite: scene.add.tileSprite(s.x, s.y, s.width, s.height, 'forest-foliage').setOrigin(0).setDepth(8), revealed: false });
    for (const p of f.monkeys) this.addMonkey(p, false);
    if (f.boss) this.bossSprite = scene.add.sprite(f.boss.x, f.boss.y, 'monyet-sultan').setDepth(4);
    scene.events.once('shutdown', () => {
      scene.input.keyboard?.off('keydown-M', toggle);
      this.shots.clear(); this.monkeys = [];
    });
  }
  private updateMuteLabel(): void { this.muteLabel.setText(`M: FOREST SFX ${this.muted ? 'OFF' : 'ON'}`); }
  private sound(key: string): void { if (!this.muted && !this.scene.sound.locked) this.scene.sound.play(key, { volume: .3 }); }
  get defeated(): boolean { return this.boss.state === 'defeated'; }
  isSlippery(x: number): boolean { return this.level.forest!.slippery.some(s => x >= s.x && x <= s.x + s.width); }
  private addMonkey(p: Point, summoned: boolean): void {
    const sprite = this.scene.add.sprite(p.x, p.y, 'forest-monkey').setDepth(4);
    const warning = this.scene.add.text(p.x, p.y - 48, '', { color: '#f5dfaa', backgroundColor: '#193833', fontSize: '15px' }).setOrigin(.5).setDepth(10);
    this.monkeys.push({ sprite, warning, attack: new MonkeyAttack(), summoned });
  }
  private projectile(x: number, y: number, vx: number, vy: number, wave = false): void {
    const s = this.scene.physics.add.sprite(x, y, wave ? 'forest-shockwave' : 'forest-banana').setDepth(6);
    s.body.setAllowGravity(false);
    s.setSize(wave ? 44 : 16, wave ? 12 : 14).setOffset(wave ? 10 : 8, wave ? 18 : 10).setVelocity(vx, vy);
    if (wave) s.play('forest-shockwave');
    this.shots.add(s);
    // One collider per group would also work; destruction removes this pair on cleanup.
    const overlap = this.scene.physics.add.overlap(this.player, s, () => { this.hurt(); s.destroy(); this.shots.delete(s); });
    s.once('destroy', () => overlap.destroy());
  }
  /** Called after input velocity: currents add a bounded impulse to the result. */
  update(delta: number): void {
    this.clock += delta;
    const f = this.level.forest!;
    for (const water of this.waterEffects) {
      water.setFrame(Math.floor(this.clock / 125) % 4);
      water.tilePositionY = -this.clock / 45;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    for (const c of f.currents) {
      const impulse = currentImpulse(c, this.player.x, this.player.y, delta);
      body.velocity.x += impulse.x; body.velocity.y += impulse.y;
    }
    for (const b of this.bridges) b.update(this.clock, delta);
    for (const { sprite, model } of this.fragile) {
      const occupied = Math.abs(this.player.x - sprite.x) < sprite.displayWidth / 2 + 20 && Math.abs(this.player.y - sprite.y) < 65;
      model.update(delta, occupied);
      sprite.body!.enable = model.state !== 'absent';
      sprite.setVisible(model.state !== 'absent').setFrame(model.state === 'warning' ? 1 : 0);
      sprite.setAlpha(model.state === 'warning' ? .6 + .4 * Math.sin(this.clock / 60) : 1);
    }
    for (const s of this.secrets) {
      if (!s.revealed && Math.abs(this.player.x - (s.sprite.x + s.sprite.width / 2)) < s.sprite.width / 2 + 40 && Math.abs(this.player.y - (s.sprite.y + s.sprite.height / 2)) < 100) {
        s.revealed = true;
        this.scene.tweens.add({ targets: s.sprite, alpha: .12, duration: 300 });
        const text = this.scene.add.text(s.sprite.x, s.sprite.y - 20, 'JALUR RAHASIA! • secret fish', { color: '#f5dfaa', fontSize: '14px' }).setDepth(10);
        this.scene.time.delayedCall(2500, () => text.destroy());
      }
    }
    for (const m of this.monkeys) {
      const fire = m.attack.update(delta, Math.abs(m.sprite.x - this.player.x) < 560 && Math.abs(m.sprite.y - this.player.y) < 260);
      m.warning.setText(m.attack.state === 'warning' ? 'PISANG! ↓' : '');
      m.sprite.setFrame(m.attack.state === 'warning' ? 2 + Math.floor(this.clock / 160) % 2 : Math.floor(this.clock / 300) % 2).setFlipX(this.player.x < m.sprite.x);
      if (fire) {
        const dx = this.player.x - m.sprite.x, dy = this.player.y - m.sprite.y;
        const length = Math.max(Math.hypot(dx, dy), 1);
        this.projectile(m.sprite.x, m.sprite.y, dx / length * 165, dy / length * 165);
      }
    }
    for (const s of this.shots) {
      if (!s.active || s.y > 620 || s.y < f.top - 150 || Math.abs(s.x - this.player.x) > 1100) { s.destroy(); this.shots.delete(s); }
      else if (s.texture.key === 'forest-banana') s.rotation += delta / 180;
    }
    if (!f.boss || !this.bossSprite || this.defeated) return;
    if (!this.bossStarted && this.player.x < f.boss.arenaLeft) return;
    this.bossStarted = true;
    const transitions = this.boss.update(delta);
    const state = this.boss.state;
    const frame = state === 'recovery' ? 7 : state === 'attack' ? [2 + Math.floor(this.clock / 130) % 2, 4, 5][this.boss.phase - 1] : Math.floor(this.clock / 260) % 2;
    this.bossSprite.setFrame(this.clock < this.hurtUntil ? 6 : frame).setTint(this.clock < this.hurtUntil ? 0xffb1a0 : state === 'recovery' ? 0xc9f5b5 : 0xffffff);
    const cue = this.boss.attack === 'banana-fan' ? 'BANANAS → Jump or duck between lanes' : this.boss.attack === 'ground-slam' ? 'GROUND SLAM → Jump the low wave' : 'SUMMONS → Watch the marked perches';
    this.warning.setText(`MONYET SULTAN • Phase ${this.boss.phase}/3 • HP ${this.boss.health}/9\n${state === 'recovery' ? 'TIRED! Touch Sultan once to hit' : state === 'telegraph' ? cue : state.toUpperCase()}`);
    this.health.clear().fillStyle(0x77513d).fillRect(345, 117, 270, 8).fillStyle(0xe7ac42).fillRect(345, 117, 30 * this.boss.health, 8);
    if (state === 'telegraph' && this.slamMarks.length === 0 && this.boss.phase >= 2) {
      for (const x of this.boss.phase === 2 ? [f.boss.x - 160, f.boss.x - 340] : [f.boss.arenaLeft + 90, f.boss.x + 95]) {
        this.slamMarks.push(this.scene.add.text(x, 415, this.boss.phase === 2 ? '↑ JUMP' : 'MONKEY ↓', { color: '#f5dfaa', backgroundColor: '#77513d', fontSize: '16px' }).setOrigin(.5).setDepth(9));
      }
    }
    if (transitions.includes('attack')) {
      this.sound('forest-roar');
      if (this.boss.phase === 1) {
        for (const y of [448, 365]) this.projectile(f.boss.x - 60, y, -190, 0);
      } else if (this.boss.phase === 2) {
        this.projectile(f.boss.x - 55, 465, -230, 0, true);
        this.projectile(f.boss.x + 55, 465, 230, 0, true);
      } else {
        // Replacements keep the arena bounded: at most two summoned attackers.
        for (const m of this.monkeys.filter(m => m.summoned)) { m.sprite.destroy(); m.warning.destroy(); }
        this.monkeys = this.monkeys.filter(m => !m.summoned);
        this.addMonkey({ x: f.boss.arenaLeft + 90, y: 370 }, true);
        this.addMonkey({ x: f.boss.x + 95, y: 370 }, true);
        this.projectile(f.boss.x - 55, 465, -200, 0, true);
      }
      for (const mark of this.slamMarks) mark.destroy();
      this.slamMarks = [];
    }
    if (Math.abs(this.player.x - f.boss.x) < 64 && Math.abs(this.player.y - f.boss.y) < 65) {
      if (this.boss.hit()) {
        this.hurtUntil = this.clock + 220; this.sound('forest-boss-hit'); this.player.setVelocityY(-200);
        if (this.defeated) {
          this.bossSprite.setFrame(8).clearTint(); this.health.clear();
          this.warning.setText('SULTAN MENYERAH! • Forest exit →'); this.sound('forest-clear');
          for (const s of this.shots) s.destroy(); this.shots.clear();
          for (const m of this.monkeys) { m.sprite.destroy(); m.warning.destroy(); } this.monkeys = [];
        }
      } else if (state === 'attack') this.hurt();
    }
  }
}
