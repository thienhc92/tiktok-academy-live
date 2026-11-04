import {test} from 'node:test';
import assert from 'node:assert/strict';
import {t,vi} from '../src/i18n/vi.ts';
import {RANKS,QUESTIONS,OFFICES} from '../src/game/progression.ts';
import {createGame,answerQuiz,parseProgress} from '../src/game/engine.ts';
test('Vietnamese required terminology and complete academic labels',()=>{
 assert.equal(RANKS.length,11);assert.equal(RANKS[0],'Học sinh');assert.equal(RANKS[4],'Trợ giảng');assert.equal(RANKS[10],'Hiệu trưởng');
 assert.equal(t('Admin Mode'),'Chế độ quản trị');assert.equal(t('Broadcast Mode'),'Chế độ phát sóng');assert.equal(t('QA simulation lab'),'Khu mô phỏng kiểm thử');
 assert.ok(t('Promotion exam · 80% required from Mentor').startsWith('Kỳ thi thăng cấp'));
 assert.ok(Object.values(vi).every(v=>v.trim().length>0));
 assert.equal(t('Need {0} more XP',25),'Cần thêm 25 XP');
});
test('translation preserves saved numeric ranks, stable IDs, nicknames and quiz scoring',()=>{
 const game=createGame(['Mochi']);const before=JSON.stringify(game);const roundtrip=parseProgress(before)!;assert.deepEqual(roundtrip,game);
 assert.equal(QUESTIONS[0].id,'q1');assert.equal(QUESTIONS[0].answer,'A');assert.equal(OFFICES[0].id,'class-leader');
 assert.equal(answerQuiz(game,'mock-0','q1','A').players[0].xp,25);assert.equal(game.players[0].nickname,'Mochi');assert.equal(JSON.stringify(game),before);
});

test('every literal UI translation key has a centralized Vietnamese entry',async()=>{
 const {readdirSync,readFileSync}=await import('node:fs');
 function scan(dir:string){for(const file of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+file.name;if(file.isDirectory()){if(file.name!=='i18n')scan(path);}else if(/\.tsx?$/.test(file.name)){const source=readFileSync(path,'utf8');for(const match of source.matchAll(/\bt\(("(?:[^"\\]|\\.)*")/g)){const key=JSON.parse(match[1]);assert.ok(Object.prototype.hasOwnProperty.call(vi,key),path+': '+key);}}}}
 scan('src');assert.equal(t('TikTok Academy'),'TikTok Academy');assert.equal(t('XP'),'XP');
});
