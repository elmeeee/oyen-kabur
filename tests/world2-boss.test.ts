import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JuraganLele } from '../src/world2/JuraganLele';
test('Juragan has readable telegraphs, bounded damage windows and three phases', () => {
 const boss=new JuraganLele();assert.equal(boss.hit(),false);
 for(let hit=0;hit<6;hit++){
  assert.equal(boss.phase,Math.floor(hit/2)+1);
  assert.deepEqual(boss.update(1399),[]);assert.equal(boss.hit(),false);
  assert.deepEqual(boss.update(1),['attack']);assert.equal(boss.hit(),false);
  assert.deepEqual(boss.update(1000),['recovery']);assert.ok(boss.hit());assert.equal(boss.hit(),false);
  if(hit<5)assert.deepEqual(boss.update(1800),['telegraph']);
 }
 assert.equal(boss.state,'defeated');assert.deepEqual(boss.update(10000),[]);
});
test('boss clock rejects invalid deltas and supports variable frame rates',()=>{
 const boss=new JuraganLele();assert.throws(()=>boss.update(NaN));assert.throws(()=>boss.update(-1));
 assert.deepEqual(boss.update(4200),['attack','recovery','telegraph']);assert.equal(boss.elapsed,0);
});
