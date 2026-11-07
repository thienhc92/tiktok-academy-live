import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONTRIBUTION_RANKS,contributionRank,topContributors} from '../src/photo/live/ranks.ts';
import {enqueueProgress,progressCue,progressPosition,PROGRESS_LIMIT} from '../src/photo/live/progress.ts';
import {createTempleState,processTempleEvent,templeParticipants} from '../src/photo/live/processor.ts';
import {mockTempleEvent} from '../src/photo/live/sources.ts';
import {restoreTempleSnapshot} from '../src/photo/live/repository.ts';
import {initialSeatPlan,updateSeatPlan} from '../src/photo/live/seating.ts';
import {projectSeats,layoutSeatLabels,SEAT_MAP} from '../src/photo/seatMap.ts';
const now=100000;
const seed=()=>createTempleState('MOCK','rank-test',[]);
const e=(id:string,kind:Parameters<typeof mockTempleEvent>[0],at=now,text?:string,coins=1)=>mockTempleEvent(kind,{id:'viewer',nickname:'Tên mẫu'},seed(),id,at,text,coins);
test('five configurable contribution thresholds include all exact boundaries',()=>{
    assert.deepEqual(CONTRIBUTION_RANKS.map(r=>r.threshold),[0,100,500,2000,10000]);
    for(const [score,level]of [[0,1],[99,1],[100,2],[499,2],[500,3],[1999,3],[2000,4],[9999,4],[10000,5],[999999,5]])assert.equal(contributionRank(score).level,level);
    const custom=CONTRIBUTION_RANKS.map(r=>({...r,threshold:r.level===2?125:r.threshold}));assert.equal(contributionRank(100,custom).level,1);
});
test('only actual contribution crossing emits one promotion, not merit, duplicate, spam or reload',()=>{
    let s=processTempleEvent(seed(),e('join','join'),now).state;
    s={...s,merit:{viewer:999999},game:{...s.game,contributionScore:{viewer:99}}};
    const a=processTempleEvent(s,e('heart','like'),now);assert.equal(a.progress?.rankLevel,2);assert.equal(a.progress?.meritDelta,0);assert.equal(templeParticipants(a.state)[0].rank,2);
    assert.equal(processTempleEvent(a.state,e('heart','like'),now+5000).progress,undefined);
    assert.equal(processTempleEvent(a.state,e('spam','like',now+10),now+10).progress,undefined);
    const restored=restoreTempleSnapshot(JSON.parse(JSON.stringify(a.state)),'MOCK');assert.equal(restored.game.contributionScore.viewer,100);assert.equal(restored.merit.viewer,999999);assert.equal(restored.game.notice,null);
    const bow=processTempleEvent(restored,e('bow','bow',now+3000),now+3000);assert.equal(bow.state.game.contributionScore.viewer,100);assert.equal(bow.progress,undefined);
    const big=processTempleEvent({...restored,game:{...restored.game,contributionScore:{viewer:9900}}},e('gift','gift',now+4000,undefined,30),now+4000);assert.equal(big.progress?.rankLevel,5);assert.equal(big.progress?.meritDelta,0);
});
test('earned merit feedback uses actual credited delta while preserving existing contribution rules',()=>{
    let s=seed();
    for(const [id,kind,merit,contribution]of [['b','bow',2,0],['i','incense',7,5],['f','flower',17,13],['l','like',18,14]] as const){
        const r=processTempleEvent(s,e(id,kind),now);assert.equal(r.progress?.meritDelta,kind==='bow'?2:kind==='incense'?5:kind==='flower'?10:1);s=r.state;
        assert.equal(s.merit.viewer,merit);assert.equal(s.game.contributionScore.viewer,contribution);
    }
    const capped=processTempleEvent({...s,merit:{viewer:999995}},e('cap','flower',now+1),now+1);assert.equal(capped.progress?.meritDelta,4);
    const prayer=processTempleEvent(seed(),e('p','wish',now,'Nam mô A Di Đà Phật'),now);assert.equal(prayer.progress?.meritDelta,2);assert.equal(prayer.progress?.rankLevel,undefined);
});
test('Top 10 uses contribution only with stable ties, matches seat priority and includes waiting users',()=>{
    const users=Array.from({length:109},(_,i)=>({id:'u'+i,contributionScore:i===108?100:0,meritScore:999999-i}));
    const top=topContributors(users);assert.equal(top.length,10);assert.deepEqual(top.map(u=>u.id),['u108','u0','u1','u2','u3','u4','u5','u6','u7','u8']);
    assert.deepEqual(topContributors(users),top);assert.equal(users[0].id,'u0');
    let plan=initialSeatPlan(users.map(u=>({...u,contributionScore:0})),now);const held=updateSeatPlan(plan,users,now+5000,now+6000);assert.deepEqual(held.assigned,plan.assigned);
    plan=updateSeatPlan(held,users,now+6000);assert.equal(plan.assigned[0].userId,'u108');assert.equal(plan.assigned.length,108);assert.equal(new Set(plan.assigned.map(a=>a.seatId)).size,108);assert.equal(new Set(plan.assigned.map(a=>a.userId)).size,108);
    assert.deepEqual(initialSeatPlan(users,now).assigned,initialSeatPlan(users,now).assigned);
});
test('feedback is bounded, coalesces each person without indefinite TTL reset and prioritizes promotion',()=>{
    let cues=Array.from({length:6},(_,i)=>progressCue('e'+i,'u'+i,2,0,0,now)!);
    assert.equal(enqueueProgress(cues,progressCue('extra','outside',2,0,0,now)!,now).length,PROGRESS_LIMIT);
    cues=enqueueProgress(cues,progressCue('merged','u0',5,0,0,now+100)!,now+100);assert.equal(cues.find(c=>c.userId==='u0')!.meritDelta,7);assert.equal(cues[0].expiresAt,now+2400);
    cues=enqueueProgress(cues,progressCue('level','outside',0,99,100,now+200)!,now+200);assert.ok(cues.some(c=>c.rankLevel===2));assert.equal(cues.length,6);
    assert.equal(enqueueProgress(cues,cues[0],now+5000).length,0);
});
test('feedback placement stays in cushion wings, below statues, within the portrait viewport',()=>{
    const slots=projectSeats(768,1024,3/4),labels=layoutSeatLabels(slots,768);
    for(const seat of slots){
        const p=progressPosition(labels.get(seat.id)!,seat,slots,768,56),peers=slots.filter(s=>s.row===seat.row&&s.zone===seat.zone);
        assert.ok(p.x-p.width/2>=0&&p.x+p.width/2<=768);assert.ok(p.y-10>523);
        if(seat.zone.endsWith('left'))assert.ok(p.x+p.width/2<=Math.max(...peers.map(s=>s.x+s.width/2))-8);
        else assert.ok(p.x-p.width/2>=Math.min(...peers.map(s=>s.x-s.width/2))+8);
    }
    assert.equal(SEAT_MAP.length,108);
});
test('existing v1/v2 saved scores and receipts are preserved; ranks are derived without migration',()=>{
    const a=processTempleEvent(seed(),e('legacy','gift',now,undefined,30),now).state;
    const v2={...a,merit:{viewer:37},game:{...a.game,contributionScore:{viewer:500}}};
    const restored=restoreTempleSnapshot(JSON.parse(JSON.stringify(v2)),'MOCK');assert.equal(restored.version,2);assert.equal(restored.merit.viewer,37);assert.equal(templeParticipants(restored)[0].rank,3);assert.deepEqual(restored.receipts,v2.receipts);
    assert.equal(processTempleEvent(restored,e('legacy','gift',now,undefined,30),now).progress,undefined);
    const {merit,meritLimits,...old}=v2;const v1=restoreTempleSnapshot({...old,version:1},'MOCK');assert.equal(v1.game.contributionScore.viewer,500);assert.equal(templeParticipants(v1)[0].rank,3);
});
