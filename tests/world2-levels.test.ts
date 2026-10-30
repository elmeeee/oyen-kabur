import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/progression/registry';
import { SaveManager } from '../src/progression/SaveManager';
import { GRAVITY, JUMP, SPEED } from '../src/level';
test('warehouse route uses reachable ascending shelves and safe persistent checkpoints',()=>{
 const level=levels.find(l=>l.id==='w2-l4')!;
 const route=level.platforms.filter(p=>p.y<482);
 for(let i=0;i<route.length;i++){
  const p=route[i], previous=i?route[i-1]:level.platforms[0];
  const rise=previous.y-p.y;assert.ok(rise<JUMP*JUMP/(2*GRAVITY));
  const duration=(JUMP+Math.sqrt(JUMP*JUMP-2*GRAVITY*rise))/GRAVITY;
  assert.ok(Math.max(0,p.x-previous.x-previous.w)<duration*SPEED-30);
 }
 assert.ok(route.some(p=>level.goal>=p.x&&level.goal<=p.x+p.w&&Math.abs(p.y-level.market!.goalY)<60));
 let value:string|null=null;const storage={getItem:()=>value,setItem:(_k:string,v:string)=>{value=v;}};
 const save=new SaveManager(storage);save.data.checkpoints[level.id]=2;save.save();assert.equal(new SaveManager(storage).data.checkpoints[level.id],2);
 for(const cp of level.market!.checkpoints)assert.ok(level.platforms.some(p=>cp.x>p.x&&cp.x<p.x+p.w&&p.y-cp.y>=30&&p.y-cp.y<=60));
});
