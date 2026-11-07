import {MOCK_GIFTS,mockGift} from '../src/photo/live/gifts.ts';
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

test('gift contribution feedback uses only actual committed delta, does not mint merit or replay',()=>{
    const event=e('gift-only','gift',now,undefined,1),first=processTempleEvent(seed(),event,now);
    assert.equal(first.progress?.meritDelta,0);assert.equal(first.progress?.contributionDelta,10);assert.equal(first.progress?.rankLevel,undefined);
    const loaded=restoreTempleSnapshot(JSON.parse(JSON.stringify(first.state)),'MOCK');
    const duplicate=processTempleEvent(loaded,event,now+1000);assert.equal(duplicate.progress,undefined);assert.equal(duplicate.state.game.contributionScore.viewer,10);
    const capped=processTempleEvent({...loaded,game:{...loaded.game,contributionScore:{viewer:999995}}},e('gift-cap','gift',now+1000,undefined,30),now+1000);
    assert.equal(capped.progress?.contributionDelta,4);assert.equal(capped.progress?.meritDelta,0);
    const merged=enqueueProgress([first.progress!],progressCue('another','viewer',5,10,15,now+100)!,now+100);
    assert.equal(merged[0].meritDelta,5);assert.equal(merged[0].contributionDelta,15);assert.equal(merged[0].expiresAt,now+2400);
});
test('point feedback avoids all name rectangles while staying in its cushion wing',()=>{
    const slots=projectSeats(768,1024,3/4),labels=layoutSeatLabels(slots,768),blocked=[...labels.values()];
    const first=slots[0],near=progressPosition(labels.get(first.id)!,first,slots,768,30,blocked);assert.ok(Math.abs(near.x-first.x)<20,'front-row feedback remains near its own user');
    for(const seat of slots){
        const p=progressPosition(labels.get(seat.id)!,seat,slots,768,90,blocked);
        for(const b of blocked)assert.ok(!(p.x-p.width/2<b.x+b.width/2&&p.x+p.width/2>b.x-b.width/2&&p.y-10<b.y+b.height&&p.y+18>b.y));
        assert.ok(p.y>=Math.min(...slots.map(s=>s.y))-40);
    }
});
test('108 seat swaps stay atomic through every ritual kind and ignore small adjacent changes',()=>{
    const users=Array.from({length:109},(_,i)=>({id:'u'+i,contributionScore:109-i}));
    const initial=initialSeatPlan(users,now),boost=users.map(u=>({...u,contributionScore:u.id==='u108'?1000:u.contributionScore}));
    for(const duration of [2200,2400,2800]){
        const held=updateSeatPlan(initial,boost,now+5000,now+5000+duration);
        assert.deepEqual(held.assigned,initial.assigned);
        const moved=updateSeatPlan(held,boost,now+5000+duration);
        assert.equal(moved.assigned[0].userId,'u108');assert.equal(new Set(moved.assigned.map(a=>a.seatId)).size,108);assert.equal(new Set(moved.assigned.map(a=>a.userId)).size,108);
        assert.deepEqual(updateSeatPlan(moved,boost,now+5001+duration).assigned,moved.assigned);
    }
    const minor=users.map(u=>({...u,contributionScore:u.id==='u1'?u.contributionScore+2:u.contributionScore}));
    assert.deepEqual(updateSeatPlan(initial,minor,now+5000).assigned,initial.assigned);
});

test('four gift presets use existing contribution weights and reject unknown UI choices',()=>{
    assert.deepEqual(MOCK_GIFTS.map(g=>[g.coins,g.points]),[[1,10],[5,50],[10,100],[30,300]]);
    assert.deepEqual(MOCK_GIFTS.map(g=>g.icon),['🎁','🌸','🪷','✨']);
    for(const coins of [0,-1,2,NaN,Infinity])assert.equal(mockGift(coins),undefined);
});
test('every preset credits the correct stable identity once, with bounded gift effects and no merit',()=>{
    for(const gift of MOCK_GIFTS){
        const event=e('preset-'+gift.coins,'gift',now,undefined,gift.coins),r=processTempleEvent(seed(),event,now);
        assert.equal(r.state.game.contributionScore.viewer,gift.points);assert.equal(r.state.merit.viewer??0,0);
        assert.equal(r.progress?.giftCoins,gift.coins);assert.equal(r.progress?.contributionDelta,gift.points);
        assert.equal(r.state.game.contributionScore.other,undefined);
        const restored=restoreTempleSnapshot(JSON.parse(JSON.stringify(r.state)),'MOCK');
        assert.equal(processTempleEvent(restored,event,now+100).progress,undefined);
        assert.equal(restored.game.contributionScore.viewer,gift.points);
        assert.equal(templeParticipants(restored)[0].rank,gift.coins>=10?2:1);
    }
});
test('many gifts retain all rewards while coalescing only the strongest bounded visual preset',()=>{
    let cues:ReturnType<typeof enqueueProgress>=[],s=seed();
    for(let i=0;i<108;i++){
        const event=mockTempleEvent('gift',{id:'gift-user-'+i,nickname:'Khách '+i},s,'gift-'+i,now,undefined,30);
        const r=processTempleEvent(s,event,now);s=r.state;cues=enqueueProgress(cues,r.progress!,now);
    }
    assert.equal(Object.keys(s.game.contributionScore).length,108);assert.equal(Object.values(s.game.contributionScore).reduce((a,b)=>a+b,0),32400);
    assert.equal(cues.length,PROGRESS_LIMIT);
    let same=enqueueProgress([],processTempleEvent(seed(),e('large','gift',now,undefined,30),now).progress!,now);
    const small=processTempleEvent(seed(),e('small','gift',now+10,undefined,1),now+10);
    same=enqueueProgress(same,small.progress!,now+10);assert.equal(same.length,1);assert.equal(same[0].giftCoins,30);assert.equal(same[0].contributionDelta,310);
});
test('gift promotion updates Top 10 immediately but seats wait for active worship',()=>{
    const users=Array.from({length:108},(_,i)=>({id:'u'+i,contributionScore:0}));
    let plan=initialSeatPlan(users,now);const state=createTempleState('MOCK','gift-seats',[]);
    const gift=mockTempleEvent('gift',{id:'u107',nickname:'Khách'},state,'promotion-gift',now+5000,undefined,10);
    const r=processTempleEvent(state,gift,now+5000);assert.equal(r.progress?.rankLevel,2);
    const updated=users.map(u=>({...u,contributionScore:r.state.game.contributionScore[u.id]??0}));
    assert.equal(topContributors(updated)[0].id,'u107');
    plan=updateSeatPlan(plan,updated,now+5000,now+7800);assert.equal(plan.assigned.at(-1)!.userId,'u107');
    plan=updateSeatPlan(plan,updated,now+7800);assert.equal(plan.assigned[0].userId,'u107');assert.equal(new Set(plan.assigned.map(a=>a.seatId)).size,108);
});
