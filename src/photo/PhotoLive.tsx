import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/vi';
import { LIVE_ROSTER, LIVE_NOTICE_MS, applyPhotoLive, initialPhotoLive, projectLiveSlots } from './liveModel';
import type { LiveAction, LiveEvent } from './liveModel';
import './live.css';

export function PhotoLive({onControls,operator,photoAspect,cover}:{onControls:()=>void;operator:boolean;photoAspect:number;cover:boolean}) {
    const root=useRef<HTMLDivElement>(null), footer=useRef<HTMLElement>(null);
    const [bounds,setBounds]=useState({width:window.innerWidth,height:window.innerHeight,footer:124});
    useEffect(()=>{
        const update=()=>{if(root.current&&footer.current&&root.current.clientWidth>0&&root.current.clientHeight>0)setBounds({width:root.current.clientWidth,height:root.current.clientHeight,footer:footer.current.getBoundingClientRect().height});};
        update();
        if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(update);if(root.current)observer.observe(root.current);if(footer.current)observer.observe(footer.current);return ()=>observer.disconnect();}
        window.addEventListener('resize',update);return ()=>window.removeEventListener('resize',update);
    },[]);
    const slots=projectLiveSlots(bounds.width,bounds.height,photoAspect,cover,bounds.footer+(bounds.height<650?28:52));
    const [state,setState]=useState(initialPhotoLive);
    const [selected,setSelected]=useState(LIVE_ROSTER[0].id);
    const [text,setText]=useState('');
    const [playing,setPlaying]=useState(false);
    const [hidden,setHidden]=useState(document.hidden);
    const sequence=useRef(1), simulationIndex=useRef(0);
    const stateRef=useRef(state); stateRef.current=state;
    const [notice,setNotice]=useState<typeof state.notice>(null);
    useEffect(()=>{
        const update=()=>setHidden(document.hidden);
        document.addEventListener('visibilitychange',update);
        return ()=>document.removeEventListener('visibilitychange',update);
    },[]);
    useEffect(()=>{
        if (!state.notice) return;
        setNotice(state.notice);
        const timer=setTimeout(()=>setNotice(null),LIVE_NOTICE_MS);
        return ()=>clearTimeout(timer);
    },[state.notice]);
    function send(kind:LiveAction,viewerId=selected,message?:string) {
        const event:LiveEvent={id:`photo-live-${sequence.current++}`,kind,viewerId,text:message};
        setState(previous=>applyPhotoLive(previous,event));
    }
    useEffect(()=>{
        if (!playing||hidden) return;
        const timer=setInterval(()=>{
            const current=stateRef.current, index=simulationIndex.current++;
            const next=LIVE_ROSTER.find(p=>!current.visitors.includes(p.id));
            const viewerId=current.visitors[index%current.visitors.length];
            if (next&&index%3===0) send('join',next.id);
            else {
                const kind=(['like','incense','flower','wish'] as const)[index%4];
                send(kind,viewerId,kind==='wish'?t('Photo LIVE sample wish'):undefined);
            }
        },6500);
        return ()=>clearInterval(timer);
    },[playing,hidden]);
    const participants=LIVE_ROSTER.filter(p=>state.visitors.includes(p.id));
    const leaders=[...participants].sort((a,b)=>(state.activity[b.id]??0)-(state.activity[a.id]??0)||a.id.localeCompare(b.id)).slice(0,3);
    const next=LIVE_ROSTER.find(p=>!state.visitors.includes(p.id));
    return <div ref={root} className="photo-live" data-hidden={hidden} style={{'--pl-footer-height':`${bounds.footer}px` } as React.CSSProperties}>
        <header className="pl-header"><div className="pl-brand"><span aria-hidden="true">🪷</span><div><b>{t('Temple title')}</b><small>{t('Photo LIVE subtitle')}</small></div></div><button className="pl-settings" onClick={onControls} aria-label={t('Photo LIVE settings')}>☰</button></header>
        <div className="pl-session"><span className="pl-badge">{t('Photo LIVE badge')}</span><span>{t('Photo LIVE visitors',state.visitors.length)}</span><span>♥ {state.likes}</span></div>
        <section className="pl-stats" aria-label={t('Photo LIVE activity')}><div><span>🪔 {t('Photo LIVE incense')}</span><b>{state.incense}</b></div><div><span>🌸 {t('Temple flowers')}</span><b>{state.flowers}</b></div></section>
        <section className="pl-congregation" aria-label={t('Photo LIVE congregation')}>{participants.map((person,index)=>{
            const slot=slots[index];
            return <button key={person.id} className="pl-visitor" data-viewer-id={person.id} aria-label={t('Photo LIVE choose person',person.name)} aria-pressed={selected===person.id} onClick={()=>setSelected(person.id)} style={{left:`${slot.x}px`,top:`${slot.y}px`,height:`${slot.height}px`,width:`${slot.width}px`,zIndex:10+index,animationDelay:`${index%7*-.8}s`}}>
                <img src="/temple/devotee-realistic.webp" alt="" draggable={false}/><span className="pl-name">{person.name}</span>
            </button>;
        })}</section>
        <aside className="pl-ranking" aria-label={t('Photo LIVE ranking')}><h2>{t('Photo LIVE ranking')}</h2>{leaders.map((person,index)=><div key={person.id}><i>{index+1}</i><span>{person.name}</span><b>{state.activity[person.id]??0}</b></div>)}</aside>
        {notice&&<div className={`pl-notice pl-notice-${notice.kind}`} key={notice.id} role="status"><span aria-hidden="true">{({join:'🪷',like:'♥',incense:'🪔',flower:'🌸',wish:'✨'})[notice.kind]}</span><b>{t('Photo LIVE notice '+notice.kind,notice.name)}</b></div>}
        {notice&&(notice.kind==='like'||notice.kind==='flower')&&<div key={'effect-'+notice.id} className="pl-reactions" aria-hidden="true">{Array.from({length:6},(_,index)=><span key={index} style={{left:`${15+index*14}%`,animationDelay:`${index*.08}s`}}>{notice.kind==='like'?'♥':'🌸'}</span>)}</div>}
        <section className="pl-chat" aria-label={t('Photo LIVE chat')}>{state.comments.length?state.comments.slice(-2).map(comment=><p key={comment.id}><b>{comment.name}</b><span>{comment.text}</span></p>):<p><b>{t('Temple title')}</b><span>{t('Photo LIVE sample wish')}</span></p>}</section>
        {operator && <div className="pl-simulator"><label><span>{t('Photo LIVE person')}</span><select value={selected} onChange={event=>setSelected(event.target.value)}>{participants.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button onClick={()=>setPlaying(v=>!v)} aria-pressed={playing}>{t(playing?'Photo LIVE pause':'Photo LIVE play')}</button><button disabled={!next} onClick={()=>next&&send('join',next.id)}>{t('Photo LIVE add guest')}</button></div>}
        <footer ref={footer} className="pl-footer"><div className="pl-actions"><button onClick={()=>send('incense')}><span aria-hidden="true">🪔</span>{t('Photo LIVE incense')}</button><button onClick={()=>send('flower')}><span aria-hidden="true">🌸</span>{t('Temple flowers')}</button><button onClick={()=>send('like')}><span className="pl-heart" aria-hidden="true">♥</span>{t('Photo LIVE like')}</button></div>
            <form className="pl-comment" onSubmit={event=>{event.preventDefault();if(text.trim()){send('wish',selected,text);setText('')}}}><input aria-label={t('Photo LIVE wish')} placeholder={t('Photo LIVE wish')} maxLength={120} value={text} onChange={event=>setText(event.target.value)}/><button disabled={!text.trim()}>{t('Photo LIVE send')}</button></form>
            <small>{t('Photo LIVE disclaimer')}</small>
        </footer>
    </div>;
}
