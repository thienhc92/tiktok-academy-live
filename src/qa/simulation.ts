import { createGame, takeExam, promotePlayer, appointOffice, startSession } from '../game/engine.ts';
import type { GameState } from '../game/engine.ts';
import { QUESTIONS, recordFor } from '../game/progression.ts';
export type Sandbox = { kind: 'qa-only'; game: GameState };
export type QAAction =
  | { type:'xp'; playerId:string; amount:unknown }
  | { type:'exam'; playerId:string; answers:unknown }
  | { type:'promote'; playerId:string; target:number; at:number }
  | { type:'appoint'; office:string }
  | { type:'session'; id:string };
export function createSandbox(nicknames:string[]):Sandbox { return {kind:'qa-only',game:createGame(nicknames)}; }
/** No storage or network access. This reducer cannot accept regular GameState. */
export function simulate(state:Sandbox,action:QAAction):Sandbox {
  if(state.kind!=='qa-only')return state;
  const game=state.game;
  let next=game;
  if(action.type==='xp') {
    if(typeof action.amount!=='number'||!Number.isSafeInteger(action.amount)||action.amount<=0||action.amount>1_000_000)return state;
    if(!game.players.some(p=>p.id===action.playerId))return state;
    next={...game,players:game.players.map(p=>p.id===action.playerId?{...p,xp:Math.min(1_000_000_000,p.xp+Number(action.amount))}:p)};
  } else if(action.type==='exam')next=takeExam(game,action.playerId,action.answers);
  else if(action.type==='promote')next=promotePlayer(game,action.playerId,action.at,action.target);
  else if(action.type==='appoint')next=appointOffice(game,action.office);
  else if(action.type==='session')next=startSession(game,action.id);
  return next===game?state:{kind:'qa-only',game:next};
}
export function examAnswers(correct:number):string[] {
  return QUESTIONS.map((q,i)=>i<correct?q.answer:q.answer==='A'?'B':'A');
}
export function previewRank(state:Sandbox,playerId:string):number {
  return Math.min(10,recordFor(state.game.academy,playerId).rank+1);
}
