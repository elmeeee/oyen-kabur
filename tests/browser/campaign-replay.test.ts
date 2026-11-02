import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
test('sparse legacy completion migrates and remains reachable through world map replay; credits return to menu', {timeout:45000}, async()=>{
  const server=spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4185','--strictPort'],{stdio:'pipe'});
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-webgl']});
    const page=await browser.newPage({viewport:{width:960,height:540}}),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    for(let i=0;i<50;i++){try{await page.goto('http://127.0.0.1:4185');break;}catch{await page.waitForTimeout(100);}}
    const inspect=(expression:string)=>page.evaluate(async expression=>{
      // @ts-expect-error Runtime Vite module.
      const {game}=await import('/src/main.ts');
      // @ts-expect-error Runtime Vite module.
      const {progression}=await import('/src/progression/ProgressionManager.ts');
      return new Function('game','progression',`return (${expression})`)(game,progression);
    },expression);
    const waitFor=async(expression:string)=>{const until=Date.now()+12000;while(!await inspect(expression)){assert.ok(Date.now()<until,expression);await page.waitForTimeout(35);}};
    await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    await page.evaluate(()=>localStorage.setItem('oyen-progression',JSON.stringify({version:2,records:{'w5-l5':{completed:true,bestScore:0,stars:1,fish:0}},collectedFish:200,owned:['bandana'],equipped:'bandana',achievements:['fish100']})));
    await page.reload();await waitFor('game.scene.getScene("MainMenuScene").children.list.some(c=>c.input?.enabled)');
    assert.equal(await inspect('progression.saves.data.version'),3);assert.equal(await inspect('progression.saves.data.campaign.completed'),true);
    assert.equal(await inspect('progression.worldUnlocked("w5")'),true);assert.equal(await inspect('progression.saves.data.equipped'),'bandana');
    await page.keyboard.press('Enter');await waitFor('game.scene.isActive("WorldMapScene")');
    await waitFor('game.scene.getScene("WorldMapScene").children.list.some(c=>c.text?.includes("Kerajaan Meong"))');
    await page.waitForTimeout(100);await page.mouse.click(480,365);await waitFor('game.scene.isActive("LevelSelectScene")');
    await page.waitForTimeout(100);await page.mouse.click(480,398);await waitFor('game.scene.isActive("GameScene")');
    assert.equal(await inspect('game.scene.getScene("GameScene").level.id'),'w5-l5');
    assert.equal(await inspect('game.scene.getScene("GameScene").palace.boss.health'),12);
    await inspect('(game.scene.stop("GameScene"),game.scene.start("CreditsScene"),true)');
    await waitFor('game.scene.isActive("CreditsScene")');
    assert.equal(await inspect('game.scene.getScene("CreditsScene").children.list.some(c=>c.text==="Thank you for playing this work-in-progress edition.")'),true);
    await page.screenshot({path:'/tmp/oyen-credits-final.png'});
    await page.keyboard.press('ArrowDown');await page.waitForTimeout(100);await page.keyboard.press('Enter');await waitFor('game.scene.isActive("MainMenuScene")');
    assert.equal(await inspect('progression.saves.data.campaign.endingSeen'),false,'credits alone do not invent a viewed ending');
    assert.deepEqual(errors,[]);
  }finally{await browser?.close();server.kill();}
});
