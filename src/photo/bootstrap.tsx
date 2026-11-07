import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { t } from '../i18n/vi';
import { toggleFullscreen } from '../broadcast/fullscreen';
import { readPhoto, savePhoto, validatePhoto } from './storage';
import './style.css';
import { PhotoLive } from './PhotoLive';

function PhotoApp() {
    const [photo, setPhoto] = useState<Blob | null>(null);
    const [url, setUrl] = useState('');
    const [photoAspect, setPhotoAspect] = useState(3 / 4);
    const [cover, setCover] = useState(true);
    const [portrait, setPortrait] = useState(false);
    const [live, setLive] = useState(true);
    const [controls, setControls] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const input = useRef<HTMLInputElement>(null);
    const selected = useRef(false);
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(''), 4500);
        return () => clearTimeout(timer);
    }, [message]);
    useEffect(() => { document.title = t(live ? 'Photo LIVE title' : 'Photo title'); }, [live]);
    useEffect(() => {
        let active = true;
        void readPhoto().then(saved => {
            if (active && !selected.current && saved) setPhoto(saved);
        }).catch(() => { if (active) setMessage(t('Photo storage unavailable')); });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!photo) return;
        const next = URL.createObjectURL(photo);
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [photo]);
    async function choose(file?: File) {
        if (!file || busy) return;
        selected.current = true;
        setBusy(true); setMessage('');
        let temporary = '';
        try {
            if (!await validatePhoto(file)) throw new Error('invalid');
            temporary = URL.createObjectURL(file);
            const image = new Image(); image.src = temporary;
            await image.decode();
            if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 32000000) throw new Error('invalid');
            setPhoto(file);
            try { await savePhoto(file); setMessage(t('Photo saved')); }
            catch { setMessage(t('Photo storage unavailable')); }
        } catch { setMessage(t('Photo invalid')); }
        finally {
            if (temporary) URL.revokeObjectURL(temporary);
            setBusy(false);
            if (input.current) input.current.value = '';
        }
    }
    async function fullscreen() {
        setMessage(await toggleFullscreen({
            active: !!document.fullscreenElement,
            enter: document.documentElement.requestFullscreen ? () => document.documentElement.requestFullscreen() : undefined,
            exit: document.exitFullscreen ? () => document.exitFullscreen() : undefined,
        }));
    }
    return <main className={`photo-app ${portrait ? 'photo-portrait' : ''} ${live && url ? 'photo-live-active' : ''}`}>
        <section className={`photo-stage ${cover ? 'photo-cover' : ''} ${live && url ? 'photo-live-stage' : ''}`} aria-label={t('Photo stage')}>
            {url ? <img src={url} alt={t('Photo description')} onLoad={event => setPhotoAspect(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)} onError={() => setMessage(t('Photo invalid'))} /> :
                <div className="photo-empty"><h1>{t('Temple title')}</h1><p>{t('Photo choose help')}</p><button disabled={busy} onClick={() => input.current?.click()}>{t('Photo choose')}</button><small>{t('Photo privacy')}</small></div>}
            {live && url && <PhotoLive photoAspect={photoAspect} cover={cover} operator={controls} onControls={() => setControls(v => !v)} />}
        </section>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t('Photo choose')} hidden onChange={event => void choose(event.target.files?.[0])} />
        {!controls && message && <p className="photo-feedback" role="status">{message}</p>}
        {controls ? <aside className="photo-controls" aria-label={t('Photo controls')}>
            <div className="photo-toolbar">
                <button disabled={busy} onClick={() => input.current?.click()}>{t(busy ? 'Photo loading' : 'Photo choose')}</button>
                <button aria-pressed={live} onClick={() => { setLive(v => !v); }}>{t('Photo LIVE toggle')}</button>
                <button aria-pressed={cover} onClick={() => setCover(v => !v)}>{t('Photo cover')}</button>
                <button aria-pressed={portrait} onClick={() => setPortrait(v => !v)}>{t('Photo portrait')}</button>
                <button onClick={() => void fullscreen()}>{t('Temple fullscreen')}</button>
                <button onClick={() => setControls(false)}>{t('Photo hide')}</button>
            </div>
            {url && <small>{t(cover ? 'Photo crop help' : 'Photo original help')}</small>}
            {message && <p role="status">{message}</p>}
        </aside> : !(live && url) && <button className="photo-show" aria-label={t('Photo show')} onClick={() => setControls(true)}>☰</button>}
    </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><PhotoApp /></React.StrictMode>);
