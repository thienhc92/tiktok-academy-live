import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyEvent, answerQuiz, takeExam, promotePlayer, startSession, configureThresholds, appointOffice, parseProgress } from '../src/game/engine.ts';
import { RANKS, DEFAULT_THRESHOLDS, QUESTIONS, OFFICES, eligibility, recordFor } from '../src/game/progression.ts';
const answers=QUESTIONS.map(q=>q.answer);
const ready=(xp=10000,n=1)=>{const s=createGame(Array.from({length:n},(_,i)=>`Student ${i}`));s.players=s.players.map(p=>({...p,xp}));return s;};
function graduate(s:ReturnType<typeof createGame>,id:string,rank:number){for(let r=1;r<=rank;r++){if(r>=4){s=startSession(s,`session-${r}-${id}`);s=takeExam(s,id,answers);}s=promotePlayer(s,id,r*100,r);}return s;}
test('11 configurable ranks enforce every exact XP boundary and valid ordering',()=>{
 assert.equal(RANKS.length,11);assert.equal(RANKS[0],'Student');assert.equal(RANKS[10],'Principal');
 for(let rank=1;rank<11;rank++){
  let s=graduate(ready(), 'mock-0',rank-1);
  if(rank>=4){s=startSession(s,`boundary-${rank}`);s=takeExam(s,'mock-0',answers);}
  assert.equal(eligibility(s.academy,'mock-0',DEFAULT_THRESHOLDS[rank]-1).eligible,false);
  assert.equal(eligibility(s.academy,'mock-0',DEFAULT_THRESHOLDS[rank]).eligible,true);
 }
 const s=ready();assert.equal(configureThresholds(s,[0,0]),s);
 assert.equal(configureThresholds(s,[0,1,2,3,4,5,6,7,8,9,NaN]),s);
 const updated=configureThresholds(s,[0,1,2,3,4,5,6,7,8,9,10]);assert.equal(updated.academy.thresholds[10],10);
});
test('promotions cannot skip ranks or replay a target and never grant offices',()=>{
 const s=ready();assert.equal(promotePlayer(s,'mock-0',10,3),s);
 const next=promotePlayer(s,'mock-0',10,1);
 assert.equal(promotePlayer(next,'mock-0',10,1),next);
 assert.equal(recordFor(next.academy,'mock-0').history.length,1);
 assert.deepEqual(next.academy.appointments,[]);
 assert.equal(promotePlayer(ready(0),'mock-0',10,1).academy.records.length,0);
});
test('Mentor requires 80% examination; one attempt per session, invalid attempts rejected',()=>{
 let s=graduate(ready(),'mock-0',3);
 assert.equal(promotePlayer(s,'mock-0',1,4),s);
 assert.equal(takeExam(s,'mock-0',['A']),s);
 s=takeExam(s,'mock-0',['B','A','D','C','B']);
 assert.equal(recordFor(s.academy,'mock-0').exams[0].score,0);
 assert.equal(takeExam(s,'mock-0',answers),s);
 assert.equal(promotePlayer(s,'mock-0',1,4),s);
 s=startSession(s,'retry');s=takeExam(s,'mock-0',['A','B','C','D','B']);
 assert.equal(recordFor(s.academy,'mock-0').exams.slice(-1)[0].score,80);
 s=promotePlayer(s,'mock-0',100,4);assert.equal(recordFor(s.academy,'mock-0').rank,4);
});
test('all 11 ranks attainable with exams and top rank remains capped',()=>{
 const s=graduate(ready(),'mock-0',10);
 assert.equal(recordFor(s.academy,'mock-0').rank,10);
 assert.equal(eligibility(s.academy,'mock-0',10000).eligible,false);
 assert.equal(promotePlayer(s,'mock-0',2000,11),s);
 assert.equal(recordFor(s.academy,'mock-0').history.length,10);
 assert.ok(parseProgress(JSON.stringify(s)));
});
test('correct quiz awards XP once, wrong/invalid answers do not, including after reload',()=>{
 let s=ready(0);assert.equal(answerQuiz(s,'mock-0','q1','X'),s);
 s=answerQuiz(s,'mock-0','q1','A');assert.equal(s.players[0].xp,25);assert.equal(s.players[0].contribution,0);
 s=parseProgress(JSON.stringify(s))!;assert.equal(answerQuiz(s,'mock-0','q1','A'),s);
 s=answerQuiz(s,'mock-0','q2','A');assert.equal(s.players[0].xp,25);
 assert.equal(answerQuiz(s,'mock-0','q2','B'),s);
 assert.equal(answerQuiz(s,'unknown','q1','A'),s);
});
test('validated events award academic XP except gifts; replays preserve progression',()=>{
 let s=ready(0);for(const [i,kind] of ['like','comment','share','gift'].entries())s=applyEvent(s,{id:`event-${i}`,playerId:'mock-0',nickname:'Student',kind,count:1});
 assert.equal(s.players[0].xp,16);assert.equal(s.players[0].contribution,28);
 assert.equal(applyEvent(s,{id:'event-0',playerId:'mock-0',nickname:'Student',kind:'like',count:1}),s);
 assert.equal(recordFor(s.academy,'mock-0').rank,0);
});
test('offices enforce capacities, academic eligibility, one seat per person and session expiry',()=>{
 let s=ready(10000,9);
 assert.equal(appointOffice(s,'principal'),s);
 for(const p of s.players)s=graduate(s,p.id,10);
 s=appointOffice(s,'principal');assert.equal(s.academy.appointments.length,1);
 const original=s;s=appointOffice(s,'principal');assert.equal(s,original);
 s=appointOffice(s,'vice-principal');s=appointOffice(s,'department-head');s=appointOffice(s,'class-leader');
 for(const o of OFFICES)assert.ok(s.academy.appointments.filter(p=>p.office===o.id).length<=o.capacity);
 assert.equal(new Set(s.academy.appointments.map(p=>p.playerId)).size,8);
 const ranks=s.academy.records.map(r=>r.rank);s=startSession(s,'new-term');
 assert.equal(s.academy.appointments.length,0);assert.deepEqual(s.academy.records.map(r=>r.rank),ranks);
 assert.ok(parseProgress(JSON.stringify(s)));
});
test('gift contribution cannot decide appointments, deterministic ID breaks academic ties',()=>{
 let s=ready(10000,2);for(const p of s.players)s=graduate(s,p.id,10);
 s.players[1].contribution=999999;
 s=appointOffice(s,'principal');assert.equal(s.academy.appointments[0].playerId,'mock-0');
});
test('legacy saves retain balances and initialize ranks without inventing earned promotions',()=>{
 const old={version:1,players:[{id:'old',nickname:'Old',xp:5000,contribution:50}],processedIds:['old-event']};
 const restored=parseProgress(JSON.stringify(old))!;assert.equal(restored.players[0].xp,5000);
 assert.equal(recordFor(restored.academy,'old').rank,0);assert.deepEqual(restored.processedIds,['old-event']);
});
test('corrupt progression, duplicate appointments and invalid thresholds reject entire save',()=>{
 const s=graduate(ready(),'mock-0',10);
 const invalid=[{...s.academy,thresholds:[0]}, {...s.academy,records:[{...s.academy.records[0],rank:11}]}, {...s.academy,appointments:[{office:'principal',playerId:'mock-0',session:s.academy.session},{office:'principal',playerId:'mock-0',session:s.academy.session}]}];
 for(const academy of invalid)assert.equal(parseProgress(JSON.stringify({...s,academy})),null);
});

test('bounded examination history retains promotion evidence after many failed attempts',()=>{
 let s=graduate(ready(),'mock-0',4);
 for(let i=0;i<105;i++){s=startSession(s,`failed-${i}`);s=takeExam(s,'mock-0',['B','A','D','C','B']);}
 assert.equal(recordFor(s.academy,'mock-0').exams.length,100);
 assert.ok(recordFor(s.academy,'mock-0').exams.some(e=>e.target===4&&e.score>=80));
 assert.ok(parseProgress(JSON.stringify(s)));
});

test('a passed target exam cannot be farmed again in later sessions before promotion',()=>{
 let s=graduate(ready(),'mock-0',3);s=takeExam(s,'mock-0',answers);
 s=startSession(s,'new-before-promoting');
 assert.equal(takeExam(s,'mock-0',answers),s);
 assert.ok(parseProgress(JSON.stringify(s)));
});
