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
/** Cushion centers measured on the unmodified official 1086 × 1448 PNG.
 * Each pair is an actual left/right cushion, not an assumed symmetric grid.
 * y is the devotee's floor contact point; the altar ends above source y=800.
 */
const CUSHION_ROWS = [
    {feet:909, height:56, width:50, pairs:[[435,654],[362,733],[287,809]]},
    {feet:974, height:62, width:60, pairs:[[405,687],[305,783],[209,880]]},
    {feet:1058,height:70, width:70, pairs:[[362,725],[250,837],[141,948]]},
    {feet:1122,height:78, width:80, pairs:[[345,752],[218,881],[86,1014]]},
] as const;
export function liveSlot(index:number) {
    if (!Number.isInteger(index)||index<0||index>=24) throw Error('Invalid photo LIVE slot');
    const row=Math.floor(index/6), column=Math.floor(index%6/2), right=index%2===1;
    const seat=CUSHION_ROWS[row];
    const height=seat.height/1448;
    return {x:seat.pairs[column][right?1:0]/1086,y:seat.feet/1448-height,
        feet:seat.feet/1448,height,width:seat.width/1086,row,column,right};
}
/** The same centered contain transform as the image. UI never moves the seats. */
export function projectLiveSlots(width:number,height:number,aspect:number) {
    if (![width,height,aspect].every(n=>Number.isFinite(n)&&n>0)) throw Error('Invalid photo bounds');
    const imageHeight=Math.min(height,width/aspect), imageWidth=imageHeight*aspect;
    const left=(width-imageWidth)/2, top=(height-imageHeight)/2;
    const nameHeight=Math.min(14,Math.max(9,imageWidth*.014));
    return Array.from({length:24},(_,index)=>{
        const slot=liveSlot(index);
        return {x:left+slot.x*imageWidth,y:top+slot.y*imageHeight,
            width:slot.width*imageWidth,height:slot.height*imageHeight+nameHeight,
            nameHeight,row:slot.row};
    });
}
