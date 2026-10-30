import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds, LevelLoader } from '../src/progression/registry';
import { SPEED, JUMP, GRAVITY } from '../src/level';
test('registry has unique stable identities and every available level resolves', () => {
 const ids=worlds.flatMap(w=>w.levelIds); assert.equal(new Set(ids).size,25);
 for(const w of worlds.filter(w=>w.available)) for(const id of w.levelIds) assert.equal(LevelLoader.load(id).worldId,w.id);
 assert.equal(new Set(levels.map(l=>l.id)).size,levels.length);
});
test('every playable level has safe spawn, finish, checkpoints and ground route', () => {
 for(const l of levels){
  const ground=l.platforms.filter(p=>p.y===482).sort((a,b)=>a.x-b.x);
  assert.ok(ground.some(p=>90>=p.x+20&&90<=p.x+p.w-20),`${l.id} spawn`);
  assert.ok(ground.some(p=>l.goal>=p.x+30&&l.goal<=p.x+p.w-30),`${l.id} finish`);
  for(const p of l.platforms) assert.ok(p.x>=0&&p.w>0&&p.x+p.w<=l.width&&p.y>(l.market?.top ?? 0)&&p.y<540,`${l.id} bounds`);
  for(let i=1;i<ground.length;i++){
   assert.ok(ground[i].w>=100,`${l.id} checkpoint width`);
   const gap=ground[i].x-ground[i-1].x-ground[i-1].w;
   assert.ok(gap<SPEED*(2*JUMP/GRAVITY)-40,`${l.id} reachable ground`);
  }
  for(const fish of l.fish) assert.ok(fish.x>0&&fish.x<l.width&&fish.y>(l.market?.top ?? 0)&&fish.y<482);
 }
});
