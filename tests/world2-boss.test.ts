import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JuraganLele } from '../src/world2/JuraganLele';
const advance = (boss: JuraganLele, duration: number) => {
 const transitions = [];
 while(duration > 0) {
  const step = Math.min(duration, 250);
  transitions.push(...boss.update(step));
  duration -= step;
 }
 return transitions;
};

test('Juragan has readable telegraphs, bounded damage windows and three phases', () => {
 const boss=new JuraganLele();assert.equal(boss.hit(),false);
 for(let hit=0;hit<6;hit++){
  assert.equal(boss.phase,Math.floor(hit/2)+1);
  assert.deepEqual(advance(boss,1399),[]);assert.equal(boss.hit(),false);
  assert.deepEqual(advance(boss,1),['attack']);assert.equal(boss.hit(),false);
  assert.deepEqual(advance(boss,1000),['recovery']);assert.ok(boss.hit());assert.equal(boss.hit(),false);
  if(hit<5)assert.deepEqual(advance(boss,1800),['telegraph']);
 }
 assert.equal(boss.state,'defeated');assert.deepEqual(boss.update(10000),[]);
});
test('boss clock rejects invalid deltas and supports variable frame rates',()=>{
 const boss=new JuraganLele();assert.throws(()=>boss.update(NaN));assert.throws(()=>boss.update(-1));
 assert.deepEqual(boss.update(4200),[]);assert.equal(boss.elapsed,250);assert.equal(boss.state,'telegraph');
});
test('long frame stalls cannot skip the recovery window or defeat the boss twice',()=>{
 const boss=new JuraganLele();
 assert.deepEqual(boss.update(4200),[]);
 for(let i=0;i<5;i++)boss.update(250);
 assert.equal(boss.state,'attack');
 for(let i=0;i<4;i++)boss.update(250);
 assert.equal(boss.state,'recovery');
 assert.deepEqual(boss.update(4200),[]);
 assert.equal(boss.vulnerable,true);
 assert.equal(boss.hit(),true);assert.equal(boss.health,5);
 assert.equal(boss.hit(),false);assert.equal(boss.health,5);
});
