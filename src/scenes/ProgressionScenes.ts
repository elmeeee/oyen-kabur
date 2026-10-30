import Phaser from 'phaser';
import { progression } from '../progression/ProgressionManager';
import { LevelLoader, worlds } from '../progression/registry';
import { button, label, village } from './presentation';
export class WorldMapScene extends Phaser.Scene {
  constructor() { super('WorldMapScene'); }
  create(): void {
    village(this); label(this, 40, 25, `PETA DUNIA  •  Fish ${progression.saves.data.currency}`, 26);
    worlds.forEach((w, i) => {
      const unlocked = progression.worldUnlocked(w.id);
      button(this, 110 + i * 66, `${w.name} ${!unlocked ? '🔒' : !w.available ? '(soon)' : '→'}`, () => { if (w.available && unlocked) this.scene.start('LevelSelectScene'); });
    });
    const reset = label(this, 40, 470, 'Reset save', 18).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => { if (window.confirm('Reset all level progress and fish currency?')) { progression.saves.reset(); this.scene.restart(); } });
    if (!progression.saves.persistent) label(this, 40, 505, 'Storage unavailable: progress lasts this session.', 14);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('LevelSelectScene'));
  }
}
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }
  create(): void {
    village(this); label(this, 40, 25, 'WORLD 1 — KAMPUNG OYEN', 26);
    worlds[0].levelIds.forEach((id, i) => {
      const level = LevelLoader.load(id), record = progression.saves.data.records[id];
      button(this, 110 + i * 72, `${i + 1}. ${level.name}`, () => { if (progression.unlocked(id)) this.scene.start('GameScene', { levelId: id }); });
      label(this, 650, 102 + i * 72, progression.unlocked(id) ? `${record?.stars ?? 0}/3 ★  Best ${record?.bestScore ?? 0}` : 'LOCKED', 14);
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene', { levelId: 'w1-l1' }));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('WorldMapScene'));
  }
}
export class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }
  create(data: { levelId: string; won: boolean; score: number; stars: number }): void {
    village(this);
    label(this, 480, 100, data.won ? 'IKAN AMAN!' : 'COBA LAGI!', 44).setOrigin(0.5);
    label(this, 480, 180, LevelLoader.load(data.levelId).name, 24).setOrigin(0.5);
    label(this, 480, 240, `Score ${data.score}   Stars ${data.stars}/3\nFish bank ${progression.saves.data.currency}`, 22).setOrigin(0.5);
    button(this, 330, 'REPLAY', () => this.scene.start('GameScene', { levelId: data.levelId }));
    button(this, 400, 'LEVEL SELECT', () => this.scene.start('LevelSelectScene'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene', { levelId: data.levelId }));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
