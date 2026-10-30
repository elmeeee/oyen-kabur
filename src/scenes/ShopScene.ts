import Phaser from 'phaser';
import { catalog, type CosmeticId } from '../progression/catalog';
import { progression } from '../progression/ProgressionManager';
import { drawCosmetic } from '../entities/Cosmetics';
import { button, label, village } from './presentation';
export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }
  create(): void {
    village(this); label(this, 35, 25, 'TOKO MANG UJANG', 32);
    const balance = label(this, 35, 70, '', 20);
    const message = label(this, 480, 485, '', 16).setOrigin(0.5);
    let selected: CosmeticId = 'bandana';
    const cat = this.add.sprite(180, 230, 'oyen-idle').play('oyen-idle').setScale(3);
    const overlay = this.add.graphics().setDepth(7);
    const sync = () => { drawCosmetic(overlay, cat, selected); balance.setText(`Fish: ${progression.saves.data.currency}\nEquipped: ${progression.saves.data.equipped ?? 'none'}`); };
    this.events.on('update', sync); this.events.once('shutdown', () => this.events.off('update', sync));
    catalog.forEach((item, i) => button(this, 130 + i * 62, `${item.name} — ${item.price}`, () => { selected = item.id; message.setText(`Preview: ${item.name}${progression.saves.data.owned.includes(item.id) ? ' (owned)' : ''}`); }));
    button(this, 330, 'BUY SELECTED', () => { message.setText(progression.saves.purchase(selected) ? 'Purchased!' : 'Already owned or not enough fish.'); });
    button(this, 392, 'EQUIP / UNEQUIP', () => { const id = progression.saves.data.equipped === selected ? null : selected; message.setText(progression.saves.equip(id) ? 'Outfit updated.' : 'Purchase this item first.'); });
    button(this, 454, 'WORLD MAP', () => this.scene.start('WorldMapScene'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('WorldMapScene'));
  }
}
export class AchievementsScene extends Phaser.Scene {
  constructor() { super('AchievementsScene'); }
  create(): void {
    village(this); label(this, 40, 40, 'PENCAPAIAN / ACHIEVEMENTS', 30);
    const data = progression.saves.data;
    [['fish100', `Fish collector: ${Math.min(100, data.collectedFish)}/100`], ['clean-level', 'Finish a level without taking damage'], ['clean-boss', 'Finish a boss without taking damage']].forEach(([id, text], i) => label(this, 80, 150 + i * 80, `${data.achievements.includes(id) ? '✓' : '○'} ${text}`, 22));
    button(this, 430, 'WORLD MAP', () => this.scene.start('WorldMapScene'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('WorldMapScene'));
  }
}
