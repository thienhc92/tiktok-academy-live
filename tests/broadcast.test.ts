import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueueNotice, communityGoal, broadcastPosition, NOTICE_DURATION_MS } from '../src/broadcast/model.ts';
import type { Notice } from '../src/broadcast/model.ts';
const notice = (id: number, expiresAt = 5000): Notice => ({ id, expiresAt, kind: 'join', nickname: 'Mochi' });
test('notifications discard expired entries and bound bursts to two', () => {
  const original = [notice(1, 100), notice(2), notice(3), notice(4)];
  const next = enqueueNotice(original, notice(5), 100);
  assert.deepEqual(next.map(n => n.id), [4, 5]);
  assert.equal(original.length, 4);
  assert.deepEqual(enqueueNotice([notice(1, 100)], notice(2), 100).map(n => n.id), [2]);
});
test('community overlay clamps progress and never awards gameplay rewards', () => {
  assert.deepEqual(communityGoal(-1), { target: 5000, progress: 0, complete: false });
  assert.deepEqual(communityGoal(150), { target: 5000, progress: 150, complete: false });
  assert.deepEqual(communityGoal(5001), { target: 5000, progress: 5000, complete: true });
});

test('broadcast layout spreads all 20 students over four columns without changing identity', () => {
  const positions = Array.from({length:20}, (_, i) => broadcastPosition(i));
  assert.equal(new Set(positions.map(p => p.join(','))).size, 20);
  for (let i=0;i<20;i++) {
    assert.ok(Math.abs(positions[i][0]) < 3);
    if (i % 4 !== 3) assert.ok(positions[i+1][0] - positions[i][0] >= 1.79);
  }
  assert.equal(NOTICE_DURATION_MS, 3000);
});

test('fullscreen port supports entry, exit and unavailable/rejected Safari fallback', async () => {
  const { toggleFullscreen, FULLSCREEN_FALLBACK } = await import('../src/broadcast/fullscreen.ts');
  let entered = 0, exited = 0;
  assert.equal(await toggleFullscreen({active:false,enter:async()=>{entered++;}}), '');
  assert.equal(await toggleFullscreen({active:true,exit:async()=>{exited++;}}), '');
  assert.equal(entered,1); assert.equal(exited,1);
  assert.equal(await toggleFullscreen({active:false}), FULLSCREEN_FALLBACK);
  assert.equal(await toggleFullscreen({active:false,enter:async()=>{throw Error('Not supported');}}), FULLSCREEN_FALLBACK);
  assert.equal(await toggleFullscreen({active:true,exit:async()=>{throw Error('Denied');}}), FULLSCREEN_FALLBACK);
});
