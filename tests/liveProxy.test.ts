import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../public/_worker.js';
const frontend='https://tiktok-academy-live.pages.dev',backend='https://backend.example.test',key='k'.repeat(40);
const assets={fetch:async()=>new Response('static')};
const env={FRONTEND_ORIGIN:frontend,LIVE_BACKEND_ORIGIN:backend,LIVE_GATEWAY_KEY:key,ASSETS:assets};
test('Pages proxy leaves assets untouched and API/socket fail closed without secrets',async()=>{
 assert.equal(await (await worker.fetch(new Request(frontend+'/'),{ASSETS:assets})).text(),'static');
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/state'),{ASSETS:assets})).status,503);
 for(const url of ['http://backend.example.test','https://user:password@backend.example.test','https://backend.example.test/path'])assert.equal((await worker.fetch(new Request(frontend+'/api/temple/state'),{...env,LIVE_BACKEND_ORIGIN:url})).status,503);
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/state'),{...env,LIVE_GATEWAY_KEY:'short'})).status,503);
});
test('cross-origin, invalid methods and forged proxy headers cannot reach upstream',async()=>{
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/connect',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'}),env)).status,403);
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/connect',{method:'POST',body:'{}'}),env)).status,403);
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/state',{method:'DELETE'}),env)).status,405);
 assert.equal((await worker.fetch(new Request(frontend+'/api/temple/events',{method:'POST'}),env)).status,404);
 assert.equal((await worker.fetch(new Request(frontend+'/socket.io/?EIO=4&transport=websocket',{headers:{Upgrade:'websocket',Origin:'https://evil.test'}}),env)).status,403);
});
test('same-origin HTTPS preserves native login/cookie while only server injects gateway key',async()=>{
 const original=globalThis.fetch;let seen:Request|undefined;
 globalThis.fetch=async input=>{seen=input as Request;return new Response(null,{status:303,headers:{Location:'/admin/tiktok','Set-Cookie':'temple_trial='+('a'.repeat(64))+'; HttpOnly; SameSite=Strict; Secure; Path=/'}});};
 try{
  const r=await worker.fetch(new Request(frontend+'/api/temple/login',{method:'POST',headers:{Origin:frontend,'Content-Type':'application/x-www-form-urlencoded',Cookie:'other=private; temple_trial='+('b'.repeat(64)),'X-Temple-Gateway':'forged','Authorization':'Bearer must-not-forward'},body:'password=test-only'}),env);
  assert.equal(r.status,303);assert.equal(r.headers.get('Location'),'/admin/tiktok');assert.match(r.headers.get('Set-Cookie')!,/HttpOnly/);
  assert.equal(seen!.url,backend+'/api/temple/login');assert.equal(seen!.headers.get('X-Temple-Gateway'),key);assert.equal(seen!.headers.get('Authorization'),null);assert.equal(seen!.headers.get('Cookie'),'temple_trial='+('b'.repeat(64)));assert.equal(await seen!.text(),'password=test-only');assert.equal(r.headers.get('Cache-Control'),'no-store');
 }finally{globalThis.fetch=original;}
});
test('WSS upgrade response passes through and upstream failure exposes no secret',async()=>{
 const original=globalThis.fetch;const upgraded={status:101} as Response;let seen:Request|undefined;
 try{
  globalThis.fetch=async input=>{seen=input as Request;return upgraded;};
  const request=new Request(frontend+'/socket.io/?EIO=4&transport=websocket',{headers:{Upgrade:'websocket',Origin:frontend}});
  assert.equal(await worker.fetch(request,env),upgraded);assert.equal(new URL(seen!.url).origin,backend);assert.equal(seen!.headers.get('Origin'),frontend);assert.equal(seen!.headers.get('X-Temple-Gateway'),key);
  globalThis.fetch=async()=>{throw Error(key);};const response=await worker.fetch(new Request(frontend+'/api/temple/state'),env);assert.equal(response.status,502);assert.ok(!(await response.text()).includes(key));
 }finally{globalThis.fetch=original;}
});
