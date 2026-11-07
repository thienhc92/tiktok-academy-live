import {LIVE_ROSTER,initialPhotoLive,applyPhotoLive} from '../liveModel.ts';
import type {PhotoLiveState,LiveEvent} from '../liveModel.ts';
import {isTempleEvent,templeEventKey} from './events.ts';
import {MERIT_RULES,emptyMeritLimits,allowMeritAction,isPrayerComment} from './merit.ts';
import type {MeritLimits} from './merit.ts';
import {ritualCue} from './rituals.ts';
import type {RitualCue} from './rituals.ts';
import {mockGift} from './gifts.ts';
import {contributionRank} from './ranks.ts';
import {progressCue} from './progress.ts';
import type {ProgressCue} from './progress.ts';
import type {TempleMode} from './events.ts';
export const TEMPLE_RECEIPT_LIMIT=10000, TEMPLE_USER_LIMIT=1000;
export type TempleProfile={userId:string;nickname:string;avatar:string|null;presenceAt:number;presenceKey:string;profileAt:number;active:boolean};
export type TempleState={version:2;merit:Record<string,number>;meritLimits:Record<string,MeritLimits>;mode:TempleMode;roomId:string;sessionId:string;game:PhotoLiveState;profiles:Record<string,TempleProfile>;receipts:string[];counters:Record<string,number>;closed:string[];clock:number};
export type TempleOutcome='processed'|'duplicate'|'invalid'|'anonymous'|'pending'|'stale'|'aggregate'|'capacity'|'rate-limited';
export type TempleResult={state:TempleState;outcome:TempleOutcome;cue?:RitualCue;progress?:ProgressCue};
export function createTempleState(mode:TempleMode,sessionId:string,visitors?:string[]):TempleState {
    const game=initialPhotoLive(mode==='MOCK'?visitors:[]);
    const profiles=Object.fromEntries(game.visitors.map(id=>[id,{userId:id,nickname:LIVE_ROSTER.find(p=>p.id===id)!.name,avatar:'/temple/devotee-realistic.webp',presenceAt:0,presenceKey:'',profileAt:0,active:true}]));
    return {version:2,merit:{},meritLimits:{},mode,roomId:mode==='MOCK'?'mock-temple':'unconfigured',sessionId,game,profiles,receipts:[],counters:{},closed:[],clock:0};
}
export function processTempleEvent(state:TempleState,input:unknown,now:number):TempleResult {
    const result=(outcome:TempleOutcome,next=state):TempleResult=>({state:next,outcome});
    if(!isTempleEvent(input)||!Number.isSafeInteger(now)||now<0)return result('invalid');
    const e=input;
    if(e.source!==(state.mode==='MOCK'?'mock':'tiktok')||e.roomId!==state.roomId||e.sessionId!==state.sessionId||
        (state.mode==='LIVE'&&['incense','flower','bow'].includes(e.kind))||e.receivedAt>now+5000)return result('invalid');
    const key=templeEventKey(e);
    if(state.receipts.includes(key))return result('duplicate');
    // Persist receipts with balances. Never silently evict keys and repay old events.
    if(state.receipts.length>=TEMPLE_RECEIPT_LIMIT)return result('capacity');
    const next:TempleState={...state,merit:{...state.merit},meritLimits:{...state.meritLimits},receipts:[...state.receipts,key],profiles:{...state.profiles},counters:{...state.counters},closed:[...state.closed],clock:Math.max(state.clock,now)};
    if(next.clock-e.occurredAt>30000)return result('stale',next);
    if(e.viewer.id===null)return result('anonymous',next);
    if(e.kind==='like'&&e.likes.mode==='cumulative'&&e.likes.scope==='room')return result('aggregate',next);
    const id=e.viewer.id,old=state.profiles[id];
    if(!old&&Object.keys(state.profiles).length>=TEMPLE_USER_LIMIT)return result('capacity',next);
    const profile:TempleProfile=old?{...old}:{userId:id,nickname:e.viewer.nickname??'Khách ghé chùa',avatar:null,presenceAt:0,presenceKey:'',profileAt:0,active:false};
    // Presence/profile high water prevents a delayed leave or rename undoing a rejoin.
    if(e.occurredAt>=profile.profileAt){profile.nickname=e.viewer.nickname?.trim()??profile.nickname;profile.avatar=e.viewer.avatar===undefined?profile.avatar:e.viewer.avatar;profile.profileAt=e.occurredAt;}
    if(e.occurredAt>profile.presenceAt||(e.occurredAt===profile.presenceAt&&key>profile.presenceKey)){
        profile.active=e.kind!=='leave';profile.presenceAt=e.occurredAt;profile.presenceKey=key;
    }
    next.profiles[id]=profile;
    const activeIds=state.game.visitors.filter(v=>v!==id||profile.active);
    if(profile.active&&!activeIds.includes(id))activeIds.push(id);
    next.game={...state.game,visitors:activeIds};
    if(e.kind==='leave')return result('processed',next);
    let count=1,coins=0;
    const counterKey=(suffix:string)=>JSON.stringify([e.source,e.roomId,e.sessionId,id,suffix]);
    if(e.kind==='like'){
        if(e.likes.mode==='delta')count=e.likes.count;
        else {
            const k=counterKey('like:'+e.likes.counterId),before=state.counters[k];
            next.counters[k]=Math.max(before??0,e.likes.total);
            if(before===undefined)return result('pending',next);
            count=Math.max(0,e.likes.total-before);
            if(!count)return result('stale',next);
            if(count>10000)return result('invalid',next); // Do not split to evade validation/caps.
        }
    }
    if(e.kind==='gift'){
        const k=counterKey('gift:'+JSON.stringify([e.giftId,e.streakId]));
        if(state.closed.includes(k))return result('duplicate',next);
        if(state.counters[k+':coins']!==undefined&&state.counters[k+':coins']!==e.coins)return result('invalid',next);
        next.counters[k+':coins']=e.coins;
        if(!e.final){next.counters[k]=Math.max(state.counters[k]??0,e.repeatCount);return result('pending',next);}
        if(e.repeatCount<(state.counters[k]??0))return result('stale',next);
        next.closed.push(k);next.counters[k]=e.repeatCount;
        coins=Math.min(1000000,e.coins*e.repeatCount); // Existing contribution cap is reached before this bound.
    }
    let ritual:'bow'|'incense'|'flower'|undefined;
    let merit=0;
    if(state.mode==='MOCK'){
        const limits=state.meritLimits[id]??emptyMeritLimits();
        const prayer=e.kind==='bow'||(e.kind==='comment'&&isPrayerComment(e.text));
        if(prayer){
            const allowed=allowMeritAction('bow',limits,next.clock);
            if(allowed){next.meritLimits[id]=allowed;merit=MERIT_RULES.bow;ritual='bow';}
            else if(e.kind==='bow')return result('rate-limited',next);
        }
        if(e.kind==='like'){
            const allowed=allowMeritAction('like',limits,next.clock);
            if(!allowed)return result('rate-limited',next);
            next.meritLimits[id]=allowed;count=1;merit=MERIT_RULES.like;
        }
        if(e.kind==='incense'||e.kind==='flower'){merit=MERIT_RULES[e.kind];ritual=e.kind;}
        if(merit)next.merit[id]=Math.min(MERIT_RULES.maxScore,(state.merit[id]??0)+merit);
    }
    // Reuse mock rules for counters, comments, validated amounts and contribution weights.
    const kind=e.kind==='comment'?'wish':e.kind;
    if(kind==='join'&&state.game.visitors.includes(id))return result('processed',next);
    const before=kind==='join'?{...next.game,visitors:next.game.visitors.filter(v=>v!==id)}:
        {...next.game,visitors:next.game.visitors.includes(id)?next.game.visitors:[...next.game.visitors,id]};
    const action:LiveEvent={id:'temple-event-'+next.receipts.length,kind,viewerId:id,...(e.kind==='comment'?{text:e.text}:{}),...(kind==='like'?{count}:{}),...(kind==='gift'?{coins}:{})};
    next.game=applyPhotoLive(before,action,Object.values(next.profiles).map(p=>({id:p.userId,name:p.nickname})));
    // Late, valid rewards may update points without resurrecting a departed viewer.
    next.game={...next.game,visitors:activeIds};
    if(ritual==='bow'&&next.game.notice)next.game={...next.game,notice:{...next.game.notice,kind:'bow'}};
    const progress=progressCue(key,id,(next.merit[id]??0)-(state.merit[id]??0),state.game.contributionScore[id]??0,next.game.contributionScore[id]??0,next.clock);
    return {...result('processed',next),...(progress?{progress:{...progress,noticeId:next.game.notice?.id,...(e.kind==='gift'&&progress.contributionDelta>0&&mockGift(e.coins)?{giftCoins:e.coins}:{})}}:{}),...(ritual?{cue:ritualCue(key,id,ritual,next.clock)}:{})};
}
export function templeParticipants(state:TempleState){
    return state.game.visitors.map(id=>{const p=state.profiles[id];return {...p,id,name:p.nickname,contributionScore:state.game.contributionScore[id]??0,meritScore:state.merit[id]??0,rank:contributionRank(state.game.contributionScore[id]??0).level,seatId:null as string|null};});
}
