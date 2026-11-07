import {validTempleSnapshot} from '../photo/live/repository.ts';
import type {LiveFrame,LiveError} from './protocol.ts';
export function readFrame(input:unknown):LiveFrame {
    const f=input as LiveFrame;
    if(!f||f.v!==1||typeof f.epoch!=='string'||!f.epoch||!Number.isSafeInteger(f.sequence)||f.sequence<0||!['LIVE','SIMULATION'].includes(f.mode)||!['disconnected','connecting','connected','error'].includes(f.status)||typeof f.username!=='string'||f.username.length>24||(f.error!==null&&!['unconfigured','offline','not-found','network','auth','invalid','storage','room-mismatch','rate-limit'].includes(f.error))||(f.snapshot!==null&&!validTempleSnapshot(f.snapshot,'LIVE'))||!Array.isArray(f.rituals)||!Array.isArray(f.progress)||f.rituals.length>6||f.progress.length>6)throw Error('invalid');
    if(f.logs!==undefined&&(!Array.isArray(f.logs)||f.logs.length>20||f.logs.some(l=>!l||typeof l.id!=='string'||typeof l.nickname!=='string'||typeof l.kind!=='string'||typeof l.outcome!=='string'||!Number.isSafeInteger(l.at))))throw Error('invalid');
    // Visual cues are never a reward source. Reject malformed/unbounded server messages.
    for(const cue of [...f.rituals,...f.progress])if(!cue||typeof cue.id!=='string'||typeof cue.userId!=='string'||!Number.isSafeInteger(cue.createdAt)||!Number.isSafeInteger(cue.expiresAt)||cue.expiresAt<cue.createdAt||cue.expiresAt-cue.createdAt>12000)throw Error('invalid');
    for(const cue of f.rituals)if(!['bow','incense','flower'].includes(cue.kind))throw Error('invalid');
    for(const cue of f.progress)if(!Number.isSafeInteger(cue.meritDelta)||cue.meritDelta<0||cue.meritDelta>999999||!Number.isSafeInteger(cue.contributionDelta)||cue.contributionDelta<0||cue.contributionDelta>999999||(cue.rankLevel!==undefined&&![1,2,3,4,5].includes(cue.rankLevel))||(cue.giftCoins!==undefined&&![1,5,10,30].includes(cue.giftCoins)))throw Error('invalid');
    return f;
}
export async function liveRequest(path:string,body?:unknown,signal?:AbortSignal):Promise<LiveFrame>{
    const r=await fetch('/api/temple/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:signal??AbortSignal.timeout(path==='connect'?35000:8000)});
    if(r.status===401||r.status===403)throw Error('auth');
    if(r.status===404||r.status===503||!r.headers.get('content-type')?.includes('application/json'))throw Error('unconfigured');
    if(!r.ok)throw Error('network');return readFrame(await r.json());
}
export function liveError(error:unknown):LiveError {return error instanceof Error&&['unconfigured','auth','invalid'].includes(error.message)?error.message as LiveError:'network';}

/** A new epoch is a full resync; never replay transient effects from its initial snapshot. */
export function mergeFrame(previous:LiveFrame,next:LiveFrame):LiveFrame {
    if(previous.epoch!==next.epoch)return {...next,rituals:[],progress:[]};
    if(next.sequence<previous.sequence)return previous;
    if(next.sequence===previous.sequence)return {...next,rituals:previous.rituals,progress:previous.progress};
    return next;
}
