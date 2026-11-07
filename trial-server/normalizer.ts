import {isTempleEvent,validAvatar} from '../src/photo/live/events.ts';
import type {TempleEvent} from '../src/photo/live/events.ts';
export type UpstreamKind='join'|'comment'|'like'|'follow'|'share'|'gift';
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};
/** IDs stay strings/bigints. A rounded 64-bit number is never repaired with String(). */
const id=(v:unknown):string|null=>{const s=typeof v==='bigint'?v.toString():typeof v==='string'?v:null;return s&&/^[1-9][0-9]{0,49}$/.test(s)?s:null;};
export function normalize(kind:UpstreamKind,input:unknown,room:string,now:number):TempleEvent|null {
 const data=obj(input),common=obj(data.common),user=obj(data.user);
 const eventId=id(common.msgId),roomId=id(room),userId=id(user.id??user.userId);
 if(!eventId||!roomId||(common.roomId&&id(common.roomId)!==roomId))return null;
 const rawTime=Number(common.createTime),at=Number.isSafeInteger(rawTime)&&rawTime>0?(rawTime<1e12?rawTime*1000:rawTime):now;
 const avatar=obj(user.avatarThumb).urlList;const url=Array.isArray(avatar)?avatar[0]:null;
 const base={version:1 as const,source:'tiktok',roomId,sessionId:'live-'+roomId,eventId,occurredAt:at,receivedAt:now,
  viewer:{id:userId,nickname:typeof user.nickname==='string'&&user.nickname.trim()?user.nickname.slice(0,80):'Khách TikTok',avatar:validAvatar(url)?url:null}};
 let value:unknown;
 if(kind==='comment'){if(typeof data.comment!=='string'||data.comment.length>120)return null;value={...base,kind,text:data.comment};}
 else if(kind==='like')value={...base,kind,likes:{mode:'delta',count:data.count}};
 else if(kind==='gift'){
  const gift=obj(data.gift),giftId=id(data.giftId??gift.id),streak=gift.type===1||gift.combo===true;
  const group=streak?id(data.groupId):id(data.groupId)??eventId;
  if(!giftId||!group||!Number.isSafeInteger(gift.diamondCount)||Number(gift.diamondCount)<=0||!Number.isInteger(gift.type))return null;
  value={...base,kind,giftId,streakId:group,repeatCount:data.repeatCount,final:streak?(data.repeatEnd===1||data.repeatEnd===true):true,coins:gift.diamondCount};
 }else value={...base,kind};
 return isTempleEvent(value)?value:null;
}
