import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
test('World 3 runtime: physics, five levels, natural Sultan cycle, persistent unlock and replay', { timeout: 300000 }, async () => {
  const server = spawn('node', ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4179','--strictPort'], {stdio:'pipe'});
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-webgl']});
    const page = await browser.newPage({viewport:{width:960,height:540}});
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    for(let i=0;i<60;i++) {
      try { await page.goto('http://127.0.0.1:4179'); break; } catch { await page.waitForTimeout(100); }
    }
    const inspect = async (expression: string) => page.evaluate(async expression => {
      // @ts-expect-error Runtime Vite module.
      const {game}=await import('/src/main.ts');
      // @ts-expect-error Runtime Vite module.
      const {progression}=await import('/src/progression/ProgressionManager.ts');
      return new Function('scene','game','progression',`return (${expression})`)(game.scene.getScene('GameScene'),game,progression);
    }, expression);
    // Await module inspection before testing its boolean result.
    const waitFor = async (expression: string, timeout = 10000) => {
      const deadline = Date.now() + timeout;
      while (!(await inspect(expression))) {
        assert.ok(Date.now() < deadline, `Timed out: ${expression}`);
        await page.waitForTimeout(35);
      }
    };
    await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    // Software rendering can run below 60fps; hold controls for simulated game time.
    const advance = async (ms: number) => inspect(`new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{scene.events.off('postupdate',tick);reject(new Error('Scene did not advance'));},15000);
      let elapsed=0;
      const tick=(_time,delta)=>{elapsed+=delta;if(elapsed>=${ms}){scene.events.off('postupdate',tick);clearTimeout(timer);resolve();}};
      scene.events.on('postupdate',tick);
    })`);
    const start = async (i: number) => {
      await inspect(`(()=>{for(const active of game.scene.getScenes(true))game.scene.stop(active.scene.key);game.scene.start('GameScene',{levelId:'w3-l${i}'});return true})()`);
      await page.waitForTimeout(220);
      assert.equal(await inspect('scene.level.id'),`w3-l${i}`);
      assert.equal(await inspect('game.textures.get("monyet-sultan").frameTotal'),10); // base + nine frames
    };
    // Existing campaign cleared via its public manager; W3 results still use actual goal overlaps.
    await inspect(`(()=>{for(let w=1;w<=2;w++)for(let i=1;i<=5;i++)progression.complete('w'+w+'-l'+i,0,3);return true})()`);
    await start(1);
    await page.keyboard.down('d'); await advance(650); await page.keyboard.up('d');
    assert.ok((await inspect('scene.player.x') as number)>140);
    // A real held jump reaches the first bamboo platform, without moving the player in flight.
    await inspect('(scene.player.setPosition(140,454).setVelocity(0,0),true)'); await advance(100);
    await page.keyboard.down('d'); await page.keyboard.down('Space');
    await advance(520); await page.keyboard.up('d'); await page.keyboard.up('Space');
    await advance(220);
    assert.ok((await inspect('scene.player.x') as number)>220);
    assert.ok((await inspect('scene.player.y') as number)<390, 'landed on bamboo: '+JSON.stringify(await inspect('[scene.player.x,scene.player.y]')));
    // Hidden collectible reveals foliage and credits the existing pickup economy.
    const bank = await inspect('progression.saves.data.collectedFish') as number;
    await inspect('(scene.player.setPosition(735,235).setVelocity(0,0),true)'); await advance(220);
    assert.ok((await inspect('scene.state.score') as number)>=10);
    assert.ok((await inspect('progression.saves.data.collectedFish') as number)>bank);
    assert.equal(await inspect('scene.forest.secrets[0].revealed'),true);
    await page.screenshot({path:'/tmp/oyen-world3-1.png'});
    const finish = async () => {
      await inspect('(scene.player.setPosition(scene.level.goal,scene.level.forest.goalY).setVelocity(0,0),true)');
      await page.waitForTimeout(300); assert.equal(await inspect('game.scene.isActive("ResultScene")'),true);
    };
    await finish();
    // Selector uses the correct world and supports replay.
    await inspect(`(game.scene.start('LevelSelectScene',{worldId:'w3'}),true)`); await page.waitForTimeout(100);
    assert.equal(await inspect('game.scene.isActive("LevelSelectScene")'),true);
    await start(2);
    await inspect(`(()=>{const b=scene.forest.bridges[0];scene.player.body.reset(b.sprite.x,b.sprite.body.top-28);scene.player.setVelocity(0,0);return true})()`);
    await advance(220);
    const bridgeX=await inspect('scene.player.x') as number;
    assert.ok(Math.abs((await inspect('scene.player.body.bottom - scene.forest.bridges[0].sprite.body.top') as number))<3,'rider stays on deck');
    await advance(250);
    assert.ok(Math.abs((await inspect('scene.player.x') as number)-bridgeX)>1,'bridge carries rider');
    await page.keyboard.down('Space'); await advance(150); await page.keyboard.up('Space');
    assert.ok((await inspect('scene.player.body.velocity.y') as number)<-100,'jump from moving deck: '+JSON.stringify(await inspect('[scene.player.x,scene.player.y,scene.player.body.velocity.y,scene.groundedAt,scene.jumpAt,scene.time.now,scene.player.body.touching,scene.player.body.blocked]')));
    await inspect(`(()=>{const f=scene.forest.fragile[0];scene.player.body.reset(f.sprite.x,f.sprite.body.top-28);scene.player.setVelocity(0,0);return true})()`);
    await advance(220); assert.equal(await inspect('scene.forest.fragile[0].model.state'),'warning');
    await page.keyboard.press('Escape');
    const paused=await inspect('[scene.forest.clock,scene.forest.fragile[0].model.elapsed,scene.forest.bridges[0].sprite.x]');
    await page.waitForTimeout(300); assert.deepEqual(await inspect('[scene.forest.clock,scene.forest.fragile[0].model.elapsed,scene.forest.bridges[0].sprite.x]'),paused);
    await page.keyboard.press('Escape'); await advance(1100);
    assert.equal(await inspect('scene.forest.fragile[0].model.state'),'absent');
    assert.equal(await inspect('scene.forest.fragile[0].sprite.body.enable'),false);
    await inspect('(scene.player.body.reset(1300,454),true)'); await advance(3600);
    assert.equal(await inspect('scene.forest.fragile[0].model.state'),'solid');
    await page.screenshot({path:'/tmp/oyen-world3-2.png'});
    await finish();
    await start(3);
    // Opposing input remains effective in a right-flowing current.
    await inspect('(scene.player.body.reset(800,454),scene.player.setVelocity(0,0),true)');
    await page.keyboard.down('a'); await advance(300); await page.keyboard.up('a');
    assert.ok((await inspect('scene.player.body.velocity.x') as number)<-100);
    await page.keyboard.press('m'); assert.equal(await inspect('scene.forest.muted'),true);
    await page.keyboard.press('m'); assert.equal(await inspect('scene.forest.muted'),false);
    await page.screenshot({path:'/tmp/oyen-world3-3.png'}); await finish();
    await start(4);
    // Each vertical shelf-to-shelf jump runs with actual Arcade gravity and held input.
    // Start at a supported shelf (checkpoint-style fixture); never teleport during a jump.
    for(let j=1;j<=8;j++) {
      await inspect(`(()=>{const p=scene.level.platforms[${j}];scene.player.body.reset(p.x+p.w-34,p.y-28);scene.player.setVelocity(0,0);return true})()`);
      await advance(70);
      await page.keyboard.down('d'); await page.keyboard.down('Space'); await advance(430);
      await page.keyboard.up('d'); await page.keyboard.up('Space'); await advance(280);
      const y=await inspect('scene.player.y') as number;
      const target=await inspect(`scene.level.platforms[${j+1}].y-28`) as number;
      assert.ok(Math.abs(y-target)<8,`real vertical jump ${j}: ${y} vs ${target}`);
    }
    // Natural monkey warning and projectile emission, while standing in range.
    await inspect('(scene.player.body.reset(475,242),scene.player.setVelocity(0,0),true)');
    await waitFor("scene.forest.monkeys[0].attack.state==='warning'");
    assert.equal(await inspect('scene.forest.monkeys[0].warning.text'),'PISANG! ↓');
    await advance(980); assert.ok((await inspect('scene.forest.shots.size') as number)>0);
    // Checkpoint is activated by a real grounded overlap, persisted and restored on R.
    await inspect('(scene.player.body.reset(1470,-148),scene.player.setVelocity(0,0),true)'); await advance(200);
    assert.equal(await inspect('progression.saves.data.checkpoints[scene.level.id]'),3);
    await page.keyboard.press('r'); await page.waitForTimeout(250);
    assert.equal(await inspect('scene.checkpointIndex'),3);
    assert.ok(Math.abs((await inspect('scene.player.x') as number)-1470)<5);
    await inspect('(scene.state.invulnerableUntil=0,scene.player.body.reset(1500,620),true)'); await advance(120);
    assert.equal(await inspect('scene.state.lives'),2);
    assert.ok(Math.abs((await inspect('scene.player.x') as number)-1470)<5);
    await page.screenshot({path:'/tmp/oyen-world3-4.png'}); await finish();
    await start(5);
    // Goal is blocked before victory; entering it also starts the natural boss clock.
    await inspect('(scene.player.body.reset(2370,454),scene.player.setVelocity(0,0),true)'); await advance(100);
    await inspect('(scene.player.body.reset(scene.level.goal,454),true)'); await advance(80);
    assert.equal(await inspect('game.scene.isActive("GameScene")'),true);
    await inspect('(scene.player.body.reset(2370,454),true)');
    const phases=new Set<number>(), attacks=new Set<string>();
    for(let hit=0;hit<9;hit++) {
      await waitFor("scene.forest.boss.state==='attack'", 15000);
      phases.add(await inspect('scene.forest.boss.phase') as number); attacks.add(await inspect('scene.forest.boss.attack') as string);
      assert.ok((await inspect('scene.forest.shots.size') as number)>0);
      if(hit===6) assert.equal(await inspect('scene.forest.monkeys.filter(m=>m.summoned).length'),2);
      if(hit===0) {
        await page.keyboard.press('Escape'); const elapsed=await inspect('scene.forest.boss.elapsed');
        await page.waitForTimeout(250); assert.equal(await inspect('scene.forest.boss.elapsed'),elapsed); await page.keyboard.press('Escape');
      }
      if ((await inspect('scene.forest.boss.phase') as number) === 2) {
        // Jump when the approaching wave is near, so its trailing edge clears before landing.
        await advance(280); await page.keyboard.down('Space');
      }
      await waitFor("scene.forest.boss.state==='recovery'");
      await page.keyboard.up('Space');
      await inspect('(scene.player.body.reset(2135,454),scene.player.setVelocity(0,0),true)');
      await advance(100); assert.equal(await inspect('scene.forest.boss.health'),8-hit);
      await page.screenshot({path:`/tmp/oyen-sultan-hit-${hit+1}.png`});
      await inspect('(scene.player.body.reset(scene.forest.boss.phase===3 ? 1190 : 2370,scene.forest.boss.phase===3 ? 372 : 454),scene.player.setVelocity(0,0),true)');
    }
    assert.deepEqual([...phases],[1,2,3]); assert.deepEqual([...attacks],['banana-fan','ground-slam','monkey-summons']);
    assert.equal(await inspect('scene.forest.defeated'),true);
    assert.equal(await inspect('scene.forest.shots.size'),0); assert.equal(await inspect('scene.forest.monkeys.length'),0);
    await finish(); assert.equal(await inspect('progression.worldUnlocked("w4")'),true);
    await page.reload(); await page.waitForTimeout(500);
    assert.equal(await inspect('progression.worldUnlocked("w4")'),true);
    assert.equal(await inspect('progression.unlocked("w4-l1")'),true);
    for(let i=1;i<=5;i++) assert.equal(await inspect(`progression.saves.data.records['w3-l${i}'].completed`),true);
    await start(4); assert.equal(await inspect('scene.checkpointIndex'),0);
    assert.deepEqual(errors,[]);
  } finally { await browser?.close(); server.kill(); }
});
