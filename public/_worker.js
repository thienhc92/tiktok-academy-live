// @ts-check
/** @param {string} error @param {number} status */
const failure=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export default {
 /**
  * @param {Request} request
  * @param {{LIVE_BACKEND_ORIGIN?:string,LIVE_GATEWAY_KEY?:string,FRONTEND_ORIGIN?:string,ASSETS:{fetch(request:Request):Promise<Response>}}} env
  */
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  const api=path.startsWith('/api/temple'),socket=path==='/socket.io'||path==='/socket.io/';
  if(!api&&!socket)return env.ASSETS.fetch(request);
  if(api&&!['/api/temple/state','/api/temple/connect','/api/temple/disconnect','/api/temple/login'].includes(path))return failure('invalid',404);
  let backend;
  try{backend=new URL(env.LIVE_BACKEND_ORIGIN??'');}catch{return failure('unconfigured',503);}
  if(backend.protocol!=='https:'||backend.username||backend.password||backend.pathname!=='/'||backend.search||backend.hash||typeof env.FRONTEND_ORIGIN!=='string'||!env.FRONTEND_ORIGIN||url.origin!==env.FRONTEND_ORIGIN||typeof env.LIVE_GATEWAY_KEY!=='string'||env.LIVE_GATEWAY_KEY.length<32)return failure('unconfigured',503);
  const origin=request.headers.get('Origin');
  if(origin&&origin!==env.FRONTEND_ORIGIN)return failure('auth',403);
  if(socket&&(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket'||origin!==env.FRONTEND_ORIGIN))return failure('auth',403);
  const expected=path==='/api/temple/login'?['GET','POST']:path==='/api/temple/state'?['GET']:['POST'];
  if(api&&!expected.includes(request.method))return failure('invalid',405);
  if(request.method==='POST'&&origin!==env.FRONTEND_ORIGIN)return failure('auth',403);
  const headers=new Headers();
  for(const key of ['Content-Type','Origin','Upgrade','Sec-WebSocket-Key','Sec-WebSocket-Version','Sec-WebSocket-Protocol','Sec-WebSocket-Extensions']){
   const value=request.headers.get(key);if(value)headers.set(key,value);
  }
  const cookie=/(?:^|;\s*)(temple_trial=[a-f0-9]{64})(?:;|$)/.exec(request.headers.get('Cookie')??'');
  if(cookie)headers.set('Cookie',cookie[1]);
  headers.set('X-Temple-Gateway',env.LIVE_GATEWAY_KEY);
  const target=new URL(path+url.search,backend);
  try{
   const response=await fetch(new Request(new Request(target,request),{headers,redirect:'manual'}));
   if(response.status===101)return response;
   const result=new Response(response.body,response);result.headers.set('Cache-Control','no-store');return result;
  }catch{return failure('network',502);}
 }
};
