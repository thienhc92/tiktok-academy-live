import {isNormalizedEvent} from '../../events/types.ts';
import type {NormalizedEvent} from '../../events/types.ts';
export type TempleMode='MOCK'|'LIVE';
export type TempleViewer={id:string|null;nickname?:string;avatar?:string|null};
type Envelope=Pick<NormalizedEvent,'version'|'source'|'roomId'|'sessionId'|'eventId'|'occurredAt'|'receivedAt'>&{viewer:TempleViewer};
export type TempleEvent=Envelope & (
    {kind:'join'|'leave'|'follow'|'share'|'incense'|'flower'|'bow'}|
    {kind:'comment';text:string}|
    {kind:'like';likes:Extract<NormalizedEvent,{kind:'like'}>['likes']}|
    {kind:'gift';giftId:string;streakId:string;repeatCount:number;final:boolean;coins:number}
);
export const validId=(id:unknown):id is string=>typeof id==='string'&&/^[A-Za-z0-9._:-]{1,128}$/.test(id)&&!['0','null','undefined','__proto__','constructor','prototype'].includes(id)&&!Object.prototype.hasOwnProperty.call(Object.prototype,id);
export function validAvatar(value:unknown):value is string|null {
    if(value===null||value==='/temple/devotee-realistic.webp')return true;
    if(typeof value!=='string'||value.length>1024)return false;
    try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443');}catch{return false;}
}
export function isTempleEvent(input:unknown):input is TempleEvent {
    if(!input||typeof input!=='object')return false;
    const e=input as TempleEvent;
    if(!['mock','tiktok'].includes(e.source)||!e.viewer||(e.viewer.id!==null&&!validId(e.viewer.id)))return false;
    if(e.viewer.nickname!==undefined&&(typeof e.viewer.nickname!=='string'||!e.viewer.nickname.trim()||e.viewer.nickname.length>80))return false;
    if(e.viewer.avatar!==undefined&&!validAvatar(e.viewer.avatar))return false;
    if(!['join','leave','comment','like','gift','follow','share','incense','flower','bow'].includes(e.kind))return false;
    // Reuse the existing envelope/payload contract; temple identity/profile limits are checked above.
    const kind=['leave','follow','incense','flower','bow'].includes(e.kind)?'join':e.kind;
    if(!isNormalizedEvent({...e,kind,viewer:{id:e.viewer.id===null?null:'validated-viewer'}}))return false;
    if(e.kind==='comment'&&e.text.length>120)return false;
    if(e.kind==='gift'&&(!Number.isSafeInteger(e.coins)||e.coins<=0||e.coins>1000000))return false;
    return e.eventId===e.eventId.trim()&&e.sessionId===e.sessionId.trim()&&e.roomId===e.roomId.trim();
}
export function templeEventKey(e:TempleEvent){return JSON.stringify([e.source,e.roomId,e.sessionId,e.kind,e.eventId]);}
