import {createGame} from '../game/engine.ts';
import type {GameState} from '../game/engine.ts';
import {receive} from '../missions/rules.ts';
import {isNormalizedEvent} from './types.ts';
export type Outcome='invalid'|'duplicate'|'anonymous'|'aggregate'|'stale'|'pending'|'processed'|'blocked'|'capacity';
export type ReplayState={game:GameState;seen:string[];counters:Record<string,number>;closed:string[];clock:number};
export const REPLAY_CAPACITY=10000;
export function createReplay():ReplayState{return {game:createGame([]),seen:[],counters:{},closed:[],clock:0};}
export function processEvent(state:ReplayState,input:unknown):{state:ReplayState;outcome:Outcome;units:number} {
 const result=(outcome:Outcome,units=0,next=state)=>({state:next,outcome,units});
 if(!isNormalizedEvent(input))return result('invalid');const e=input;
 const key=JSON.stringify([e.source,e.roomId,e.sessionId,e.kind,e.eventId]);
 if(state.seen.includes(key))return result('duplicate');
 // Never evict dedup keys silently: a full offline run fails closed.
 if(state.seen.length>=REPLAY_CAPACITY)return result('capacity');
 const next:ReplayState={...state,seen:[...state.seen,key],counters:{...state.counters},closed:[...state.closed],clock:Math.max(state.clock,e.receivedAt)};
 if(next.clock-e.occurredAt>30000)return result('stale',0,next);
 if(e.viewer.id===null)return result('anonymous',0,next);
 let units=1;
 const counterKey=(suffix:string)=>JSON.stringify([e.source,e.roomId,e.sessionId,e.viewer.id,suffix]);
 if(e.kind==='like'){
  if(e.likes.mode==='delta')units=e.likes.count;
  else{
   if(e.likes.scope==='room')return result('aggregate',0,next);
   const k=counterKey('likes:'+e.likes.counterId);
   if(state.counters[k]===undefined){next.counters[k]=e.likes.total;return result('pending',0,next);}
   const previous=state.counters[k];
   units=Math.max(0,e.likes.total-previous);next.counters[k]=Math.max(previous,e.likes.total);
   if(!units)return result('stale',0,next);
  }
 }
 if(e.kind==='gift'){
  const k=counterKey('gift:'+JSON.stringify([e.giftId,e.streakId]));
  if(state.closed.includes(k))return result('duplicate',0,next);
  // Intermediate updates are observations, never rewards. Final total pays once.
  if(!e.final){next.counters[k]=Math.max(state.counters[k]??0,e.repeatCount);return result('pending',0,next);}
  if(e.repeatCount<(state.counters[k]??0))return result('stale',0,next);
  next.closed.push(k);next.counters[k]=e.repeatCount;units=e.repeatCount;
 }
 const before=next.game;
 // Separate offline namespace; nickname is display-only. Engine quotas remain authoritative.
 next.game=receive(before,{id:'offline:'+next.seen.length,playerId:e.source+':'+e.viewer.id,nickname:e.viewer.nickname??'Người xem ẩn danh',kind:e.kind,count:units,...(e.kind==='comment'?{text:e.text}:{})},next.clock);
 const id='offline:'+next.seen.length;
 const accepted=next.game.live?.records.some(r=>r.id===e.source+':'+e.viewer.id&&r.acceptedIds.includes(id));
 return result(accepted?'processed':'blocked',accepted?Math.min(units,e.kind==='like'?20:e.kind==='gift'?10:1):0,next);
}
