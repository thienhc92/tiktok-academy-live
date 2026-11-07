import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../i18n/vi';
import { toggleFullscreen } from '../broadcast/fullscreen';
import './style.css';
import { PhotoLive } from './PhotoLive';
import { SEAT_IMAGE } from './seatMap';

const BACKGROUND = SEAT_IMAGE.src;
function PhotoApp() {
    const [photoAspect, setPhotoAspect] = useState(SEAT_IMAGE.width / SEAT_IMAGE.height);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [portrait, setPortrait] = useState(false);
    const [live, setLive] = useState(true);
    const [controls, setControls] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(''), 4500);
        return () => clearTimeout(timer);
    }, [message]);
    useEffect(() => { document.title = t(live ? 'Photo LIVE title' : 'Photo title'); }, [live]);
    async function fullscreen() {
        setMessage(await toggleFullscreen({
            active: !!document.fullscreenElement,
            enter: document.documentElement.requestFullscreen ? () => document.documentElement.requestFullscreen() : undefined,
            exit: document.exitFullscreen ? () => document.exitFullscreen() : undefined,
        }));
    }
    return <main className={`photo-app ${portrait ? 'photo-portrait' : ''} ${live && loaded ? 'photo-live-active' : ''}`}>
        <section className={`photo-stage ${live && loaded ? 'photo-live-stage' : ''}`} aria-label={t('Photo stage')}>
            <img src={BACKGROUND} alt={t('Photo official description')} onLoad={event => {
                setPhotoAspect(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight);
                setLoaded(true); setFailed(false);
            }} onError={() => { setLoaded(false); setFailed(true); }} />
            {failed && <p className="photo-feedback" role="alert">{t('Photo official missing')}</p>}
            {live && loaded && <PhotoLive photoAspect={photoAspect} operator={controls} onControls={() => setControls(v => !v)} />}
        </section>
        {!controls && message && <p className="photo-feedback" role="status">{message}</p>}
        {controls ? <aside className="photo-controls" aria-label={t('Photo controls')}>
            <div className="photo-toolbar">
                <button aria-pressed={live} onClick={() => setLive(v => !v)}>{t('Photo LIVE toggle')}</button>
                <button aria-pressed={portrait} onClick={() => setPortrait(v => !v)}>{t('Photo portrait')}</button>
                <button onClick={() => void fullscreen()}>{t('Temple fullscreen')}</button>
                <button onClick={() => setControls(false)}>{t('Photo hide')}</button>
            </div>
            <small>{t('Photo original help')}</small>
            {message && <p role="status">{message}</p>}
        </aside> : !(live && loaded) && <button className="photo-show" aria-label={t('Photo show')} onClick={() => setControls(true)}>☰</button>}
    </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><PhotoApp /></React.StrictMode>);
