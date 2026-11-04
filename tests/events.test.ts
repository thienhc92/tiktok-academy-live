import {test} from 'node:test';import assert from 'node:assert/strict';
import {createReplay,processEvent,REPLAY_CAPACITY} from '../src/events/processor.ts';
import {OfflineAdapter} from '../src/events/OfflineAdapter.ts';import {FIXTURES} from '../src/events/fixtures.ts';
const base={version:1,source:'offline',roomId:'room',sessionId:'session',viewer:{id:'90071992547409931234',nickname:'Một'},occurredAt:100000,receivedAt:100000,eventId:'one',kind:'join'};
const like=(id:string,total:number,time:number)=>({...base,eventId:id,occurredAt:time,receivedAt:time,kind:'like',likes:{mode:'cumulative',scope:'viewer',counterId:'counter',total}});
test('stable IDs remain strings; nickname changes do not create a second player',()=>{let s=processEvent(createReplay(),base).state;s=processEvent(s,{...base,eventId:'two',kind:'share',viewer:{...base.viewer,nickname:'Hai'},receivedAt:104000,occurredAt:104000}).state;assert.equal(s.game.players.length,1);assert.equal(s.game.players[0].id,'offline:'+base.viewer.id);});
test('missing identity and room aggregates never create a reward recipient',()=>{const s=createReplay();assert.equal(processEvent(s,{...base,viewer:{id:null}}).outcome,'anonymous');assert.equal(processEvent(s,{...base,viewer:{id:123}}).outcome,'invalid');assert.equal(processEvent(s,{...base,viewer:{nickname:'Only'}}).outcome,'invalid');const r=processEvent(s,{...like('x',99,100000),likes:{mode:'cumulative',scope:'room',counterId:'room',total:99}});assert.equal(r.outcome,'aggregate');assert.equal(r.state.game.players.length,0);});
test('duplicate replays and reconnects do not repay rewards',()=>{let s=createReplay();const play=()=>{const a=new OfflineAdapter(FIXTURES);a.start({connection:()=>{},error:()=>{},event:e=>{s=processEvent(s,e).state;}});while(a.step()){}a.stop();};play();const before=JSON.stringify(s.game);play();assert.equal(JSON.stringify(s.game),before);});
test('cumulative likes establish a baseline and pay only increasing deltas',()=>{let s=processEvent(createReplay(),like('a',10,100000)).state;assert.equal(s.game.players.length,0);let r=processEvent(s,like('b',15,104000));assert.equal(r.units,5);assert.equal(r.state.game.players[0].xp,5);s=r.state;r=processEvent(s,like('c',12,108000));assert.equal(r.outcome,'stale');assert.equal(r.state.game.players[0].xp,5);r=processEvent(r.state,like('d',17,112000));assert.equal(r.units,2);assert.equal(r.state.game.players[0].xp,7);});
test('gift streak final pays contribution once, not intermediate or repeated final',()=>{let s=createReplay();const gift={...base,kind:'gift',giftId:'flower',streakId:'streak',repeatCount:2,final:false};s=processEvent(s,gift).state;assert.equal(s.game.players.length,0);s=processEvent(s,{...gift,eventId:'final',final:true,repeatCount:3,occurredAt:104000,receivedAt:104000}).state;assert.equal(s.game.players[0].contribution,60);assert.equal(s.game.players[0].xp,0);const r=processEvent(s,{...gift,eventId:'final-again',final:true,repeatCount:3,occurredAt:108000,receivedAt:108000});assert.equal(r.outcome,'duplicate');assert.equal(r.state.game.players[0].contribution,60);});
test('late finals below observed count do not close or overpay streak',()=>{const gift={...base,kind:'gift',giftId:'f',streakId:'s',repeatCount:5,final:false};let s=processEvent(createReplay(),gift).state;let r=processEvent(s,{...gift,eventId:'old',final:true,repeatCount:3});assert.equal(r.outcome,'stale');r=processEvent(r.state,{...gift,eventId:'end',final:true,repeatCount:5});assert.equal(r.state.game.players[0].contribution,100);});
test('arrival time remains authoritative; out-of-order event times do not rewind engine',()=>{let s=processEvent(createReplay(),base).state;const r=processEvent(s,{...base,kind:'comment',text:'nhaphoc',eventId:'late',occurredAt:99000,receivedAt:104000});assert.equal(r.outcome,'processed');assert.equal(r.state.game.live!.now,104000);assert.equal(processEvent(r.state,{...base,eventId:'too-old',occurredAt:1,receivedAt:105000}).outcome,'stale');});
test('validation and full dedup storage fail closed, not evict old keys',()=>{const s=createReplay();assert.equal(processEvent(s,{...base,receivedAt:NaN}).outcome,'invalid');assert.equal(processEvent(s,{...base,kind:'like',likes:{mode:'delta',count:-1}}).outcome,'invalid');const full={...s,seen:Array.from({length:REPLAY_CAPACITY},(_,i)=>String(i))};assert.equal(processEvent(full,base).outcome,'capacity');assert.equal(processEvent(full,base).state,full);});
test('engine cooldown/XP caps remain enforced even when normalization is valid',()=>{let s=processEvent(createReplay(),{...base,kind:'like',likes:{mode:'delta',count:5}}).state;const r=processEvent(s,{...base,eventId:'spam',kind:'like',likes:{mode:'delta',count:5},receivedAt:100001});assert.equal(r.outcome,'blocked');assert.equal(r.state.game.players[0].xp,5);});
test('adapter stop prevents delivery and reports disconnect without resetting processor',()=>{const states:string[]=[];let n=0;const a=new OfflineAdapter(FIXTURES);a.start({connection:s=>states.push(s),error:()=>{},event:()=>n++});a.step();a.step();a.step();a.stop();assert.equal(a.step(),false);assert.equal(n,1);assert.equal(states.at(-1),'disconnected');});
test('room/session/provider keys are distinct and input state is immutable',()=>{
 const initial=createReplay(),before=JSON.stringify(initial);let s=processEvent(initial,base).state;
 assert.equal(JSON.stringify(initial),before);
 s=processEvent(s,{...base,roomId:'other-room',kind:'share',occurredAt:104000,receivedAt:104000}).state;
 assert.equal(s.seen.length,2);assert.equal(s.game.players.length,1);
 s=processEvent(s,{...base,source:'fixture-provider',occurredAt:108000,receivedAt:108000}).state;assert.equal(s.game.players.length,2);
});
test('counter resets need an explicit new counter ID and delta likes deduplicate independently',()=>{
 let s=processEvent(createReplay(),like('baseline',100,100000)).state;
 let r=processEvent(s,like('reset-old',0,104000));assert.equal(r.outcome,'stale');
 r=processEvent(r.state,{...like('new',0,108000),likes:{mode:'cumulative',scope:'viewer',counterId:'new-counter',total:0}});assert.equal(r.outcome,'pending');
 r=processEvent(r.state,{...like('delta',3,112000),likes:{mode:'delta',count:3}});assert.equal(r.state.game.players[0].xp,3);
 assert.equal(processEvent(r.state,{...like('delta',3,112000),likes:{mode:'delta',count:3}}).outcome,'duplicate');
});
test('offline normalized answers preserve timed quiz deadlines and duplicate protection',async()=>{
 const {openQuiz}=await import('../src/missions/rules.ts');let s=createReplay();s.game=openQuiz(s.game,'offline-round','q1',100000,15);
 const answer={...base,kind:'comment',text:'A',occurredAt:104000,receivedAt:104000};s=processEvent(s,answer).state;assert.equal(s.game.players[0].xp,45);assert.equal(processEvent(s,answer).outcome,'duplicate');
 const late=processEvent(s,{...answer,eventId:'late-answer',viewer:{id:'other'},occurredAt:116000,receivedAt:116000});assert.equal(late.state.game.players[1].xp,0);
});
test('offline rewards reuse promotion eligibility and stop at the examination gate',async()=>{
 const {configureThresholds}=await import('../src/game/engine.ts');const {recordFor}=await import('../src/game/progression.ts');let s=createReplay();s.game=configureThresholds(s.game,[0,1,2,3,4,5,6,7,8,9,10]);
 s=processEvent(s,{...base,kind:'comment',text:'nhaphoc'}).state;assert.equal(recordFor(s.game.academy,'offline:'+base.viewer.id).rank,3);assert.equal(s.game.academy.appointments.length,0);
});
