import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {io} from 'socket.io-client';
import {normalize} from './normalizer.ts';
import {SQLiteTempleRepository} from './repository.ts';
import {TrialAuth} from './auth.ts';
import {createGateway} from './gateway.ts';
import {createTempleState,processTempleEvent} from '../src/photo/live/processor.ts';
const now=1700000000000;
const raw=(id='101')=>({common:{msgId:id,roomId:'900',createTime:String(now/1000)},user:{id:'9223372036854775807',nickname:'Phật tử'},comment:'Nam mô A Di Đà Phật',count:3,giftId:'5655',repeatCount:2,groupId:'400',repeatEnd:1,gift:{id:'5655',type:1,diamondCount:5}});
test('v3 protobuf fixtures normalize all six event types, preserving string identity and no invented IDs',()=>{
 for(const kind of ['join','comment','like','follow','share','gift'] as const){const e=normalize(kind,raw(), '900',now)!;assert.ok(e);assert.equal(e.viewer.id,'9223372036854775807');assert.equal(e.kind,kind);assert.equal(e.sessionId,'live-900');}
 assert.equal(normalize('join',{...raw(),common:{msgId:'0'}},'900',now),null);
 assert.equal(normalize('join',{...raw(),common:{msgId:'101',roomId:'901'}},'900',now),null);
 const anonymous=normalize('gift',{...raw(),user:{id:9223372036854776000,nickname:'X'}},'900',now)!;assert.equal(anonymous.viewer.id,null);
 assert.equal(normalize('gift',{...raw(),groupId:'0'},'900',now),null);
 assert.equal(normalize('gift',{...raw(),gift:undefined},'900',now),null);
});
test('real-format gift streak intermediates/final/replay survive SQLite restart and follow/share pay nothing',async()=>{
 const file=join(mkdtempSync(join(tmpdir(),'temple-trial-')),'state.sqlite');let repo=new SQLiteTempleRepository(file);
 const seed={...createTempleState('LIVE','live-900'),roomId:'900'};
 const apply=(event:unknown)=>repo.transact('LIVE',seed,s=>processTempleEvent(s,event,now));
 await apply(normalize('gift',{...raw('101'),repeatEnd:0},'900',now));
 const final=normalize('gift',raw('102'),'900',now);let r=await apply(final);assert.equal(r.state.game.contributionScore['9223372036854775807'],100);assert.equal(r.state.merit['9223372036854775807']??0,0);
 repo.close();repo=new SQLiteTempleRepository(file);r=await apply(final);assert.equal(r.outcome,'duplicate');
 await apply(normalize('gift',raw('103'),'900',now));
 for(const kind of ['follow','share'] as const){r=await apply(normalize(kind,raw('104'),'900',now));assert.equal(r.state.game.contributionScore['9223372036854775807'],100);}
 r=await apply(normalize('comment',raw('105'),'900',now));assert.equal(r.cue?.kind,'bow');assert.equal(r.state.merit['9223372036854775807'],2);repo.close();
});
test('native owner login uses HttpOnly, Origin checks, finite expiry and throttling',async()=>{
 let clock=now;const password=randomBytes(24).toString('hex'),auth=new TrialAuth(password,'http://127.0.0.1:3001',()=>clock);
 const login=(value:string,origin='http://127.0.0.1:3001')=>auth.login(new Request('http://127.0.0.1:3001/api/temple/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:value}).toString()}));
 assert.equal((await login(password,'https://evil.test')).status,403);
 const r=await login(password);assert.equal(r.status,303);assert.match(r.headers.get('Set-Cookie')!,/HttpOnly; SameSite=Strict/);const cookie=r.headers.get('Set-Cookie')!.split(';')[0];
 assert.equal(await auth.verify(new Request('http://localhost',{headers:{Cookie:cookie}})),true);clock+=7200001;assert.equal(await auth.verify(new Request('http://localhost',{headers:{Cookie:cookie}})),false);
 for(let i=0;i<5;i++)assert.equal((await login('wrong')).status,401);assert.equal((await login(password)).status,429);
});
test('HTTP/Socket.IO gateway refuses anonymous clients and never connects TikTok by itself',async()=>{
 const repository=new SQLiteTempleRepository(':memory:'),password=randomBytes(24).toString('hex');let starts=0;
 const gateway=createGateway({origin:'http://127.0.0.1:3001',password,repository,connector:()=>({mode:'LIVE',async start(){starts++;throw Error('offline');},async stop(){}})});
 await new Promise<void>(r=>gateway.http.listen(0,'127.0.0.1',r));const address=gateway.http.address();assert.ok(address&&typeof address!=='string');const url='http://127.0.0.1:'+address.port;
 try{
  assert.equal((await fetch(url+'/api/temple/state')).status,401);
  const login=await fetch(url+'/api/temple/login',{method:'POST',redirect:'manual',headers:{Origin:'http://127.0.0.1:3001','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});const cookie=login.headers.get('Set-Cookie')!.split(';')[0];
  const client=io(url,{transports:['websocket'],reconnection:false,extraHeaders:{Origin:'http://127.0.0.1:3001',Cookie:cookie}});
  const frame=await new Promise<{status:string;mode:string}>((resolve,reject)=>{client.once('temple:state',resolve);client.once('connect_error',reject);});assert.equal(frame.status,'disconnected');assert.equal(frame.mode,'LIVE');assert.equal(starts,0);client.disconnect();
  const response=await fetch(url+'/api/temple/connect',{method:'POST',headers:{Origin:'http://127.0.0.1:3001',Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({username:'example'})});assert.equal((await response.json()).error,'offline');assert.equal(starts,1);
 }finally{await gateway.close();repository.close();}
});
test('hosted gateway requires edge secret for login/API and WSS handshake, keeping health non-sensitive',async()=>{
 const repository=new SQLiteTempleRepository(':memory:'),password=randomBytes(24).toString('hex'),key=randomBytes(32).toString('hex');
 const origin='https://tiktok-academy-live.pages.dev';
 const gateway=createGateway({origin,password,gatewayKey:key,repository,connector:()=>{throw Error('must not connect');}});
 await new Promise<void>(r=>gateway.http.listen(0,'127.0.0.1',r));const address=gateway.http.address();assert.ok(address&&typeof address!=='string');const url='http://127.0.0.1:'+address.port;
 try{
  assert.equal((await fetch(url+'/api/temple/login')).status,403);
  assert.equal((await fetch(url+'/api/temple/state',{headers:{'X-Temple-Gateway':'forged'}})).status,403);
  assert.deepEqual(await (await fetch(url+'/healthz')).json(),{service:'temple-live',status:'process-up'});
  const login=await fetch(url+'/api/temple/login',{method:'POST',redirect:'manual',headers:{Origin:origin,'X-Temple-Gateway':key,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});assert.equal(login.status,303);assert.match(login.headers.get('Set-Cookie')!,/Secure/);const cookie=login.headers.get('Set-Cookie')!.split(';')[0];
  const bad=io(url,{transports:['websocket'],reconnection:false,extraHeaders:{Origin:origin,Cookie:cookie}});
  await new Promise<void>((resolve,reject)=>{bad.once('connect_error',()=>resolve());bad.once('connect',()=>reject(Error('unexpected connection')));});bad.disconnect();
  const good=io(url,{transports:['websocket'],reconnection:false,extraHeaders:{Origin:origin,Cookie:cookie,'X-Temple-Gateway':key}});
  const frame=await new Promise<{status:string}>((resolve,reject)=>{good.once('temple:state',resolve);good.once('connect_error',reject);});assert.equal(frame.status,'disconnected');good.disconnect();
 }finally{await gateway.close();repository.close();}
});
