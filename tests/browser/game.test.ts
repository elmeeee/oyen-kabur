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
    // Read engine state without adding a production debug API.
    const inspect = async (expression: string) => page.evaluate(async expression => {
      // @ts-expect-error Runtime Vite module URL.
      const { game } = await import('/src/main.ts');
      const scene = game.scene.getScene('GameScene');
      return new Function('scene', 'game', `return (${expression})`)(scene, game);
    }, expression);
    const waitFor = async (expression: string) => {
      const deadline=Date.now()+15000;
      while(!(await inspect(expression))) { assert.ok(Date.now()<deadline,`Timed out: ${expression}`); await page.waitForTimeout(35); }
    };
    const advance = async (ms: number) => inspect(`new Promise((resolve,reject)=>{
      let elapsed=0;
      const timer=setTimeout(()=>{scene.events.off('postupdate',tick);reject(Error('Scene did not advance'));},15000);
      const tick=(_time,delta)=>{elapsed+=delta;if(elapsed>=${ms}){scene.events.off('postupdate',tick);clearTimeout(timer);resolve();}};
      scene.events.on('postupdate',tick);
    })`);
    await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    await page.keyboard.press('Enter'); await waitFor('game.scene.isActive("WorldMapScene")');
    await page.keyboard.press('Enter'); await waitFor('game.scene.isActive("LevelSelectScene")');
    await page.keyboard.press('Enter'); await waitFor('game.scene.isActive("GameScene")'); await advance(600);
    await page.keyboard.press('Escape');
    const pausedX = await inspect('scene.player.x');
    await page.waitForTimeout(200);
    assert.equal(await inspect('scene.player.x'), pausedX);
    assert.equal(await inspect('scene.paused'), true);
    await page.keyboard.press('Escape');
    assert.equal(await inspect('scene.paused'), false);
    const startX = await inspect('scene.player.x') as number;
    await page.keyboard.down('d'); await advance(500); await page.keyboard.up('d');
    assert.ok((await inspect('scene.player.x') as number) > startX + 60);
    // Take off from clear ground; the movement check can finish under a low roof.
    await inspect('(scene.player.body.reset(90,454),scene.player.setVelocity(0,0),true)'); await advance(100);
    const groundY = await inspect('scene.player.y') as number;
    await page.keyboard.down('Space'); await advance(180);
    await page.keyboard.up('Space');
    assert.ok((await inspect('scene.player.y') as number) < groundY - 30);
    await inspect('(scene.player.setPosition(300, 370).setVelocity(0, 0), true)');
    await page.waitForTimeout(120); assert.equal(await inspect('scene.state.score'), 10);
    await inspect('(scene.hurt(), scene.hurt(), true)'); assert.equal(await inspect('scene.state.lives'), 2);
    await inspect('(scene.state.invulnerableUntil = 0, scene.hurt(), scene.state.invulnerableUntil = 0, scene.hurt(), true)');
    assert.equal(await inspect('game.scene.isActive("ResultScene")'), true);
    await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    assert.equal(await inspect('scene.state.lives'), 3); assert.equal(await inspect('scene.state.score'), 0);
    await inspect('(scene.player.setPosition(scene.level.goal, 440).setVelocity(0, 0), true)');
    await page.waitForTimeout(150); assert.equal(await inspect('game.scene.isActive("ResultScene")'), true);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    assert.equal(await inspect('game.scene.isActive("MainMenuScene")'), true);
    await page.screenshot({ path: '/tmp/oyen-menu.png' });
    await page.evaluate(async () => {
      // @ts-expect-error Vite module URL
      const { progression } = await import('/src/progression/ProgressionManager.ts');
      for(let i=1;i<=5;i++) progression.complete(`w1-l${i}`,0,3);
    });
    for(let i=1;i<=5;i++) {
      await inspect(`(game.scene.start('GameScene', {levelId:'w2-l${i}'}), true)`);
      await page.waitForTimeout(250);
      assert.equal(await inspect('scene.level.id'), `w2-l${i}`);
      assert.equal(await inspect('game.textures.exists("juragan-lele")'), true);
      if(i===5) {
        const fight = await inspect(`(()=>{
          const boss=scene.market.boss;
          scene.state.invulnerableUntil=Number.MAX_SAFE_INTEGER;
          for(let hit=0;hit<6;hit++){
            scene.player.setPosition(scene.level.goal-170,418).setVelocity(0,0);
            const hp=boss.health;
            let steps=0;
            while(boss.state==='telegraph'&&steps++<20)scene.market.update(250);
            while(boss.state==='attack'&&steps++<20)scene.market.update(250);
            if(hit<5){
              if(boss.state!=='recovery'||!boss.vulnerable||boss.health!==hp-1)return false;
            }else if(!scene.market.defeated||boss.health!==0)return false;
            if(hit<5){
              steps=0;
              while(boss.state==='recovery'&&steps++<20)scene.market.update(250);
            }
          }
          return scene.market.defeated&&boss.health===0&&scene.market.shots.size===0;
        })()`);
        assert.equal(fight, true);
      }
      await page.screenshot({path:`/tmp/oyen-world2-${i}.png`});
      await inspect('(scene.player.setPosition(scene.level.goal, scene.level.market.goalY).setVelocity(0,0), true)');
      await page.waitForTimeout(150);
      assert.equal(await inspect('game.scene.isActive("ResultScene")'),true);
      if(i===5) {
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('oyen-progression')??'null').records['w2-l5']?.completed),true);
      }
    }
    await page.reload();
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(async()=>{
      // @ts-expect-error Vite module URL
      const {progression}=await import('/src/progression/ProgressionManager.ts');
      return progression.worldUnlocked('w3');
    }),true);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); server.kill(); }
});
