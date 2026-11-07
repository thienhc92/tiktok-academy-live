import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {t} from '../i18n/vi';
import {PhotoLive} from '../photo/PhotoLive';
import {SEAT_IMAGE} from '../photo/seatMap';
import {liveRequest,liveError,mergeFrame} from './client';
import {cleanUsername} from './protocol';
import type {LiveFrame} from './protocol';
import '../photo/style.css';
import './style.css';
const initial:LiveFrame={v:1,epoch:'pending',sequence:0,status:'disconnected',mode:'LIVE',username:'',error:null,snapshot:null,rituals:[],progress:[]};
function App(){
    const broadcast=location.pathname==='/broadcast/tiktok';
    const [frame,setFrame]=useState(initial),[busy,setBusy]=useState(false);
    const [username,setUsername]=useState(()=>{try{return cleanUsername(localStorage.getItem('temple-tiktok-username'))??'';}catch{return '';}});
    const mounted=useRef(false);
    const accept=(value:LiveFrame)=>setFrame(old=>mergeFrame(old,value));
    useEffect(()=>{
        mounted.current=true;let active=true;let timer:ReturnType<typeof setTimeout>,attempts=0;const controller=new AbortController();
        const poll=async()=>{
            try{const value=await liveRequest('state',undefined,AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]));if(!active)return;accept(value);attempts=0;timer=setTimeout(poll,1000);}
            catch(error){if(!active)return;const reason=liveError(error);setFrame(old=>({...old,status:'error',error:reason}));if(reason==='network'&&attempts<5)timer=setTimeout(poll,1000*2**attempts++);}
        };
        void poll();return ()=>{active=false;mounted.current=false;controller.abort();clearTimeout(timer);};
    },[]);
    async function command(action:'connect'|'disconnect'){
        const name=cleanUsername(username);if(action==='connect'&&!name)return;
        setBusy(true);if(action==='connect'){try{localStorage.setItem('temple-tiktok-username',name!);}catch{}setFrame(old=>({...old,status:'connecting',error:null}));}
        try{const value=await liveRequest(action,action==='connect'?{username:name}:{});if(mounted.current)accept(value);}
        catch(error){if(mounted.current)setFrame(old=>({...old,status:'error',error:liveError(error)}));}
        finally{if(mounted.current)setBusy(false);}
    }
    const status=<p role="status" className="tl-status">{t('TikTok status '+frame.status)}{frame.mode==='SIMULATION'&&' · '+t('TikTok server simulation')}{frame.error&&<span>{t('TikTok error '+frame.error)}</span>}</p>;
    if(broadcast)return <main className="photo-app photo-live-active"><section className="photo-stage photo-live-stage"><img src={SEAT_IMAGE.src} alt={t('Photo official description')}/><PhotoLive photoAspect={SEAT_IMAGE.width/SEAT_IMAGE.height} operator={false} onControls={()=>{}} remote={frame}/><div className="tl-broadcast-status">{status}</div></section></main>;
    return <main className="tl-admin"><h1>{t('TikTok Admin title')}</h1><p>{t('TikTok Admin help')}</p>{status}
        {(frame.error==='auth'||frame.error==='unconfigured')&&<a href="/api/temple/login">{t('TikTok sign in')}</a>}
        <form onSubmit={event=>{event.preventDefault();void command('connect');}}><label>{t('TikTok username')}<input autoComplete="off" maxLength={25} value={username} onChange={e=>setUsername(e.target.value)} disabled={busy||frame.status==='connected'} placeholder="@username"/></label><div><button disabled={busy||!cleanUsername(username)||frame.status==='connected'||frame.status==='connecting'}>{t('TikTok connect')}</button><button type="button" disabled={busy||!['connecting','connected','error'].includes(frame.status)} onClick={()=>void command('disconnect')}>{t('TikTok disconnect')}</button></div></form>
        {frame.status==='connected'&&<a className="tl-open" href="/broadcast/tiktok" target="_blank" rel="noopener noreferrer">{t('TikTok Web Broadcast')}</a>}
        <p className="tl-warning">{t('TikTok gate help')}</p><a href="/">{t('TikTok back to MOCK')}</a>
    </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
