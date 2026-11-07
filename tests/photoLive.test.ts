import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIVE_ROSTER, LIVE_NOTICE_MS, applyPhotoLive, initialPhotoLive, liveSlot, projectLiveSlots } from '../src/photo/liveModel.ts';
import { vi } from '../src/i18n/vi.ts';
test('photo LIVE reuses stable identities with 20 guests, bounded joins and no nickname identity',()=>{
    let state=initialPhotoLive();assert.equal(state.visitors.length,20);
    for(const person of LIVE_ROSTER.slice(20)) state=applyPhotoLive(state,{id:'join-'+person.id,kind:'join',viewerId:person.id});
    assert.equal(state.visitors.length,24);assert.equal(new Set(state.visitors).size,24);
    assert.strictEqual(applyPhotoLive(state,{id:'join-again',kind:'join',viewerId:LIVE_ROSTER[0].id}),state);
    assert.strictEqual(applyPhotoLive(state,{id:'bad',kind:'like',viewerId:LIVE_ROSTER[0].name}),state);
});
test('events validate identity/action/text and duplicate deliveries do not increment counters',()=>{
    const start=initialPhotoLive(), person=LIVE_ROSTER[0];
    const event={id:'one',kind:'incense',viewerId:person.id};
    const after=applyPhotoLive(start,event);assert.equal(after.incense,1);assert.equal(start.incense,0);
    assert.strictEqual(applyPhotoLive(after,event),after);
    for(const bad of [null,[],{...event,id:''},{...event,id:' a '},{...event,kind:'xp'},{...event,viewerId:'missing'},{...event,viewerId:LIVE_ROSTER[23].id},{...event,kind:'wish',text:' '},{...event,kind:'wish',text:'a'.repeat(121)}]) assert.strictEqual(applyPhotoLive(start,bad),start);
    let state=applyPhotoLive(after,{id:'two',kind:'like',viewerId:person.id});
    state=applyPhotoLive(state,{id:'three',kind:'flower',viewerId:person.id});
    assert.equal(state.likes,1);assert.equal(state.flowers,1);assert.equal(state.activity[person.id],3);
});
test('comments, receipt memory and activity remain bounded and only count session interactions',()=>{
    let state=initialPhotoLive();
    for(let i=0;i<300;i++) state=applyPhotoLive(state,{id:String(i),kind:'wish',viewerId:LIVE_ROSTER[i%20].id,text:'  Bình an '+i+'  '});
    assert.equal(state.comments.length,3);assert.equal(state.recent.length,256);assert.equal(Object.keys(state.activity).length,20);
    assert.equal(state.comments[2].text,'Bình an 299');assert.equal(state.likes,0);assert.equal(state.incense,0);assert.equal(state.flowers,0);
    assert.ok(!('xp' in state));assert.ok(!('contribution' in state));
});
test('official-image seats stay on the cushion floor and clear of the carpet',()=>{
    const slots=LIVE_ROSTER.map((_,i)=>liveSlot(i));
    assert.equal(slots.length,24);
    for(const [i,s] of slots.entries()) {
        assert.ok(s.x-s.width/2>=0&&s.x+s.width/2<=1);
        assert.ok(s.y>800/1448&&s.feet<.8, 'no altar seating');
        assert.ok(i%2===0?s.x+s.width/2<.46:s.x-s.width/2>.57,'clear carpet');
    }
    for(const i of [-1,24,NaN,1.3]) assert.throws(()=>liveSlot(i));
    assert.ok(liveSlot(0).height<liveSlot(18).height);
    assert.equal(LIVE_NOTICE_MS,3000);
    for(const kind of ['join','like','incense','flower','wish']) assert.ok(vi['Photo LIVE notice '+kind]);
    assert.match(vi['Photo LIVE disclaimer'],/Mô phỏng|mô phỏng/);
});
test('contain projection preserves source cushion contact through resize and letterboxing',()=>{
    for(const [width,height] of [[768,1024],[390,844],[320,568],[1024,768],[1440,900],[576,1024]]) {
        const slots=projectLiveSlots(width,height,3/4);
        const h=Math.min(height,width/(3/4)),w=h*3/4,left=(width-w)/2,top=(height-h)/2;
        for(const [i,s] of slots.entries()) {
            const source=liveSlot(i);
            assert.ok(Math.abs((s.x-left)/w-source.x)<1e-12);
            assert.ok(Math.abs((s.y+s.height-s.nameHeight-top)/h-source.feet)<1e-12);
            assert.ok(s.x-s.width/2>=0&&s.x+s.width/2<=width);
            assert.ok(s.y>=top&&s.y+s.height<top+h);
        }
        for(let i=0;i<24;i++)for(let j=i+1;j<24;j++) {
            const a=slots[i],b=slots[j],ay=a.y+a.height-a.nameHeight,by=b.y+b.height-b.nameHeight;
            assert.ok(!(a.x-a.width/2<b.x+b.width/2&&a.x+a.width/2>b.x-b.width/2&&ay<by+b.nameHeight&&ay+a.nameHeight>by),'name boxes overlap');
        }
    }
    // Measured source landmark: first guest sits on the cushion at (435,909).
    const first=projectLiveSlots(1086,1448,3/4)[0];
    assert.equal(first.x,435);
    assert.equal(first.y+first.height-first.nameHeight,909);
    for(const invalid of [0,NaN,Infinity,-1])assert.throws(()=>projectLiveSlots(768,1024,invalid));
});
