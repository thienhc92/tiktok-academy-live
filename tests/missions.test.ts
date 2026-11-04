import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,parseProgress,startSession,configureThresholds} from '../src/game/engine.ts';
import {receive,openQuiz,configureLive,DEFAULT_CONFIG,quizLeaders,dayKey} from '../src/missions/rules.ts';
import {recordFor} from '../src/game/progression.ts';
let serial=0;const start=Date.UTC(2026,10,4,3);
const event=(kind='comment',text='diemdanh',extra={})=>({id:`e${serial++}`,playerId:'mock-0',nickname:'Mochi',kind,text,count:1,...extra});
test('validation rejects invalid events, timestamps and duplicates',()=>{
 let s=createGame(['Mochi']);for(const bad of [null,{},event('bad'),event('like','',{count:-1}),event('comment',''),event('gift','',{count:1.5})])assert.equal(receive(s,bad,start),s);
 assert.equal(receive(s,event(),NaN),s);const e=event('join');s=receive(s,e,start);assert.equal(receive(s,e,start+5000),s);assert.equal(receive(s,event(),start-1),s);
 assert.ok(parseProgress(JSON.stringify(s)));
});
test('enrollment/attendance commands and daily missions reward once, spam IDs remain consumed',()=>{
 let s=receive(createGame(['Mochi']),event('comment',' NHAPHOC '),start);assert.equal(s.players[0].xp,20);
 s=receive(s,event('comment','nhaphoc'),start+4000);assert.equal(s.players[0].xp,20);
 s=receive(s,event(),start+8000);assert.equal(s.players[0].xp,50);
 const spam=event('comment','khác');s=receive(s,spam,start+8001);const xp=s.players[0].xp;assert.equal(receive(s,spam,start+20000),s);assert.equal(s.players[0].xp,xp);
 s=receive(s,event(),start+20000);assert.equal(s.players[0].xp,xp);
});
test('daily/session caps include quiz and mission rewards, gifts never add academic XP',()=>{
 let s=configureLive(createGame(['Mochi']),{...DEFAULT_CONFIG,dailyCap:25,sessionCap:15},start);
 s=receive(s,event(),start);assert.equal(s.players[0].xp,15);
 s=startSession(s,'second');s=receive(s,event('share'),start+5000);assert.equal(s.players[0].xp,25);
 s=receive(s,event('gift','',{count:10}),start+10000);assert.equal(s.players[0].xp,25);assert.equal(s.players[0].contribution,200);
 assert.ok(parseProgress(JSON.stringify(s)));
});
test('day rollover is Vietnam-local, preserves session limits and allows attendance next day',()=>{
 assert.equal(dayKey(Date.UTC(2026,10,4,16,59)),'2026-11-04');assert.equal(dayKey(Date.UTC(2026,10,4,17)),'2026-11-05');
 let s=receive(createGame(['Mochi']),event(),start);s=receive(s,event(),start+86400000);assert.equal(s.players[0].xp,60);assert.equal(s.live!.records[0].dailyXP,30);assert.equal(s.live!.records[0].sessionXP,60);
});
test('quiz grades first A/B/C/D only before exclusive deadline and restores after reload',()=>{
 let s=openQuiz(createGame(['Mochi','Luna']),'round','q1',start,15);
 s=receive(s,event('comment','a'),start+1000);assert.equal(s.players[0].xp,45); // correct + daily quiz mission
 const xp=s.players[0].xp;s=receive(s,event('comment','B'),start+6000);assert.equal(s.players[0].xp,xp);
 s=receive(s,event('comment','A',{playerId:'mock-1'}),start+15000);assert.equal(s.players[1].xp,0);assert.equal(s.live!.quiz!.answers.length,1);
 s=parseProgress(JSON.stringify(s))!;assert.equal(quizLeaders(s.live!).length,1);
 assert.equal(openQuiz(s,'round','q1',start+20000,15),s);
});
test('wrong quiz answers earn no XP and first submission remains final',()=>{
 let s=openQuiz(createGame(['Mochi']),'wrong','q1',start,30);s=receive(s,event('comment','B'),start+1000);assert.equal(s.players[0].xp,0);assert.equal(s.live!.quiz!.answers[0].correct,false);
 s=receive(s,event('comment','A'),start+6000);assert.equal(s.players[0].xp,0);
});
test('school collective goal awards once and gifts cannot progress it',()=>{
 let s=createGame(['Mochi']);let now=start;
 for(let i=0;i<5;i++){s=receive(s,event('like','',{count:20}),now);now+=4000;}
 for(let i=0;i<10;i++){s=receive(s,event('comment','lời nhắn '+i),now);now+=4000;}
 for(let i=0;i<5;i++){s=receive(s,event('share'),now);now+=4000;}
 assert.equal(s.live!.school.claimed,true);assert.ok(s.live!.records[0].dailyXP<=DEFAULT_CONFIG.dailyCap);const xp=s.players[0].xp;
 s=receive(s,event('gift'),now);assert.equal(s.players[0].xp,xp);assert.equal(s.live!.school.likes,100);
});
test('reward XP connects to automatic promotions and thi uses real exam gate',()=>{
 let s=configureThresholds(createGame(['Mochi']),[0,1,2,3,4,5,6,7,8,9,10]);
 s=receive(s,event('comment','nhaphoc'),start);assert.equal(recordFor(s.academy,'mock-0').rank,3);
 s=receive(s,event('comment','thi'),start+4000);let now=start+8000;
 for(const answer of ['A','B','C','D','A']){s=receive(s,event('comment',answer),now);now+=4000;}
 assert.equal(recordFor(s.academy,'mock-0').rank,4);assert.equal(recordFor(s.academy,'mock-0').exams[0].score,100);assert.equal(s.live!.records[0].exam,undefined);
 assert.ok(parseProgress(JSON.stringify(s)));
});
test('corrupt saved mission data is rejected; legacy saves still load without live state',()=>{
 const old=createGame(['Mochi']);assert.ok(parseProgress(JSON.stringify(old)));
 const s=receive(old,event(),start);assert.equal(parseProgress(JSON.stringify({...s,live:{...s.live,config:{}}})),null);
 assert.equal(configureLive(s,{...DEFAULT_CONFIG,cooldownMs:0},start),s);
});
test('closed/wrong answers and invalid thi cannot farm comment missions',()=>{
 let s=createGame(['Mochi']);for(let i=0;i<5;i++)s=receive(s,event('comment',i%2?'thi':'A'),start+i*4000);
 assert.equal(s.players[0].xp,0);assert.equal(s.live!.records[0].counts.comment,0);assert.deepEqual(s.live!.records[0].claimed,[]);
});
test('daily mission claims stay spent across sessions and reloads; daily caps cannot be reset by session',()=>{
 let s=configureLive(createGame(['Mochi']),{...DEFAULT_CONFIG,dailyCap:30},start);s=receive(s,event(),start);assert.equal(s.players[0].xp,30);
 s=parseProgress(JSON.stringify(s))!;s=startSession(s,'fresh');s=receive(s,event('share'),start+5000);assert.equal(s.players[0].xp,30);assert.ok(s.live!.records[0].claimed.includes('attendance'));
});
test('overlapping quiz starts and invalid configurations are rejected',()=>{
 const s=openQuiz(createGame(['Mochi']),'round','q1',start,15);
 assert.equal(openQuiz(s,'second','q2',start+1000,15),s);assert.equal(openQuiz(s,'bad','missing',start+20000,15),s);assert.equal(openQuiz(s,'short','q1',start+20000,1),s);
 assert.equal(configureLive(s,{...DEFAULT_CONFIG,quiz:-1},start),s);
});
test('gift-only or rejected-answer participants cannot receive collective academic rewards',()=>{
 let s=createGame(['Mochi','Luna','Kai']),now=start;
 s=receive(s,event('gift','',{playerId:'mock-1'}),now);s=receive(s,event('comment','A',{playerId:'mock-2'}),now);now+=4000;
 for(let i=0;i<5;i++){s=receive(s,event('like','',{count:20}),now);now+=4000;}
 for(let i=0;i<10;i++){s=receive(s,event('comment','nội dung '+i),now);now+=4000;}
 for(let i=0;i<5;i++){s=receive(s,event('share'),now);now+=4000;}
 assert.equal(s.live!.school.claimed,true);assert.equal(s.players[1].xp,0);assert.equal(s.players[2].xp,0);
});
test('accepted daily events cannot repay after eviction from shared replay window',()=>{
 const e=event('like');let s=receive(createGame(['Mochi']),e,start);
 s={...s,processedIds:[]};assert.equal(receive(s,e,start+10000),s);assert.ok(parseProgress(JSON.stringify(s)));
});
