import type {NormalizedEvent,ConnectionState} from './types';
export type ReplayStep={connection:ConnectionState}|{event:unknown}|{error:string};
// Synthetic identities, not captured viewer data; no real room or account names.
const base={version:1 as const,source:'offline' as const,roomId:'room-test',sessionId:'session-test',viewer:{id:'90071992547409931234',nickname:'Học sinh mẫu'},occurredAt:100000,receivedAt:100000};
const event=(eventId:string,offset:number,details:Record<string,unknown>):NormalizedEvent=>({...base,eventId,occurredAt:base.occurredAt+offset,receivedAt:base.receivedAt+offset,...details}) as NormalizedEvent;
export const FIXTURES:ReplayStep[]=[
 {connection:'connecting'},{connection:'connected'},
 {event:event('join-1',0,{kind:'join'})},
 {event:event('comment-1',4000,{kind:'comment',text:'nhaphoc'})},
 {event:event('like-1',8000,{kind:'like',likes:{mode:'cumulative',total:5,scope:'viewer',counterId:'likes-1'}})},
 {connection:'reconnecting'},{connection:'connected'},
 {event:event('like-1',8000,{kind:'like',likes:{mode:'cumulative',total:5,scope:'viewer',counterId:'likes-1'}})},
 {event:event('like-2',12000,{kind:'like',likes:{mode:'cumulative',total:8,scope:'viewer',counterId:'likes-1'}})},
 {event:event('like-old',13000,{kind:'like',likes:{mode:'cumulative',total:6,scope:'viewer',counterId:'likes-1'}})},
 {event:event('gift-1',16000,{kind:'gift',giftId:'flower',streakId:'streak-1',repeatCount:1,final:false})},
 {event:event('gift-2',20000,{kind:'gift',giftId:'flower',streakId:'streak-1',repeatCount:3,final:true})},
 {event:event('gift-3',24000,{kind:'gift',giftId:'flower',streakId:'streak-1',repeatCount:3,final:true})},
 {event:event('share-1',28000,{kind:'share'})},
 {event:event('anon',32000,{kind:'join',viewer:{id:null,nickname:'Không định danh'}})},
 {event:{...base,eventId:'bad-id',kind:'join',viewer:{id:123}}},
 {error:'Lỗi mô phỏng nguồn dữ liệu'}, {connection:'ended'}
];
