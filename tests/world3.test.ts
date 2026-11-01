import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels, worlds, LevelLoader } from '../src/progression/registry';
import { SaveManager, type StorageAdapter } from '../src/progression/SaveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { MonyetSultan } from '../src/world3/MonyetSultan';
import { bridgePosition, currentImpulse, FragilePlatform, MonkeyAttack } from '../src/world3/mechanics';
import { JUMP, SPEED, GRAVITY } from '../src/level';
const forest = levels.filter(l => l.worldId === 'w3');
function memory(initial: unknown = null): StorageAdapter {
  let raw = JSON.stringify(initial);
  return { getItem: () => raw, setItem: (_k, v) => { raw = v; } };
}
test('five distinct forest levels have reachable static routes, objectives and safe persistent checkpoints', () => {
  assert.equal(forest.length, 5); assert.ok(worlds.find(w => w.id === 'w3')?.available);
  assert.equal(worlds.find(w => w.id === 'w4')?.available, false);
  for (const [i, l] of forest.entries()) {
    assert.equal(l.id, `w3-l${i+1}`); assert.equal(LevelLoader.load(l.id), l);
    const f = l.forest!;
    assert.equal(l.boss, i === 4); assert.equal(!!f.boss, l.boss);
    assert.ok(l.objectives.fish > 0 && l.objectives.fish <= l.fish.length);
    const route = l.platforms;
    for (let j = 1; j < route.length; j++) {
      const previous = route[j-1], next = route[j];
      const rise = previous.y - next.y;
      assert.ok(rise < JUMP * JUMP / (2*GRAVITY), `${l.id} rise ${j}`);
      const flight = (JUMP + Math.sqrt(JUMP*JUMP - 2*GRAVITY*rise)) / GRAVITY;
      assert.ok(next.x - previous.x - previous.w < flight * SPEED - 40, `${l.id} gap ${j}`);
    }
    assert.ok(route.some(p => l.goal > p.x + 20 && l.goal < p.x + p.w - 20 && Math.abs(p.y - f.goalY) < 60));
    for (const cp of f.checkpoints) assert.ok(route.some(p => cp.x > p.x + 20 && cp.x < p.x+p.w-20 && p.y-cp.y >= 28 && p.y-cp.y <= 40), `${l.id} safe checkpoint`);
    for (const secret of f.secrets) assert.ok(l.fish.some(p => p.x >= secret.x && p.x <= secret.x + secret.width && p.y >= secret.y && p.y <= secret.y + secret.height));
    for (const c of f.currents) assert.ok(Math.abs(c.forceX) <= 120 && Math.abs(c.forceY) <= 120);
  }
  assert.ok(forest[0].forest!.secrets.length);
  assert.ok(forest[1].forest!.bridges.length && forest[1].forest!.fragile.length);
  assert.ok(forest[2].forest!.currents.length && forest[2].forest!.slippery.length);
  assert.ok(forest[3].forest!.monkeys.length && forest[3].forest!.top < 0);
});
test('forest completion, stars, replay economy and World 4 unlock survive reload without unlocking unshipped content', () => {
  const storage = memory(), saves = new SaveManager(storage), p = new ProgressionManager(saves);
  assert.equal(p.unlocked('w3-l1'), false);
  for (const l of levels.filter(l => l.worldId !== 'w3')) p.complete(l.id, 0, 3);
  assert.ok(p.unlocked('w3-l1')); assert.equal(p.worldUnlocked('w4'), false);
  for (const l of forest) {
    assert.equal(p.complete(l.id, l.fish.length*10, 3, 0), 3);
    const balance = saves.data.currency;
    p.complete(l.id, 0, 1);
    assert.equal(saves.data.currency, balance);
    assert.equal(saves.data.records[l.id].stars, 3);
    saves.data.checkpoints[l.id] = l.forest!.checkpoints.length - 1; saves.save();
  }
  const restored = new SaveManager(storage);
  assert.deepEqual(restored.data, saves.data);
  assert.ok(new ProgressionManager(restored).worldUnlocked('w4'));
  assert.equal(new ProgressionManager(restored).unlocked('w4-l1'), false);
});
test('v1/v2 fixtures retain W1–2 records, purchased cosmetics, equipment and achievements; reject bad forest checkpoints', () => {
  const record = { completed: true, bestScore: 10, stars: 2, fish: 1 };
  for (const version of [1, 2]) {
    const old = { version, records: { 'w1-l1': record, 'w2-l5': record }, collectedFish: 200, owned: ['bandana'], equipped: 'bandana', achievements: ['fish100'], checkpoints: { 'w2-l4': 2, 'w3-l4': 3, 'w3-l1': 999, 'w3-l2': -1, 'w3-l3': 1.5 } };
    const storage = memory(old), save = new SaveManager(storage);
    assert.deepEqual(save.data.records['w1-l1'], record); assert.deepEqual(save.data.records['w2-l5'], record);
    assert.equal(save.data.checkpoints['w2-l4'], 2); assert.equal(save.data.checkpoints['w3-l4'], 3);
    for (const id of ['w3-l1','w3-l2','w3-l3']) assert.equal(save.data.checkpoints[id], undefined);
    if (version === 2) {
      assert.deepEqual(save.data.owned, ['bandana']); assert.equal(save.data.equipped, 'bandana');
      assert.equal(save.data.collectedFish, 200); assert.deepEqual(save.data.achievements, ['fish100']);
    }
    save.save(); assert.deepEqual(new SaveManager(storage).data, save.data);
  }
  const noStorage = new SaveManager({getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }});
  const p = new ProgressionManager(noStorage);
  for (const l of levels) p.complete(l.id, 0, 3);
  assert.equal(noStorage.persistent, false); assert.ok(p.worldUnlocked('w4'));
});
test('Sultan naturally cycles all attacks, enforces one hit per window, cooldown and terminal defeat', () => {
  const boss = new MonyetSultan();
  const attacks: string[] = [], phases: number[] = [];
  for (let hit = 0; hit < 9; hit++) {
    assert.equal(boss.hit(), false);
    const phase = 1 + Math.floor(hit/3);
    assert.equal(boss.phase, phase); phases.push(boss.phase); attacks.push(boss.attack);
    boss.update(boss.duration - 1); assert.equal(boss.state, 'telegraph');
    assert.deepEqual(boss.update(1), ['attack']); assert.equal(boss.hit(), false);
    assert.deepEqual(boss.update(boss.duration), ['recovery']);
    assert.ok(boss.hit()); assert.equal(boss.hit(), false);
    if (hit < 8) {
      boss.update(boss.duration); assert.equal(boss.state, 'cooldown'); assert.equal(boss.hit(), false);
      boss.update(boss.duration); assert.equal(boss.state, 'telegraph');
    }
  }
  assert.deepEqual([...new Set(attacks)], ['banana-fan', 'ground-slam', 'monkey-summons']);
  assert.deepEqual([...new Set(phases)], [1,2,3]);
  assert.equal(boss.health, 0); assert.equal(boss.state, 'defeated');
  assert.deepEqual(boss.update(1e6), []); assert.equal(boss.health, 0);
  for (const delta of [-1, NaN, Infinity]) assert.throws(() => boss.update(delta));
  const a = new MonyetSultan(), b = new MonyetSultan();
  a.update(12000); for (let i = 0; i < 120; i++) b.update(100);
  assert.equal(a.state,b.state); assert.equal(a.elapsed,b.elapsed);
});
test('bridge path is periodic and bounded; fragile warns, collapses, and waits for clear respawn space', () => {
  const d = forest[1].forest!.bridges[0];
  assert.deepEqual(bridgePosition(d,0), { x:d.x,y:d.y });
  assert.ok(Math.abs(bridgePosition(d,d.period).x-d.x)<.001);
  for(let t=0;t<d.period;t+=16) {
    const p=bridgePosition(d,t); assert.ok(Math.abs(p.x-d.x)<d.amplitude*.33); assert.ok(d.y-p.y<6);
  }
  const fragile = new FragilePlatform(1000,3500);
  fragile.update(2000,false); assert.equal(fragile.state,'solid'); fragile.touch();
  fragile.update(999,true); assert.equal(fragile.state,'warning'); fragile.touch();
  fragile.update(1,true); assert.equal(fragile.state,'absent');
  fragile.update(3500,true); assert.equal(fragile.state,'absent');
  fragile.update(0,false); assert.equal(fragile.state,'solid');
  assert.throws(()=>fragile.update(-1,false));
});
test('currents add finite bounded impulses inside zones; monkeys give a full warning before firing', () => {
  const c = forest[2].forest!.currents[0];
  assert.deepEqual(currentImpulse(c,0,0,16),{x:0,y:0});
  const impulse=currentImpulse(c,c.x+10,c.y+10,16);
  assert.ok(impulse.x>0 && impulse.y<0);
  assert.equal(currentImpulse(c,c.x+10,c.y+10,5000).x,c.forceX*.05);
  assert.throws(()=>currentImpulse(c,c.x,c.y,NaN));
  const monkey=new MonkeyAttack();
  assert.equal(monkey.update(2200,true),false); assert.equal(monkey.state,'warning');
  assert.equal(monkey.update(949,true),false); assert.equal(monkey.update(1,true),true);
  monkey.update(2200,true); monkey.update(100,false); assert.equal(monkey.state,'idle');
});
