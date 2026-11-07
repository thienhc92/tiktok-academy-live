import type {EventEmitter} from 'node:events';
import type {WebcastGotHttpConfig} from 'tiktok-live-connector';
import {TikTokLiveConnection,WebcastEvent,ControlEvent,WebcastDeserializeConfig,SignConfig} from 'tiktok-live-connector';
import {ProxyAgent} from 'proxy-agent';
import {normalize} from './normalizer.ts';
import type {UpstreamKind} from './normalizer.ts';
import type {ServerConnector} from '../src/templeLive/service.ts';
/** Unofficial, read-only public LIVE, free/community signing only. Never sends chat or cookies. */
export class TikTokConnector implements ServerConnector {
 readonly mode='LIVE';private connection:(TikTokLiveConnection & Pick<EventEmitter,'on'|'removeAllListeners'>)|null=null;private stopped=false;private agent:ProxyAgent|null=null;
 private diagnostic:(code:string)=>void;
 constructor(diagnostic:(code:string)=>void=()=>{}){this.diagnostic=diagnostic;}
 async start(username:string,sink:Parameters<ServerConnector['start']>[1]){
  if(SignConfig.apiKey||SignConfig.basePath!=='https://api.eulerstream.com')throw Error('unconfigured');
  WebcastDeserializeConfig.showBase64OnDecodeError=false;
  const agent=new ProxyAgent();this.agent=agent;
  const connection=new TikTokLiveConnection(username,{processInitialData:false,fetchRoomInfoOnConnect:true,enableExtendedGiftInfo:false,
   authenticateWs:false,useMobile:false,// SDK 2.5.0's type requires cookieJar, although its runtime always creates its own.
   webClientOptions:{agent:{http:agent,https:agent}} as unknown as WebcastGotHttpConfig,wsClientOptions:{agent}}) as TikTokLiveConnection & Pick<EventEmitter,'on'|'removeAllListeners'>;
  if(typeof connection.on!=='function')throw Error('unconfigured');
  this.connection=connection;
  const pairs:[WebcastEvent,UpstreamKind][]=[[WebcastEvent.MEMBER,'join'],[WebcastEvent.CHAT,'comment'],[WebcastEvent.LIKE,'like'],[WebcastEvent.FOLLOW,'follow'],[WebcastEvent.SHARE,'share'],[WebcastEvent.GIFT,'gift']];
  for(const [event,kind]of pairs)connection.on(event,(payload:unknown)=>{if(this.stopped)return;const normalized=normalize(kind,payload,connection.state.roomId,Date.now());if(normalized)sink.event(normalized);else this.diagnostic('payload-skipped');});
  connection.on(ControlEvent.ERROR,()=>this.diagnostic('upstream-error'));
  connection.on(ControlEvent.DISCONNECTED,()=>{if(!this.stopped)sink.disconnect('network');});
  connection.on(WebcastEvent.STREAM_END,()=>{if(!this.stopped)sink.disconnect('offline');});
  try{
   const state=await connection.connect();if(this.stopped){await connection.disconnect();throw Error('network');}
   if(!state.isConnected||!state.roomId)throw Error('network');
   return {roomId:state.roomId,sessionId:'live-'+state.roomId};
  }catch(error){
   const name=error instanceof Error?error.constructor.name:'';
   if(name==='UserOfflineError')throw Error('offline');
   if(name==='InvalidUniqueIdError')throw Error('not-found');
   if(name==='SignatureRateLimitError'||name==='PremiumFeatureError')throw Error('rate-limit');
   throw Error('network');
  }
 }
 async stop(){this.stopped=true;const connection=this.connection;this.connection=null;if(connection){await connection.disconnect().catch(()=>{});connection.removeAllListeners();connection.on(ControlEvent.ERROR,()=>{});}this.agent?.destroy();this.agent=null;}
}
