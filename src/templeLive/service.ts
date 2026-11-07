import {createTempleState,processTempleEvent} from '../photo/live/processor.ts';
import type {TempleState} from '../photo/live/processor.ts';
import type {TempleRepository} from '../photo/live/repository.ts';
import type {TempleEvent} from '../photo/live/events.ts';
import {isTempleEvent} from '../photo/live/events.ts';
import {enqueueRitual} from '../photo/live/rituals.ts';
import {enqueueProgress} from '../photo/live/progress.ts';
import {cleanUsername} from './protocol.ts';
import type {LiveFrame,LiveError} from './protocol.ts';
import type {AccessVerifier} from './access.ts';
export interface ServerConnector {
    readonly mode:'LIVE'|'SIMULATION';
    start(username:string,sink:{event:(event:unknown)=>void;disconnect:(reason:LiveError)=>void}):Promise<{roomId:string;sessionId:string}>;
    stop():Promise<void>;
}
export class UnconfiguredConnector implements ServerConnector {
    readonly mode='LIVE';
    async start():Promise<{roomId:string;sessionId:string}>{throw new Error('unconfigured');}
    async stop(){}
}
const fail=(e:unknown):LiveError=>e instanceof Error&&['unconfigured','offline','not-found','network','room-mismatch','storage','rate-limit'].includes(e.message)?e.message as LiveError:'network';
/** One room, server lifetime. Hosting must supply a durable repository and approved connector. */
export class TempleLiveService {
    private frame:LiveFrame={v:1,epoch:crypto.randomUUID(),sequence:0,status:'disconnected',mode:'LIVE',username:'',error:null,snapshot:null,rituals:[],progress:[]};
    private state:TempleState|null=null;private connector:ServerConnector|null=null;
    private generation=0;private desired=false;private attempts=0;private cancel:(()=>void)|undefined;
    private events:Promise<unknown>=Promise.resolve();
    private repository:TempleRepository;private factory:()=>ServerConnector;private auth:Pick<AccessVerifier,'configured'|'verify'>;private origin:string;private now:()=>number;private handshakeMs:number;private schedule:(fn:()=>void,ms:number)=>()=>void;
    constructor(repository:TempleRepository,factory:()=>ServerConnector,auth:Pick<AccessVerifier,'configured'|'verify'>,origin:string,
        now=()=>Date.now(),schedule=(fn:()=>void,ms:number)=>{const id=setTimeout(fn,ms);return ()=>clearTimeout(id);},handshakeMs=8000){this.handshakeMs=handshakeMs;this.repository=repository;this.factory=factory;this.auth=auth;this.origin=origin;this.now=now;this.schedule=schedule;}
    snapshot():LiveFrame {
        const s=this.state,now=this.now();
        return {...this.frame,snapshot:s?{...s,receipts:[],counters:{},closed:[],meritLimits:{},game:{...s.game,notice:null}}:null,
            rituals:this.frame.rituals.filter(c=>c.expiresAt>now),progress:this.frame.progress.filter(c=>c.expiresAt>now)};
    }
    private listeners=new Set<(frame:LiveFrame)=>void>();
    subscribe(listener:(frame:LiveFrame)=>void){this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};}
    private update(value:Partial<LiveFrame>){this.frame={...this.frame,...value,sequence:this.frame.sequence+1};for(const listener of this.listeners)listener(this.snapshot());}
    private async begin(generation:number){
        this.update({status:'connecting',error:null});
        const connector=this.factory();this.connector=connector;const pending:unknown[]=[];let accepting=false;
        let cancelTimeout:(()=>void)|undefined;
        try{
            const timeout=new Promise<never>((_,reject)=>{cancelTimeout=this.schedule(()=>reject(Error('network')),this.handshakeMs);});
            const descriptor=await Promise.race([connector.start(this.frame.username,{event:e=>{if(generation!==this.generation)return;if(accepting)this.consume(e,generation);else if(pending.length<25)pending.push(e);else this.lost('invalid',generation);},disconnect:reason=>{if(generation===this.generation)this.lost(reason,generation);}}),timeout]);
            cancelTimeout?.();
            if(generation!==this.generation){await connector.stop();return;}
            if(!/^[A-Za-z0-9._:-]{1,60}$/.test(descriptor.roomId)||!/^[A-Za-z0-9._:-]{1,60}$/.test(descriptor.sessionId))throw Error('unconfigured');
            const seed={...createTempleState('LIVE',descriptor.sessionId),roomId:descriptor.roomId};
            const result=await this.repository.transact('LIVE',seed,s=>{if(s.roomId!==descriptor.roomId||s.sessionId!==descriptor.sessionId)throw Error('room-mismatch');return {state:s,outcome:'processed'};}).catch(error=>{throw Error(error instanceof Error&&error.message==='room-mismatch'?'room-mismatch':'storage');});
            if(generation!==this.generation){await connector.stop();return;}
            this.state=result.state;accepting=true;this.update({status:'connected',mode:connector.mode,error:null});
            for(const event of pending)this.consume(event,generation);
        }catch(error){if(generation===this.generation)this.lost(fail(error),generation);}finally{cancelTimeout?.();}
    }
    private consume(input:unknown,generation:number){
        this.events=this.events.then(async()=>{
            if(generation!==this.generation||this.frame.status!=='connected'||!this.state)return;
            if(!isTempleEvent(input)||input.source!=='tiktok'){this.update({error:'invalid'});return;}
            const event:TempleEvent={...input,receivedAt:this.now()};
            try{
                const result=await this.repository.transact('LIVE',this.state,s=>processTempleEvent(s,event,this.now()));
                if(generation!==this.generation)return;
                if(result.outcome==='capacity')throw Error('storage');
                this.state=result.state;this.update({error:null,logs:[...(this.frame.logs??[]).slice(-19),{id:event.eventId,kind:event.kind,nickname:event.viewer.nickname??'',at:this.now(),outcome:result.outcome}],rituals:result.cue?enqueueRitual(this.frame.rituals,result.cue,this.now()):this.frame.rituals,progress:result.progress?enqueueProgress(this.frame.progress,result.progress,this.now()):this.frame.progress});
            }catch{await this.disconnect();this.update({status:'error',error:'storage'});}
        });
    }
    private lost(reason:LiveError,generation:number){
        if(generation!==this.generation)return;
        // Invalidate the old sink before stop can deliver any more callbacks.
        const next=++this.generation;void this.connector?.stop().catch(()=>{});this.update({status:'error',error:reason});
        if(this.desired&&reason==='network'&&this.attempts<5){const delay=Math.min(30000,1000*2**this.attempts++);this.cancel=this.schedule(()=>{if(this.desired&&next===this.generation)void this.begin(next);},delay);}
    }
    async disconnect(){this.desired=false;++this.generation;this.cancel?.();this.cancel=undefined;await this.connector?.stop().catch(()=>{});this.update({status:'disconnected',error:null,rituals:[],progress:[]});}
    async fetch(request:Request){
        const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
        if(!this.auth.configured())return json({error:'unconfigured'},503);
        if(!await this.auth.verify(request,this.now()))return json({error:'auth'},401);
        const path=new URL(request.url).pathname;
        if(request.method==='GET'&&path==='/api/temple/login')return Response.redirect(new URL('/admin/tiktok',this.origin),303);
        if(request.method==='GET'&&path==='/api/temple/state')return json(this.snapshot());
        if(request.method!=='POST'||request.headers.get('Origin')!==this.origin||request.headers.get('Content-Type')!=='application/json')return json({error:'auth'},403);
        if(path==='/api/temple/disconnect'){await this.disconnect();return json(this.snapshot());}
        if(path!=='/api/temple/connect')return json({error:'invalid'},404);
        if(this.frame.status==='connecting'||this.frame.status==='connected')return json({error:'invalid'},409);
        try{
            const reader=request.body?.getReader();if(!reader)throw Error();let text='';const decoder=new TextDecoder();let size=0;
            while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();throw Error();}text+=decoder.decode(value,{stream:true});}
            const username=cleanUsername(JSON.parse(text+decoder.decode()).username);if(!username)throw Error();
            this.desired=true;this.attempts=0;this.cancel?.();this.cancel=undefined;const generation=++this.generation;
            this.update({username});await this.begin(generation);return json(this.snapshot());
        }catch{return json({error:'invalid'},400);}
    }
}
