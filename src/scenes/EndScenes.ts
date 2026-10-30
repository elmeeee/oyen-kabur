import Phaser from 'phaser';
import { button, label, village } from './presentation';
class EndScene extends Phaser.Scene {
  private score = 0;
  constructor(key: string, private readonly won: boolean) { super(key); }
  init(data: { score?: number }): void { this.score = data.score ?? 0; }
  create(): void {
    village(this);
    this.add.rectangle(480, 270, 680, 400, 0x193b3c, 0.97).setStrokeStyle(3, 0x658a73);
    label(this, 480, 132, this.won ? 'IKAN AMAN!' : 'YAH, KETANGKAP!', 42, '#ffc66d').setOrigin(0.5);
    label(this, 480, 190, this.won ? 'Oyen made it to the pos ronda. Feast time!' : 'The kampung has a very accurate throwing arm.', 16).setOrigin(0.5);
    this.add.image(480, 245, 'oyen').setScale(2);
    label(this, 480, 300, `FISH SCORE  ${String(this.score).padStart(3, '0')}`, 24).setOrigin(0.5);
    button(this, 367, 'MAIN LAGI / RESTART', () => this.scene.start('GameScene'));
    label(this, 480, 427, 'ENTER / R to retry    •    ESC for menu', 15, '#a9c9a1').setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard?.once('keydown-R', () => this.scene.start('GameScene'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
export class GameOverScene extends EndScene { constructor() { super('GameOverScene', false); } }
export class VictoryScene extends EndScene { constructor() { super('VictoryScene', true); } }
