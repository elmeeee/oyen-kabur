import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager } from '../src/progression/SaveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { levels } from '../src/progression/registry';
const storage = () => { let data: string | null = null; return { getItem: () => data, setItem: (_key: string, value: string) => { data = value; } }; };
test('transactions, equipment and achievements persist without duplicate spending', () => {
 const disk = storage(), save = new SaveManager(disk);
 assert.equal(save.purchase('hat'), false); assert.equal(save.equip('hat'), false);
 for(let i=0;i<100;i++) save.collectFish();
 assert.deepEqual(save.data.achievements, ['fish100']);
 assert.ok(save.purchase('bandana')); assert.equal(save.data.currency,50);
 assert.equal(save.purchase('bandana'),false); assert.equal(save.data.currency,50);
 assert.ok(save.equip('bandana')); assert.equal(new SaveManager(disk).data.equipped,'bandana');
 assert.ok(save.equip(null)); assert.equal(save.data.currency,50);
});
test('v1 migration preserves completion credit and applies spending once', () => {
 const disk=storage();disk.setItem('',JSON.stringify({version:1,currency:999,records:{'w1-l1':{completed:true,bestScore:10,stars:2,fish:1}}}));
 const save=new SaveManager(disk);assert.equal(save.data.version,2);assert.equal(save.data.currency,21);
 assert.deepEqual(save.data.owned,[]);save.save();assert.equal(new SaveManager(disk).data.currency,21);
});
test('no damage achievements require a successful zero-damage clear', () => {
 const save=new SaveManager(storage()), p=new ProgressionManager(save);
 p.complete('w1-l1',0,3,1);assert.ok(!save.data.achievements.includes('clean-level'));
 p.complete('w1-l1',0,3,0);assert.ok(save.data.achievements.includes('clean-level'));
 for(const l of levels.slice(1)) p.complete(l.id,0,3,0);
 assert.ok(save.data.achievements.includes('clean-boss'));
 const count=save.data.achievements.length;p.complete('w1-l5',0,3,0);assert.equal(save.data.achievements.length,count);
});
