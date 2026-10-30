import Phaser from 'phaser';
export const ink = '#f9e9be';
export function label(scene: Phaser.Scene, x: number, y: number, text: string, size = 18, color = ink): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: 'monospace', fontSize: size, color, fontStyle: 'bold' });
}
export function village(scene: Phaser.Scene, width = 960): void {
  scene.cameras.main.setBackgroundColor('#91beb0');
  const g = scene.add.graphics().setScrollFactor(0.18);
  g.fillStyle(0xf8dc9a).fillCircle(760, 95, 42);
  g.fillStyle(0xc6d7b7);
  for (let i = 0; i < width / 170 + 5; i++) g.fillEllipse(i * 170, 280, 270, 210);
  scene.add.image(0, 482, 'kampung-panorama').setOrigin(0, 1).setScale(3).setScrollFactor(0.25);
  const far = scene.add.graphics().setScrollFactor(0.35).setAlpha(0.2);
  for (let i = 0; i < width / 150 + 5; i++) {
    const x = i * 155, y = 310 + (i % 3) * 20;
    far.fillStyle(i % 2 ? 0x769a89 : 0x638c81).fillRect(x, y, 120, 190);
    far.fillStyle(0x506f66).fillTriangle(x - 12, y, x + 60, y - 55, x + 134, y);
    far.fillStyle(0xb7c4a0).fillRect(x + 20, y + 25, 20, 30).fillRect(x + 78, y + 25, 20, 30);
    far.lineStyle(3, 0x526f62).lineBetween(x + 138, y - 55, x + 138, 490);
    far.lineStyle(1, 0x526f62).lineBetween(x, y - 40, x + 155, y - 25);
  }
}
const menus = new WeakMap<Phaser.Scene, { entries: { box: Phaser.GameObjects.Rectangle; action: () => void }[]; index: number }>();
export function button(scene: Phaser.Scene, y: number, text: string, action: () => void): void {
  const b = scene.add.rectangle(480, y, 294, 52, 0xf3be64).setStrokeStyle(3, 0x684a32).setInteractive({ useHandCursor: true });
  const t = label(scene, 480, y, text, 20, '#233b39').setOrigin(0.5);
  b.on('pointerover', () => b.setFillStyle(0xffd98b)); b.on('pointerout', () => b.setFillStyle(0xf3be64));
  b.on('pointerdown', action); t.setDepth(1);
  let menu = menus.get(scene);
  if (!menu) {
    menu = { entries: [], index: 0 }; menus.set(scene, menu);
    const state = menu;
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (['ArrowDown', 'ArrowUp', 'Tab'].includes(event.key)) {
        event.preventDefault(); state.index = (state.index + (event.key === 'ArrowUp' || event.shiftKey ? -1 : 1) + state.entries.length) % state.entries.length;
        state.entries.forEach((e, i) => e.box.setStrokeStyle(i === state.index ? 4 : 3, i === state.index ? 0xffffff : 0x684a32));
      }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.entries[state.index]?.action(); }
    };
    scene.input.keyboard?.on('keydown', keyboard);
    scene.events.once('shutdown', () => { scene.input.keyboard?.off('keydown', keyboard); menus.delete(scene); });
  }
  menu.entries.push({ box: b, action });
  if (menu.entries.length === 1) b.setStrokeStyle(4, 0xffffff);
}
