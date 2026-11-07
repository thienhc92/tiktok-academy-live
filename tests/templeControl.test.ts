import {readFrame,mergeFrame} from '../src/templeLive/client.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AccessVerifier} from '../src/templeLive/access.ts';
import {TempleLiveService,UnconfiguredConnector} from '../src/templeLive/service.ts';
import type {ServerConnector} from '../src/templeLive/service.ts';
import {MemoryTempleRepository} from '../src/photo/live/repository.ts';
import {createTempleState} from '../src/photo/live/processor.ts';
import {mockTempleEvent} from '../src/photo/live/sources.ts';
import {cleanUsername} from '../src/templeLive/protocol.ts';
const origin='https://example.test',now=1000000;
const auth={configured:()=>true,verify:async(r:Request)=>r.headers.get('X-Test-Auth')==='test'};
const req=(path:string,value?:unknown,headers:Record<string,string>={})=>new Request(origin+'/api/temple/'+path,{method:value===undefined?'GET':'POST',headers:{'X-Test-Auth':'test',...(value===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...headers},...(value===undefined?{}:{body:JSON.stringify(value)})});
class Simulated implements ServerConnector {
 readonly mode='SIMULATION';stops=0;sink?:Parameters<ServerConnector['start']>[1];
 async start(_name:string,sink:Parameters<ServerConnector['start']>[1]){this.sink=sink;return {roomId:'live-room',sessionId:'live-session'};}
 async stop(){this.stops++;}
}
const event=(id:string,kind:Parameters<typeof mockTempleEvent>[0],coins=1)=>({...mockTempleEvent(kind,{id:'9223372036854775807',nickname:'Khách thật mẫu'}, {roomId:'live-room',sessionId:'live-session'},id,now,kind==='wish'?'Nam mô A Di Đà Phật':undefined,coins),source:'tiktok'});
const drain=()=>new Promise<void>(r=>setImmediate(r));
test('username normalization is strict, accepts @ and rejects URLs, injection and overlength',()=>{
 assert.equal(cleanUsername(' @phat.tam_live '),'phat.tam_live');for(const v of ['',null,'https://tiktok.com/@test','x','x.','<script>','a'.repeat(25),'../bad'])assert.equal(cleanUsername(v),null);
});
test('Access verifies RS256 issuer, audience, expiry and signature, never trusts a forged header',async()=>{
 const issuer='https://example.cloudflareaccess.com',aud='test-audience-00000001';
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test'};let requests=0;
 const verifier=new AccessVerifier(issuer,aud,async()=>{requests++;return Response.json({keys:[jwk]});});
 const encode=(o:unknown)=>Buffer.from(JSON.stringify(o)).toString('base64url');
 async function jwt(claim:object,algorithm='RS256'){const input=encode({alg:algorithm,kid:'test'})+'.'+encode(claim);const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(input));return input+'.'+Buffer.from(signature).toString('base64url');}
 const good={iss:issuer,aud:[aud],iat:now/1000-1,exp:now/1000+60};
 const r=(token:string)=>new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':token}});
 assert.equal(await verifier.verify(r(await jwt(good)),now),true);
 assert.equal(await verifier.verify(r(await jwt({...good,aud:['other']})),now),false);
 assert.equal(await verifier.verify(r(await jwt({...good,iss:'https://evil.test'})),now),false);
 assert.equal(await verifier.verify(r(await jwt({...good,exp:now/1000})),now),false);
 assert.equal(await verifier.verify(r(await jwt(good,'none')),now),false);
 const token=await jwt(good);assert.equal(await verifier.verify(r(token.slice(0,-8)+'AAAAAAAA'),now),false);
 assert.equal(await verifier.verify(new Request(origin),now),false);assert.equal(new AccessVerifier('https://evil.test',aud).configured(),false);assert.equal(requests,1);
});
test('service fails closed without auth, checks CSRF and has no browser reward endpoint',async()=>{
 const service=new TempleLiveService(new MemoryTempleRepository(),()=>new UnconfiguredConnector(),auth,origin,()=>now);
 assert.equal((await service.fetch(req('state',undefined,{'X-Test-Auth':''}))).status,401);
 assert.equal((await service.fetch(req('connect',{username:'abc'},{Origin:'https://evil.test'}))).status,403);
 assert.equal((await service.fetch(req('events',[event('fake','gift',30)]))).status,404);
 const closed=new TempleLiveService(new MemoryTempleRepository(),()=>new UnconfiguredConnector(),{...auth,configured:()=>false},origin);
 assert.equal((await closed.fetch(req('state'))).status,503);
 const response=await service.fetch(req('connect',{username:'example'}));assert.equal(response.status,200);assert.equal((await response.json()).error,'unconfigured');assert.equal(service.snapshot().status,'error');
});
test('Admin connect → server events → read-only broadcast → disconnect preserves identity and rewards',async()=>{
 const repository=new MemoryTempleRepository(),connector=new Simulated();
 const service=new TempleLiveService(repository,()=>connector,auth,origin,()=>now);
 const connected=await (await service.fetch(req('connect',{username:'@example'}))).json();assert.equal(connected.status,'connected');assert.equal(connected.mode,'SIMULATION');assert.equal(connected.snapshot.game.visitors.length,0);
 for(const id of ['a','b'])connector.sink!.event(event(id,'gift',10));await drain();
 const first=service.snapshot();assert.equal(first.snapshot!.game.contributionScore['9223372036854775807'],200);assert.equal(first.progress[0].rankLevel,2);
 connector.sink!.event(event('a','gift',10));connector.sink!.event(event('prayer','wish'));await drain();
 const repeated=service.snapshot();assert.equal(repeated.snapshot!.game.contributionScore['9223372036854775807'],200);assert.equal(repeated.snapshot!.merit['9223372036854775807'],2);assert.equal(repeated.rituals[0].kind,'bow');assert.equal(repeated.snapshot!.receipts.length,0);
 await service.fetch(req('disconnect',{}));connector.sink!.event(event('after-close','gift',30));await drain();assert.equal(service.snapshot().status,'disconnected');assert.equal(service.snapshot().snapshot!.game.contributionScore['9223372036854775807'],200);
 const restart=new TempleLiveService(repository,()=>new Simulated(),auth,origin,()=>now);await restart.fetch(req('connect',{username:'example'}));assert.notEqual(restart.snapshot().epoch,first.epoch);assert.equal(restart.snapshot().snapshot!.game.contributionScore['9223372036854775807'],200);
});
test('gift streak final pays once across reconnect and out-of-order delivery',async()=>{
 const connector=new Simulated(),service=new TempleLiveService(new MemoryTempleRepository(),()=>connector,auth,origin,()=>now);
 await service.fetch(req('connect',{username:'example'}));const gift=event('partial','gift',5);
 connector.sink!.event({...gift,final:false,repeatCount:3,streakId:'streak'});connector.sink!.event({...gift,eventId:'final',final:true,repeatCount:3,streakId:'streak'});connector.sink!.event({...gift,eventId:'late',final:true,repeatCount:3,streakId:'streak'});await drain();
 assert.equal(service.snapshot().snapshot!.game.contributionScore['9223372036854775807'],150);
 await service.disconnect();
});
test('reconnect happens on server, stops after five retries and ignores late callbacks',async()=>{
 const jobs=new Map<number,()=>void>();let id=0,starts=0;
 const connector:ServerConnector={mode:'SIMULATION',start:async()=>{starts++;throw Error('network');},stop:async()=>{}};
 const service=new TempleLiveService(new MemoryTempleRepository(),()=>connector,auth,origin,()=>now,(fn)=>{const key=++id;jobs.set(key,fn);return ()=>{jobs.delete(key);};});
 await service.fetch(req('connect',{username:'example'}));
 for(let i=0;i<5;i++){assert.equal(jobs.size,1);const [key,fn]=[...jobs][0];jobs.delete(key);fn();await drain();}
 assert.equal(starts,6);assert.equal(jobs.size,0);assert.equal(service.snapshot().status,'error');
 await service.disconnect();assert.equal(service.snapshot().status,'disconnected');
});
test('offline and missing accounts are explicit errors, never a connected simulation',async()=>{
 for(const code of ['offline','not-found']){
  const connector:ServerConnector={mode:'LIVE',start:async()=>{throw Error(code);},stop:async()=>{}};
  const service=new TempleLiveService(new MemoryTempleRepository(),()=>connector,auth,origin,()=>now);
  await service.fetch(req('connect',{username:'example'}));assert.equal(service.snapshot().status,'error');assert.equal(service.snapshot().error,code);
 }
});
test('disconnect cancels a pending handshake and timeout cannot later report connected',async()=>{
 const jobs=new Map<number,()=>void>();let n=0,finish!:(value:{roomId:string;sessionId:string})=>void;
 const connector:ServerConnector={mode:'SIMULATION',start:()=>new Promise(resolve=>{finish=resolve;}),stop:async()=>{}};
 const service=new TempleLiveService(new MemoryTempleRepository(),()=>connector,auth,origin,()=>now,(fn)=>{const id=++n;jobs.set(id,fn);return ()=>{jobs.delete(id);};});
 const pending=service.fetch(req('connect',{username:'example'}));await drain();assert.equal(service.snapshot().status,'connecting');
 await service.disconnect();finish({roomId:'live-room',sessionId:'live-session'});await pending;assert.equal(service.snapshot().status,'disconnected');assert.equal(jobs.size,0);
});

