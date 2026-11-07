import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {t} from '../../i18n/vi';
import type {ConnectionState} from '../../events/types';
import type {LiveAction} from '../liveModel';
import {LIVE_ROSTER} from '../liveModel';
import {SEAT_MAP} from '../seatMap';
import {createTempleState,processTempleEvent,templeParticipants} from './processor';
import type {TempleResult} from './processor';
import {IndexedTempleRepository,MemoryTempleRepository} from './repository';
import type {TempleRepository} from './repository';
import {MockTempleSource,UnconfiguredLiveSource,mockTempleEvent} from './sources';
import {initialSeatPlan,updateSeatPlan} from './seating';
export function useTempleSession(initialVisitors?:string[]) {
    const [snapshot,setSnapshot]=useState(()=>createTempleState('MOCK',crypto.randomUUID(),initialVisitors));
    const current=useRef(snapshot);current.current=snapshot;
    // Explicit fixture data is isolated and never reads or writes an owner's progress.
    const repository=useRef<TempleRepository>(initialVisitors?new MemoryTempleRepository():new IndexedTempleRepository());
    const source=useRef(new MockTempleSource());
    const [ready,setReady]=useState(false),[persistent,setPersistent]=useState(!initialVisitors);
    const [connection,setConnection]=useState<ConnectionState>('disconnected');
    const [message,setMessage]=useState(''),[outcome,setOutcome]=useState('');
    const queue=useRef<Promise<unknown>>(Promise.resolve()),loaded=useRef<Promise<unknown>>(Promise.resolve());
    const mounted=useRef(false),readyFlag=useRef(false);
    useEffect(()=>{
        mounted.current=true;let active=true;
        loaded.current=repository.current.transact('MOCK',current.current,s=>({state:s,outcome:'processed'})).then(result=>{
            if(active){current.current=result.state;setSnapshot(result.state);readyFlag.current=true;setReady(true);}
        }).catch(()=>{
            if(active){repository.current=new MemoryTempleRepository();setPersistent(false);setMessage(t('Temple storage unavailable'));readyFlag.current=true;setReady(true);}
        });
        return ()=>{active=false;mounted.current=false;readyFlag.current=false;};
    },[]);
    const consume=useCallback((input:unknown)=>{
        queue.current=queue.current.then(async()=>{
            await loaded.current;if(!mounted.current)return;
            const change=(s:typeof current.current)=>processTempleEvent(s,input,Date.now());
            let result:TempleResult;
            try{result=await repository.current.transact('MOCK',current.current,change);}
            catch{
                // Preserve the last committed record. Clearly mark any in-memory continuation.
                repository.current=new MemoryTempleRepository();setPersistent(false);setMessage(t('Temple storage unavailable'));
                result=await repository.current.transact('MOCK',current.current,change);
            }
            if(mounted.current){current.current=result.state;setSnapshot(result.state);setOutcome(t('Temple event '+result.outcome));}
        }).catch(()=>{if(mounted.current)setMessage(t('Temple processing error'));});
    },[]);
    useEffect(()=>{
        const adapter=source.current;
        adapter.start({event:consume,connection:setConnection,error:()=>setMessage(t('Temple processing error'))});
        return ()=>adapter.stop();
    },[consume]);
    const send=useCallback((kind:LiveAction|'leave',viewerId:string,text?:string,coins?:number)=>{
        if(!viewerId||!readyFlag.current)return;
        const s=current.current,p=s.profiles[viewerId],fixture=LIVE_ROSTER.find(p=>p.id===viewerId);
        if(!p&&!fixture)return;
        source.current.emit(mockTempleEvent(kind,{id:viewerId,nickname:p?.nickname??fixture!.name,avatar:p?.avatar??'/temple/devotee-realistic.webp'},s,crypto.randomUUID(),Date.now(),text,coins));
    },[]);
    const requestLive=()=>new UnconfiguredLiveSource().start({event:()=>{},connection:()=>{},error:()=>setMessage(t('Temple LIVE unavailable'))});
    const participants=useMemo(()=>templeParticipants(snapshot),[snapshot]);
    const [plan,setPlan]=useState(()=>initialSeatPlan(participants,Date.now()));
    useEffect(()=>{
        const update=()=>setPlan(previous=>updateSeatPlan(previous,participants,Date.now()));
        update();const timer=setInterval(update,1000);return ()=>clearInterval(timer);
    },[participants]);
    const seating=useMemo(()=>{
        const users=new Map(participants.map(p=>[p.id,p]));
        const seated=plan.assigned.flatMap(a=>{const user=users.get(a.userId),seat=SEAT_MAP.find(s=>s.id===a.seatId);return user&&seat?[{user,seat}]:[];});
        const ids=new Set(seated.map(a=>a.user.id));
        return {seated,waiting:participants.filter(p=>!ids.has(p.id))};
    },[plan,participants]);
    return {snapshot,state:snapshot.game,participants,seating,send,requestLive,ready,persistent,connection,message,outcome,pending:plan.pending};
}
