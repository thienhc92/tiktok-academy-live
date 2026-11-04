import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {SQLiteGameRepository} from '../local/sqliteRepository.ts';
import {eventKey} from '../src/events/processor.ts';
import type {NormalizedEvent} from '../src/events/types.ts';
const base:NormalizedEvent={version:1,source:'offline',roomId:'room',sessionId:'session',eventId:'one',occurredAt:100000,receivedAt:100000,viewer:{id:'90071992547409931234',nickname:'Mẫu'},kind:'comment',text:'nhaphoc'};
function temp(t:{after:(fn:()=>void)=>void}){const dir=mkdtempSync(join(tmpdir(),'academy-sqlite-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));return join(dir,'game.db');}
const child=(file:string,event:unknown,mode='')=>spawnSync(process.execPath,['tests/helpers/durable-child.ts',file,JSON.stringify(event),mode],{encoding:'utf8'});
function concurrent(file:string,event:unknown){return new Promise<void>((resolve,reject)=>{const p=spawn(process.execPath,['tests/helpers/durable-child.ts',file,JSON.stringify(event),''],{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',d=>error+=d);p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(error||String(code))));});}
test('restart preserves stable player, session, reward and snapshot sequence',t=>{
 const f=temp(t);let db=new SQLiteGameRepository(f);const receipt=db.process(base);assert.equal(receipt.sequence,1);assert.equal(receipt.rewards[0].xp,20);const snapshot=db.snapshot();db.close();
 db=new SQLiteGameRepository(f);assert.deepEqual(db.snapshot(),snapshot);assert.equal(db.player('offline:'+base.viewer.id)!.xp,20);assert.equal(db.snapshot().state.game.academy.session,snapshot.state.game.academy.session);
 assert.equal(db.process(base).duplicate,true);assert.equal(db.snapshot().sequence,1);assert.deepEqual(db.receipt(eventKey(base))!.rewards,receipt.rewards);db.close();
});
test('SIGKILL before COMMIT rolls back snapshot, reward and dedup together',t=>{
 const f=temp(t);new SQLiteGameRepository(f).close();const killed=child(f,base,'beforeCommit');assert.equal(killed.signal,'SIGKILL');
 const db=new SQLiteGameRepository(f);assert.equal(db.snapshot().sequence,0);assert.equal(db.receipt(eventKey(base)),undefined);assert.equal(db.player('offline:'+base.viewer.id),undefined);assert.equal(db.process(base).rewards[0].xp,20);db.close();
});
test('SIGKILL after COMMIT loses ack but replay cannot repay',t=>{
 const f=temp(t);new SQLiteGameRepository(f).close();const killed=child(f,base,'afterCommit');assert.equal(killed.signal,'SIGKILL');
 const db=new SQLiteGameRepository(f);assert.equal(db.snapshot().sequence,1);assert.equal(db.process(base).duplicate,true);assert.equal(db.player('offline:'+base.viewer.id)!.xp,20);db.close();
});
test('concurrent processes serialize duplicate and distinct rewards',async t=>{
 const f=temp(t);new SQLiteGameRepository(f).close();const other={...base,eventId:'two',viewer:{id:'other',nickname:'Khác'}};
 await Promise.all([concurrent(f,base),concurrent(f,base),concurrent(f,other)]);
 const db=new SQLiteGameRepository(f);assert.equal(db.snapshot().sequence,2);assert.equal(db.player('offline:'+base.viewer.id)!.xp,20);assert.equal(db.player('offline:other')!.xp,20);db.close();
});
test('cumulative likes and gift high water survive restart and stale delivery',t=>{
 const f=temp(t);let db=new SQLiteGameRepository(f);
 const like={...base,kind:'like',likes:{mode:'cumulative',scope:'viewer',counterId:'c',total:10}};
 db.process(like);db.close();db=new SQLiteGameRepository(f);
 db.process({...like,eventId:'increase',occurredAt:104000,receivedAt:104000,likes:{...like.likes,total:15}});assert.equal(db.player('offline:'+base.viewer.id)!.xp,5);
 db.process({...like,eventId:'stale',receivedAt:108000,likes:{...like.likes,total:12}});db.close();db=new SQLiteGameRepository(f);
 const gift={...base,kind:'gift',eventId:'g1',occurredAt:112000,receivedAt:112000,giftId:'f',streakId:'s',repeatCount:3,final:false};db.process(gift);db.close();db=new SQLiteGameRepository(f);
 db.process({...gift,eventId:'g2',occurredAt:116000,receivedAt:116000,final:true});db.close();db=new SQLiteGameRepository(f);
 db.process({...gift,eventId:'g3',occurredAt:120000,receivedAt:120000,final:true});assert.equal(db.player('offline:'+base.viewer.id)!.contribution,60);assert.equal(db.player('offline:'+base.viewer.id)!.xp,5);db.close();
});
test('missing identity persists observation only; malformed input changes nothing',t=>{
 const db=new SQLiteGameRepository(temp(t));assert.throws(()=>db.process({...base,viewer:{id:123}}),/Invalid/);assert.equal(db.snapshot().sequence,0);
 const unknown={...base,viewer:{id:null}};assert.equal(db.process(unknown).outcome,'anonymous');assert.equal(db.snapshot().state.game.players.length,0);assert.equal(db.process(unknown).duplicate,true);db.close();
});
test('thrown precommit fault rolls back without consuming sequence',t=>{
 const f=temp(t),db=new SQLiteGameRepository(f,point=>{if(point==='beforeCommit')throw Error('fault');});assert.throws(()=>db.process(base),/fault/);assert.equal(db.snapshot().sequence,0);db.close();
 const reopened=new SQLiteGameRepository(f);assert.equal(reopened.process(base).sequence,1);reopened.close();
});
test('snapshot/schema versions fail closed, never silently reset a database',async t=>{
 const {DatabaseSync}=await import('node:sqlite');const f=temp(t);new SQLiteGameRepository(f).close();let raw=new DatabaseSync(f);raw.exec('PRAGMA user_version=2');raw.close();assert.throws(()=>new SQLiteGameRepository(f),/Unsupported database schema/);
 raw=new DatabaseSync(f);raw.exec('PRAGMA user_version=1; DELETE FROM snapshots;');raw.close();assert.throws(()=>new SQLiteGameRepository(f),/Unsupported snapshot version/);
});
test('quiz and promotion state survive restart, late answers do not gain XP',async t=>{
 const {QUESTIONS}=await import('../src/game/progression.ts');
 const {configureThresholds,openQuiz}=await import('../src/game/engine.ts').then(async engine=>({...engine,openQuiz:(await import('../src/missions/rules.ts')).openQuiz}));
 // Seed only through an initial snapshot fixture before any event (local test setup).
 const {DatabaseSync}=await import('node:sqlite');const f=temp(t);new SQLiteGameRepository(f).close();const raw=new DatabaseSync(f);
 const {createReplay}=await import('../src/events/processor.ts');const seed=createReplay();seed.game=configureThresholds(seed.game,[0,1,2,3,4,5,6,7,8,9,10]);seed.game=openQuiz(seed.game,'quiz','q1',100000,15);seed.clock=100000;raw.prepare('UPDATE snapshots SET body=? WHERE sequence=0').run(JSON.stringify(seed));raw.close();
 let db=new SQLiteGameRepository(f);const answer={...base,text:QUESTIONS[0].answer};db.process(answer);const snapshot=db.snapshot();assert.equal(snapshot.state.game.academy.records[0].rank,3);db.close();
 db=new SQLiteGameRepository(f);assert.deepEqual(db.snapshot(),snapshot);assert.equal(db.process(answer).duplicate,true);
 db.process({...answer,eventId:'late',viewer:{id:'late'},occurredAt:116000,receivedAt:116000});assert.equal(db.player('offline:late')!.xp,0);assert.equal(db.snapshot().state.game.live!.quiz!.answers.length,1);db.close();
});
test('capacity failure rolls back without publishing a new sequence',async t=>{
 const {DatabaseSync}=await import('node:sqlite');const {createReplay}=await import('../src/events/processor.ts');
 const f=temp(t);new SQLiteGameRepository(f).close();const raw=new DatabaseSync(f),seed=createReplay();seed.seen=Array.from({length:10000},(_,i)=>'key-'+i);raw.prepare('UPDATE snapshots SET body=? WHERE sequence=0').run(JSON.stringify(seed));raw.close();
 const db=new SQLiteGameRepository(f);assert.throws(()=>db.process(base),/capacity/);assert.equal(db.snapshot().sequence,0);assert.equal(db.receipt(eventKey(base)),undefined);db.close();
});
test('pending examination and academic session recover before later promotion',async t=>{
 const {DatabaseSync}=await import('node:sqlite');const {createReplay,processEvent}=await import('../src/events/processor.ts');const {configureThresholds,startSession}=await import('../src/game/engine.ts');
 const f=temp(t);new SQLiteGameRepository(f).close();let seed=createReplay();seed.game=configureThresholds(seed.game,[0,1,2,3,4,5,6,7,8,9,10]);seed.game=startSession(seed.game,'academic-persistent');seed=processEvent(seed,base).state;
 const raw=new DatabaseSync(f);raw.prepare('UPDATE snapshots SET body=? WHERE sequence=0').run(JSON.stringify(seed));raw.close();
 let db=new SQLiteGameRepository(f);db.process({...base,eventId:'exam',text:'thi',occurredAt:104000,receivedAt:104000});db.process({...base,eventId:'a1',text:'A',occurredAt:108000,receivedAt:108000});db.close();
 db=new SQLiteGameRepository(f);assert.deepEqual(db.snapshot().state.game.live!.records[0].exam!.answers,['A']);assert.equal(db.snapshot().state.game.academy.session,'academic-persistent');
 for(const [i,answer] of ['B','C','D','A'].entries())db.process({...base,eventId:'a'+(i+2),text:answer,occurredAt:112000+i*4000,receivedAt:112000+i*4000});
 assert.equal(db.snapshot().state.game.academy.records[0].rank,4);db.close();
});
