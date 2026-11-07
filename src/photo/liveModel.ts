import { TEMPLE_PEOPLE } from '../temple/model.ts';
export const LIVE_ROSTER = TEMPLE_PEOPLE.slice(0,24);
export const LIVE_NOTICE_MS = 3000;
export const LIVE_ACTIONS = ['join','like','incense','flower','wish'] as const;
export type LiveAction = typeof LIVE_ACTIONS[number];
export type LiveEvent = {id:string; kind:LiveAction; viewerId:string; text?:string};
export type LiveNotice = LiveEvent & {name:string};
export type PhotoLiveState = {
    visitors:string[]; likes:number; incense:number; flowers:number;
    activity:Record<string,number>; comments:{id:string;name:string;text:string}[];
    recent:string[]; notice:LiveNotice|null;
};
export function initialPhotoLive():PhotoLiveState {
    return {visitors:LIVE_ROSTER.slice(0,20).map(p=>p.id),likes:0,incense:0,flowers:0,activity:{},comments:[],recent:[],notice:null};
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
    const text=event.kind==='wish'?event.text!.trim():undefined;
    return {
        ...state,
        visitors:event.kind==='join'?[...state.visitors,person.id]:state.visitors,
        likes:Math.min(999999,state.likes+Number(event.kind==='like')),
        incense:Math.min(999999,state.incense+Number(event.kind==='incense')),
        flowers:Math.min(999999,state.flowers+Number(event.kind==='flower')),
        activity:{...state.activity,[person.id]:Math.min(999999,(state.activity[person.id]??0)+1)},
        comments:event.kind==='wish'?[...state.comments.slice(-2),{id:event.id,name:person.name,text:text!}]:state.comments,
        recent:[...state.recent.slice(-255),event.id],
        notice:{id:event.id,kind:event.kind,viewerId:person.id,name:person.name,text},
    };
}
export function liveSlot(index:number) {
    if (!Number.isInteger(index)||index<0||index>=24) throw Error('Invalid photo LIVE slot');
    const row=index<4?0:index<10?1:index<17?2:3;
    const start=[0,4,10,17][row], count=[4,6,7,7][row];
    return {x:count===4?.2+(index-start)*.2:.08+(index-start)*(.84/(count-1)),y:row*.25,height:.23,width:.12};
}
