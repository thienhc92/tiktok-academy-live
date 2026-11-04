import { t } from '../i18n/vi';
import { useState } from 'react';
import type { GameState } from './engine';
import { answerQuiz, takeExam, promotePlayer, configureThresholds, startSession, appointOffice } from './engine';
import { RANKS, QUESTIONS, OFFICES, eligibility, recordFor, validThresholds } from './progression';
import './progression.css';
export function ProgressionPanel({game,playerId,update}:{game:GameState;playerId:string;update:(r:(s:GameState)=>GameState)=>void}) {
  const [question,setQuestion]=useState(QUESTIONS[0].id as string),[answers,setAnswers]=useState<string[]>(Array(5).fill(''));
  const [thresholds,setThresholds]=useState(game.academy.thresholds.join(',')),[message,setMessage]=useState('');
  const player=game.players.find(p=>p.id===playerId);if(!player)return null;
  const record=recordFor(game.academy,playerId),status=eligibility(game.academy,playerId,player.xp);
  const exam=record.exams.find(e=>e.session===game.academy.session);
  const q=QUESTIONS.find(q=>q.id===question)!;
  return <section className="progression-panel"><h2>{t("Academy progression · mock operator")}</h2>
    <p><b>{player.nickname} · {RANKS[record.rank]}</b> · {player.xp} XP · {player.contribution}  {t("contribution")}</p>
    <p role="status">{status.reason}</p>
    <button disabled={!status.eligible} onClick={()=>update(s=>promotePlayer(s,playerId,Date.now(),record.rank+1))}>{t("Promote & celebrate")}</button>
    <h3>{t("Mock quiz · first answer is final")}</h3><label>{t("Question")} <select value={question} onChange={e=>setQuestion(e.target.value)}>{QUESTIONS.map(q=><option key={q.id} value={q.id}>{q.id}</option>)}</select></label><p>{q.prompt}</p>
    <div className="answer-buttons">{q.options.map((text,i)=><button key={text} disabled={record.quizzes.includes(q.id)} onClick={()=>update(s=>answerQuiz(s,playerId,q.id,'ABCD'[i]))}>{'ABCD'[i]}. {text}</button>)}</div>
    <small>{t("Correct: +25 XP. Each question rewards once per player, including after reload.")}</small>
    <h3>{t("Promotion exam · 80% required from Mentor")}</h3>
    {QUESTIONS.map((q,i)=><label key={q.id}>{q.prompt}<select aria-label={t("Exam {0}",q.id)} value={answers[i]} onChange={e=>setAnswers(a=>a.map((v,j)=>j===i?e.target.value:v))}><option value="">{t("Choose…")}</option>{q.options.map((text,j)=><option key={text} value={'ABCD'[j]}>{'ABCD'[j]}. {text}</option>)}</select></label>)}
    <button disabled={Boolean(exam)||record.exams.some(e=>e.target===record.rank+1&&e.score>=80)||record.rank<3||record.rank>=10||answers.some(a=>!a)||player.xp<(game.academy.thresholds[record.rank+1]??Infinity)} onClick={()=>update(s=>takeExam(s,playerId,answers))}>{t("Submit promotion exam")}</button>
    <p>{exam?t("This session: {0}% · {1}",exam.score,exam.score>=80?t("Passed"):t("Failed")):t("One attempt per player per session. No XP for exams.")}</p>
    <h3>{t("Promotion history")}</h3><ol>{record.history.map(h=><li key={h.to}>{RANKS[h.to]} · {new Date(h.at).toLocaleString('vi-VN')}</li>)}</ol>{!record.history.length&&<p>{t("No promotions yet.")}</p>}
    <details><summary>{t("Rank thresholds and school offices")}</summary><p>{t("Academic titles do not grant an office. Gifts never affect selection.")}</p>
      <label>{t("XP thresholds (11 ascending values)")}<input aria-label={t("XP thresholds")} value={thresholds} onChange={e=>setThresholds(e.target.value)}/></label>
      <button onClick={()=>{const values=thresholds.split(',').map(v=>v.trim()===''?NaN:Number(v));if(!validThresholds(values)){setMessage(t("Invalid thresholds: enter 11 increasing integers starting at 0."));return;}update(s=>configureThresholds(s,values));setMessage(t("Thresholds saved. Earned ranks are retained."));}}>{t("Apply thresholds")}</button>
      {OFFICES.map(o=><div key={o.id}><b>{o.title} · {game.academy.appointments.filter(a=>a.office===o.id).length}/{o.capacity}</b><button onClick={()=>update(s=>appointOffice(s,o.id))}>{t("Appoint eligible {0}",o.title)}</button></div>)}
      <ul>{game.academy.appointments.map(a=><li key={a.playerId}>{game.players.find(p=>p.id===a.playerId)?.nickname} · {OFFICES.find(o=>o.id===a.office)?.title}</li>)}</ul>
      <p>{t("Current session:")} {game.academy.session}{t(". New sessions expire offices and permit another exam; ranks and quiz rewards persist.")}</p>
      <button onClick={()=>{if(window.confirm(t("Start a new mock session? Current offices expire; academic progress stays.")))update(s=>startSession(s,crypto.randomUUID()));}}>{t("Start new mock session")}</button>
    </details>{message&&<p role="status">{message}</p>}
  </section>;
}
