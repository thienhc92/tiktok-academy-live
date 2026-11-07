import {validId,validAvatar} from './events.ts';
import type {TempleMode} from './events.ts';
import type {TempleState,TempleResult} from './processor.ts';
import {TEMPLE_RECEIPT_LIMIT,TEMPLE_USER_LIMIT} from './processor.ts';
export interface TempleRepository {
    transact(mode:TempleMode,seed:TempleState,change:(state:TempleState)=>TempleResult):Promise<TempleResult>;
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const integer=(v:unknown,max=8e15):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const strings=(v:unknown,max:number,length:number):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(s=>typeof s==='string'&&s.length<=length)&&new Set(v).size===v.length;
export function validTempleSnapshot(value:unknown,mode:TempleMode):value is TempleState {
    if(!object(value))return false;const s=value as unknown as TempleState;
    if(s.version!==2||s.mode!==mode||typeof s.sessionId!=='string'||!s.sessionId||s.sessionId.length>60||typeof s.roomId!=='string'||!s.roomId||s.roomId.length>60||!integer(s.clock)||!object(s.profiles))return false;
    const entries=Object.entries(s.profiles);if(entries.length>TEMPLE_USER_LIMIT)return false;
    if(!entries.every(([id,p])=>validId(id)&&object(p)&&p.userId===id&&typeof p.nickname==='string'&&!!p.nickname.trim()&&p.nickname.length<=80&&validAvatar(p.avatar)&&typeof p.active==='boolean'&&integer(p.presenceAt)&&integer(p.profileAt)&&typeof p.presenceKey==='string'&&p.presenceKey.length<=500))return false;
    if(!strings(s.receipts,TEMPLE_RECEIPT_LIMIT,500)||!strings(s.closed,TEMPLE_RECEIPT_LIMIT,500)||!object(s.counters)||Object.keys(s.counters).length>TEMPLE_RECEIPT_LIMIT*2||!Object.entries(s.counters).every(([k,v])=>k.length<=500&&integer(v,1e12)))return false;
    if(!object(s.merit)||Object.keys(s.merit).length>TEMPLE_USER_LIMIT||!Object.entries(s.merit).every(([id,v])=>Object.prototype.hasOwnProperty.call(s.profiles,id)&&integer(v,999999)))return false;
    if(!object(s.meritLimits)||Object.keys(s.meritLimits).length>TEMPLE_USER_LIMIT||!Object.entries(s.meritLimits).every(([id,v])=>Object.prototype.hasOwnProperty.call(s.profiles,id)&&object(v)&&(v.heartAt===null||integer(v.heartAt))&&integer(v.heartStart)&&integer(v.hearts,30)&&(v.bowAt===null||integer(v.bowAt))))return false;
    const g=s.game;
    if(!object(g)||!strings(g.visitors,TEMPLE_USER_LIMIT,128)||!g.visitors.every(id=>s.profiles[id]?.active)||!strings(g.recent,256,80)||!integer(g.likes,999999)||!integer(g.incense,999999)||!integer(g.flowers,999999))return false;
    if(entries.some(([id,p])=>p.active!==g.visitors.includes(id)))return false;
    for(const field of [g.activity,g.contributionScore])if(!object(field)||Object.keys(field).length>TEMPLE_USER_LIMIT||!Object.entries(field).every(([id,v])=>validId(id)&&Object.prototype.hasOwnProperty.call(s.profiles,id)&&integer(v,999999)))return false;
    return Array.isArray(g.comments)&&g.comments.length<=3&&g.comments.every(c=>object(c)&&typeof c.id==='string'&&c.id.length<=80&&typeof c.name==='string'&&c.name.length<=80&&typeof c.text==='string'&&c.text.length<=120);
}
export function restoreTempleSnapshot(value:unknown,mode:TempleMode){
    // Format-only migration: retain every old balance, receipt, profile and high-water counter.
    if(object(value)&&value.version===1)value={...value,version:2,merit:{},meritLimits:{}};
    if(!validTempleSnapshot(value,mode))throw Error('Invalid temple snapshot; original record preserved');
    return {...value,game:{...value.game,notice:null}};
}
/** Separate DB from Academy and selected photos. Read/receipt/reward/write share one transaction. */
export class IndexedTempleRepository implements TempleRepository {
    async transact(mode:TempleMode,seed:TempleState,change:(s:TempleState)=>TempleResult){
        const db=await new Promise<IDBDatabase>((resolve,reject)=>{
            const r=indexedDB.open('chua-online-temple-events-v1',1);let blocked=false;
            r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');
            r.onsuccess=()=>{if(blocked)r.result.close();else resolve(r.result);};
            r.onerror=()=>reject(r.error);r.onblocked=()=>{blocked=true;reject(Error('Temple database blocked'));};
        });
        try{return await new Promise<TempleResult>((resolve,reject)=>{
            const tx=db.transaction('snapshots','readwrite'),store=tx.objectStore('snapshots'),read=store.get(mode);
            let result:TempleResult,error:unknown;
            read.onsuccess=()=>{
                try{
                    const current=read.result===undefined?seed:restoreTempleSnapshot(read.result,mode);
                    result=change(current);
                    if(!validTempleSnapshot(result.state,mode))throw Error('Invalid temple transition');
                    if(read.result===undefined||read.result.version!==2||result.state!==current)store.put({...result.state,game:{...result.state.game,notice:null}},mode);
                }catch(e){error=e;tx.abort();}
            };
            tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(error??tx.error??Error('Temple transaction failed'));
        });}finally{db.close();}
    }
}
export class MemoryTempleRepository implements TempleRepository {
    private snapshots=new Map<TempleMode,TempleState>();private queue:Promise<unknown>=Promise.resolve();
    transact(mode:TempleMode,seed:TempleState,change:(s:TempleState)=>TempleResult):Promise<TempleResult>{
        const job=this.queue.then(()=>{
            const result=change(this.snapshots.get(mode)??seed);
            if(!validTempleSnapshot(result.state,mode))throw Error('Invalid temple transition');
            this.snapshots.set(mode,result.state);return result;
        });this.queue=job.catch(()=>undefined);return job;
    }
}
