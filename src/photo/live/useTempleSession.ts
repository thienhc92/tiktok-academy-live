import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {t} from '../../i18n/vi';
import type {ConnectionState} from '../../events/types';
import type {LiveAction,LiveNotice} from '../liveModel';
import {LIVE_ROSTER,LIVE_NOTICE_MS} from '../liveModel';
import {SEAT_MAP} from '../seatMap';
import {createTempleState,processTempleEvent,templeParticipants} from './processor';
import type {TempleResult} from './processor';
import {IndexedTempleRepository,MemoryTempleRepository} from './repository';
import type {TempleRepository} from './repository';
import {MockTempleSource,UnconfiguredLiveSource,mockTempleEvent} from './sources';
import {enqueueRitual} from './rituals';
import type {RitualCue} from './rituals';
import {enqueueProgress} from './progress';
import type {ProgressCue} from './progress';
import {enqueueNotice} from './notices';
import {initialSeatPlan,updateSeatPlan} from './seating';
export function useTempleSession(initialVisitors?:string[]) {
    const [snapshot,setSnapshot]=useState(()=>createTempleState('MOCK',crypto.randomUUID(),initialVisitors));
    const current=useRef(snapshot);current.current=snapshot;
    // Explicit fixture data is isolated and never reads or writes an owner's progress.
    const repository=useRef<TempleRepository>(initialVisitors?new MemoryTempleRepository():new IndexedTempleRepository());
    const source=useRef(new MockTempleSource());
    const [ready,setReady]=useState(false),[persistent,setPersistent]=useState(!initialVisitors);
    const [connection,setConnection]=useState<ConnectionState>('disconnected');
    const [rituals,setRituals]=useState<RitualCue[]>([]);
    const [progress,setProgress]=useState<ProgressCue[]>([]);
    const [notices,setNotices]=useState<LiveNotice[]>([]);
    const notice=notices[0]??null;
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
            const previousNoticeId=current.current.game.notice?.id;
            const change=(s:typeof current.current)=>processTempleEvent(s,input,Date.now());
            let result:TempleResult;
            try{result=await repository.current.transact('MOCK',current.current,change);}
            catch{
                // Preserve the last committed record. Clearly mark any in-memory continuation.
                repository.current=new MemoryTempleRepository();setPersistent(false);setMessage(t('Temple storage unavailable'));
                result=await repository.current.transact('MOCK',current.current,change);
            }
            if(mounted.current){
                const nextNotice=result.state.game.notice;
                if(!document.hidden&&result.outcome==='processed'&&nextNotice&&nextNotice.id!==previousNoticeId&&!result.progress?.rankLevel)
                    setNotices(previous=>enqueueNotice(previous,nextNotice));
                current.current=result.state;setSnapshot(result.state);setOutcome(t('Temple event '+result.outcome));if(result.cue&&!document.hidden)setRituals(previous=>enqueueRitual(previous,result.cue!,Date.now()));if(result.progress&&!document.hidden)setProgress(previous=>enqueueProgress(previous,result.progress!,Date.now()));}
        }).catch(()=>{if(mounted.current)setMessage(t('Temple processing error'));});
    },[]);
    useEffect(()=>{
        const adapter=source.current;
        adapter.start({event:consume,connection:setConnection,error:()=>setMessage(t('Temple processing error'))});
        return ()=>adapter.stop();
    },[consume]);
    useEffect(()=>{
        if(!rituals.length)return;
        const timer=setTimeout(()=>setRituals(previous=>previous.filter(c=>c.expiresAt>Date.now())),Math.max(20,Math.min(...rituals.map(c=>c.expiresAt))-Date.now()+10));
        return ()=>clearTimeout(timer);
    },[rituals]);
    useEffect(()=>{
        if(!progress.length)return;
        const timer=setTimeout(()=>setProgress(previous=>previous.filter(c=>c.expiresAt>Date.now())),Math.max(20,Math.min(...progress.map(c=>c.expiresAt))-Date.now()+10));
        return ()=>clearTimeout(timer);
    },[progress]);
    useEffect(()=>{
        if(!notice)return;
        const timer=setTimeout(()=>setNotices(previous=>previous.slice(1)),LIVE_NOTICE_MS);
        return ()=>clearTimeout(timer);
    },[notice?.id]);
    useEffect(()=>{const hide=()=>{if(document.hidden){setRituals([]);setProgress([]);setNotices([]);}};document.addEventListener('visibilitychange',hide);return ()=>document.removeEventListener('visibilitychange',hide);},[]);
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
        const update=()=>setPlan(previous=>updateSeatPlan(previous,participants,Date.now(),Math.max(0,...rituals.map(c=>c.expiresAt))));
        update();const timer=setInterval(update,1000);return ()=>clearInterval(timer);
    },[participants,rituals]);
    const displayedParticipants=useMemo(()=>participants.map(p=>({...p,seatId:plan.assigned.find(a=>a.userId===p.id)?.seatId??null})),[participants,plan]);
    const seating=useMemo(()=>{
        const users=new Map(displayedParticipants.map(p=>[p.id,p]));
        const seated=plan.assigned.flatMap(a=>{const user=users.get(a.userId),seat=SEAT_MAP.find(s=>s.id===a.seatId);return user&&seat?[{user,seat}]:[];});
        const ids=new Set(seated.map(a=>a.user.id));
        return {seated,waiting:displayedParticipants.filter(p=>!ids.has(p.id))};
    },[plan,displayedParticipants]);
    return {snapshot,state:snapshot.game,participants:displayedParticipants,seating,rituals,progress,notice,send,requestLive,ready,persistent,connection,message,outcome,pending:plan.pending};
}
