import {createHash,timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:http';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {Server} from 'socket.io';
import {TempleLiveService} from '../src/templeLive/service.ts';
import type {ServerConnector} from '../src/templeLive/service.ts';
import type {TempleRepository} from '../src/photo/live/repository.ts';
import {TrialAuth} from './auth.ts';
export function createGateway(options:{origin:string;password:string;repository:TempleRepository;connector:()=>ServerConnector;gatewayKey?:string}){
 if(options.gatewayKey!==undefined&&options.gatewayKey.length<32)throw Error('Gateway secret must be at least 32 characters');
 const gatewayAllowed=(value:string|undefined)=>!options.gatewayKey||!!value&&timingSafeEqual(createHash('sha256').update(value).digest(),createHash('sha256').update(options.gatewayKey).digest());
 const parsed=new URL(options.origin);if(parsed.origin!==options.origin||!(parsed.protocol==='https:'||(parsed.protocol==='http:'&&['127.0.0.1','localhost'].includes(parsed.hostname))))throw Error('HTTPS origin required');
 const auth=new TrialAuth(options.password,options.origin),service=new TempleLiveService(options.repository,options.connector,auth,options.origin,undefined,undefined,30000);
 const frame=()=>({...service.snapshot(),transport:'socket.io' as const});
 async function request(req:IncomingMessage){
  let bytes=0;const chunks:Buffer[]=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>2048)throw Error('large');chunks.push(chunk);}
  const headers=new Headers();for(const [key,value]of Object.entries(req.headers))if(typeof value==='string')headers.set(key,value);
  return new Request(options.origin+(req.url??'/'),{method:req.method,headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})});
 }
 const http=createServer(async(req:IncomingMessage,res:ServerResponse)=>{
  try{
   if(req.method==='GET'&&req.url==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({service:'temple-live',status:'process-up'}));return;}
   if(!gatewayAllowed(typeof req.headers['x-temple-gateway']==='string'?req.headers['x-temple-gateway']:undefined)){res.writeHead(403,{'Cache-Control':'no-store'});res.end();return;}
   const r=await request(req);let response:Response;
   if(new URL(r.url).pathname==='/api/temple/login')response=await auth.login(r);
   else {response=await service.fetch(r);if(response.ok&&response.headers.get('Content-Type')?.includes('application/json')){const body=await response.json();response=Response.json(body?.v===1?{...body,transport:'socket.io'}:body,{status:response.status,headers:{'Cache-Control':'no-store'}});}}
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(400,{'Cache-Control':'no-store'});res.end();}
 });
 const io=new Server(http,{serveClient:false,maxHttpBufferSize:1024,transports:['websocket'],allowRequest:(req,done)=>{void (async()=>{const r=new Request(options.origin,{headers:{Cookie:req.headers.cookie??''}});done(null,gatewayAllowed(typeof req.headers['x-temple-gateway']==='string'?req.headers['x-temple-gateway']:undefined)&&req.headers.origin===options.origin&&await auth.verify(r));})();}});
 io.on('connection',socket=>{socket.emit('temple:state',frame());socket.onAny(()=>socket.disconnect(true));});
 let pending:ReturnType<typeof setTimeout>|undefined;
 const unsubscribe=service.subscribe(()=>{if(!pending)pending=setTimeout(()=>{pending=undefined;void (async()=>{for(const socket of io.sockets.sockets.values()){const r=new Request(options.origin,{headers:{Cookie:socket.request.headers.cookie??''}});if(await auth.verify(r))socket.emit('temple:state',frame());else socket.disconnect(true);}})();},200);});
 return {http,io,service,async close(){unsubscribe();if(pending)clearTimeout(pending);await service.disconnect();await new Promise<void>(resolve=>io.close(()=>resolve()));}};
}
