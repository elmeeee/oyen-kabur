import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
test('World 4: boats, water, storm, cranes, five goals, natural Captain phases and persistent World 5 unlock', { timeout: 240000 }, async () => {
  const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4181','--strictPort'],{stdio:'pipe'});
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-webgl']});
    const page=await browser.newPage({viewport:{width:960,height:540}});
    const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    for(let i=0;i<60;i++){try{await page.goto('http://127.0.0.1:4181');break;}catch{await page.waitForTimeout(100);}}
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
      await inspect(`(()=>{for(const active of game.scene.getScenes(true))game.scene.stop(active.scene.key);game.scene.start('GameScene',{levelId:'w4-l${i}'});return true})()`);
      await page.waitForTimeout(220);
      assert.equal(await inspect('scene.level.id'),`w4-l${i}`);
      assert.equal(await inspect('game.textures.get("kapten-bebek").frameTotal'),10); // base + nine frames
    };
    await inspect(`(()=>{for(let w=1;w<=3;w++)for(let i=1;i<=5;i++)progression.complete('w'+w+'-l'+i,0,3);return true})()`);
    const finish=async()=>{
      await inspect('(scene.player.body.reset(scene.level.goal,scene.level.harbor.goalY),scene.player.setVelocity(0,0),true)');
      await waitFor('game.scene.isActive("ResultScene")');
    };
    await start(1);
    await page.keyboard.down('d');await advance(500);await page.keyboard.up('d');
    assert.ok((await inspect('scene.player.x') as number)>150);
    // Actual keyboard jump from the first dock into the first container shelf.
    await inspect('(scene.player.body.reset(140,454),scene.player.setVelocity(0,0),true)');await advance(80);
    await page.keyboard.down('d');await page.keyboard.down('Space');await advance(520);
    await page.keyboard.up('d');await page.keyboard.up('Space');await advance(220);
    assert.ok((await inspect('scene.player.y') as number)<390,'container jump');
    await inspect('(scene.player.body.reset(295,370),scene.player.setVelocity(0,0),true)');await advance(150);
    assert.ok((await inspect('scene.state.score') as number)>=10);
    // Water costs one life and returns to safe ground; cooldown recovery still works.
    await inspect('(scene.player.body.reset(664,515),scene.player.setVelocity(0,0),true)');await advance(100);
    assert.equal(await inspect('scene.state.lives'),2);assert.ok((await inspect('scene.player.x') as number)<120);
    await inspect('(scene.player.body.reset(664,515),true)');await advance(100);
    assert.equal(await inspect('scene.state.lives'),2);assert.ok((await inspect('scene.player.x') as number)<120);
    await inspect('(scene.player.body.reset(808,454),scene.player.setVelocity(0,0),true)');await advance(150);
    assert.equal(await inspect('scene.checkpointIndex'),1);
    await page.screenshot({path:'/tmp/oyen-world4-1.png'});await finish();
    assert.equal(await inspect('progression.saves.data.checkpoints["w4-l1"]'),undefined);
    await start(2);
    await inspect(`(()=>{const b=scene.harbor.decks[3];scene.player.body.reset(b.sprite.x,b.sprite.body.top-28);scene.player.setVelocity(0,0);return true})()`);
    await advance(250);
    const boatX=await inspect('scene.player.x') as number;
    assert.ok(Math.abs(await inspect('scene.player.body.bottom-scene.harbor.decks[3].sprite.body.top') as number)<4,'boat supports rider: '+JSON.stringify(await inspect('[scene.player.x,scene.player.y,scene.player.body.bottom,scene.harbor.decks[3].sprite.x,scene.harbor.decks[3].sprite.body.top,scene.harbor.clock,scene.player.body.velocity.y]')));
    await waitFor(`Math.abs(scene.player.x-${boatX})>8`,5000); // Observe travel even near a wave turning point.
    await page.keyboard.down('Space');await advance(150);await page.keyboard.up('Space');
    assert.ok((await inspect('scene.player.body.velocity.y') as number)<-100,'jump from wave boat');
    await page.keyboard.press('Escape');const boatClock=await inspect('[scene.harbor.clock,scene.harbor.decks[3].sprite.x]');
    await page.waitForTimeout(250);assert.deepEqual(await inspect('[scene.harbor.clock,scene.harbor.decks[3].sprite.x]'),boatClock);
    await page.keyboard.press('Escape');
    await page.screenshot({path:'/tmp/oyen-world4-2.png'});await finish();
    await start(3);
    await inspect('(scene.player.body.reset(660,454),scene.player.setVelocity(0,0),true)');
    await page.keyboard.down('a');await advance(350);await page.keyboard.up('a');
    assert.ok((await inspect('scene.player.body.velocity.x') as number)<-100,'input opposes right wind');
    // Fixed strike at x=800: stand in the marked column, observe a complete warning.
    await inspect('(scene.player.body.reset(800,454),scene.player.setVelocity(0,0),true)');
    await waitFor('scene.harbor.lightning[0].model.state==="warning"');
    assert.ok((await inspect('scene.harbor.lightning[0].marker.text') as string).includes('PETIR'));
    const lives=await inspect('scene.state.lives');
    await page.keyboard.press('Escape');const weather=await inspect('[scene.harbor.clock,scene.harbor.lightning[0].model.elapsed]');
    await page.waitForTimeout(250);assert.deepEqual(await inspect('[scene.harbor.clock,scene.harbor.lightning[0].model.elapsed]'),weather);
    await page.keyboard.press('Escape');
    await advance(800);assert.equal(await inspect('scene.state.lives'),lives,'warning does not damage');
    await inspect('(scene.player.body.reset(800,454),scene.player.setVelocity(0,0),true)');
    await waitFor('scene.harbor.lightning[0].model.state==="strike"');
    assert.equal(await inspect('scene.harbor.lightning[0].bolt.visible'),true);
    await advance(100);assert.equal(await inspect('scene.state.lives'),(lives as number)-1,'warned lightning damages');
    await inspect('(scene.player.body.reset(900,454),scene.player.setVelocity(0,0),true)');await advance(300);
    assert.equal(await inspect('scene.state.lives'),(lives as number)-1,'safe outside the column');
    await page.screenshot({path:'/tmp/oyen-world4-3.png'});await finish();
    await start(4);
    // Verify stable collision and rider transport on a vertical crane.
    await inspect(`(()=>{const b=scene.harbor.decks[0];scene.player.body.reset(b.sprite.x,b.sprite.body.top-28);scene.player.setVelocity(0,0);return true})()`);
    await advance(250);const craneY=await inspect('scene.player.y') as number;
    assert.ok(Math.abs(await inspect('scene.player.body.bottom-scene.harbor.decks[0].sprite.body.top') as number)<4,'crane supports rider');
    await advance(400);assert.ok(Math.abs((await inspect('scene.player.y') as number)-craneY)>5,'crane carries rider vertically');
    await page.keyboard.down('Space');await advance(150);await page.keyboard.up('Space');
    assert.ok((await inspect('scene.player.body.velocity.y') as number)<-100,'jump from crane');
    // Critical canopy-style cargo ascent, with real Arcade jumps, no mid-air fixtures.
    for(let j=1;j<=8;j++){
      await inspect(`(()=>{const p=scene.level.platforms[${j}];scene.player.body.reset(p.x+p.w-34,p.y-28);scene.player.setVelocity(0,0);return true})()`);await advance(70);
      await page.keyboard.down('d');await page.keyboard.down('Space');await advance(430);
      await page.keyboard.up('d');await page.keyboard.up('Space');await advance(280);
      const y=await inspect('scene.player.y') as number,target=await inspect(`scene.level.platforms[${j+1}].y-28`) as number;
      assert.ok(Math.abs(y-target)<8,`cargo jump ${j}: ${y} vs ${target}`);
    }
    await inspect('(scene.player.body.reset(1470,-148),scene.player.setVelocity(0,0),true)');await advance(150);
    assert.equal(await inspect('progression.saves.data.checkpoints["w4-l4"]'),3);
    await page.keyboard.press('r');await page.waitForTimeout(250);assert.equal(await inspect('scene.checkpointIndex'),3);
    assert.ok(Math.abs((await inspect('scene.player.x') as number)-1470)<5);
    await inspect('(scene.player.body.reset(1500,620),true)');await advance(100);
    assert.equal(await inspect('scene.state.lives'),2);assert.ok(Math.abs((await inspect('scene.player.x') as number)-1470)<5);
    await page.screenshot({path:'/tmp/oyen-world4-4.png'});await finish();
    await start(5);
    await inspect('(scene.player.body.reset(scene.level.goal,454),scene.player.setVelocity(0,0),true)');await advance(100);
    assert.equal(await inspect('game.scene.isActive("GameScene")'),true,'goal requires boss defeat');
    await inspect('(scene.player.body.reset(2470,454),scene.player.setVelocity(0,0),true)');
    const phases=new Set<number>(),attacks=new Set<string>();
    for(let hit=0;hit<9;hit++){
      await waitFor('scene.harbor.boss.state==="attack"',15000);
      phases.add(await inspect('scene.harbor.boss.phase') as number);attacks.add(await inspect('scene.harbor.boss.attack') as string);
      const expected=['harbor-anchor','harbor-wave','harbor-ship'][Math.floor(hit/3)];
      assert.equal(await inspect(`Array.from(scene.harbor.shots).some(s=>s.texture.key==='${expected}')`),true);
      if(hit===0){
        await page.keyboard.press('Escape');const paused=await inspect('[scene.harbor.boss.elapsed,Array.from(scene.harbor.shots).map(s=>s.x)]');
        await page.waitForTimeout(250);assert.deepEqual(await inspect('[scene.harbor.boss.elapsed,Array.from(scene.harbor.shots).map(s=>s.x)]'),paused);await page.keyboard.press('Escape');
        await inspect('(scene.player.body.reset(2185,454),scene.player.setVelocity(0,0),true)');await advance(100);
        assert.equal(await inspect('scene.harbor.boss.health'),9);assert.equal(await inspect('scene.state.lives'),2,'attack contact hurts, not boss');
        await inspect('(scene.player.body.reset(2470,454),scene.player.setVelocity(0,0),true)');
      }
      await waitFor('scene.harbor.boss.state==="recovery"');
      await inspect('(scene.player.body.reset(2200,454),scene.player.setVelocity(0,0),true)');await advance(100);
      assert.equal(await inspect('scene.harbor.boss.health'),8-hit);
      if([2,5,8].includes(hit))await page.screenshot({path:`/tmp/oyen-captain-phase-${1+Math.floor(hit/3)}.png`});
      await inspect('(scene.player.body.reset(2470,454),scene.player.setVelocity(0,0),true)');
    }
    assert.deepEqual([...phases],[1,2,3]);assert.deepEqual([...attacks],['anchor-throw','water-waves','ship-charge']);
    assert.equal(await inspect('scene.harbor.defeated'),true);assert.equal(await inspect('scene.harbor.shots.size'),0);
    await finish();assert.equal(await inspect('progression.worldUnlocked("w5")'),true);
    await page.reload();await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    assert.equal(await inspect('progression.worldUnlocked("w5")'),true);assert.equal(await inspect('progression.unlocked("w5-l1")'),false);
    for(let i=1;i<=5;i++)assert.equal(await inspect(`progression.saves.data.records['w4-l${i}'].completed`),true);
    await start(4);assert.equal(await inspect('scene.checkpointIndex'),0,'completion resets retry checkpoint for full replay');
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();server.kill();}
});
