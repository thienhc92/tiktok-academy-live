/** Transport-independent rules. Never import React or a TikTok SDK here. */
export type EventKind = 'like' | 'comment' | 'gift' | 'share';
export type LiveEvent = {
  id: string;
  playerId: string;
  nickname: string;
  kind: EventKind;
  count: number;
};
export type Player = { id: string; nickname: string; xp: number; contribution: number };
export type GameState = { version: 1; players: Player[]; processedIds: string[] };
export const MAX_PLAYERS = 1000;
export const REPLAY_WINDOW = 2000;
export const STORAGE_KEY = 'tiktok-academy.progress.v1';
const LIMIT = 1_000_000_000;
const rewards: Record<EventKind, { xp: number; contribution: number; max: number }> = {
  like: { xp: 1, contribution: 1, max: 100 },
  comment: { xp: 5, contribution: 2, max: 1 },
  share: { xp: 10, contribution: 5, max: 1 },
  gift: { xp: 0, contribution: 20, max: 10 },
};
export function createGame(nicknames: string[]): GameState {
  return { version: 1, players: nicknames.slice(0, MAX_PLAYERS).map((nickname, i) => ({
    id: `mock-${i}`, nickname, xp: 0, contribution: 0,
  })), processedIds: [] };
}
function validString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function validNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= LIMIT;
}
export function isLiveEvent(value: unknown): value is LiveEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as LiveEvent;
  return validString(e.id, 160) && validString(e.playerId, 100) && validString(e.nickname, 40)
    && typeof e.kind === 'string' && Object.prototype.hasOwnProperty.call(rewards, e.kind) && Number.isSafeInteger(e.count) && e.count > 0 && e.count <= 10000;
}
/** Duplicate IDs are ignored within a bounded persisted replay window. */
export function applyEvent(state: GameState, value: unknown): GameState {
  if (!isLiveEvent(value) || state.processedIds.includes(value.id)) return state;
  const index = state.players.findIndex(p => p.id === value.playerId);
  if (index < 0 && state.players.length >= MAX_PLAYERS) return state;
  const reward = rewards[value.kind];
  const count = Math.min(value.count, reward.max);
  const previous = state.players[index] ?? { id: value.playerId, nickname: value.nickname, xp: 0, contribution: 0 };
  const player = { ...previous, nickname: value.nickname,
    xp: Math.min(LIMIT, previous.xp + reward.xp * count),
    contribution: Math.min(LIMIT, previous.contribution + reward.contribution * count) };
  const players = [...state.players];
  if (index < 0) players.push(player); else players[index] = player;
  return { version: 1, players, processedIds: [...state.processedIds, value.id].slice(-REPLAY_WINDOW) };
}
export function leaderboard(state: GameState): Player[] {
  return [...state.players].sort((a, b) => b.xp - a.xp || b.contribution - a.contribution
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 10);
}
export function parseProgress(raw: string | null): GameState | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const s = JSON.parse(raw) as GameState;
    if (s.version !== 1 || !Array.isArray(s.players) || s.players.length > MAX_PLAYERS
      || !Array.isArray(s.processedIds) || s.processedIds.length > REPLAY_WINDOW) return null;
    if (!s.players.every(p => p && validString(p.id, 100) && validString(p.nickname, 40)
      && validNumber(p.xp) && validNumber(p.contribution))) return null;
    if (new Set(s.players.map(p => p.id)).size !== s.players.length
      || !s.processedIds.every(id => validString(id, 160))
      || new Set(s.processedIds).size !== s.processedIds.length) return null;
    return { version: 1, players: s.players.map(({ id, nickname, xp, contribution }) => ({ id, nickname, xp, contribution })), processedIds: [...s.processedIds] };
  } catch { return null; }
}
export type StoragePort = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export function loadProgress(storage: StoragePort): GameState | null {
  return parseProgress(storage.getItem(STORAGE_KEY));
}
export function saveProgress(storage: StoragePort, state: GameState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
