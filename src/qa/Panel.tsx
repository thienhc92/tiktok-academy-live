import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createSandbox, simulate, examAnswers, previewRank } from './simulation';
import { eligibility, recordFor, RANKS, OFFICES } from '../game/progression';
import type { GameState } from '../game/engine';
import type { CeremonyEvent } from '../broadcast/Ceremony';
import './style.css';
export function QAPanel({nicknames,renderPreview,active}:{active:boolean;nicknames:string[];renderPreview:(game:GameState,event:CeremonyEvent)=>ReactNode}) {
  const [sandbox,setSandbox]=useState(()=>createSandbox(nicknames));
  const [playerId,setPlayerId]=useState('mock-0'),[amount,setAmount]=useState('100');
  const [score,setScore]=useState('5'),[office,setOffice]=useState<string>(OFFICES[0].id);
  const [message,setMessage]=useState('QA is isolated. No changes are saved to regular player progress.');
  const [preview,setPreview]=useState<CeremonyEvent|null>(null);
  useEffect(()=>{if(!preview)return;const timer=setTimeout(()=>setPreview(null),6000);return()=>clearTimeout(timer);},[preview]);
  useEffect(()=>{if(!active)setPreview(null);},[active]);
  const player=sandbox.game.players.find(p=>p.id===playerId)!;
  const record=recordFor(sandbox.game.academy,playerId);
  const status=eligibility(sandbox.game.academy,playerId,player.xp);
  function showPreview(rank=previewRank(sandbox,playerId)){setPreview({playerId,nickname:player.nickname,rank,at:Date.now()});}
  if(!active)return null;
  return <section className="qa-panel" aria-labelledby="qa-heading"><h2 id="qa-heading">QA simulation lab</h2>
    <p className="qa-warning"><b>SIMULATION ONLY · MEMORY-ONLY TEST DATA</b><br/>Separate students and balances. No regular save, real viewer data or TikTok connection. Reload discards this lab.</p>
    <label>QA student<select value={playerId} onChange={e=>{setPlayerId(e.target.value);setPreview(null);setMessage('Selected QA student.');}}>{sandbox.game.players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>
    <p data-testid="qa-profile"><b>{player.nickname} · {RANKS[record.rank]}</b> · {player.xp} QA XP · {player.contribution} contribution</p>
    <div className="qa-row"><label>Mock XP amount<input type="number" min="1" max="1000000" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label><button onClick={()=>{const next=simulate(sandbox,{type:'xp',playerId,amount:amount.trim()?Number(amount):NaN});setSandbox(next);setMessage(next===sandbox?'Enter an integer from 1 to 1,000,000.':'QA XP added. No rank or contribution was granted.');}}>Add QA XP</button></div>
    <button onClick={()=>setMessage(status.reason)}>Check promotion eligibility</button>
    <button disabled={!status.eligible} onClick={()=>{const next=simulate(sandbox,{type:'promote',playerId,target:record.rank+1,at:Date.now()});setSandbox(next);if(next!==sandbox){showPreview(record.rank+1);setMessage('Valid QA promotion granted; ceremony preview below.');}}}>Promote QA student</button>
    <div className="qa-row"><label>Exam result<select value={score} onChange={e=>setScore(e.target.value)}><option value="5">100% pass</option><option value="4">80% pass</option><option value="3">60% fail</option><option value="0">0% fail</option></select></label><button onClick={()=>{const next=simulate(sandbox,{type:'exam',playerId,answers:examAnswers(Number(score))});setSandbox(next);setMessage(next===sandbox?'Exam blocked: check rank, XP, passed target or this session’s attempt.':`QA exam recorded: ${Number(score)*20}%.`);}}>Simulate exam</button></div>
    <button onClick={()=>{setSandbox(s=>simulate(s,{type:'session',id:crypto.randomUUID()}));setMessage('New QA session; test offices expired, ranks retained.');}}>New QA session</button>
    <div className="qa-row"><label>Management office<select value={office} onChange={e=>setOffice(e.target.value)}>{OFFICES.map(o=><option key={o.id} value={o.id}>{o.title} ({o.capacity} seats)</option>)}</select></label><button onClick={()=>{const next=simulate(sandbox,{type:'appoint',office});setSandbox(next);setMessage(next===sandbox?'No eligible unappointed QA students or no free seats.':'QA seats filled by academic rules, not gifts or operator selection.');}}>Assign eligible QA appointments</button></div>
    <p>Office filling considers all QA students, requires the office rank and respects capacity and one office per person.</p>
    <ul>{sandbox.game.academy.appointments.map(a=><li key={a.playerId}>{sandbox.game.players.find(p=>p.id===a.playerId)?.nickname} · {OFFICES.find(o=>o.id===a.office)?.title}</li>)}</ul>
    <button onClick={()=>{showPreview();setMessage('Visual-only preview: eligibility, rank, XP and offices are unchanged.');}}>Preview 3D QA ceremony</button>
    <button className="qa-reset" onClick={()=>{if(window.confirm('Reset only the QA lab? Regular player progress will not change.')){setSandbox(createSandbox(nicknames));setPlayerId('mock-0');setPreview(null);setMessage('QA lab reset. Regular player progress was not touched.');}}}>Reset QA progress</button>
    <p role="status">{message}</p>
    <ol aria-label="QA promotion history">{record.history.map(h=><li key={h.to}>{RANKS[h.to]}</li>)}</ol>
    {preview&&<div className="qa-preview"><p>QA CEREMONY PREVIEW · no changes to regular players</p>{renderPreview(sandbox.game,preview)}</div>}
  </section>;
}
