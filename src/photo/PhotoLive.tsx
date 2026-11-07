import React, { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/vi';
import { LIVE_ROSTER, LIVE_NOTICE_MS } from './liveModel';
import { projectSeats, layoutSeatLabels, SEAT_MAP } from './seatMap';
import type { LiveAction } from './liveModel';
import { useTempleSession } from './live/useTempleSession';
import { RitualEffects } from './RitualEffects';
import { MOCK_GIFT_TIERS } from './live/merit';
import { ProgressEffects } from './ProgressEffects';
import { topContributors } from './live/ranks';
import './live.css';

export function PhotoLive({onControls,operator,photoAspect,initialVisitors}:{onControls:()=>void;operator:boolean;photoAspect:number;initialVisitors?:string[]}) {
    const root=useRef<HTMLDivElement>(null), footer=useRef<HTMLElement>(null), chat=useRef<HTMLElement>(null);
    const session=useTempleSession(initialVisitors);
    const {state,participants,seating}=session;
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
    const [rankingOpen,setRankingOpen]=useState(false);
    const [playing,setPlaying]=useState(false);
    const [hidden,setHidden]=useState(document.hidden);
    const simulationIndex=useRef(0);
    const stateRef=useRef(state); stateRef.current=state;
    const [notice,setNotice]=useState<typeof state.notice>(null);
    useEffect(()=>{
        const update=()=>setHidden(document.hidden);
        document.addEventListener('visibilitychange',update);
        return ()=>document.removeEventListener('visibilitychange',update);
    },[]);
    useEffect(()=>{
        if (!state.notice) return;
        if(session.progress.some(p=>p.rankLevel&&p.noticeId===state.notice!.id)){setNotice(null);return;}
        setNotice(state.notice);
        const timer=setTimeout(()=>setNotice(null),LIVE_NOTICE_MS);
        return ()=>clearTimeout(timer);
    },[state.notice]);
    function send(kind:LiveAction|'leave',viewerId=selected,message?:string,coins?:number) {
        session.send(kind,viewerId,message,coins);
    }
    useEffect(()=>{if(participants.length&&!participants.some(p=>p.id===selected))setSelected(participants[0].id);},[participants,selected]);
    useEffect(()=>{
        if (!playing||hidden||!session.ready) return;
        const timer=setInterval(()=>{
            const current=stateRef.current, index=simulationIndex.current++;
            const next=LIVE_ROSTER.find(p=>!current.visitors.includes(p.id));
            const viewerId=current.visitors[index%current.visitors.length];
            if (next&&(!current.visitors.length||index%3===0)) send('join',next.id);
            else {
                const kind=(['like','incense','flower','wish'] as const)[index%4];
                send(kind,viewerId,kind==='wish'?t('Photo LIVE sample wish'):undefined);
            }
        },6500);
        return ()=>clearInterval(timer);
    },[playing,hidden,session.ready]);
    const projected=new Map(slots.map(slot=>[slot.id,slot]));
    const labels=layoutSeatLabels(seating.seated.map(({seat})=>projected.get(seat.id)!),bounds.width,{bottom:bounds.height-bounds.footer-3,blocked:[bounds.chat]});
    const leaders=topContributors(participants);
    const selectedPerson=participants.find(p=>p.id===selected);
    const promoted=new Set(session.progress.filter(c=>c.rankLevel).map(c=>c.userId));
    const next=LIVE_ROSTER.find(p=>!state.visitors.includes(p.id));
    return <div ref={root} className="photo-live" data-hidden={hidden} style={{'--pl-footer-height':`${bounds.footer}px` } as React.CSSProperties}>
        <header className="pl-header"><div className="pl-brand"><span aria-hidden="true">🪷</span><div><b>{t('Temple title')}</b><small>{t('Photo LIVE subtitle')}</small></div></div><button className="pl-settings" onClick={onControls} aria-label={t('Photo LIVE settings')}>☰</button></header>
        <div className="pl-session"><span className="pl-badge">{t('Photo LIVE badge')}</span><span>{t('Photo LIVE visitors',state.visitors.length)}</span><span>♥ {state.likes}</span></div>
        <section className="pl-stats" aria-label={t('Photo LIVE activity')}><div><span>🪔 {t('Photo LIVE incense')}</span><b>{state.incense}</b></div><div><span>🌸 {t('Temple flowers')}</span><b>{state.flowers}</b></div><div title={t('Temple selected merit')} aria-label={t('Temple selected merit')}><span>🙏</span><b>{session.snapshot.merit[selected]??0}</b></div></section>
        <p className="pl-seating-summary">{t('Photo LIVE seats',seating.seated.length,SEAT_MAP.length,seating.waiting.length)}</p>
        <section className="pl-congregation" aria-label={t('Photo LIVE congregation')}>{seating.seated.map(({user:person,seat},index)=>{
            const slot=projected.get(seat.id)!;
            const pose=session.rituals.find(c=>c.userId===person.id&&c.kind==='bow')??session.rituals.find(c=>c.userId===person.id&&c.kind==='incense');
            return <button key={person.id} className="pl-visitor" data-viewer-id={person.id} data-seat-id={seat.id} data-score={person.contributionScore} data-merit={person.meritScore} data-rank={person.rank} data-ritual={pose?.kind} aria-label={t('Photo LIVE choose person',person.name)} title={t('Photo LIVE person score',person.name,person.contributionScore)} aria-pressed={selected===person.id} onClick={()=>setSelected(person.id)} style={{left:`${slot.x}px`,top:`${slot.y}px`,height:`${slot.height}px`,width:`${slot.width}px`,zIndex:10+seat.row,animationDelay:`${index%7*-.8}s`} as React.CSSProperties}>
                <img src="/temple/devotee-realistic.webp" alt="" draggable={false}/>{pose&&<span className="pl-prayer-mark" key={pose.id} aria-hidden="true">🙏</span>}
            </button>;
        })}<div className="pl-name-layer"><svg className="pl-name-guides" aria-hidden="true">{seating.seated.map(({seat})=>{
            const slot=projected.get(seat.id)!,label=labels.get(seat.id)!;
            const edgeY=label.y<slot.y+slot.height?label.y+label.height:label.y;
            return Math.abs(label.x-slot.x)>3||Math.abs(edgeY-slot.y-slot.height)>3?<line key={seat.id} x1={slot.x} y1={slot.y+slot.height} x2={label.x} y2={edgeY}/>:null;
        })}</svg>{seating.seated.map(({user:person,seat})=>{
            const label=labels.get(seat.id)!;
            return <span key={person.id} className="pl-name" data-for-viewer-id={person.id} data-seat-id={seat.id} data-selected={selected===person.id} data-promoted={promoted.has(person.id)} title={person.name} style={{left:`${label.x}px`,top:`${label.y}px`,width:`${label.width}px`,height:`${label.height}px`,fontSize:`${label.fontSize}px`,lineHeight:`${label.height-2}px`}}>{person.name}</span>;
        })}</div></section>
        <RitualEffects cues={session.rituals} slots={new Map(seating.seated.map(({user,seat})=>[user.id,projected.get(seat.id)!]))} width={bounds.width} height={bounds.height} aspect={photoAspect}/>
        <ProgressEffects cues={session.progress} slots={new Map(seating.seated.map(({user,seat})=>[user.id,projected.get(seat.id)!]))} labels={labels} names={new Map(Object.values(session.snapshot.profiles).map(p=>[p.userId,p.nickname]))} allSlots={slots} width={bounds.width}/>
        <aside className="pl-ranking" aria-label={t('Temple contribution ranking')}>
            <button className="pl-ranking-toggle" aria-expanded={rankingOpen} aria-controls="temple-contribution-top" onClick={()=>setRankingOpen(v=>!v)}>{t('Temple contribution ranking')}<span aria-hidden="true">{rankingOpen?'⌃':'⌄'}</span></button>
            {selectedPerson&&<div className="pl-selected-contribution" aria-label={t('Temple selected contribution')}><span>{selectedPerson.name}</span><b>{t('Temple contribution rank '+selectedPerson.rank)} · {t('Temple contribution points',selectedPerson.contributionScore)}</b></div>}
            {rankingOpen&&<ol id="temple-contribution-top" className="pl-contribution-top">{leaders.map(person=><li key={person.id} data-viewer-id={person.id}><span>{person.name}</span><small>{t('Temple contribution rank '+person.rank)} · {t('Temple contribution points',person.contributionScore)}</small></li>)}</ol>}
        </aside>
        {notice&&<div className={`pl-notice pl-notice-${notice.kind}`} key={notice.id} role="status"><span aria-hidden="true">{({join:'🪷',like:'♥',incense:'🪔',flower:'🌸',wish:'✨',gift:'🎁',bow:'🙏'})[notice.kind]}</span><b>{t('Photo LIVE notice '+notice.kind,notice.name)}</b></div>}
        {notice&&notice.kind==='like'&&<div key={'effect-'+notice.id} className="pl-reactions" aria-hidden="true">{Array.from({length:6},(_,index)=><span key={index} style={{left:`${15+index*14}%`,animationDelay:`${index*.08}s`}}>{notice.kind==='like'?'♥':'🌸'}</span>)}</div>}
        <section ref={chat} className="pl-chat" aria-label={t('Photo LIVE chat')}>{state.comments.length?state.comments.slice(-2).map(comment=><p key={comment.id}><b>{comment.name}</b><span>{comment.text}</span></p>):<p><b>{t('Temple title')}</b><span>{t('Photo LIVE sample wish')}</span></p>}</section>
        {operator && <div className="pl-simulator"><label><span>{t('Temple data source')}</span><select aria-label={t('Temple data source')} value="MOCK" onChange={event=>{if(event.target.value==='LIVE')session.requestLive();}}><option value="MOCK">{t('Temple MOCK mode')}</option><option value="LIVE">{t('Temple LIVE mode')}</option></select></label><label><span>{t('Photo LIVE person')}</span><select value={selected} onChange={event=>setSelected(event.target.value)}>{participants.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button onClick={()=>setPlaying(v=>!v)} aria-pressed={playing}>{t(playing?'Photo LIVE pause':'Photo LIVE play')}</button><button disabled={!next||!session.ready} onClick={()=>next&&send('join',next.id)}>{t('Photo LIVE add guest')}</button><button disabled={!session.ready||!state.visitors.includes(selected)} onClick={()=>send('leave')}>{t('Temple simulate leave')}</button><label className="pl-gift-coins"><span>{t('Photo LIVE mock coins')}</span><select aria-label={t('Photo LIVE mock coins')} value={giftCoins} onChange={event=>setGiftCoins(event.target.value)}>{MOCK_GIFT_TIERS.map(coins=><option key={coins} value={coins}>{coins}</option>)}</select></label><button disabled={!session.ready||!Number.isSafeInteger(Number(giftCoins))||Number(giftCoins)<=0||Number(giftCoins)>1000000} onClick={()=>send('gift',selected,undefined,Number(giftCoins))}>{t('Photo LIVE mock gift')}</button><small>{t('Temple merit summary',session.snapshot.merit[selected]??0,state.contributionScore[selected]??0)} · {t('Temple contribution rank '+(selectedPerson?.rank??1))} · {t('Temple seat summary',participants.find(p=>p.id===selected)?.seatId??t('Temple waiting seat'))}</small><small>{t('Temple merit help')}</small><small className="pl-source-status" role="status">{t(session.connection==='connected'?'Temple mock connected':'Temple source disconnected')} · {t(session.persistent?'Temple saved locally':'Temple memory only')} · {session.outcome} {session.pending&&t('Temple seating pending')}{session.message&&<strong>{session.message}</strong>}<span>{t('Temple selected identity',selected)}</span></small></div>}
        {!session.persistent&&!operator&&<p className="pl-storage-warning" role="status">{t('Temple memory only')}</p>}
        <footer ref={footer} className="pl-footer"><div className="pl-actions"><button disabled={!session.ready||!state.visitors.length} onClick={()=>send('bow')}><span aria-hidden="true">🙏</span>{t('Temple bow')}</button><button disabled={!session.ready||!state.visitors.length} onClick={()=>send('incense')}><span aria-hidden="true">🪔</span>{t('Photo LIVE incense')}</button><button disabled={!session.ready||!state.visitors.length} onClick={()=>send('flower')}><span aria-hidden="true">🌸</span>{t('Temple flowers')}</button><button disabled={!session.ready||!state.visitors.length} onClick={()=>send('like')}><span className="pl-heart" aria-hidden="true">♥</span>{t('Photo LIVE like')}</button></div>
            <form className="pl-comment" onSubmit={event=>{event.preventDefault();if(text.trim()){send('wish',selected,text);setText('')}}}><input aria-label={t('Photo LIVE wish')} placeholder={t('Photo LIVE wish')} maxLength={120} value={text} onChange={event=>setText(event.target.value)}/><button disabled={!session.ready||!text.trim()}>{t('Photo LIVE send')}</button></form>
            <small>{t('Photo LIVE disclaimer')}</small>
        </footer>
    </div>;
}
