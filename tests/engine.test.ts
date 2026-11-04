import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEvent, createGame, leaderboard, parseProgress, loadProgress, saveProgress, MAX_PLAYERS, REPLAY_WINDOW } from '../src/game/engine.ts';
const event = (kind = 'comment', extra = {}) => ({ id: 'event-1', playerId: 'mock-0', nickname: 'Mochi', kind, count: 1, ...extra });
test('awards separate XP and contribution without mutating input', () => {
  const original = createGame(['Mochi']);
  const next = applyEvent(original, event());
  assert.equal(original.players[0].xp, 0);
  assert.equal(next.players[0].xp, 5);
  assert.equal(next.players[0].contribution, 2);
  const gifted = applyEvent(next, event('gift', { id: 'gift' }));
  assert.equal(gifted.players[0].xp, 5);
  assert.equal(gifted.players[0].contribution, 22);
});
test('replayed IDs cannot earn twice, including after reload', () => {
  const state = applyEvent(createGame(['Mochi']), event());
  const restored = parseProgress(JSON.stringify(state))!;
  assert.deepEqual(applyEvent(restored, event()), state);
});
test('caps event batches, supports shares and separates stable identity from nickname', () => {
  let state = applyEvent(createGame(['Mochi']), event('like', { count: 10000 }));
  assert.equal(state.players[0].xp, 100);
  state = applyEvent(state, event('share', { id: 'share', nickname: 'New name' }));
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].xp, 110);
  assert.equal(state.players[0].nickname, 'New name');
});
test('rejects malformed events and prototype property kinds', () => {
  const state = createGame(['Mochi']);
  for (const bad of [null, {}, event('toString'), event('like', { count: -1 }), event('gift', { count: 1.5 }), event('like', { count: Infinity }), event('like', { playerId: '' }), event('like', { nickname: 'x'.repeat(41) })]) assert.equal(applyEvent(state, bad), state);
});
test('leaderboard uses XP then contribution then stable ID; does not mutate roster', () => {
  let state = createGame(Array.from({ length: 20 }, (_, i) => `Player ${i}`));
  state = applyEvent(state, event('comment', { playerId: 'mock-5' }));
  state = applyEvent(state, event('comment', { id: 'second', playerId: 'mock-3' }));
  state = applyEvent(state, event('gift', { id: 'third', playerId: 'mock-5' }));
  assert.equal(leaderboard(state).length, 10);
  assert.deepEqual(leaderboard(state).slice(0, 2).map(p => p.id), ['mock-5', 'mock-3']);
  assert.equal(state.players[0].id, 'mock-0');
});
test('invalid, incompatible and corrupt saves are rejected', () => {
  const state = createGame(['Mochi']);
  for (const raw of [null, '', '{', 'null', JSON.stringify({ ...state, version: 2 }), JSON.stringify({ ...state, players: [state.players[0], state.players[0]] }), JSON.stringify({ ...state, players: [{ ...state.players[0], xp: -10 }] }), JSON.stringify({ ...state, processedIds: [1] })]) assert.equal(parseProgress(raw), null);
});
test('storage round trip and storage errors remain visible to callers', () => {
  const map = new Map<string, string>();
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
  assert.equal(loadProgress(storage), null);
  const state = applyEvent(createGame(['Mochi']), event());
  saveProgress(storage, state);
  assert.deepEqual(loadProgress(storage), state);
  assert.throws(() => saveProgress({ ...storage, setItem() { throw Error('quota'); } }, state), /quota/);
});
test('bounds roster and replay history', () => {
  const state = createGame(Array.from({ length: MAX_PLAYERS }, () => 'Student'));
  assert.equal(applyEvent(state, event('like', { playerId: 'new-player' })), state);
  state.processedIds = Array.from({ length: REPLAY_WINDOW }, (_, i) => `old-${i}`);
  const next = applyEvent(state, event());
  assert.equal(next.processedIds.length, REPLAY_WINDOW);
  assert.equal(next.processedIds[0], 'old-1');
});
