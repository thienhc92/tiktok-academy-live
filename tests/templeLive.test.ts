import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTempleState,processTempleEvent,templeParticipants,TEMPLE_RECEIPT_LIMIT} from '../src/photo/live/processor.ts';
import {validTempleSnapshot,MemoryTempleRepository} from '../src/photo/live/repository.ts';
import {MockTempleSource,UnconfiguredLiveSource,mockTempleEvent} from '../src/photo/live/sources.ts';
import {initialSeatPlan,updateSeatPlan,SEAT_REBALANCE_MS} from '../src/photo/live/seating.ts';
import {SEAT_MAP} from '../src/photo/seatMap.ts';
import {isTempleEvent} from '../src/photo/live/events.ts';
import type {TempleEvent} from '../src/photo/live/events.ts';
const now=100000;
const seed=()=>createTempleState('MOCK','test-session',[]);
function event(id:string,kind:TempleEvent['kind']='join',at=now):TempleEvent {
    const e=mockTempleEvent(kind==='comment'?'wish':kind,{id:'90071992547409931234',nickname:'Người xem mẫu',avatar:'https://example.com/avatar.png'},seed(),id,at,'Bình an',2);
    return e;
}
const apply=(s:ReturnType<typeof seed>,e:unknown,at=now)=>processTempleEvent(s,e,at).state;
test('stable string identity, renamed profiles, duplicate reward and atomic snapshot replay',async()=>{
    const repo=new MemoryTempleRepository(),initial=seed(),e=event('like','like');
    let r=await repo.transact('MOCK',initial,s=>processTempleEvent(s,e,now));
    assert.equal(r.state.game.contributionScore[e.viewer.id!],1);assert.equal(templeParticipants(r.state)[0].userId,'90071992547409931234');
    const restored=JSON.parse(JSON.stringify(r.state));assert.ok(validTempleSnapshot(restored,'MOCK'));
    const replay=processTempleEvent(restored,e,now);assert.equal(replay.outcome,'duplicate');assert.equal(replay.state.game.likes,1);
    r=await repo.transact('MOCK',initial,s=>processTempleEvent(s,{...event('rename'),viewer:{...e.viewer,nickname:'Tên mới'}},now));
    assert.equal(Object.keys(r.state.profiles).length,1);assert.equal(r.state.profiles[e.viewer.id!].nickname,'Tên mới');
    assert.equal(r.state.profiles[e.viewer.id!].avatar,e.viewer.avatar);
});
test('missing/malformed IDs, unsafe avatar schemes, source/session mismatch never receive points',()=>{
    const s=seed(),e=event('bad','like');
    for(const id of ['',0,123,null,'0','name with spaces','__proto__','toString']){
        const r=processTempleEvent(s,{...e,viewer:{id,nickname:'Trùng tên'}},now);
        assert.equal(Object.keys(r.state.game.contributionScore).length,0);
        assert.equal(r.outcome,id===null?'anonymous':'invalid');
    }
    for(const avatar of ['javascript:alert(1)','data:image/png;base64,AAA','http://example.com/a','https://user:pass@example.com/a'])assert.equal(isTempleEvent({...e,viewer:{...e.viewer,avatar}}),false);
    for(const bad of [{...e,source:'tiktok'},{...e,sessionId:'other'},{...e,roomId:'other'},{...e,eventId:' '},{...e,occurredAt:now+5001,receivedAt:now+5001}])assert.equal(processTempleEvent(s,bad,now).outcome,'invalid');
});
test('join, leave, rejoin preserve points; delayed leave cannot evict a fresh join',()=>{
    let s=apply(seed(),event('flower','flower'));const id=event('x').viewer.id!;
    s=apply(s,event('leave','leave',now+10),now+10);assert.equal(s.game.visitors.length,0);assert.equal(s.game.contributionScore[id],8);
    s=apply(s,event('rejoin','join',now+30),now+30);s=apply(s,event('old-leave','leave',now+20),now+30);
    assert.deepEqual(s.game.visitors,[id]);assert.equal(s.game.contributionScore[id],8);
    s=apply(s,event('leave-2','leave',now+40),now+40);
    s=apply(s,event('late-like','like',now+35),now+40);assert.equal(s.game.visitors.length,0);assert.equal(s.game.contributionScore[id],9);
    assert.ok(validTempleSnapshot(s,'MOCK'));
});
test('cumulative likes survive restart, establish baseline, and ignore smaller/room totals',()=>{
    let s=seed();const e=event('l1','like');
    const cumulative=(eventId:string,total:number,scope:'viewer'|'room'='viewer')=>({...e,eventId,likes:{mode:'cumulative',counterId:'stable-counter',total,scope}});
    s=apply(s,cumulative('1',100));assert.equal(s.game.likes,0);
    s=JSON.parse(JSON.stringify(s));s=apply(s,cumulative('2',107));assert.equal(s.game.likes,7);
    s=apply(s,cumulative('3',104));s=apply(s,cumulative('4',107));s=apply(s,cumulative('5',999,'room'));
    assert.equal(s.game.likes,7);assert.equal(s.game.contributionScore[e.viewer.id!],7);
});
test('gift streak final pays once across new message IDs/restart, checks consistent valuation',()=>{
    let s=seed();const e=event('g1','gift');assert.equal(e.kind,'gift');
    s=apply(s,{...e,final:false,repeatCount:2});assert.equal(s.game.contributionScore[e.viewer.id!]??0,0);
    assert.equal(processTempleEvent(s,{...e,eventId:'price-change',coins:999,final:true},now).outcome,'invalid');
    s=apply(s,{...e,eventId:'g2',repeatCount:3,final:true});assert.equal(s.game.contributionScore[e.viewer.id!],60);
    s=JSON.parse(JSON.stringify(s));s=apply(s,{...e,eventId:'g3',repeatCount:3,final:true});assert.equal(s.game.contributionScore[e.viewer.id!],60);
    assert.ok(validTempleSnapshot(s,'MOCK'));
});
test('parallel repository updates serialize without losing points; MOCK/LIVE snapshots remain separate',async()=>{
    const repo=new MemoryTempleRepository(),initial=seed();
    await Promise.all(Array.from({length:30},(_,i)=>repo.transact('MOCK',initial,s=>processTempleEvent(s,event('parallel-'+i,'like'),now))));
    const r=await repo.transact('MOCK',initial,s=>({state:s,outcome:'processed'}));assert.equal(r.state.game.likes,30);
    const live=createTempleState('LIVE','live-session');
    const l=await repo.transact('LIVE',live,s=>({state:s,outcome:'processed'}));assert.equal(l.state.game.visitors.length,0);assert.equal(l.state.game.likes,0);
});
test('corrupt/versioned snapshots are rejected; receipt saturation fails closed',()=>{
    const s=seed();assert.ok(validTempleSnapshot(s,'MOCK'));
    for(const bad of [{...s,version:99},{...s,mode:'LIVE'},{...s,game:{...s.game,contributionScore:{unknown:10}}},{...s,receipts:['same','same']},{...s,profiles:{x:{userId:'x',active:true}}}])assert.equal(validTempleSnapshot(bad,'MOCK'),false);
    const full={...s,receipts:Array.from({length:TEMPLE_RECEIPT_LIMIT},(_,i)=>'key'+i)};
    const r=processTempleEvent(full,event('new','like'),now);assert.equal(r.outcome,'capacity');assert.strictEqual(r.state,full);
});
test('adapters stop offline delivery and LIVE never opens a connection',()=>{
    const received:unknown[]=[],connections:unknown[]=[],errors:string[]=[];
    const sink={event:(e:unknown)=>received.push(e),connection:(c:unknown)=>connections.push(c),error:(s:string)=>errors.push(s)};
    const mock=new MockTempleSource();mock.start(sink);mock.emit(event('1'));mock.stop();mock.emit(event('2'));assert.equal(received.length,1);
    const live=new UnconfiguredLiveSource();live.start(sink);assert.equal(connections.at(-1),'disconnected');assert.equal(errors.length,1);
});
test('seat vacancies fill immediately, rewards reorder at most once per cooldown, 108 remain bounded',()=>{
    const users=Array.from({length:SEAT_MAP.length+1},(_,i)=>({id:'u'+i,contributionScore:0}));
    let plan=initialSeatPlan(users,now);const before=structuredClone(plan.assigned);
    users.at(-1)!.contributionScore=100;
    plan=updateSeatPlan(plan,users,now+100);assert.deepEqual(plan.assigned,before);assert.equal(plan.pending,true);
    plan=updateSeatPlan(plan,users,now+SEAT_REBALANCE_MS);assert.equal(plan.assigned[0].userId,users.at(-1)!.id);assert.equal(plan.assigned.length,108);
    const unchanged=plan;assert.strictEqual(updateSeatPlan(plan,users,now+SEAT_REBALANCE_MS+1),unchanged);
    const leaving=plan.assigned[3];const remaining=users.filter(u=>u.id!==leaving.userId);
    const refill=updateSeatPlan(plan,remaining,now+SEAT_REBALANCE_MS+20);assert.equal(refill.assigned.length,108);
    for(const a of plan.assigned.filter(a=>a.userId!==leaving.userId))assert.ok(refill.assigned.some(b=>b.userId===a.userId&&b.seatId===a.seatId));
});
test('mock envelopes expose only event data; equal nicknames remain distinct viewer IDs',()=>{
    const first=event('one','like');assert.ok(!('game'in first));assert.ok(!('profiles'in first));assert.ok(!('receipts'in first));
    let s=apply(seed(),first);
    s=apply(s,{...event('two','flower'),viewer:{...first.viewer,id:'90071992547409931235'}});
    assert.equal(Object.keys(s.profiles).length,2);
    assert.equal(s.game.contributionScore['90071992547409931234'],1);
    assert.equal(s.game.contributionScore['90071992547409931235'],8);
});
