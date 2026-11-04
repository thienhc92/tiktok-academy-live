export type Viewer={id:string|null;nickname?:string};
type Base={version:1;source:string;roomId:string;sessionId:string;eventId:string;occurredAt:number;receivedAt:number;viewer:Viewer};
export type NormalizedEvent=Base & (
 | {kind:'join'|'share'}
 | {kind:'comment';text:string}
 | {kind:'like';likes:{mode:'delta';count:number}|{mode:'cumulative';total:number;scope:'viewer'|'room';counterId:string}}
 | {kind:'gift';giftId:string;streakId:string;repeatCount:number;final:boolean}
);
export type ConnectionState='disconnected'|'connecting'|'connected'|'reconnecting'|'ended';
export interface EventSink {event:(event:unknown)=>void;connection:(state:ConnectionState)=>void;error:(message:string)=>void;}
export interface EventAdapter {start:(sink:EventSink)=>void;stop:()=>void;}
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const int=(v:unknown,max=8e15):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
export function isNormalizedEvent(value:unknown):value is NormalizedEvent {
 if(!value||typeof value!=='object')return false;const e=value as NormalizedEvent;
 if(e.version!==1||!text(e.source,20)||!text(e.roomId,60)||!text(e.sessionId,60)||!text(e.eventId,100)||!int(e.occurredAt)||!int(e.receivedAt)||e.occurredAt>e.receivedAt||!e.viewer||(e.viewer.id!==null&&(!text(e.viewer.id,60)||e.viewer.id==='0'))||(e.viewer.nickname!==undefined&&!text(e.viewer.nickname,40)))return false;
 switch(e.kind){case 'join':case 'share':return true;case 'comment':return text(e.text,160);case 'like':return !!e.likes&&(e.likes.mode==='delta'?int(e.likes.count,10000)&&e.likes.count>0:e.likes.mode==='cumulative'&&int(e.likes.total,1e9)&&text(e.likes.counterId,60)&&['room','viewer'].includes(e.likes.scope));case 'gift':return text(e.giftId,60)&&text(e.streakId,60)&&int(e.repeatCount,10000)&&e.repeatCount>0&&typeof e.final==='boolean';default:return false;}
}
