import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueueNotice, communityGoal } from '../src/broadcast/model.ts';
import type { Notice } from '../src/broadcast/model.ts';
const notice = (id: number, expiresAt = 5000): Notice => ({ id, expiresAt, kind: 'join', nickname: 'Mochi' });
test('notifications discard expired entries and bound bursts to three', () => {
  const original = [notice(1, 100), notice(2), notice(3), notice(4)];
  const next = enqueueNotice(original, notice(5), 100);
  assert.deepEqual(next.map(n => n.id), [3, 4, 5]);
  assert.equal(original.length, 4);
  assert.deepEqual(enqueueNotice([notice(1, 100)], notice(2), 100).map(n => n.id), [2]);
});
test('community overlay clamps progress and never awards gameplay rewards', () => {
  assert.deepEqual(communityGoal(-1), { target: 5000, progress: 0, complete: false });
  assert.deepEqual(communityGoal(150), { target: 5000, progress: 150, complete: false });
  assert.deepEqual(communityGoal(5001), { target: 5000, progress: 5000, complete: true });
});
