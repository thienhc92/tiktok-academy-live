import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';
import { Download, Expand, Flower2, RotateCcw, Sun, Wind, Menu, X, ChevronLeft, ChevronRight, Focus } from 'lucide-react';
import { ACESFilmicToneMapping } from 'three';
import { t } from '../i18n/vi';
import { toggleFullscreen } from '../broadcast/fullscreen';
import { Sanctuary } from './Sanctuary';
import type { ShrineView } from './views';
import './style.css';
class SceneBoundary extends React.Component<{
    children: React.ReactNode;
}, {
    error: boolean;
}> {
    state = { error: false };
    static getDerivedStateFromError() {
        return { error: true };
    }
    render() {
        return this.state.error ? <div className="shrine-fallback"><Flower2 /><h2>{t('Shrine unavailable')}</h2><p>{t('Shrine retry help')}</p><button onClick={() => window.location.reload()}>{t('Shrine reload')}</button><a href="?experience=live">{t('Shrine live view')}</a></div> : this.props.children;
    }
}
function Loading() {
    const { progress } = useProgress();
    return <Html center><div className="shrine-loading"><Flower2 /><span>{t('Shrine loading')}</span><small>{Math.round(progress)}%</small></div></Html>;
}
export function ShrineApp() {
    const [view, setView] = useState<ShrineView>('front'), [reset, setReset] = useState(0), [detail, setDetail] = useState(false), [sunbeams, setSunbeams] = useState(true), [smoke, setSmoke] = useState(true), [menu, setMenu] = useState(false), [visible, setVisible] = useState(!document.hidden), [message, setMessage] = useState(''), [portrait, setPortrait] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        document.title = t('Shrine title');
        const change = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', change);
        return () => document.removeEventListener('visibilitychange', change);
    }, []);
    useEffect(() => {
        if (!message)
            return;
        const id = setTimeout(() => setMessage(''), 5000);
        return () => clearTimeout(id);
    }, [message]);
    async function full() {
        setMessage(await toggleFullscreen({ active: !!document.fullscreenElement, enter: document.documentElement.requestFullscreen ? () => document.documentElement.requestFullscreen() : undefined, exit: document.exitFullscreen ? () => document.exitFullscreen() : undefined }));
    }
    return <main className={`shrine-app ${portrait ? 'shrine-portrait' : ''}`} ref={root}>
 <header className="shrine-topbar"><a href="/" className="shrine-brand"><Flower2 /><span>{t('Temple title')}<small>{t('Shrine subtitle')}</small></span></a><div className="shrine-top-actions"><a className="shrine-download" href="/temple3d/sanctuary.glb" download="chua-online-3d.glb"><Download size={15}/><span>{t('Shrine download')}</span></a><button onClick={() => void full()} aria-label={t('Temple fullscreen')}><Expand size={18}/></button><button onClick={() => setMenu(v => !v)} aria-expanded={menu} aria-label={t('Shrine settings')}>{menu ? <X size={18}/> : <Menu size={18}/>}</button></div></header>
 <div className="shrine-canvas"><SceneBoundary><Canvas frameloop={visible ? 'demand' : 'never'} dpr={detail ? [1, 1.5] : 1} shadows={detail} camera={{ position: [0, 3.2, 11.2], fov: 42, near: .1, far: 100 }} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
    }} fallback={<div className="shrine-fallback">{t('Shrine unavailable')}</div>}><Suspense fallback={<Loading />}><Sanctuary view={view} reset={reset} detail={detail} sunbeams={sunbeams} smoke={smoke}/></Suspense></Canvas></SceneBoundary></div>
 <div className="shrine-caption"><span>{t('Shrine scene label')}</span><h1>{t('Shrine scene title')}</h1><p>{t('Shrine scene description')}</p></div>
 <nav className="shrine-view-controls" aria-label={t('Shrine views')}><button aria-pressed={view === 'left'} onClick={() => setView('left')}><ChevronLeft size={16}/>{t('Shrine left')}</button><button aria-pressed={view === 'front'} onClick={() => {
        setView('front');
        setReset(r => r + 1);
    }}><RotateCcw size={15}/>{t('Shrine front')}</button><button aria-pressed={view === 'right'} onClick={() => setView('right')}>{t('Shrine right')}<ChevronRight size={16}/></button><button aria-pressed={view === 'close'} onClick={() => setView('close')}><Focus size={16}/>{t('Shrine close')}</button></nav>
 <p className="shrine-gesture">{t('Shrine gesture')}</p>
 {menu && <aside className="shrine-settings"><h2>{t('Shrine settings')}</h2><label><span><Sun size={16}/>{t('Shrine sunlight')}</span><input type="checkbox" checked={sunbeams} onChange={e => setSunbeams(e.target.checked)}/></label><label><span><Wind size={16}/>{t('Shrine incense')}</span><input type="checkbox" checked={smoke} onChange={e => setSmoke(e.target.checked)}/></label><label><span>{t('Shrine detail')}</span><input type="checkbox" checked={detail} onChange={e => setDetail(e.target.checked)}/></label><label><span>{t('Shrine portrait')}</span><input type="checkbox" checked={portrait} onChange={e => setPortrait(e.target.checked)}/></label><p>{t('Shrine performance help')}</p><a href="?experience=live">{t('Shrine live view')}</a></aside>}
 {message && <p className="shrine-status" role="status">{message}</p>}
 </main>;
}
