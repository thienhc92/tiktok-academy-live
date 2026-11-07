import { TEMPLE_PEOPLE } from '../temple/model.ts';
import { SEAT_MAP } from './seatMap.ts';
// Fixtures are replaceable; capacity is always derived from the photographed seats.
export const LIVE_ROSTER = [...TEMPLE_PEOPLE,...Array.from({length:Math.max(0,
    SEAT_MAP.length+Math.ceil(SEAT_MAP.length*.15)-TEMPLE_PEOPLE.length)},(_,i)=>({
        id:`photo-guest-${i+1}`,name:`${TEMPLE_PEOPLE[i%TEMPLE_PEOPLE.length].name} ${i+2}`,
    }))];
export const CONTRIBUTION_WEIGHTS = Object.freeze({join:0,wish:0,like:1,incense:5,flower:8,giftCoin:10});
const MAX_SCORE = 999999;
export function contributionReward(event:Pick<LiveEvent,'kind'|'coins'>):number {
    return event.kind==='gift'?CONTRIBUTION_WEIGHTS.giftCoin*(event.coins??0):CONTRIBUTION_WEIGHTS[event.kind];
}
export const LIVE_NOTICE_MS = 3000;
export const LIVE_ACTIONS = ['join','like','incense','flower','wish','gift'] as const;
export type LiveAction = typeof LIVE_ACTIONS[number];
export type LiveEvent = {id:string; kind:LiveAction; viewerId:string; text?:string; coins?:number};
export type LiveNotice = LiveEvent & {name:string};
export type PhotoLiveState = {
    visitors:string[]; likes:number; incense:number; flowers:number;
    activity:Record<string,number>; contributionScore:Record<string,number>; comments:{id:string;name:string;text:string}[];
    recent:string[]; notice:LiveNotice|null;
};
export function initialPhotoLive(visitors=LIVE_ROSTER.slice(0,SEAT_MAP.length).map(p=>p.id)):PhotoLiveState {
    return {visitors:[...new Set(visitors.filter(id=>LIVE_ROSTER.some(p=>p.id===id)))],likes:0,incense:0,flowers:0,activity:{},contributionScore:{},comments:[],recent:[],notice:null};
}
/** Session-only demonstration. Never forwards events to the academic/reward engine. */
export function applyPhotoLive(state:PhotoLiveState, input:unknown):PhotoLiveState {
    if (!input || typeof input!=='object') return state;
    const event=input as LiveEvent;
    if (typeof event.id!=='string'||!event.id.trim()||event.id.length>80||event.id!==event.id.trim()||!LIVE_ACTIONS.includes(event.kind)) return state;
    const person=LIVE_ROSTER.find(p=>p.id===event.viewerId);
    if (!person||state.recent.includes(event.id)) return state;
    if (event.kind==='join' ? state.visitors.includes(person.id) : !state.visitors.includes(person.id)) return state;
    if (event.kind==='wish'&&(typeof event.text!=='string'||!event.text.trim()||event.text.length>120)) return state;
    if(event.kind==='gift'&&(!Number.isSafeInteger(event.coins)||event.coins!<=0||event.coins!>1000000)) return state;
    const text=event.kind==='wish'?event.text!.trim():undefined;
    return {
        ...state,
        visitors:event.kind==='join'?[...state.visitors,person.id]:state.visitors,
        likes:Math.min(999999,state.likes+Number(event.kind==='like')),
        incense:Math.min(999999,state.incense+Number(event.kind==='incense')),
        flowers:Math.min(999999,state.flowers+Number(event.kind==='flower')),
        activity:{...state.activity,[person.id]:Math.min(999999,(state.activity[person.id]??0)+1)},
        contributionScore:{...state.contributionScore,[person.id]:Math.min(MAX_SCORE,(state.contributionScore[person.id]??0)+contributionReward(event))},
        comments:event.kind==='wish'?[...state.comments.slice(-2),{id:event.id,name:person.name,text:text!}]:state.comments,
        recent:[...state.recent.slice(-255),event.id],
        notice:{id:event.id,kind:event.kind,viewerId:person.id,name:person.name,text},
    };
}
