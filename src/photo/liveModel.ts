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
/** Seats calibrated to the portrait hall: two groups, with the red carpet clear. */
export function liveSlot(index:number) {
    if (!Number.isInteger(index)||index<0||index>=24) throw Error('Invalid photo LIVE slot');
    const row=Math.floor(index/6), local=index%6, column=Math.floor(local/2), right=local%2===1;
    const left=[[.43,.365,.30],[.405,.32,.235],[.38,.28,.18],[.355,.24,.125]][row][column];
    const height=[.040,.044,.048,.052][row], feet=[.595,.665,.735,.805][row];
    return {x:right?1-left:left,y:feet-height,height,width:[.05,.065,.08,.09][row],row,column,right};
}
/** Match the browser's centered object-fit transform, then keep all seats visible. */
export function projectLiveSlots(width:number,height:number,aspect:number,cover:boolean,footerHeight=124) {
    if (![width,height,aspect].every(n=>Number.isFinite(n)&&n>0)||!Number.isFinite(footerHeight)||footerHeight<0) throw Error('Invalid photo bounds');
    const imageHeight=cover?Math.max(height,width/aspect):Math.min(height,width/aspect);
    const imageWidth=imageHeight*aspect, left=(width-imageWidth)/2, top=(height-imageHeight)/2;
    const nameHeight=14, gap=4;
    const floorTop=Math.max(top+.55*imageHeight,120);
    const floorBottom=Math.min(top+.86*imageHeight,height-footerHeight-nameHeight-6);
    const first=top+.595*imageHeight, last=top+.805*imageHeight;
    const compressed=first-.04*imageHeight<floorTop||last>floorBottom;
    const start=compressed?Math.min(floorBottom-54,floorTop+Math.min(24,.04*imageHeight)):first;
    const end=compressed?floorBottom:last, step=Math.max(18,(end-start)/3);
    return Array.from({length:24},(_,index)=>{
        const slot=liveSlot(index), aisle=[.455,.425,.395,.36][slot.row];
        const edge=[.27,.20,.14,.08][slot.row];
        const leftOuter=Math.max(4,left+edge*imageWidth), rightOuter=Math.min(width-4,left+(1-edge)*imageWidth);
        const leftInner=Math.max(leftOuter+24,left+aisle*imageWidth-gap);
        const rightInner=Math.min(rightOuter-24,left+(1-aisle)*imageWidth+gap);
        const band=Math.max(24,slot.right?rightOuter-rightInner:leftInner-leftOuter), cell=band/3;
        const seatWidth=Math.max(4,Math.min(slot.width*imageWidth,cell-gap));
        const x=slot.right?rightInner+cell*(slot.column+.5):leftInner-cell*(slot.column+.5);
        const figureHeight=Math.max(4,Math.min(slot.height*imageHeight,step-nameHeight-3));
        return {x,y:start+slot.row*step-figureHeight,width:seatWidth,height:figureHeight+nameHeight,nameHeight,row:slot.row};
    });
}
