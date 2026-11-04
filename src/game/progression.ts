import { t } from '../i18n/vi.ts';
/** Academic ranks qualify players; office seats never change academic rank. */
export const RANKS = [t("Student"),t("Active Student"),t("Scholar"),t("Senior Scholar"),t("Mentor"),t("Class Leader"),t("Teaching Assistant"),t("Teacher"),t("Department Head"),t("Vice Principal"),t("Principal")] as const;
export const DEFAULT_THRESHOLDS = [0,100,300,600,1000,1500,2200,3200,4500,6000,8000];
export const QUESTIONS = [
  { id:'q1', prompt:t("Which action earns academic XP without a gift?"), options:[t("Like"),t("Buy a rank"),t("Send diamonds"),t("Buy an office")], answer:'A' },
  { id:'q2', prompt:t("What do gifts award?"), options:[t("Principal rank"),t("Contribution points"),t("Exam passes"),t("Office seats")], answer:'B' },
  { id:'q3', prompt:t("How should classmates be treated?"), options:[t("Ignore them"),t("Spam them"),t("With respect"),t("By gift value")], answer:'C' },
  { id:'q4', prompt:t("What is needed for senior promotion?"), options:[t("A gift"),t("A nickname change"),t("An office"),t("XP and a passed exam")], answer:'D' },
  { id:'q5', prompt:t("Are academic ranks the same as limited offices?"), options:[t("No"),t("Yes"),t("Only for gifts"),t("Always")], answer:'A' },
] as const;
export type Promotion = { from:number; to:number; at:number; session:string };
export type Exam = { session:string; target:number; score:number };
export type AcademicRecord = { playerId:string; rank:number; history:Promotion[]; exams:Exam[]; quizzes:string[] };
export const OFFICES = [ {id:'class-leader',title:t("Class Leader"),rank:5,capacity:4}, {id:'department-head',title:t("Department Head"),rank:8,capacity:2}, {id:'vice-principal',title:t("Vice Principal"),rank:9,capacity:1}, {id:'principal',title:t("Principal"),rank:10,capacity:1} ] as const;
export type Appointment = { office:string; playerId:string; session:string };
export type Academy = { thresholds:number[]; session:string; records:AcademicRecord[]; appointments:Appointment[] };
export function createAcademy():Academy { return {thresholds:[...DEFAULT_THRESHOLDS],session:'mock-session-1',records:[],appointments:[]}; }
export function recordFor(academy:Academy,playerId:string):AcademicRecord { return academy.records.find(r=>r.playerId===playerId)??{playerId,rank:0,history:[],exams:[],quizzes:[]}; }
export function validThresholds(values:unknown):values is number[] {return Array.isArray(values)&&values.length===11&&values[0]===0&&values.every((v,i)=>Number.isSafeInteger(v)&&v>=0&&v<=1e9&&(i===0||v>values[i-1]));}
export function eligibility(academy:Academy,playerId:string,xp:number) {
  const r=recordFor(academy,playerId),next=r.rank+1;
  if(next>=RANKS.length)return {eligible:false,reason:t("Highest rank reached"),next:null};
  if(xp<academy.thresholds[next])return {eligible:false,reason:t("Need {0} more XP",academy.thresholds[next]-xp),next};
  if(next>=4&&!r.exams.some(e=>e.target===next&&e.score>=80))return {eligible:false,reason:t("Pass the promotion exam (80%)"),next};
  return {eligible:true,reason:t("Eligible for promotion"),next};
}
export function replaceRecord(a:Academy,r:AcademicRecord):Academy {return {...a,records:[...a.records.filter(p=>p.playerId!==r.playerId),r]};}
export function gradeExam(answers:unknown):number|null {
  if(!Array.isArray(answers)||answers.length!==QUESTIONS.length||!answers.every(a=>typeof a==='string'&&/^[ABCD]$/.test(a)))return null;
  return answers.reduce((score,a,i)=>score+(a===QUESTIONS[i].answer?20:0),0);
}
/** Validate persisted academy data before trusting rank/office/history fields. */
export function parseAcademy(value:unknown,playerIds:string[]):Academy|null {
  if(!value||typeof value!=='object')return null;
  const a=value as Academy;
  const text=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<=160;
  const rank=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=10;
  if(!validThresholds(a.thresholds)||!text(a.session)||!Array.isArray(a.records)||a.records.length>playerIds.length||!Array.isArray(a.appointments)||a.appointments.length>8)return null;
  if(new Set(a.records.map(r=>r?.playerId)).size!==a.records.length)return null;
  for(const r of a.records){
    if(!r||!playerIds.includes(r.playerId)||!rank(r.rank)||!Array.isArray(r.history)||r.history.length!==r.rank||!Array.isArray(r.exams)||r.exams.length>100||!Array.isArray(r.quizzes)||r.quizzes.length>QUESTIONS.length||new Set(r.quizzes).size!==r.quizzes.length||!r.quizzes.every(q=>QUESTIONS.some(item=>item.id===q)))return null;
    if(!r.history.every((h,i)=>h&&h.from===i&&h.to===i+1&&Number.isSafeInteger(h.at)&&h.at>=0&&text(h.session)))return null;
    if(!r.exams.every(e=>e&&text(e.session)&&rank(e.target)&&e.target>=4&&Number.isInteger(e.score)&&e.score>=0&&e.score<=100&&e.score%20===0)||new Set(r.exams.map(e=>e.session)).size!==r.exams.length)return null;
    if(r.history.some(h=>h.to>=4&&!r.exams.some(e=>e.target===h.to&&e.score>=80)))return null;
  }
  if(new Set(a.appointments.map(p=>p?.playerId)).size!==a.appointments.length)return null;
  for(const p of a.appointments){const office=OFFICES.find(o=>o.id===p?.office);if(!office||p.session!==a.session||!playerIds.includes(p.playerId)||recordFor(a,p.playerId).rank<office.rank)return null;}
  for(const o of OFFICES)if(a.appointments.filter(p=>p.office===o.id).length>o.capacity)return null;
  return a;
}
