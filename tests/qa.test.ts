import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox, simulate, examAnswers, previewRank } from '../src/qa/simulation.ts';
import { createGame } from '../src/game/engine.ts';
import { recordFor } from '../src/game/progression.ts';
import type { Sandbox } from '../src/qa/simulation.ts';
const roster=['Mochi','Luna','Kai','Alex','Sunny'];
function graduate(state:Sandbox,id:string,rank:number){
 state=simulate(state,{type:'xp',playerId:id,amount:10000});
 for(let target=1;target<=rank;target++){
  if(target>=4){state=simulate(state,{type:'session',id:`${id}-${target}`});state=simulate(state,{type:'exam',playerId:id,answers:examAnswers(5)});}
  state=simulate(state,{type:'promote',playerId:id,target,at:target*100});
 }
 return state;
}
test('QA starts independently and cannot mutate regular state or another sandbox',()=>{
 const regular=createGame(roster),snapshot=JSON.stringify(regular),a=createSandbox(roster),b=createSandbox(roster);
 const changed=simulate(a,{type:'xp',playerId:'mock-1',amount:500});
 assert.equal(changed.game.players[1].xp,500);assert.equal(a.game.players[1].xp,0);
 assert.equal(b.game.players[1].xp,0);assert.equal(JSON.stringify(regular),snapshot);
 assert.equal(simulate(regular as unknown as Sandbox,{type:'xp',playerId:'mock-0',amount:100}),regular);
});
test('QA XP requires bounded positive integer and does not award contribution or rank',()=>{
 const a=createSandbox(roster);
 for(const amount of [-1,0,1.5,NaN,Infinity,'100',1000001])assert.equal(simulate(a,{type:'xp',playerId:'mock-0',amount}),a);
 assert.equal(simulate(a,{type:'xp',playerId:'missing',amount:10}),a);
 const b=simulate(a,{type:'xp',playerId:'mock-0',amount:10000});
 assert.equal(b.game.players[0].contribution,0);assert.equal(recordFor(b.game.academy,'mock-0').rank,0);
});
test('QA promotion cannot bypass XP, skip a rank or replay a target',()=>{
 let a=createSandbox(roster);
 assert.equal(simulate(a,{type:'promote',playerId:'mock-0',target:1,at:1}),a);
 a=simulate(a,{type:'xp',playerId:'mock-0',amount:10000});
 assert.equal(simulate(a,{type:'promote',playerId:'mock-0',target:4,at:1}),a);
 a=simulate(a,{type:'promote',playerId:'mock-0',target:1,at:1});
 assert.equal(simulate(a,{type:'promote',playerId:'mock-0',target:1,at:1}),a);
});
test('QA examination presets use real grading, failure/retry limits and promotion gates',()=>{
 let a=graduate(createSandbox(roster),'mock-0',3);
 assert.equal(simulate(a,{type:'promote',playerId:'mock-0',target:4,at:1}),a);
 a=simulate(a,{type:'exam',playerId:'mock-0',answers:examAnswers(3)});
 assert.equal(recordFor(a.game.academy,'mock-0').exams[0].score,60);
 assert.equal(simulate(a,{type:'exam',playerId:'mock-0',answers:examAnswers(5)}),a);
 a=simulate(a,{type:'session',id:'retry'});a=simulate(a,{type:'exam',playerId:'mock-0',answers:examAnswers(4)});
 a=simulate(a,{type:'promote',playerId:'mock-0',target:4,at:500});assert.equal(recordFor(a.game.academy,'mock-0').rank,4);
});
test('QA appointment filling preserves rank and capacity restrictions',()=>{
 let a=createSandbox(roster);assert.equal(simulate(a,{type:'appoint',office:'principal'}),a);
 for(const player of a.game.players)a=graduate(a,player.id,5);
 a=simulate(a,{type:'appoint',office:'class-leader'});assert.equal(a.game.academy.appointments.length,4);
 assert.equal(simulate(a,{type:'appoint',office:'class-leader'}),a);
 assert.equal(new Set(a.game.academy.appointments.map(p=>p.playerId)).size,4);
});
test('preview computes visual rank without granting eligibility, XP or a promotion',()=>{
 const a=createSandbox(roster),before=JSON.stringify(a);assert.equal(previewRank(a,'mock-0'),1);assert.equal(JSON.stringify(a),before);
 const principal=graduate(a,'mock-0',10);assert.equal(previewRank(principal,'mock-0'),10);
});
test('reset replaces only QA data and does not retain mutated sessions or student progress',()=>{
 const previous=graduate(createSandbox(roster),'mock-0',5),snapshot=JSON.stringify(previous);
 const reset=createSandbox(roster);assert.equal(reset.game.players[0].xp,0);assert.deepEqual(reset.game.academy.records,[]);
 assert.deepEqual(reset.game.academy.appointments,[]);assert.equal(JSON.stringify(previous),snapshot);
});
