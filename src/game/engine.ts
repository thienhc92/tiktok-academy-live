import { createAcademy, parseAcademy, recordFor, replaceRecord, eligibility, gradeExam, QUESTIONS, OFFICES, validThresholds } from './progression.ts';
import type { Academy } from './progression.ts';
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
export type GameState = { version: 1; players: Player[]; processedIds: string[]; academy: Academy };
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
  })), processedIds: [], academy: createAcademy() };
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
  return { ...state, players, processedIds: [...state.processedIds, value.id].slice(-REPLAY_WINDOW) };
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
    const academy = s.academy === undefined ? createAcademy() : parseAcademy(s.academy, s.players.map(p=>p.id));
    if(!academy)return null;
    return { version: 1, academy, players: s.players.map(({ id, nickname, xp, contribution }) => ({ id, nickname, xp, contribution })), processedIds: [...s.processedIds] };
  } catch { return null; }
}
export type StoragePort = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export function loadProgress(storage: StoragePort): GameState | null {
  return parseProgress(storage.getItem(STORAGE_KEY));
}
export function saveProgress(storage: StoragePort, state: GameState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Correctness comes from the local question bank, never a caller-supplied flag. */
export function answerQuiz(state:GameState, playerId:string, questionId:string, answer:string):GameState {
  const player=state.players.find(p=>p.id===playerId),question=QUESTIONS.find(q=>q.id===questionId);
  if(!player||!question||!/^[ABCD]$/.test(answer))return state;
  const record=recordFor(state.academy,playerId);
  if(record.quizzes.includes(questionId))return state;
  const academy=replaceRecord(state.academy,{...record,quizzes:[...record.quizzes,questionId]});
  return {...state,academy,players:state.players.map(p=>p.id===playerId?{...p,xp:Math.min(LIMIT,p.xp+(answer===question.answer?25:0))}:p)};
}
export function takeExam(state: GameState, playerId: string, answers: unknown): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return state;
  const record = recordFor(state.academy, playerId);
  const target = record.rank + 1;
  const score = gradeExam(answers);
  if (target < 4 || target > 10 || player.xp < state.academy.thresholds[target] || score === null
    || record.exams.some(e => e.session === state.academy.session)
    || record.exams.some(e => e.target === target && e.score >= 80)) return state;
  let exams = [...record.exams, { target, score, session: state.academy.session }];
  if (exams.length > 100) {
    const passed = exams.filter(e => e.score >= 80);
    const failed = exams.filter(e => e.score < 80).slice(-(100 - passed.length));
    exams = [...passed, ...failed];
  }
  return { ...state, academy: replaceRecord(state.academy, { ...record, exams }) };
}
export function promotePlayer(state:GameState,playerId:string,at:number,target:number):GameState {
  const player=state.players.find(p=>p.id===playerId);if(!player||!Number.isSafeInteger(at)||at<0)return state;
  const status=eligibility(state.academy,playerId,player.xp);if(!status.eligible||status.next===null||status.next!==target)return state;
  const r=recordFor(state.academy,playerId);
  return {...state,academy:replaceRecord(state.academy,{...r,rank:status.next,history:[...r.history,{from:r.rank,to:status.next,at,session:state.academy.session}]})};
}
export function configureThresholds(state:GameState,thresholds:unknown):GameState {
  if(!validThresholds(thresholds))return state;
  return {...state,academy:{...state.academy,thresholds:[...thresholds]}};
}
export function startSession(state:GameState,id:string):GameState {
  if(!validString(id,160)||id===state.academy.session)return state;
  return {...state,academy:{...state.academy,session:id,appointments:[]}};
}
/** Deterministic academic-only selection, one office per player, fixed session term. */
export function appointOffice(state:GameState,officeId:string):GameState {
  const office=OFFICES.find(o=>o.id===officeId);if(!office)return state;
  const a=state.academy,free=office.capacity-a.appointments.filter(p=>p.office===officeId).length;
  if(free<=0)return state;
  const score=(id:string)=>Math.max(0,...recordFor(a,id).exams.map(e=>e.score));
  const time=(id:string)=>recordFor(a,id).history.slice(-1)[0]?.at??0;
  const candidates=state.players.filter(p=>recordFor(a,p.id).rank>=office.rank&&!a.appointments.some(t=>t.playerId===p.id))
    .sort((x,y)=>score(y.id)-score(x.id)||time(x.id)-time(y.id)||(x.id<y.id?-1:x.id>y.id?1:0)).slice(0,free);
  if(!candidates.length)return state;
  return {...state,academy:{...a,appointments:[...a.appointments,...candidates.map(p=>({office:officeId,playerId:p.id,session:a.session}))]}};
}
