/** Activity-only MOCK points: never money, academic XP or a seat-purchasing balance. */
export const MERIT_RULES=Object.freeze({bow:2,incense:5,flower:10,like:1,maxScore:999999,heartGapMs:1000,heartWindowMs:60000,heartsPerWindow:30,bowGapMs:2200});
export const MOCK_GIFT_TIERS=Object.freeze([1,5,10,30] as const);
export type MeritLimits={heartAt:number|null;heartStart:number;hearts:number;bowAt:number|null};
export const emptyMeritLimits=():MeritLimits=>({heartAt:null,heartStart:0,hearts:0,bowAt:null});
export function isPrayerComment(text:string){
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()==='nam mo a di da phat';
}
export function meritRank(score:number):'visitor'|'companion'|'regular'|'committed'{
    return score>=1000?'committed':score>=200?'regular':score>=50?'companion':'visitor';
}
/** Return a new quota state only for eligible actions. Consumed receipts prevent delayed retry. */
export function allowMeritAction(kind:'bow'|'like',previous:MeritLimits,now:number):MeritLimits|null {
    if(kind==='bow')return previous.bowAt!==null&&now-previous.bowAt<MERIT_RULES.bowGapMs?null:{...previous,bowAt:now};
    const quota=now-previous.heartStart>=MERIT_RULES.heartWindowMs?{...previous,heartStart:now,hearts:0}:previous;
    if((quota.heartAt!==null&&now-quota.heartAt<MERIT_RULES.heartGapMs)||quota.hearts>=MERIT_RULES.heartsPerWindow)return null;
    return {...quota,heartAt:now,hearts:quota.hearts+1};
}