test('client rejects malformed frames and resyncs epochs without replaying old effects',()=>{
 const service=new TempleLiveService(new MemoryTempleRepository(),()=>new UnconfiguredConnector(),auth,origin,()=>now);
 const frame=readFrame(service.snapshot());assert.equal(frame.status,'disconnected');
 for(const bad of [{...frame,status:'pretend-connected'},{...frame,sequence:-1},{...frame,progress:[{}]}])assert.throws(()=>readFrame(bad));
 const cue={id:'old',userId:'viewer',meritDelta:1,contributionDelta:1,createdAt:now,expiresAt:now+2400};
 const next={...frame,sequence:5,progress:[cue]};
 assert.equal(mergeFrame({...frame,epoch:'old'},next).progress.length,0);
 assert.equal(mergeFrame(next,{...frame,sequence:4}),next);
 assert.deepEqual(mergeFrame({...next,progress:[]},next).progress,[]);
 assert.equal(mergeFrame(next,{...next,sequence:6}).progress.length,1);
});

test('pre-handshake event overflow fails closed instead of silently losing rewards',async()=>{
 const connector:ServerConnector={mode:'SIMULATION',start:async(_name,sink)=>{for(let i=0;i<26;i++)sink.event(event('early-'+i,'gift',1));return {roomId:'live-room',sessionId:'live-session'};},stop:async()=>{}};
 const service=new TempleLiveService(new MemoryTempleRepository(),()=>connector,auth,origin,()=>now);
 await service.fetch(req('connect',{username:'example'}));assert.equal(service.snapshot().status,'error');assert.equal(service.snapshot().error,'invalid');assert.equal(service.snapshot().snapshot,null);
});
