import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds } from '../src/progression/registry';
import { SaveManager, type StorageAdapter } from '../src/progression/SaveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { KaptenBebek } from '../src/world4/KaptenBebek';
import { deckPosition, LightningCycle, windImpulse } from '../src/world4/mechanics';
import { JUMP, GRAVITY, SPEED } from '../src/level';
const harbor=levels.filter(l=>l.worldId==='w4');
function memory(initial: unknown=null):StorageAdapter {
  let value=JSON.stringify(initial);
  return {getItem:()=>value,setItem:(_key,next)=>{value=next;}};
}
test('five harbor levels have safe starts, finishes, checkpoints and a reachable critical route',()=>{
  assert.equal(harbor.length,5);assert.ok(worlds.find(w=>w.id==='w4')?.available);
  assert.equal(worlds.find(w=>w.id==='w5')?.available,true);
  for(const [i,l] of harbor.entries()) {
    const h=l.harbor!;assert.equal(l.id,`w4-l${i+1}`);assert.equal(l.boss,i===4);assert.equal(!!h.boss,l.boss);
    assert.ok(l.objectives.fish<=l.fish.length);
    if(h.boss)assert.equal(h.boss.y+120-64,482,'Captain sprite feet align with dock');
    for(const sailor of h.sailors)assert.ok(l.platforms.some(p=>sailor.x>p.x&&sailor.x<p.x+p.w&&sailor.y+60-32===p.y),'sentry feet align with support');
    const reached=new Set([0]);
    let grew=true;
    while(grew){grew=false;for(const a of [...reached])for(let b=0;b<l.platforms.length;b++){
      if(reached.has(b))continue;
      const from=l.platforms[a],to=l.platforms[b],rise=from.y-to.y;
      if(rise>=JUMP*JUMP/(2*GRAVITY))continue;
      const flight=(JUMP+Math.sqrt(JUMP*JUMP-2*GRAVITY*rise))/GRAVITY;
      const gap=Math.max(0,to.x-from.x-from.w,from.x-to.x-to.w);
      if(gap<flight*SPEED-40){reached.add(b);grew=true;}
    }}
    const finish=l.platforms.findIndex(p=>l.goal>p.x+20&&l.goal<p.x+p.w-20&&Math.abs(p.y-h.goalY)<60);
    assert.ok(reached.has(finish),`${l.id} finish reachable`);
    for(const cp of h.checkpoints){
      const support=l.platforms.findIndex(p=>cp.x>p.x+20&&cp.x<p.x+p.w-20&&p.y-cp.y>=28&&p.y-cp.y<=40);
      assert.ok(reached.has(support),`${l.id} checkpoint reachable`);
      assert.ok(h.water.every(w=>cp.x<w.x||cp.x>w.x+w.width));
      assert.ok(h.lightning.every(x=>Math.abs(cp.x-x)>70));
    }
    for(const w of h.water) {
      assert.ok(w.y>=508&&w.height>0);
      assert.ok(l.platforms.filter(p=>p.y===482).every(p=>w.x+w.width<=p.x||w.x>=p.x+p.w),'water only below gaps');
    }
  }
  assert.ok(harbor[0].harbor!.water.length);assert.ok(harbor[1].harbor!.decks.length);
  assert.ok(harbor[2].harbor!.rain&&harbor[2].harbor!.wind.length&&harbor[2].harbor!.lightning.length);
  assert.ok(harbor[3].harbor!.decks.every(d=>d.kind==='crane')&&harbor[3].harbor!.top<0);
});
test('moving boats/cranes are bounded and periodic with safe rider clearance across a full cycle',()=>{
  for(const l of harbor)for(const d of l.harbor!.decks) {
    const start=deckPosition(d,0),end=deckPosition(d,d.period);
    assert.ok(Math.abs(start.x-end.x)<.001&&Math.abs(start.y-end.y)<.001);
    for(let t=0;t<=d.period;t+=16){
      const p=deckPosition(d,t);
      assert.ok(Math.abs(p.x-d.x)<=d.rangeX+.001&&Math.abs(p.y-d.y)<=d.rangeY+.001);
      assert.ok(p.x-d.width/2>=0&&p.x+d.width/2<=l.width);
      for(const roof of l.platforms.filter(p=>p.y<482)) {
        const xOverlap=p.x+d.width/2>roof.x&&p.x-d.width/2<roof.x+roof.w;
        assert.ok(!xOverlap||p.y<=roof.y||p.y-30>=roof.y+16,'no ceiling crush along boat/crane travel');
      }
    }
  }
});
test('wind remains an additive bounded impulse with input available in both directions',()=>{
  for(const w of harbor[2].harbor!.wind){
    assert.equal(windImpulse(w,0,0,16),0);
    assert.equal(windImpulse(w,w.x+10,w.y+10,20),w.force*.02);
    assert.equal(windImpulse(w,w.x+10,w.y+10,10000),w.force*.05);
    assert.ok(Math.abs(w.force)<=180);
    for(const delta of [-1,NaN,Infinity])assert.throws(()=>windImpulse(w,w.x,w.y,delta));
  }
});
test('lightning cannot strike without a complete warning and resets inactive idle clocks',()=>{
  const l=new LightningCycle();
  l.update(10000,false);assert.equal(l.state,'idle');assert.equal(l.elapsed,0);
  l.update(2800,true);assert.equal(l.state,'warning');
  l.update(1499,false);assert.equal(l.state,'warning');
  l.update(1,false);assert.equal(l.state,'strike');
  l.update(249,true);assert.equal(l.state,'strike');l.update(1,true);assert.equal(l.state,'idle');
  l.update(100000,true);assert.equal(l.state,'warning','stalled frame still shows warning');
  assert.throws(()=>l.update(-1,true));
});
test('Captain cycles anchor, wave and ship phases; one recovery hit; cooldown and terminal surrender',()=>{
  const boss=new KaptenBebek(),attacks=new Set<string>();
  for(let hit=0;hit<9;hit++) {
    assert.equal(boss.phase,1+Math.floor(hit/3));attacks.add(boss.attack);assert.equal(boss.hit(),false);
    boss.update(boss.duration-1);assert.equal(boss.state,'telegraph');
    assert.deepEqual(boss.update(1),['attack']);assert.equal(boss.hit(),false);
    boss.update(boss.duration);assert.equal(boss.state,'recovery');
    assert.ok(boss.hit());assert.equal(boss.hit(),false);
    if(hit<8){boss.update(boss.duration);assert.equal(boss.state,'cooldown');assert.equal(boss.hit(),false);boss.update(boss.duration);}
  }
  assert.deepEqual([...attacks],['anchor-throw','water-waves','ship-charge']);
  assert.equal(boss.health,0);assert.equal(boss.state,'defeated');assert.deepEqual(boss.update(100000),[]);
  for(const d of [-1,NaN,Infinity])assert.throws(()=>boss.update(d));
  const a=new KaptenBebek(),b=new KaptenBebek();a.update(15750);for(let i=0;i<630;i++)b.update(25);
  assert.equal(a.state,b.state);assert.equal(a.elapsed,b.elapsed);
});
test('harbor stars, rewards, checkpoint data and World 5 unlock persist; v1/v2 saves retain earlier progress and purchases',()=>{
  for(const version of [1,2]) {
    const record={completed:true,bestScore:10,fish:1,stars:2};
    const initial={version,records:{'w1-l1':record,'w2-l5':record,'w3-l5':record},collectedFish:240,owned:['bandana'],equipped:'bandana',achievements:['fish100','clean-boss'],checkpoints:{'w3-l4':3,'w4-l4':2,'w4-l2':999,'w4-l3':-1}};
    const storage=memory(initial),save=new SaveManager(storage);
    for(const id of ['w1-l1','w2-l5','w3-l5'])assert.deepEqual(save.data.records[id],record);
    assert.equal(save.data.checkpoints['w3-l4'],3);assert.equal(save.data.checkpoints['w4-l4'],2);
    assert.equal(save.data.checkpoints['w4-l2'],undefined);assert.equal(save.data.checkpoints['w4-l3'],undefined);
    if(version===2){assert.equal(save.data.collectedFish,240);assert.deepEqual(save.data.owned,['bandana']);assert.equal(save.data.equipped,'bandana');assert.deepEqual(save.data.achievements,['fish100','clean-boss']);}
    save.save();assert.deepEqual(new SaveManager(storage).data,save.data);
  }
  const storage=memory(),save=new SaveManager(storage),p=new ProgressionManager(save);
  assert.equal(p.unlocked('w4-l1'),false);
  for(const l of levels.filter(l=>['w1','w2','w3'].includes(l.worldId)))p.complete(l.id,0,3);
  assert.ok(p.unlocked('w4-l1'));assert.equal(p.worldUnlocked('w5'),false);
  for(const l of harbor){assert.equal(p.complete(l.id,l.fish.length*10,3,0),3);const balance=save.data.currency;p.complete(l.id,0,1);assert.equal(save.data.currency,balance);assert.equal(save.data.records[l.id].stars,3);save.data.checkpoints[l.id]=l.harbor!.checkpoints.length-1;save.save();}
  const restored=new SaveManager(storage);assert.deepEqual(restored.data,save.data);
  assert.ok(new ProgressionManager(restored).worldUnlocked('w5'));assert.equal(new ProgressionManager(restored).unlocked('w5-l1'),true);
});
