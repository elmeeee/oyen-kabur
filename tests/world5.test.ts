import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds } from '../src/progression/registry';
import { SaveManager, type StorageAdapter } from '../src/progression/SaveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { RajaKucingHitam } from '../src/world5/RajaKucingHitam';
import { RoyalTrap, stonePosition } from '../src/world5/mechanics';
import { JUMP, GRAVITY, SPEED } from '../src/level';
const palace=levels.filter(l=>l.worldId==='w5');
function memory(initial:unknown=null):StorageAdapter{let value=JSON.stringify(initial);return{getItem:()=>value,setItem:(_k,v)=>{value=v;}};}
test('all 25 levels and five world bosses resolve; palace critical paths and checkpoints are reachable',()=>{
  assert.equal(levels.length,25);assert.ok(worlds.every(w=>w.available));assert.equal(palace.length,5);
  for(const w of worlds)assert.ok(levels.find(l=>l.id===w.levelIds[4])?.boss);
  for(const [i,l] of palace.entries()){
    assert.equal(l.id,`w5-l${i+1}`);const p=l.palace!;assert.equal(l.boss,i>=3);assert.ok(l.objectives.fish<=l.fish.length);
    const reached=new Set([0]);let changed=true;
    while(changed){changed=false;for(const a of [...reached])for(let b=0;b<l.platforms.length;b++){
      if(reached.has(b))continue;const from=l.platforms[a],to=l.platforms[b],rise=from.y-to.y;if(rise>=JUMP*JUMP/(2*GRAVITY))continue;
      const flight=(JUMP+Math.sqrt(JUMP*JUMP-2*GRAVITY*rise))/GRAVITY,gap=Math.max(0,to.x-from.x-from.w,from.x-to.x-to.w);
      if(gap<flight*SPEED-40){reached.add(b);changed=true;}
    }}
    const goal=l.platforms.findIndex(r=>l.goal>r.x+20&&l.goal<r.x+r.w-20&&Math.abs(r.y-p.goalY)<60);assert.ok(reached.has(goal),`${l.id} goal`);
    for(const cp of p.checkpoints){const support=l.platforms.findIndex(r=>cp.x>r.x+20&&cp.x<r.x+r.w-20&&r.y-cp.y>=28&&r.y-cp.y<=40);assert.ok(reached.has(support),`${l.id} safe checkpoint`);}
    for(const secret of p.secrets)assert.ok(l.fish.some(f=>f.x>secret.x&&f.x<secret.x+secret.width&&f.y>secret.y&&f.y<secret.y+secret.height));
    for(const d of p.decks)for(let t=0;t<d.period;t+=16){const pos=stonePosition(d,t);assert.ok(Math.abs(pos.x-d.x)<=d.rangeX+.001&&Math.abs(pos.y-d.y)<=d.rangeY+.001);for(const r of l.platforms.filter(r=>r.y<482)){const overlap=pos.x+d.width/2>r.x&&pos.x-d.width/2<r.x+r.w;assert.ok(!overlap||pos.y<=r.y||pos.y-30>=r.y+16,'elevator standing clearance');}}
  }
  assert.equal(palace[3].palace!.encounter?.kind,'sentinel');assert.equal(palace[4].palace!.encounter?.kind,'king');
});
test('Raja has four natural phases, alternating melee, mixed Last Meow attacks and a bounded defeat animation',()=>{
  const boss=new RajaKucingHitam(),attacks=new Set<string>();
  assert.equal(boss.hit(),false);boss.update(2399);assert.equal(boss.state,'intro');boss.update(1);assert.equal(boss.state,'telegraph');
  const lastMeow=new Set<string>();
  for(let hit=0;hit<12;hit++){
    assert.equal(boss.phase,1+Math.floor(hit/3));attacks.add(boss.attack);if(boss.phase===4)lastMeow.add(boss.attack);
    assert.ok(boss.duration>=1100);assert.equal(boss.hit(),false);boss.update(boss.duration);assert.equal(boss.state,'attack');assert.equal(boss.hit(),false);
    boss.update(boss.duration);assert.equal(boss.state,'recovery');assert.ok(boss.hit());assert.equal(boss.hit(),false);
    if(hit<11){boss.update(boss.duration);assert.equal(boss.state,'cooldown');boss.update(boss.duration);assert.equal(boss.state,'telegraph');}
  }
  assert.deepEqual([...attacks].sort(),['claw-swipe','dark-kingdom','royal-dash','shadow-magic']);assert.equal(lastMeow.size,3);
  assert.equal(boss.state,'defeat');assert.equal(boss.health,0);boss.update(1199);assert.equal(boss.state,'defeat');boss.update(1);assert.equal(boss.state,'defeated');assert.deepEqual(boss.update(100000),[]);
  for(const d of [-1,NaN,Infinity])assert.throws(()=>boss.update(d));
});
test('sentinel is a three-hit guard encounter with the same one-hit recovery contract',()=>{
  const boss=new RajaKucingHitam(true);assert.equal(boss.health,3);boss.update(boss.duration);
  for(let hit=0;hit<3;hit++){assert.equal(boss.phase,1);boss.update(boss.duration);assert.equal(boss.state,'attack');boss.update(boss.duration);assert.ok(boss.hit());assert.equal(boss.hit(),false);if(hit<2){boss.update(boss.duration);boss.update(boss.duration);}}
  boss.update(1200);assert.equal(boss.state,'defeated');
});
test('royal traps retain a full visible warning, fire once per cycle and reject invalid clocks',()=>{
  const trap=new RoyalTrap();assert.equal(trap.update(10000,false),false);assert.equal(trap.state,'idle');
  assert.equal(trap.update(10000,true),false);assert.equal(trap.state,'warning');assert.equal(trap.update(1099,true),false);assert.equal(trap.update(1,true),true);
  assert.equal(trap.update(499,true),false);assert.equal(trap.update(1,true),false);assert.equal(trap.state,'idle');assert.throws(()=>trap.update(NaN,true));
});
test('v1/v2/v3 migration preserves previous worlds, purchases, equipment, achievements and checkpoints',()=>{
  const record={completed:true,bestScore:10,stars:2,fish:1};
  for(const version of [1,2,3]){
    const storage=memory({version,records:{'w1-l1':record,'w2-l5':record,'w3-l5':record,'w4-l5':record},collectedFish:200,owned:['bandana','glasses'],equipped:'glasses',achievements:['fish100','clean-level'],checkpoints:{'w3-l4':3,'w4-l4':2,'w5-l3':3,'w5-l2':999},campaign:{completed:true,endingSeen:true}});
    const save=new SaveManager(storage);assert.equal(save.data.version,3);
    for(const id of ['w1-l1','w2-l5','w3-l5','w4-l5'])assert.deepEqual(save.data.records[id],record);
    assert.equal(save.data.checkpoints['w3-l4'],3);assert.equal(save.data.checkpoints['w4-l4'],2);assert.equal(save.data.checkpoints['w5-l3'],3);assert.equal(save.data.checkpoints['w5-l2'],undefined);
    assert.deepEqual(save.data.campaign,{completed:false,endingSeen:false},'a forged flag cannot complete the campaign');
    if(version>=2){assert.deepEqual(save.data.owned,['bandana','glasses']);assert.equal(save.data.equipped,'glasses');assert.equal(save.data.collectedFish,200);assert.deepEqual(save.data.achievements,['fish100','clean-level']);}
    save.save();assert.deepEqual(new SaveManager(storage).data,save.data);
  }
});
test('campaign completion and ending flags persist without duplicate currency; every completed level replays and reset clears ending',()=>{
  const storage=memory(),save=new SaveManager(storage),p=new ProgressionManager(save);
  assert.equal(p.unlocked('w5-l1'),false);save.finishEnding();assert.equal(save.data.campaign.endingSeen,false);
  for(const l of levels){p.complete(l.id,l.fish.length*10,3,0);if(l.id!=='w5-l5')assert.equal(save.data.campaign.completed,false);}
  assert.deepEqual(save.data.campaign,{completed:true,endingSeen:false});save.finishEnding();assert.equal(save.data.campaign.endingSeen,true);
  const balance=save.data.currency;
  for(const l of levels){assert.ok(p.unlocked(l.id));p.complete(l.id,0,1);}assert.equal(save.data.currency,balance);
  assert.deepEqual(new SaveManager(storage).data,save.data);save.reset();assert.deepEqual(save.data.campaign,{completed:false,endingSeen:false});
  assert.equal(p.unlocked('w5-l1'),false);
});
test('completion survives unavailable storage for the session and valid legacy final records migrate safely',()=>{
  const save=new SaveManager({getItem(){throw Error();},setItem(){throw Error();}}),p=new ProgressionManager(save);
  for(const l of levels)p.complete(l.id,0,3);save.finishEnding();assert.equal(save.persistent,false);assert.ok(save.data.campaign.completed&&save.data.campaign.endingSeen);
  const storage=memory({version:2,records:{'w5-l5':{completed:true,bestScore:0,stars:1,fish:0}}}),restored=new SaveManager(storage);
  assert.deepEqual(restored.data.campaign,{completed:true,endingSeen:false});assert.ok(new ProgressionManager(restored).unlocked('w5-l5'),'validated completed levels remain replayable');
  assert.ok(new ProgressionManager(restored).worldUnlocked('w5'),'world map can reach a sparse legacy completion');
});
