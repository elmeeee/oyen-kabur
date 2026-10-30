import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
test('playable game flow in Chromium', { timeout: 60000 }, async () => {
  const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { stdio: 'pipe' });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    for (let i = 0; i < 50; i++) {
      try { await page.goto('http://127.0.0.1:4178'); break; } catch { await new Promise(r => setTimeout(r, 100)); }
    }
    await page.waitForFunction(async () => {
      // @ts-expect-error Vite serves the game module directly for integration inspection.
      const { game } = await import('/src/main.ts');
      return game.scene.isActive('MainMenuScene');
    });
    await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    // Read engine state without adding a production debug API.
    const inspect = async (expression: string) => page.evaluate(async expression => {
      // @ts-expect-error Runtime Vite module URL.
      const { game } = await import('/src/main.ts');
      const scene = game.scene.getScene('GameScene');
      return new Function('scene', 'game', `return (${expression})`)(scene, game);
    }, expression);
    await page.keyboard.press('Escape');
    const pausedX = await inspect('scene.player.x');
    await page.waitForTimeout(200);
    assert.equal(await inspect('scene.player.x'), pausedX);
    assert.equal(await inspect('scene.paused'), true);
    await page.keyboard.press('Escape');
    assert.equal(await inspect('scene.paused'), false);
    const startX = await inspect('scene.player.x') as number;
    await page.keyboard.down('d'); await page.waitForTimeout(500); await page.keyboard.up('d');
    assert.ok((await inspect('scene.player.x') as number) > startX + 60);
    const groundY = await inspect('scene.player.y') as number;
    await page.keyboard.down('Space'); await page.waitForTimeout(180);
    await page.keyboard.up('Space');
    assert.ok((await inspect('scene.player.y') as number) < groundY - 30);
    await inspect('(scene.player.setPosition(270, 370).setVelocity(0, 0), true)');
    await page.waitForTimeout(120); assert.equal(await inspect('scene.state.score'), 10);
    await inspect('(scene.hurt(), scene.hurt(), true)'); assert.equal(await inspect('scene.state.lives'), 2);
    await inspect('(scene.state.invulnerableUntil = 0, scene.hurt(), scene.state.invulnerableUntil = 0, scene.hurt(), true)');
    assert.equal(await inspect('game.scene.isActive("GameOverScene")'), true);
    await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    assert.equal(await inspect('scene.state.lives'), 3); assert.equal(await inspect('scene.state.score'), 0);
    await inspect('(scene.player.setPosition(3480, 440).setVelocity(0, 0), true)');
    await page.waitForTimeout(150); assert.equal(await inspect('game.scene.isActive("VictoryScene")'), true);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    assert.equal(await inspect('game.scene.isActive("MainMenuScene")'), true);
    await page.screenshot({ path: '/tmp/oyen-menu.png' });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.kill(); }
});
