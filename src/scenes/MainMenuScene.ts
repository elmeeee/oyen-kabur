import Phaser from 'phaser';
import { generateTextures, preloadAssets } from '../assets/pipeline';
import { button, label, village } from './presentation';
export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }
  preload(): void { preloadAssets(this); }
  create(): void {
    generateTextures(this); village(this);
    this.add.rectangle(480, 269, 720, 428, 0x193b3c, 0.96).setStrokeStyle(3, 0x658a73);
    label(this, 480, 92, 'SEBUAH PETUALANGAN KAMPUNG', 14, '#a9c9a1').setOrigin(0.5);
    label(this, 480, 156, 'OYEN KABUR!', 62, '#ffc66d').setOrigin(0.5);
    label(this, 480, 208, 'One chubby cat. A stolen fish. A lot of sandals.', 16).setOrigin(0.5);
    this.add.sprite(480, 255, 'oyen-idle').play('oyen-idle').setScale(2);
    button(this, 345, 'MULAI / START  →', () => this.scene.start('GameScene'));
    label(this, 480, 403, 'A / D or ← →   MOVE     SPACE / ↑   JUMP', 16).setOrigin(0.5);
    label(this, 480, 437, 'Collect fish. Dodge sandals. Reach the pos ronda.', 14, '#a9c9a1').setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
  }
}
