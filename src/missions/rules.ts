import { QUESTIONS, eligibility, recordFor } from '../game/progression.ts';
import { promotePlayer, takeExam } from '../game/engine.ts';
import type { GameState } from '../game/engine.ts';
export type Kind='join'|'like'|'comment'|'share'|'gift';
export type MockEvent={id:string;playerId:string;nickname:string;kind:Kind;count:number;text?:string};
export type Config={join:number;like:number;comment:number;share:number;enroll:number;attendance:number;quiz:number;mission:number;school:number;dailyCap:number;sessionCap:number;cooldownMs:number};
export const DEFAULT_CONFIG:Config={join:2,like:1,comment:5,share:10,enroll:20,attendance:10,quiz:25,mission:20,school:25,dailyCap:500,sessionCap:200,cooldownMs:3000};
export type Ledger={id:string;day:string;session:string;dailyXP:number;sessionXP:number;counts:Record<Kind,number>;sessionCounts:Record<Kind,number>;last:Partial<Record<Kind,number>>;claimed:string[];acceptedIds:string[];texts:string[];enrolled:boolean;attendance:boolean;quizCorrect:number;exam?:{target:number;answers:string[]}};
export type Quiz={id:string;questionId:string;openedAt:number;closesAt:number;answers:{playerId:string;answer:string;at:number;correct:boolean}[]};
export type LiveState={version:1;now:number;config:Config;records:Ledger[];quiz:Quiz|null;school:{day:string;likes:number;comments:number;shares:number;claimed:boolean};effect:{id:string;kind:'mission'|'gift';at:number}|null};
const counts=()=>({join:0,like:0,comment:0,share:0,gift:0});
export const dayKey=(now:number)=>new Date(now+7*3600000).toISOString().slice(0,10);
export function createLive(now:number):LiveState{return {version:1,now,config:{...DEFAULT_CONFIG},records:[],quiz:null,school:{day:dayKey(now),likes:0,comments:0,shares:0,claimed:false},effect:null};}
export function validConfig(c:unknown):c is Config{return !!c&&typeof c==='object'&&Object.keys(DEFAULT_CONFIG).every(k=>Number.isSafeInteger((c as Config)[k as keyof Config])&&(c as Config)[k as keyof Config]>=0&&(c as Config)[k as keyof Config]<=1000000)&&Number((c as Config).cooldownMs)>=1000;}
function ledger(id:string,now:number,session:string):Ledger{return {id,day:dayKey(now),session,dailyXP:0,sessionXP:0,counts:counts(),sessionCounts:counts(),last:{},claimed:[],acceptedIds:[],texts:[],enrolled:false,attendance:false,quizCorrect:0};}
function award(state:GameState,live:LiveState,r:Ledger,amount:number){const xp=Math.max(0,Math.min(amount,live.config.dailyCap-r.dailyXP,live.config.sessionCap-r.sessionXP));r.dailyXP+=xp;r.sessionXP+=xp;state.players=state.players.map(p=>p.id===r.id?{...p,xp:Math.min(1e9,p.xp+xp)}:p);}
function promote(state:GameState,id:string,now:number){const p=state.players.find(p=>p.id===id);if(!p)return state;for(let i=0;i<10;i++){const e=eligibility(state.academy,id,p.xp);if(!e.eligible||e.next===null)break;state=promotePlayer(state,id,now,e.next);}return state;}
export function validEvent(value:unknown):value is MockEvent{if(!value||typeof value!=='object')return false;const e=value as MockEvent;const str=(s:unknown,n:number)=>typeof s==='string'&&s.trim().length>0&&s.length<=n;return str(e.id,160)&&str(e.playerId,100)&&str(e.nickname,40)&&['join','like','comment','share','gift'].includes(e.kind)&&Number.isSafeInteger(e.count)&&e.count>0&&e.count<=10000&&(e.text===undefined||typeof e.text==='string'&&e.text.length<=160)&&(e.kind!=='comment'||str(e.text,160));}
/** Mock-only normalized transport. Injected time is authoritative within this local simulation. */
export function receive(state:GameState,event:unknown,now:number):GameState{
 if(!validEvent(event)||!Number.isSafeInteger(now)||now<0||now>8e15||state.processedIds.includes(event.id)||now<(state.live?.now??0))return state;
 if(!state.players.some(p=>p.id===event.playerId)&&state.players.length>=1000)return state;
 const live:LiveState=structuredClone(state.live??createLive(now));live.now=now;const day=dayKey(now);
 if(live.school.day!==day)live.school={day,likes:0,comments:0,shares:0,claimed:false};
 let r=live.records.find(r=>r.id===event.playerId);
 if(!r){r=ledger(event.playerId,now,state.academy.session);live.records.push(r);}
 if(r.day!==day){const old=r;r=ledger(r.id,now,state.academy.session);r.enrolled=old.enrolled;r.sessionXP=old.session===state.academy.session?old.sessionXP:0;r.sessionCounts=old.session===state.academy.session?old.sessionCounts:counts();r.last=old.last;r.exam=old.exam;live.records[live.records.findIndex(x=>x.id===r!.id)]=r;}
 if(r.session!==state.academy.session){r.session=state.academy.session;r.sessionXP=0;r.sessionCounts=counts();r.exam=undefined;}
 if(r.acceptedIds.includes(event.id))return state;
 let next:GameState={...state,live,players:state.players.map(p=>({...p})),processedIds:[...state.processedIds,event.id].slice(-2000)};
 if(!next.players.some(p=>p.id===event.playerId))next.players.push({id:event.playerId,nickname:event.nickname,xp:0,contribution:0});
 // Rejected spam IDs are still consumed; they cannot be retried for a later reward.
 const max={join:1,like:100,comment:30,share:5,gift:50};
 const units=Math.min(event.count,event.kind==='like'?20:event.kind==='gift'?10:1);
 if(now-(r.last[event.kind]??-Infinity)<live.config.cooldownMs||r.sessionCounts[event.kind]+units>max[event.kind]||r.counts[event.kind]+units>max[event.kind]*3)return next;
 const normalized=event.text?.trim().toLowerCase();
 if(event.kind==='comment'){
  if(r.exam&&r.exam.target!==recordFor(next.academy,r.id).rank+1)r.exam=undefined;
  if(normalized==='thi'){const p=next.players.find(p=>p.id===r!.id)!;const target=recordFor(next.academy,r.id).rank+1;if(target<4||target>10||p.xp<next.academy.thresholds[target]||recordFor(next.academy,r.id).exams.some(e=>e.session===next.academy.session||e.target===target&&e.score>=80))return next;}
  if(normalized==='nhaphoc'&&r.enrolled||normalized==='diemdanh'&&r.attendance||normalized==='thi'&&r.exam)return next;
  if(/^[abcd]$/.test(normalized??'')){
   if(!r.exam&&(!live.quiz||now>=live.quiz.closesAt||live.quiz.answers.some(a=>a.playerId===r!.id)))return next;
  }else if(normalized!=='thi'){
   if(r.texts.includes(normalized!))return next;r.texts.push(normalized!);
  }
 }
 r.acceptedIds.push(event.id);
 r.last[event.kind]=now;r.counts[event.kind]+=units;r.sessionCounts[event.kind]+=units;
 const text=event.text?.trim().toLowerCase();let reward=event.kind==='gift'?0:live.config[event.kind]*units;
 if(event.kind==='gift'){next.players=next.players.map(p=>p.id===r!.id?{...p,contribution:Math.min(1e9,p.contribution+20*units)}:p);live.effect={id:event.id,kind:'gift',at:now};}
 if(event.kind==='like')live.school.likes=Math.min(100,live.school.likes+units);
 if(event.kind==='share')live.school.shares=Math.min(5,live.school.shares+1);
 if(event.kind==='comment'){
  live.school.comments=Math.min(10,live.school.comments+1);
  if(text==='nhaphoc'){reward=0;if(!r.enrolled){r.enrolled=true;reward=live.config.enroll;}}
  else if(text==='diemdanh'){reward=0;if(!r.attendance){r.attendance=true;reward=live.config.attendance;}}
  else if(text==='thi'){
   reward=0;const p=next.players.find(p=>p.id===r!.id)!;const target=recordFor(next.academy,r.id).rank+1;
   if(target>=4&&target<=10&&p.xp>=next.academy.thresholds[target]&&!recordFor(next.academy,r.id).exams.some(e=>e.session===next.academy.session))r.exam??={target,answers:[]};
  } else if(/^[abcd]$/.test(text??'')){
   reward=0;const answer=text!.toUpperCase();
   if(r.exam){r.exam.answers.push(answer);if(r.exam.answers.length===5){next=takeExam(next,r.id,r.exam.answers);r.exam=undefined;}}
   else if(live.quiz&&now>=live.quiz.openedAt&&now<live.quiz.closesAt&&!live.quiz.answers.some(a=>a.playerId===r!.id)){
    const correct=QUESTIONS.find(q=>q.id===live.quiz!.questionId)!.answer===answer;
    live.quiz.answers.push({playerId:r.id,answer,at:now,correct});if(correct){reward=live.config.quiz;r.quizCorrect++;}
   }
  }
 }
 award(next,live,r,reward);
 const missions=[['attendance',r.attendance],['comments',r.counts.comment>=3],['share',r.counts.share>=1],['quiz',r.quizCorrect>=1]] as const;
 for(const [id,complete] of missions)if(complete&&!r.claimed.includes(id)){r.claimed.push(id);award(next,live,r,live.config.mission);live.effect={id:event.id+id,kind:'mission',at:now};}
 if(!live.school.claimed&&live.school.likes>=100&&live.school.comments>=10&&live.school.shares>=5){live.school.claimed=true;for(const active of live.records.filter(p=>p.day===day&&(['join','like','comment','share'] as Kind[]).some(k=>p.last[k]!==undefined&&dayKey(p.last[k]!)===day))){if(active.session!==next.academy.session){active.session=next.academy.session;active.sessionXP=0;active.sessionCounts=counts();active.exam=undefined;}award(next,live,active,live.config.school);next=promote(next,active.id,now);}live.effect={id:event.id+'school',kind:'mission',at:now};}
 return promote(next,r.id,now);
}
export function openQuiz(state:GameState,id:string,questionId:string,now:number,seconds:number):GameState{
 if(typeof id!=='string'||!id.trim()||id.length>155||!QUESTIONS.some(q=>q.id===questionId)||!Number.isSafeInteger(now)||now<0||now>8e15||now<(state.live?.now??0)||!Number.isInteger(seconds)||seconds<15||seconds>300)return state;
 const live=structuredClone(state.live??createLive(now));if(live.quiz&&now<live.quiz.closesAt)return state;
 // Quiz IDs are saved in the shared replay window so reusing a closed ID is rejected.
 const key='quiz:'+id;if(state.processedIds.includes(key))return state;
 live.now=now;live.quiz={id,questionId,openedAt:now,closesAt:now+seconds*1000,answers:[]};
 return {...state,live,processedIds:[...state.processedIds,key].slice(-2000)};
}
export function configureLive(state:GameState,c:unknown,now:number):GameState{if(!validConfig(c)||!Number.isSafeInteger(now)||now<0||now>8e15||now<(state.live?.now??0))return state;return {...state,live:{...(state.live??createLive(now)),config:{...c}}};}
export function quizLeaders(live:LiveState){return [...(live.quiz?.answers??[])].filter(a=>a.correct).sort((a,b)=>a.at-b.at||a.playerId.localeCompare(b.playerId)).slice(0,10);}
export function parseLive(value:unknown,ids:string[]):LiveState|null{
 try{
  const l=value as LiveState;
  const num=(v:unknown,max=1e9)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
  const str=(v:unknown,max=160):v is string=>typeof v==='string'&&v.length>0&&v.length<=max;
  const day=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v);
  const tally=(v:Record<Kind,number>)=>v&&(['join','like','comment','share','gift'] as Kind[]).every(k=>num(v[k],10000));
  if(!l||l.version!==1||!num(l.now,8e15)||!validConfig(l.config)||!Array.isArray(l.records)||l.records.length>ids.length||new Set(l.records.map(r=>r.id)).size!==l.records.length)return null;
  for(const r of l.records){
   if(!ids.includes(r.id)||!day(r.day)||r.day>dayKey(l.now)||!str(r.session)||!num(r.dailyXP)||!num(r.sessionXP)||!tally(r.counts)||!tally(r.sessionCounts)||!r.last||!Object.entries(r.last).every(([k,v])=>['join','like','comment','share','gift'].includes(k)&&num(v,l.now))||!Array.isArray(r.claimed)||new Set(r.claimed).size!==r.claimed.length||!r.claimed.every(k=>['attendance','comments','share','quiz'].includes(k))||!Array.isArray(r.acceptedIds)||r.acceptedIds.length>600||new Set(r.acceptedIds).size!==r.acceptedIds.length||!r.acceptedIds.every(id=>str(id))||!Array.isArray(r.texts)||r.texts.length>90||!r.texts.every(t=>str(t))||typeof r.enrolled!=='boolean'||typeof r.attendance!=='boolean'||!num(r.quizCorrect))return null;
   if(r.exam&&(!num(r.exam.target,10)||r.exam.target<4||!Array.isArray(r.exam.answers)||r.exam.answers.length>4||!r.exam.answers.every(a=>/^[ABCD]$/.test(a))))return null;
  }
  if(!l.school||!day(l.school.day)||l.school.day!==dayKey(l.now)||!num(l.school.likes,100)||!num(l.school.comments,10)||!num(l.school.shares,5)||typeof l.school.claimed!=='boolean')return null;
  if(l.quiz){const q=l.quiz,question=QUESTIONS.find(x=>x.id===q.questionId);if(!str(q.id,155)||!question||!num(q.openedAt,l.now)||!num(q.closesAt,8e15)||q.closesAt-q.openedAt<15000||q.closesAt-q.openedAt>300000||!Array.isArray(q.answers)||q.answers.length>ids.length||new Set(q.answers.map(a=>a.playerId)).size!==q.answers.length||!q.answers.every(a=>ids.includes(a.playerId)&&/^[ABCD]$/.test(a.answer)&&a.correct===(a.answer===question.answer)&&num(a.at,l.now)&&a.at>=q.openedAt&&a.at<q.closesAt))return null;}
  if(l.effect&&(!str(l.effect.id,200)||!['mission','gift'].includes(l.effect.kind)||!num(l.effect.at,l.now)))return null;
  return l;
 }catch{return null;}
}
