import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fishSpawns, GRAVITY, JUMP, platforms, RunState, SPEED, WORLD_WIDTH } from '../src/level';
test('fish score, damage cooldown, and three-life limit', () => {
  const state = new RunState(); state.collect(); state.collect(); assert.equal(state.score, 20);
  assert.equal(state.damage(0), true); assert.equal(state.damage(1499), false);
  assert.equal(state.damage(1500), true); assert.equal(state.damage(3000), true);
  assert.equal(state.damage(5000), false); assert.equal(state.lives, 0);
});
test('every rooftop can be reached from the previous platform', () => {
  const roofs = platforms.slice(4);
  for (let i = 0; i < roofs.length; i++) {
    const previous = i === 0 ? platforms[0] : roofs[i - 1];
    const next = roofs[i];
    const rise = previous.y - next.y;
    assert.ok(rise < JUMP ** 2 / (2 * GRAVITY));
    const flightTime = (JUMP + Math.sqrt(JUMP ** 2 - 2 * GRAVITY * rise)) / GRAVITY;
    assert.ok(Math.max(0, next.x - previous.x - previous.w) < SPEED * flightTime - 20);
  }
});
test('ground gaps are jumpable and fish are inside world bounds', () => {
  for (let i = 1; i < 4; i++) assert.ok(platforms[i].x - platforms[i - 1].x - platforms[i - 1].w < SPEED * 2 * JUMP / GRAVITY - 30);
  assert.ok(fishSpawns.length > 0);
  assert.ok(fishSpawns.every(f => f.x > 0 && f.x < WORLD_WIDTH && f.y > 0));
});
