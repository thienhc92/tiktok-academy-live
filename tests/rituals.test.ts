import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTempleState,processTempleEvent,templeParticipants} from '../src/photo/live/processor.ts';
import {mockTempleEvent} from '../src/photo/live/sources.ts';
import {MemoryTempleRepository,restoreTempleSnapshot,validTempleSnapshot} from '../src/photo/live/repository.ts';
import {MERIT_RULES,MOCK_GIFT_TIERS,isPrayerComment,meritRank} from '../src/photo/live/merit.ts';
import {RITUAL_LIMIT,RITUAL_DURATION,RITUAL_ANCHORS,enqueueRitual,ritualCue,projectRitualPoint} from '../src/photo/live/rituals.ts';
import {initialSeatPlan,updateSeatPlan,SEAT_REBALANCE_MS,MAX_SEAT_WAIT_MS} from '../src/photo/live/seating.ts';
import {SEAT_MAP} from '../src/photo/seatMap.ts';
const start=100000;
const seed=()=>createTempleState('MOCK','ritual-test',[]);
function e(id:string,kind:Parameters<typeof mockTempleEvent>[0],at=start,userId='viewer-1',text?:string,coins=1){return mockTempleEvent(kind,{id:userId,nickname:'Khách '+userId},seed(),id,at,text,coins);}
test('activity merit is separate from contribution, gifts and academic XP',()=>{
    let s=seed();
    for(const [id,kind]of [['b','bow'],['i','incense'],['f','flower'],['l','like']] as const)s=processTempleEvent(s,e(id,kind),start).state;
    assert.equal(s.merit['viewer-1'],18);assert.equal(s.game.contributionScore['viewer-1'],14);
    const p=templeParticipants(s)[0];assert.equal(p.meritScore,18);assert.equal(p.rank,1);assert.ok('seatId'in p);assert.ok(!('xp'in p));
    assert.deepEqual(MOCK_GIFT_TIERS,[1,5,10,30]);
    for(const coins of MOCK_GIFT_TIERS){const r=processTempleEvent(s,e('gift-'+coins,'gift',start,'viewer-1',undefined,coins),start);s=r.state;assert.equal(s.merit['viewer-1'],18);}
    assert.equal(s.game.contributionScore['viewer-1'],474);
});
test('prayer comments recognize accents/case, bow once and preserve the original comment',()=>{
    for(const text of ['Nam mô A Di Đà Phật','NAM MÔ A DI ĐÀ PHẬT 🙏','nam mo a di da phat'])assert.equal(isPrayerComment(text),true);
    for(const text of ['Chúc bình an','Nam mô A Di Đà Phật nam mô A Di Đà Phật','không nam mo a di da phat'])assert.equal(isPrayerComment(text),false);
    const event=e('prayer','wish',start,'viewer-1','Nam mô A Di Đà Phật');const a=processTempleEvent(seed(),event,start);
    assert.equal(a.state.merit['viewer-1'],2);assert.equal(a.state.game.contributionScore['viewer-1'],0);assert.equal(a.cue?.kind,'bow');assert.equal(a.state.game.comments[0].text,event.kind==='comment'?event.text:'');
    const duplicate=processTempleEvent(a.state,event,start+3000);assert.equal(duplicate.outcome,'duplicate');assert.equal(duplicate.cue,undefined);assert.equal(duplicate.state.merit['viewer-1'],2);
    const rapid=processTempleEvent(a.state,e('prayer2','wish',start+100,'viewer-1','Nam mô A Di Đà Phật'),start+100);assert.equal(rapid.state.merit['viewer-1'],2);assert.equal(rapid.cue,undefined);assert.equal(rapid.state.game.comments.length,2);
});
test('pose cooldown and duplicate receipts survive restart without replaying visual cues',()=>{
    const a=processTempleEvent(seed(),e('bow','bow'),start);assert.equal(a.cue?.kind,'bow');
    const restored=restoreTempleSnapshot(JSON.parse(JSON.stringify(a.state)),'MOCK');assert.equal(restored.game.notice,null);
    const blocked=processTempleEvent(restored,e('rapid','bow',start+100),start+100);assert.equal(blocked.outcome,'rate-limited');assert.equal(blocked.state.merit['viewer-1'],2);
    const next=processTempleEvent(blocked.state,e('later','bow',start+MERIT_RULES.bowGapMs),start+MERIT_RULES.bowGapMs);assert.equal(next.state.merit['viewer-1'],4);
    assert.equal(processTempleEvent(next.state,e('bow','bow'),start+5000).outcome,'duplicate');
});
test('heart reward limits are per viewer, persistent, capped by minute and cannot replay denied units',()=>{
    let s=seed();const first=e('heart','like');s=processTempleEvent(s,first,start).state;
    let r=processTempleEvent(s,e('fast','like',start+100),start+100);assert.equal(r.outcome,'rate-limited');s=r.state;
    assert.equal(s.merit['viewer-1'],1);assert.equal(s.game.likes,1);
    assert.equal(processTempleEvent(restoreTempleSnapshot(s,'MOCK'),e('fast','like',start+5000),start+5000).outcome,'duplicate');
    for(let i=1;i<30;i++)s=processTempleEvent(s,e('heart'+i,'like',start+i*1000),start+i*1000).state;
    assert.equal(s.merit['viewer-1'],30);assert.equal(processTempleEvent(s,e('cap','like',start+31000),start+31000).outcome,'rate-limited');
    s=processTempleEvent(s,e('new-window','like',start+60000),start+60000).state;assert.equal(s.merit['viewer-1'],31);
    s=processTempleEvent(s,e('other','like',start+60000,'viewer-2'),start+60000).state;assert.equal(s.merit['viewer-2'],1);
});
test('batched/cumulative mock hearts cannot bypass the same quota or retry capped excess',()=>{
    let s=seed();const base=e('first','like');
    s=processTempleEvent(s,{...base,likes:{mode:'delta',count:10000}},start).state;assert.equal(s.game.likes,1);
    s=processTempleEvent(s,{...base,eventId:'baseline',likes:{mode:'cumulative',scope:'viewer',counterId:'c',total:100}},start).state;
    s=processTempleEvent(s,{...base,eventId:'c2',occurredAt:start+1000,receivedAt:start+1000,likes:{mode:'cumulative',scope:'viewer',counterId:'c',total:500}},start+1000).state;
    assert.equal(s.game.likes,2);assert.equal(s.merit['viewer-1'],2);
    s=processTempleEvent(s,{...base,eventId:'same-total',occurredAt:start+5000,receivedAt:start+5000,likes:{mode:'cumulative',scope:'viewer',counterId:'c',total:500}},start+5000).state;assert.equal(s.game.likes,2);
});
test('v1 migration retains old contributions, receipts and people without inventing historical merit',()=>{
    const a=processTempleEvent(seed(),e('old-gift','gift',start,'viewer-1',undefined,5),start).state;
    const {merit,meritLimits,...rest}=a;const v1={...rest,version:1};
    const migrated=restoreTempleSnapshot(v1,'MOCK');assert.equal(migrated.version,2);assert.deepEqual(migrated.merit,{});assert.deepEqual(migrated.meritLimits,{});
    assert.equal(migrated.game.contributionScore['viewer-1'],50);assert.deepEqual(migrated.receipts,a.receipts);assert.deepEqual(migrated.profiles,a.profiles);
    assert.equal(processTempleEvent(migrated,e('old-gift','gift',start,'viewer-1',undefined,5),start).outcome,'duplicate');
    for(const value of [{...v1,version:99},{...v1,profiles:{}},{...migrated,merit:{unknown:4}},{...migrated,meritLimits:{'viewer-1':{heartAt:0,hearts:100,heartStart:0,bowAt:null}}}])assert.throws(()=>restoreTempleSnapshot(value,'MOCK'));
});
test('108 simultaneous participants get correct merit while effects remain bounded and expire',async()=>{
    const repo=new MemoryTempleRepository(),initial=seed();let cues:ReturnType<typeof ritualCue>[]=[];
    const results=await Promise.all(Array.from({length:108},(_,i)=>repo.transact('MOCK',initial,s=>processTempleEvent(s,e('user'+i,'flower',start,'viewer-'+i),start))));
    for(const r of results)if(r.cue)cues=enqueueRitual(cues,r.cue,start);
    const state=results.at(-1)!.state;assert.equal(state.game.visitors.length,108);assert.equal(Object.values(state.merit).reduce((a,b)=>a+b,0),1080);assert.equal(Object.values(state.game.contributionScore).reduce((a,b)=>a+b,0),864);assert.equal(cues.length,RITUAL_LIMIT);
    assert.deepEqual(cues.filter(c=>c.expiresAt>start+5000),[]);assert.ok(validTempleSnapshot(state,'MOCK'));
});
test('long simulated run has bounded effects, persistent quotas and valid recoverable scores',()=>{
    let s=seed(),cues:ReturnType<typeof ritualCue>[]=[];
    for(let i=0;i<2000;i++){
        const time=start+i*2000,r=processTempleEvent(s,e('run'+i,i%2?'like':'flower',time),time);s=r.state;
        if(r.cue)cues=enqueueRitual(cues,r.cue,time);
        assert.ok(cues.length<=RITUAL_LIMIT);
    }
    assert.equal(s.receipts.length,2000);assert.ok(validTempleSnapshot(s,'MOCK'));assert.equal(s.merit['viewer-1'],10000+s.game.likes);
    assert.equal(s.game.likes,1000);assert.equal(restoreTempleSnapshot(JSON.parse(JSON.stringify(s)),'MOCK').merit['viewer-1'],s.merit['viewer-1']);
});
test('small adjacent rank changes wait, significant changes move after cooldown, merit never sorts seats',()=>{
    const users=[{id:'a',contributionScore:101},{id:'b',contributionScore:100}];const p=initialSeatPlan(users,start);
    const changed=[users[0],{...users[1],contributionScore:102}];const waiting=updateSeatPlan(p,changed,start+SEAT_REBALANCE_MS);
    assert.deepEqual(waiting.assigned,p.assigned);assert.equal(waiting.pending,true);assert.equal(updateSeatPlan(waiting,changed,start+MAX_SEAT_WAIT_MS).assigned[0].userId,'b');
    assert.equal(updateSeatPlan(p,[users[0],{...users[1],contributionScore:120}],start+SEAT_REBALANCE_MS).assigned[0].userId,'b');
    assert.strictEqual(updateSeatPlan(p,users.map(u=>({...u,meritScore:999999})),start+5000),p);
    const full=Array.from({length:109},(_,i)=>({id:'p'+i,contributionScore:0})),plan=initialSeatPlan(full,start);full.at(-1)!.contributionScore=1;
    assert.equal(updateSeatPlan(plan,full,start+5000).assigned[0].userId,'p108');
});
test('MOCK rituals stay locked for LIVE, milestones are participation labels and not payment',()=>{
    assert.deepEqual([0,50,200,1000].map(meritRank),['visitor','companion','regular','committed']);
    const live=createTempleState('LIVE','live-session');const r=processTempleEvent(live,{...e('live','bow'),source:'tiktok',roomId:live.roomId,sessionId:live.sessionId},start);
    assert.equal(r.outcome,'invalid');assert.equal(r.cue,undefined);assert.deepEqual(r.state.merit,{});
    const gift=processTempleEvent(seed(),e('g','gift',start,'viewer-1',undefined,30),start);assert.equal(gift.state.merit['viewer-1']??0,0);assert.equal(gift.state.game.contributionScore['viewer-1'],300);
});
test('ritual geometry stays below faces, cue coalescing does not restart poses or accumulate smoke',()=>{
    assert.equal(RITUAL_DURATION.bow,2200);assert.equal(RITUAL_DURATION.incense,2800);
    let cues=enqueueRitual([],ritualCue('one','u','incense',start),start);
    cues=enqueueRitual(cues,ritualCue('two','u','incense',start+50),start+50);assert.equal(cues.length,1);
    cues=enqueueRitual(cues,ritualCue('three','u','bow',start+100),start+100);assert.equal(cues.length,2);
    assert.equal(enqueueRitual(cues,ritualCue('old','u','flower',start),start+5000).length,0);
    for(const anchor of [RITUAL_ANCHORS.incense,...RITUAL_ANCHORS.flowers]){assert.ok(anchor.y>750/1448);const point=projectRitualPoint(anchor.x,anchor.y,768,1024,3/4);assert.ok(point.y>530&&point.y<600);}
    assert.equal(SEAT_MAP.length,108);
});

test('seat ranking waits for active ritual poses to finish without moving the anchor mid-bow',()=>{
    const users=[{id:'a',contributionScore:10},{id:'b',contributionScore:0}];const plan=initialSeatPlan(users,start);
    const changed=[users[0],{...users[1],contributionScore:100}];
    const held=updateSeatPlan(plan,changed,start+5000,start+6000);assert.deepEqual(held.assigned,plan.assigned);
    assert.equal(updateSeatPlan(held,changed,start+6000,start+6000).assigned[0].userId,'b');
});
