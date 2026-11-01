import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
test('World 5: palace levels, physics-only final fight, ending, credits, completion reload and replay', { timeout: 300000 }, async () => {
  const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4184','--strictPort'],{stdio:'pipe'});
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-webgl']});
    const page=await browser.newPage({viewport:{width:960,height:540}});
    const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    for(let i=0;i<60;i++){try{await page.goto('http://127.0.0.1:4184');break;}catch{await page.waitForTimeout(100);}}
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
      await inspect(`(()=>{for(const active of game.scene.getScenes(true))game.scene.stop(active.scene.key);game.scene.start('GameScene',{levelId:'w5-l${i}'});return true})()`);
      await page.waitForTimeout(220);
      assert.equal(await inspect('scene.level.id'),`w5-l${i}`);
      assert.equal(await inspect('game.textures.get("raja-kucing-hitam").frameTotal'),13); // base + nine frames
    };
    await inspect(`(()=>{for(let w=1;w<=4;w++)for(let i=1;i<=5;i++)progression.complete('w'+w+'-l'+i,0,3);return true})()`);
    const finish=async()=>{await inspect('(scene.player.body.reset(scene.level.goal,scene.level.palace.goalY),scene.player.setVelocity(0,0),true)');await waitFor('game.scene.isActive("ResultScene")');};
    // Exercise World 1's real survival boss clock as well as all later model bosses.
    await inspect(`(()=>{for(const active of game.scene.getScenes(true))game.scene.stop(active.scene.key);game.scene.start('GameScene',{levelId:'w1-l5'});return true})()`);
    await page.waitForTimeout(150);await inspect('(scene.player.body.reset(scene.level.goal+45,430),scene.player.setVelocity(0,0),true)');
    await waitFor('game.scene.isActive("ResultScene")',20000);
    assert.equal(await inspect('progression.saves.data.records["w1-l5"].completed'),true);
    assert.ok((await inspect('scene.bossHits') as number)>=5,'World 1 survival boss actually completed');
    await start(1);
    await page.keyboard.down('d');await advance(500);await page.keyboard.up('d');assert.ok((await inspect('scene.player.x') as number)>150);
    await inspect('(scene.player.body.reset(140,454),scene.player.setVelocity(0,0),true)');await advance(80);
    await page.keyboard.down('d');await page.keyboard.down('Space');await advance(520);await page.keyboard.up('d');await page.keyboard.up('Space');await advance(220);
    assert.ok((await inspect('scene.player.y') as number)<390,'royal platform jump');
    await inspect(`(()=>{const d=scene.palace.decks[0];scene.player.body.reset(d.x,d.body.top-28);scene.player.setVelocity(0,0);return true})()`);await advance(200);
    const deckX=await inspect('scene.player.x') as number;await waitFor(`Math.abs(scene.player.x-${deckX})>6`,5000);
    await page.keyboard.down('Space');await advance(150);await page.keyboard.up('Space');assert.ok((await inspect('scene.player.body.velocity.y') as number)<-100);
    await inspect('(scene.player.body.reset(scene.palace.guards[0].sprite.x,454),scene.player.setVelocity(0,0),true)');await advance(100);assert.equal(await inspect('scene.state.lives'),2);
    await page.screenshot({path:'/tmp/oyen-world5-1.png'});await finish();
    await start(2);
    await inspect(`(()=>{const f=scene.palace.fragile[0];scene.player.body.reset(f.sprite.x,f.sprite.body.top-28);scene.player.setVelocity(0,0);return true})()`);await advance(200);
    assert.equal(await inspect('scene.palace.fragile[0].model.state'),'warning');
    await page.keyboard.press('Escape');const frozen=await inspect('[scene.palace.clock,scene.palace.fragile[0].model.elapsed]');await page.waitForTimeout(200);assert.deepEqual(await inspect('[scene.palace.clock,scene.palace.fragile[0].model.elapsed]'),frozen);await page.keyboard.press('Escape');
    await advance(1000);assert.equal(await inspect('scene.palace.fragile[0].sprite.body.enable'),false);
    await inspect('(scene.player.body.reset(90,454),scene.player.setVelocity(0,0),true)');await advance(3700);assert.equal(await inspect('scene.palace.fragile[0].model.state'),'solid');
    await inspect('(scene.player.body.reset(735,235),scene.player.setVelocity(0,0),true)');await advance(180);
    assert.equal(await inspect('scene.palace.secrets[0].revealed'),true);assert.ok((await inspect('scene.state.score') as number)>=10);
    await waitFor('scene.palace.traps[0].clock.state==="warning"');assert.ok((await inspect('scene.palace.traps[0].label.text') as string).includes('ARROW'));
    await waitFor('Array.from(scene.palace.shots).some(s=>s.texture.key==="palace-arrow")');
    await page.screenshot({path:'/tmp/oyen-world5-2.png'});await finish();
    await start(3);
    for(let j=1;j<=8;j++){
      await inspect(`(()=>{const p=scene.level.platforms[${j}];scene.player.body.reset(p.x+p.w-34,p.y-28);scene.player.setVelocity(0,0);return true})()`);await advance(70);
      await page.keyboard.down('d');await page.keyboard.down('Space');await advance(430);await page.keyboard.up('d');await page.keyboard.up('Space');await advance(280);
      const y=await inspect('scene.player.y') as number,target=await inspect(`scene.level.platforms[${j+1}].y-28`) as number;
      assert.ok(Math.abs(y-target)<8,`tower jump ${j}: ${y} vs ${target}`);
    }
    await inspect('(scene.player.body.reset(1470,-148),scene.player.setVelocity(0,0),true)');await advance(120);assert.equal(await inspect('scene.checkpointIndex'),3);
    await page.keyboard.press('r');await page.waitForTimeout(200);assert.equal(await inspect('scene.checkpointIndex'),3);
    await inspect('(scene.player.body.reset(1500,620),true)');await advance(100);assert.ok(Math.abs((await inspect('scene.player.x') as number)-1470)<5);
    await page.screenshot({path:'/tmp/oyen-world5-3.png'});await finish();
    await start(4);
    await inspect('(scene.player.body.reset(1900,454),scene.player.setVelocity(0,0),true)');await advance(120);assert.equal(await inspect('scene.checkpointIndex'),2);
    await inspect('(scene.player.body.reset(scene.level.goal,454),scene.player.setVelocity(0,0),true)');await advance(100);assert.equal(await inspect('game.scene.isActive("GameScene")'),true);
    await inspect('(scene.player.body.reset(2870,454),scene.player.setVelocity(0,0),true)');
    for(let hit=0;hit<3;hit++){
      await waitFor('scene.palace.boss.state==="recovery"',10000);
      await inspect('(scene.player.body.reset(scene.palace.bossSprite.x+25,454),scene.player.setVelocity(0,0),true)');await advance(100);assert.equal(await inspect('scene.palace.boss.health'),2-hit);
      await inspect('(scene.player.body.reset(2870,454),scene.player.setVelocity(0,0),true)');
      if(hit<2)await waitFor('scene.palace.boss.state==="telegraph"');
    }
    await waitFor('scene.palace.defeated');assert.equal(await inspect('scene.palace.controlsLocked'),false);
    await page.screenshot({path:'/tmp/oyen-world5-4.png'});await finish();
    await start(5);
    // One entry fixture. Every subsequent fight action is real keyboard input.
    await inspect('(scene.player.body.reset(2335,454),scene.player.setVelocity(0,0),true)');
    await waitFor('scene.palace.controlsLocked');
    await page.keyboard.down('d');const introX=await inspect('scene.player.x');await advance(250);await page.keyboard.up('d');assert.equal(await inspect('scene.player.x'),introX,'cinematic locks movement');
    await page.keyboard.press('Escape');const introClock=await inspect('scene.palace.boss.elapsed');await page.waitForTimeout(200);assert.equal(await inspect('scene.palace.boss.elapsed'),introClock);await page.keyboard.press('Escape');
    let held=new Set<string>(),previousState='',recoveryHealth=12,jumped=false;
    const phases=new Set<number>(),attacks=new Set<string>();
    const control=async(keys:string[])=>{const next=new Set(keys);for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;};
    const deadline=Date.now()+105000;
    while(!(await inspect('game.scene.isActive("EndingScene")'))){
      assert.ok(Date.now()<deadline,'real-physics final fight completed');
      const s=await inspect(`(()=>{if(!game.scene.isActive('GameScene'))return null;return {state:scene.palace.boss.state,phase:scene.palace.boss.phase,attack:scene.palace.boss.attack,hp:scene.palace.boss.health,elapsed:scene.palace.boss.elapsed,duration:scene.palace.boss.duration,bossX:scene.palace.bossSprite.x,plan:scene.palace.plannedX,x:scene.player.x,lives:scene.state.lives,grounded:scene.player.body.blocked.down||scene.player.body.touching.down}})()`) as {state:string;phase:number;attack:string;hp:number;elapsed:number;duration:number;bossX:number;plan:number;x:number;lives:number;grounded:boolean}|null;
      if(!s){assert.equal(await inspect('game.scene.isActive("EndingScene")'),true,'Oyen survived the final fight');break;}
      assert.ok(s.lives>0);
      if(s.state==='attack'){phases.add(s.phase);attacks.add(s.attack);}
      if(s.state!==previousState){if(s.state==='recovery')recoveryHealth=s.hp;if(s.state==='telegraph')jumped=false;previousState=s.state;}
      let target=s.x;const keys:string[]=[];
      if(s.state==='telegraph')target=s.plan+95;
      if(s.state==='recovery')target=s.hp===recoveryHealth?s.bossX:s.bossX+95;
      if(Math.abs(s.x-target)>8)keys.push(s.x<target?'d':'a');
      if(s.grounded&&!jumped&&((s.state==='telegraph'&&s.attack!=='royal-dash'&&s.attack!=='dark-kingdom'&&s.duration-s.elapsed<220)||(s.state==='attack'&&s.attack==='royal-dash'&&s.elapsed>80)))jumped=true;
      if(jumped&&(s.state==='telegraph'||s.state==='attack'))keys.push('Space');
      await control(keys);await page.waitForTimeout(35);
    }
    await control([]);
    assert.deepEqual([...phases],[1,2,3,4]);assert.deepEqual([...attacks].sort(),['claw-swipe','dark-kingdom','royal-dash','shadow-magic']);
    assert.equal(await inspect('progression.saves.data.campaign.completed'),true);assert.equal(await inspect('progression.saves.data.campaign.endingSeen'),false);
    await page.screenshot({path:'/tmp/oyen-world5-ending-0.png'});
    // Reload during the ending: completion persists and the world map can replay it.
    await page.reload();await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    assert.equal(await inspect('progression.saves.data.version'),3);assert.equal(await inspect('progression.saves.data.campaign.completed'),true);
    await page.keyboard.press('Enter');await waitFor('game.scene.isActive("WorldMapScene")');await page.keyboard.press('c');await waitFor('game.scene.isActive("EndingScene")');
    for(let i=1;i<=3;i++){await page.keyboard.press('Enter');await page.waitForTimeout(100);if(i<3)await page.screenshot({path:`/tmp/oyen-world5-ending-${i}.png`});}
    assert.equal(await inspect('game.scene.isActive("CampaignSummaryScene")'),true);assert.equal(await inspect('progression.saves.data.campaign.endingSeen'),true);
    await page.screenshot({path:'/tmp/oyen-campaign-summary.png'});
    await page.keyboard.press('Enter');await waitFor('game.scene.isActive("CreditsScene")');await page.screenshot({path:'/tmp/oyen-credits.png'});
    await page.keyboard.press('Enter');await waitFor('game.scene.isActive("WorldMapScene")');
    assert.equal(await inspect('Object.keys(progression.saves.data.records).length'),25);
    assert.equal(await inspect(`(()=>{for(let w=1;w<=5;w++)for(let i=1;i<=5;i++)if(!progression.unlocked('w'+w+'-l'+i))return false;return true})()`),true);
    await page.reload();await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');assert.equal(await inspect('progression.saves.data.campaign.endingSeen'),true);
    await start(5);assert.equal(await inspect('scene.palace.boss.health'),12,'final boss replay starts a fresh fight');
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();server.kill();}
});
