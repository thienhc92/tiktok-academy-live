import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIVE_ROSTER, LIVE_NOTICE_MS, CONTRIBUTION_WEIGHTS, applyPhotoLive, initialPhotoLive } from '../src/photo/liveModel.ts';
import { SEAT_MAP, SEAT_IMAGE, assignSeats, projectSeats, visibleSeatLabels } from '../src/photo/seatMap.ts';
import { vi } from '../src/i18n/vi.ts';

test('capacity derives from photographed seats; joins can exceed capacity without losing identities',()=>{
    let state=initialPhotoLive();assert.equal(state.visitors.length,SEAT_MAP.length);
    for(const person of LIVE_ROSTER.filter(p=>!state.visitors.includes(p.id))) state=applyPhotoLive(state,{id:'join-'+person.id,kind:'join',viewerId:person.id});
    assert.equal(state.visitors.length,LIVE_ROSTER.length);assert.equal(new Set(state.visitors).size,LIVE_ROSTER.length);
    assert.ok(state.visitors.length>SEAT_MAP.length);
    assert.strictEqual(applyPhotoLive(state,{id:'again',kind:'join',viewerId:LIVE_ROSTER[0].id}),state);
    assert.strictEqual(applyPhotoLive(state,{id:'bad',kind:'like',viewerId:LIVE_ROSTER[0].name}),state);
    assert.equal(initialPhotoLive([]).visitors.length,0);
});
test('events validate identity/action/text and duplicate deliveries do not increment counters or scores',()=>{
    const start=initialPhotoLive(), person=LIVE_ROSTER[0];
    const event={id:'one',kind:'incense',viewerId:person.id};
    const after=applyPhotoLive(start,event);assert.equal(after.incense,1);assert.equal(start.incense,0);
    assert.equal(after.contributionScore[person.id],CONTRIBUTION_WEIGHTS.incense);
    assert.strictEqual(applyPhotoLive(after,event),after);
    for(const bad of [null,[],{...event,id:''},{...event,id:' a '},{...event,kind:'xp'},{...event,viewerId:'missing'},{...event,viewerId:LIVE_ROSTER.at(-1)!.id},{...event,kind:'wish',text:' '},{...event,kind:'wish',text:'a'.repeat(121)}]) assert.strictEqual(applyPhotoLive(start,bad),start);
    let state=applyPhotoLive(after,{id:'two',kind:'like',viewerId:person.id});
    state=applyPhotoLive(state,{id:'three',kind:'flower',viewerId:person.id});
    assert.equal(state.likes,1);assert.equal(state.flowers,1);assert.equal(state.activity[person.id],3);
    assert.equal(state.contributionScore[person.id],14);
});
test('gift score validates mock value, stays bounded, is separate from XP and cannot double count',()=>{
    const start=initialPhotoLive(),viewerId=start.visitors[0];
    const gift={id:'gift',kind:'gift',viewerId,coins:3};
    const state=applyPhotoLive(start,gift);
    assert.equal(state.contributionScore[viewerId],30);assert.equal(state.likes,0);assert.equal(state.incense,0);assert.equal(state.flowers,0);
    assert.strictEqual(applyPhotoLive(state,gift),state);
    for(const coins of [undefined,'3',-1,0,.5,NaN,Infinity,1000001]) assert.strictEqual(applyPhotoLive(start,{...gift,coins}),start);
    const capped=applyPhotoLive(state,{...gift,id:'large',coins:1000000});
    assert.equal(capped.contributionScore[viewerId],999999);
    assert.ok(!('xp' in capped));assert.ok(!('contribution' in capped));
});
test('comments, receipt memory and activity stay bounded; joins/comments do not buy seating points',()=>{
    let state=initialPhotoLive();
    const count=state.visitors.length;
    for(let i=0;i<300;i++) state=applyPhotoLive(state,{id:String(i),kind:'wish',viewerId:LIVE_ROSTER[i%count].id,text:'  Bình an '+i+'  '});
    assert.equal(state.comments.length,3);assert.equal(state.recent.length,256);assert.equal(Object.keys(state.activity).length,count);
    assert.equal(state.comments[2].text,'Bình an 299');assert.equal(state.likes,0);assert.equal(state.incense,0);assert.equal(state.flowers,0);
    assert.ok(Object.values(state.contributionScore).every(score=>score===0));
    assert.equal(LIVE_NOTICE_MS,3000);
    for(const kind of ['join','like','incense','flower','wish','gift']) assert.ok(vi['Photo LIVE notice '+kind]);
});
test('full seat map has unique IDs, floor contacts, increasing perspective and a clear carpet',()=>{
    // Visually measured: 12 rows of 8 + 2 foreground rows of 6.
    assert.equal(SEAT_MAP.length,108);assert.equal(new Set(SEAT_MAP.map(s=>s.id)).size,SEAT_MAP.length);
    for(const s of SEAT_MAP) {
        assert.ok(s.x-s.width/2>=0&&s.x+s.width/2<=1);
        assert.ok(s.y>=794/1448&&s.y<=1186/1448);
        assert.ok(s.y-s.scale>=778/1448);
        assert.ok(s.zone.endsWith('left')?s.x+s.width/2<.46:s.x-s.width/2>.55);
        assert.ok(s.scale>0&&Number.isFinite(s.rankPriority));
    }
    assert.ok(SEAT_MAP[0].scale<SEAT_MAP.at(-1)!.scale);
});
test('seat priority favors front rows first and the center within each row',()=>{
    for(const a of SEAT_MAP)for(const b of SEAT_MAP) {
        if(a.row<b.row) assert.ok(a.rankPriority>b.rankPriority);
        if(a.row===b.row&&Math.abs(a.x-.5)+.02<Math.abs(b.x-.5))assert.ok(a.rankPriority>b.rankPriority);
    }
});
test('assignment is deterministic, does not mutate inputs, leaves empty seats and ranks by score',()=>{
    const users=[{id:'low',contributionScore:1},{id:'high',contributionScore:40},{id:'equal',contributionScore:40}];
    const copy=structuredClone(users);
    const result=assignSeats(users);
    assert.deepEqual(result.seated.map(s=>s.user.id),['high','equal','low']);
    assert.equal(result.waiting.length,0);assert.equal(result.seated.length,users.length);
    assert.ok(result.seated[0].seat.rankPriority>=result.seated[1].seat.rankPriority);
    assert.deepEqual(assignSeats(users),result);assert.deepEqual(users,copy);
    assert.deepEqual(assignSeats([]),{seated:[],waiting:[]});
    assert.equal(assignSeats(users,SEAT_MAP.slice(0,1)).waiting.length,2);
});
test('over-capacity visitors wait and can earn their way into a higher seat without duplicate occupancy',()=>{
    let state=initialPhotoLive();const viewerId=LIVE_ROSTER.at(-1)!.id;
    state=applyPhotoLive(state,{id:'join',kind:'join',viewerId});
    const users=()=>state.visitors.map(id=>({id,contributionScore:state.contributionScore[id]??0}));
    assert.equal(assignSeats(users()).waiting[0].id,viewerId);
    state=applyPhotoLive(state,{id:'flower',kind:'flower',viewerId});
    const result=assignSeats(users());
    assert.equal(result.seated[0].user.id,viewerId);assert.equal(result.waiting.length,1);
    assert.equal(new Set(result.seated.map(s=>s.seat.id)).size,SEAT_MAP.length);
    assert.equal(new Set([...result.seated.map(s=>s.user.id),...result.waiting.map(s=>s.id)]).size,state.visitors.length);
});
test('malformed or duplicate user identities cannot create ambiguous seating',()=>{
    for(const users of [[{id:'',contributionScore:0}],[{id:' x ',contributionScore:0}],[{id:'x',contributionScore:NaN}],[{id:'x',contributionScore:-1}],[{id:'x',contributionScore:0},{id:'x',contributionScore:2}]]) assert.throws(()=>assignSeats(users));
});
test('contain projection preserves all cushion contacts across portrait, landscape and letterboxes',()=>{
    for(const [width,height] of [[768,1024],[390,844],[320,568],[1024,768],[1440,900],[576,1024]]) {
        const slots=projectSeats(width,height,3/4);
        const scale=Math.min(width/SEAT_IMAGE.width,height/SEAT_IMAGE.height);
        const w=SEAT_IMAGE.width*scale,h=SEAT_IMAGE.height*scale,left=(width-w)/2,top=(height-h)/2;
        for(const [i,s] of slots.entries()) {
            const source=SEAT_MAP[i];
            assert.ok(Math.abs((s.x-left)/w-source.x)<1e-12);
            assert.ok(Math.abs((s.y+s.height-top)/h-source.y)<1e-12);
            assert.ok(s.x-s.width/2>=0&&s.x+s.width/2<=width);
        }
    }
    for(const invalid of [0,NaN,Infinity,-1])assert.throws(()=>projectSeats(768,1024,invalid));
});
test('label selection prioritizes selected users and avoids overlap without moving avatars',()=>{
    for(const [width,height] of [[768,1024],[390,844],[1024,768]]) {
        const slots=projectSeats(width,height,3/4),selected=slots.at(-1)!;
        const labels=visibleSeatLabels(slots,selected.id,width);
        assert.ok(labels.has(selected.id));assert.ok(labels.size<slots.length);
        const rects=[...labels].map(([id,label])=>{const slot=slots.find(s=>s.id===id)!;return {left:label.x-label.width/2,right:label.x+label.width/2,top:slot.y+slot.height,bottom:slot.y+slot.height+12};});
        for(const r of rects)assert.ok(r.left>=0&&r.right<=width);
        for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++) {
            const a=rects[i],b=rects[j];
            assert.ok(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
        }
    }
});
