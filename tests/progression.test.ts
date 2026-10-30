import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager } from '../src/progression/SaveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { levels } from '../src/progression/registry';
test('unlock chain, replay rewards, stars and boss world unlock persist', () => {
  let value: string | null = null;
  const storage = { getItem: () => value, setItem: (_key: string, data: string) => { value = data; } };
  const save = new SaveManager(storage), p = new ProgressionManager(save);
  assert.ok(p.unlocked('w1-l1')); assert.ok(!p.unlocked('w1-l2'));
  assert.throws(() => p.complete('w1-l2', 10, 3));
  for (const l of levels) { p.complete(l.id, l.fish.length * 10, 3); const currency = save.data.currency; p.complete(l.id, 0, 1); assert.equal(save.data.currency, currency); assert.equal(save.data.records[l.id].stars, 3); }
  assert.ok(p.worldUnlocked('w2')); assert.ok(p.unlocked('w2-l1')); assert.ok(p.worldUnlocked('w3'));
  assert.deepEqual(new SaveManager(storage).data, save.data);
  save.reset(); assert.equal(save.data.currency, 0); assert.ok(!p.unlocked('w1-l2'));
});
test('malformed and unavailable storage safely fall back', () => {
  assert.equal(new SaveManager({ getItem: () => '{broken', setItem() {} }).data.currency, 0);
  const save = new SaveManager({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  const p = new ProgressionManager(save); p.complete('w1-l1', 10, 3);
  assert.equal(save.persistent, false); assert.ok(p.unlocked('w1-l2'));
  const invalid = new SaveManager({ getItem: () => JSON.stringify({ version: 1, currency: 999999, records: { 'w1-l1': { completed: true, bestScore: -1, stars: 99, fish: -10 } } }), setItem() {} });
  assert.deepEqual(invalid.data.records, {}); assert.equal(invalid.data.currency, 0);
});
test('all five level ground routes and roof rises are jumpable', () => {
  for (const l of levels) {
    const ground = l.platforms.filter(p => p.y === 482);
    ground.slice(1).forEach((p, i) => assert.ok(p.x - ground[i].x - ground[i].w < 150));
    const roofs = l.platforms.filter(p => p.y < 482);
    roofs.forEach((p, i) => { assert.ok((i ? roofs[i - 1].y : 482) - p.y < 96); if(i) assert.ok(p.x - roofs[i-1].x - roofs[i-1].w <= 100); });
  }
});
