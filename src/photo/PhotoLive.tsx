import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/vi';
import { LIVE_ROSTER, LIVE_NOTICE_MS, applyPhotoLive, initialPhotoLive } from './liveModel';
import { assignSeats, projectSeats, layoutSeatLabels, SEAT_MAP } from './seatMap';
import type { LiveAction, LiveEvent } from './liveModel';
import './live.css';

export function PhotoLive({onControls,operator,photoAspect,initialVisitors}:{onControls:()=>void;operator:boolean;photoAspect:number;initialVisitors?:string[]}) {
    const root=useRef<HTMLDivElement>(null), footer=useRef<HTMLElement>(null), chat=useRef<HTMLElement>(null);
    const [state,setState]=useState(()=>initialPhotoLive(initialVisitors));
    const [bounds,setBounds]=useState({width:window.innerWidth,height:window.innerHeight,footer:124,chat:{left:0,right:0,top:0,bottom:0}});
    useEffect(()=>{
        const update=()=>{
            if(!root.current||!footer.current||root.current.clientWidth<=0||root.current.clientHeight<=0) return;
            const messages=[...(chat.current?.querySelectorAll('p')??[])].map(p=>p.getBoundingClientRect());
            setBounds({width:root.current.clientWidth,height:root.current.clientHeight,
                footer:footer.current.getBoundingClientRect().height,
                chat:messages.length?{
                    left:Math.min(...messages.map(b=>b.left)),right:Math.max(...messages.map(b=>b.right)),
                    top:Math.min(...messages.map(b=>b.top)),bottom:Math.max(...messages.map(b=>b.bottom)),
                }:{left:0,right:0,top:0,bottom:0},
            });
        };
        update();
        if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(update);if(root.current)observer.observe(root.current);if(footer.current)observer.observe(footer.current);if(chat.current)observer.observe(chat.current);return ()=>observer.disconnect();}
        window.addEventListener('resize',update);return ()=>window.removeEventListener('resize',update);
    },[state.comments]);
    const slots=projectSeats(bounds.width,bounds.height,photoAspect);
    const [selected,setSelected]=useState(LIVE_ROSTER[0].id);
    const [text,setText]=useState('');
    const [giftCoins,setGiftCoins]=useState('1');
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
    function send(kind:LiveAction,viewerId=selected,message?:string,coins?:number) {
        const event:LiveEvent={id:`photo-live-${sequence.current++}`,kind,viewerId,text:message,coins};
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
    const participants=state.visitors.map(id=>LIVE_ROSTER.find(p=>p.id===id)!).map(person=>({...person,contributionScore:state.contributionScore[person.id]??0}));
    const seating=assignSeats(participants);
    const projected=new Map(slots.map(slot=>[slot.id,slot]));
    const labels=layoutSeatLabels(seating.seated.map(({seat})=>projected.get(seat.id)!),bounds.width,{bottom:bounds.height-bounds.footer-3,blocked:[bounds.chat]});
    const leaders=[...participants].sort((a,b)=>(state.activity[b.id]??0)-(state.activity[a.id]??0)||a.id.localeCompare(b.id)).slice(0,3);
    const next=LIVE_ROSTER.find(p=>!state.visitors.includes(p.id));
    return <div ref={root} className="photo-live" data-hidden={hidden} style={{'--pl-footer-height':`${bounds.footer}px` } as React.CSSProperties}>
        <header className="pl-header"><div className="pl-brand"><span aria-hidden="true">🪷</span><div><b>{t('Temple title')}</b><small>{t('Photo LIVE subtitle')}</small></div></div><button className="pl-settings" onClick={onControls} aria-label={t('Photo LIVE settings')}>☰</button></header>
        <div className="pl-session"><span className="pl-badge">{t('Photo LIVE badge')}</span><span>{t('Photo LIVE visitors',state.visitors.length)}</span><span>♥ {state.likes}</span></div>
        <section className="pl-stats" aria-label={t('Photo LIVE activity')}><div><span>🪔 {t('Photo LIVE incense')}</span><b>{state.incense}</b></div><div><span>🌸 {t('Temple flowers')}</span><b>{state.flowers}</b></div></section>
        <p className="pl-seating-summary">{t('Photo LIVE seats',seating.seated.length,SEAT_MAP.length,seating.waiting.length)}</p>
        <section className="pl-congregation" aria-label={t('Photo LIVE congregation')}>{seating.seated.map(({user:person,seat},index)=>{
            const slot=projected.get(seat.id)!;
            return <button key={person.id} className="pl-visitor" data-viewer-id={person.id} data-seat-id={seat.id} data-score={person.contributionScore} aria-label={t('Photo LIVE choose person',person.name)} title={t('Photo LIVE person score',person.name,person.contributionScore)} aria-pressed={selected===person.id} onClick={()=>setSelected(person.id)} style={{left:`${slot.x}px`,top:`${slot.y}px`,height:`${slot.height}px`,width:`${slot.width}px`,zIndex:10+seat.row,animationDelay:`${index%7*-.8}s`} as React.CSSProperties}>
                <img src="/temple/devotee-realistic.webp" alt="" draggable={false}/>
            </button>;
        })}<div className="pl-name-layer"><svg className="pl-name-guides" aria-hidden="true">{seating.seated.map(({seat})=>{
            const slot=projected.get(seat.id)!,label=labels.get(seat.id)!;
            const edgeY=label.y<slot.y+slot.height?label.y+label.height:label.y;
            return Math.abs(label.x-slot.x)>3||Math.abs(edgeY-slot.y-slot.height)>3?<line key={seat.id} x1={slot.x} y1={slot.y+slot.height} x2={label.x} y2={edgeY}/>:null;
        })}</svg>{seating.seated.map(({user:person,seat})=>{
            const label=labels.get(seat.id)!;
            return <span key={person.id} className="pl-name" data-for-viewer-id={person.id} data-seat-id={seat.id} data-selected={selected===person.id} title={person.name} style={{left:`${label.x}px`,top:`${label.y}px`,width:`${label.width}px`,height:`${label.height}px`,fontSize:`${label.fontSize}px`,lineHeight:`${label.height-2}px`}}>{person.name}</span>;
        })}</div></section>
        <aside className="pl-ranking" aria-label={t('Photo LIVE ranking')}><h2>{t('Photo LIVE ranking')}</h2>{leaders.map((person,index)=><div key={person.id}><i>{index+1}</i><span>{person.name}</span><b>{state.activity[person.id]??0}</b></div>)}</aside>
        {notice&&<div className={`pl-notice pl-notice-${notice.kind}`} key={notice.id} role="status"><span aria-hidden="true">{({join:'🪷',like:'♥',incense:'🪔',flower:'🌸',wish:'✨',gift:'🎁'})[notice.kind]}</span><b>{t('Photo LIVE notice '+notice.kind,notice.name)}</b></div>}
        {notice&&(notice.kind==='like'||notice.kind==='flower')&&<div key={'effect-'+notice.id} className="pl-reactions" aria-hidden="true">{Array.from({length:6},(_,index)=><span key={index} style={{left:`${15+index*14}%`,animationDelay:`${index*.08}s`}}>{notice.kind==='like'?'♥':'🌸'}</span>)}</div>}
        <section ref={chat} className="pl-chat" aria-label={t('Photo LIVE chat')}>{state.comments.length?state.comments.slice(-2).map(comment=><p key={comment.id}><b>{comment.name}</b><span>{comment.text}</span></p>):<p><b>{t('Temple title')}</b><span>{t('Photo LIVE sample wish')}</span></p>}</section>
        {operator && <div className="pl-simulator"><label><span>{t('Photo LIVE person')}</span><select value={selected} onChange={event=>setSelected(event.target.value)}>{participants.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button onClick={()=>setPlaying(v=>!v)} aria-pressed={playing}>{t(playing?'Photo LIVE pause':'Photo LIVE play')}</button><button disabled={!next} onClick={()=>next&&send('join',next.id)}>{t('Photo LIVE add guest')}</button><label className="pl-gift-coins"><span>{t('Photo LIVE mock coins')}</span><input aria-label={t('Photo LIVE mock coins')} type="number" min="1" max="1000000" step="1" value={giftCoins} onChange={event=>setGiftCoins(event.target.value)}/></label><button disabled={!Number.isSafeInteger(Number(giftCoins))||Number(giftCoins)<=0||Number(giftCoins)>1000000} onClick={()=>send('gift',selected,undefined,Number(giftCoins))}>{t('Photo LIVE mock gift')}</button><small>{t('Photo LIVE selected score',state.contributionScore[selected]??0)}</small></div>}
        <footer ref={footer} className="pl-footer"><div className="pl-actions"><button onClick={()=>send('incense')}><span aria-hidden="true">🪔</span>{t('Photo LIVE incense')}</button><button onClick={()=>send('flower')}><span aria-hidden="true">🌸</span>{t('Temple flowers')}</button><button onClick={()=>send('like')}><span className="pl-heart" aria-hidden="true">♥</span>{t('Photo LIVE like')}</button></div>
            <form className="pl-comment" onSubmit={event=>{event.preventDefault();if(text.trim()){send('wish',selected,text);setText('')}}}><input aria-label={t('Photo LIVE wish')} placeholder={t('Photo LIVE wish')} maxLength={120} value={text} onChange={event=>setText(event.target.value)}/><button disabled={!text.trim()}>{t('Photo LIVE send')}</button></form>
            <small>{t('Photo LIVE disclaimer')}</small>
        </footer>
    </div>;
}
