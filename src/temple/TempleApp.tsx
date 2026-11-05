import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Flower2, Heart, Maximize2, Pause, Play, Send, Settings2, Users, Volume2, VolumeX, X, Flame, ArrowUpRight, Leaf } from 'lucide-react';
import { t } from '../i18n/vi';
import { toggleFullscreen } from '../broadcast/fullscreen';
import { TempleScene } from './Scene';
import { BLESSING_KEYS, TEMPLE_NOTICES_MS, TEMPLE_PEOPLE } from './model';
import './style.css';
type Action = 'incense' | 'flower' | 'wish' | 'bell';
const actionKeys: Record<Action, string> = { incense: 'Temple incense', flower: 'Temple flowers', wish: 'Temple wish', bell: 'Temple bell' };
export function TempleApp() {
    const [selected, setSelected] = useState(TEMPLE_PEOPLE[0].id), [card, setCard] = useState(0), [notice, setNotice] = useState(''), [noticeId, setNoticeId] = useState(0), [playing, setPlaying] = useState(false), [sound, setSound] = useState(false), [settings, setSettings] = useState(false), [wishOpen, setWishOpen] = useState(false), [message, setMessage] = useState(''), [wishes, setWishes] = useState([{ id: 0, name: 'An Nhiên', text: t('Temple initial wish') }]), [counts, setCounts] = useState({ incense: 128, flower: 86, bell: 24 }), [reaction, setReaction] = useState<Action | null>(null);
    const audio = useRef<AudioContext | null>(null), nextId = useRef(1), stage = useRef<HTMLDivElement>(null), currentPerson = TEMPLE_PEOPLE.find(p => p.id === selected)!;
    useEffect(() => {
        document.title = t('Temple title');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#211810');
        return () => {
            void audio.current?.close();
        };
    }, []);
    useEffect(() => {
        if (!notice)
            return;
        const timer = setTimeout(() => {
            setNotice('');
            setReaction(null);
        }, TEMPLE_NOTICES_MS);
        return () => clearTimeout(timer);
    }, [notice, noticeId]);
    useEffect(() => {
        if (!wishOpen && !settings)
            return;
        const previous = document.activeElement as HTMLElement | null;
        const sheet = stage.current?.querySelector<HTMLElement>('.temple-sheet');
        sheet?.querySelector<HTMLElement>('textarea,button')?.focus();
        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setWishOpen(false);
                setSettings(false);
            }
            if (event.key === 'Tab' && sheet) {
                const items = Array.from(sheet.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,select'));
                const first = items[0], last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                }
                else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };
        document.addEventListener('keydown', keydown);
        return () => {
            document.removeEventListener('keydown', keydown);
            previous?.focus();
        };
    }, [wishOpen, settings]);
    function announce(text: string, kind: Action) {
        setNotice(text);
        setNoticeId(n => n + 1);
        setReaction(kind);
    }
    function ring() {
        if (!sound)
            return;
        const ctx = audio.current ?? new AudioContext();
        audio.current = ctx;
        void ctx.resume().then(() => {
            for (const [frequency, volume] of [[440, .045], [880, .012]]) {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + 1.8);
                osc.start();
                osc.stop(ctx.currentTime + 1.8);
            }
        }).catch(() => setSound(false));
    }
    function interact(kind: Action, id = selected) {
        const person = TEMPLE_PEOPLE.find(p => p.id === id);
        if (!person)
            return;
        if (kind === 'wish') {
            setWishOpen(true);
            return;
        }
        setCounts(c => ({ ...c, [kind]: c[kind] + 1 }));
        announce(t('Temple notice ' + kind, person.name), kind);
        ring();
    }
    useEffect(() => {
        if (!playing)
            return;
        let index = 0;
        const timer = setInterval(() => {
            if (document.hidden)
                return;
            const person = TEMPLE_PEOPLE[index % TEMPLE_PEOPLE.length];
            interact(index % 3 === 0 ? 'incense' : 'flower', person.id);
            index++;
        }, 7000);
        return () => clearInterval(timer);
    }, [playing, sound]);
    async function fullscreen() {
        const target = document.documentElement;
        const feedback = await toggleFullscreen({ active: !!document.fullscreenElement, enter: target.requestFullscreen ? () => target.requestFullscreen() : undefined, exit: document.exitFullscreen ? () => document.exitFullscreen() : undefined });
        if (feedback)
            announce(t('Temple fullscreen fallback'), 'wish');
    }
    function sendWish() {
        const text = message.trim();
        if (!text)
            return;
        setWishes(rows => [...rows.slice(-3), { id: nextId.current++, name: currentPerson.name, text }]);
        setMessage('');
        setWishOpen(false);
        announce(t('Temple wish sent', currentPerson.name), 'wish');
    }
    return <main className="temple-app">
 <aside className="temple-sidebar"><a className="temple-wordmark" href="/" aria-label={t('Temple title')}><Flower2 size={30}/><span>{t('Temple title')}<small>{t('Temple subtitle')}</small></span></a><div className="temple-side-copy"><span className="temple-eyebrow">{t('Temple quiet corner')}</span><h1>{t('Temple side headline 1')}<br /><em>{t('Temple side headline 2')}</em></h1><p>{t('Temple side description')}</p><div className="temple-side-divider"/><span className="temple-side-flower">✷</span><p className="temple-side-quote">{t('Temple side quote')}</p><small>{t('Temple invitation')}</small></div><div className="temple-side-bottom"><span className="temple-status-dot"/>{t('Temple mock experience')}<p>{t('Temple no connection')}</p></div></aside>
 <section className="temple-stage" ref={stage} aria-label={t('Temple scene')}>
 <div className="temple-altar" role="img" aria-label={t('Temple altar description')}/><div className="temple-floor"/><div className="temple-vignette"/>
 <header className="temple-header"><div className="temple-brand-seal"><Flower2 size={23}/></div><div><strong>{t('Temple title')}</strong><span><i />{t('Temple peaceful space')}</span></div><div className="temple-viewers"><Users size={13}/>{TEMPLE_PEOPLE.length}</div><button className="temple-icon" onClick={() => void fullscreen()} aria-label={t('Temple fullscreen')}><Maximize2 size={17}/></button></header>
 <div className="temple-hanging-copy"><span>{t('Temple hanging 1')}</span><em>{t('Temple hanging 2')}</em><span>{t('Temple hanging 3')}</span><small>✦</small></div>
 <div className="temple-welcome"><span>{t('Temple welcome')}</span><p>{t('Temple welcome description')}</p></div>
 <div className="temple-dust" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${8 + i * 7}%`, animationDelay: `${-i * 1.3}s`, animationDuration: `${10 + i % 4 * 2}s` }}/>)}</div>
 <section className="temple-blessing" aria-label={t('Temple card')}><div className="temple-incense" aria-hidden="true"><i /><i /><i /><span>✦</span></div><div className="temple-blessing-body"><span className="temple-eyebrow">{t('Temple card')} <b>0{card + 1}</b></span><h2>{t(BLESSING_KEYS[card] + ' title')}</h2><p>{t(BLESSING_KEYS[card])}</p></div><button onClick={() => {
        setCard(c => (c + 1) % BLESSING_KEYS.length);
        announce(t('Temple new card'), 'wish');
    }} aria-label={t('Temple another card')}><ArrowUpRight size={18}/></button></section>
 <div className="temple-congregation"><TempleScene selected={selected} onSelect={setSelected}/></div>
 {notice && <div key={noticeId} className={`temple-notice notice-${reaction}`} role="status"><Flower2 size={17}/><span>{notice}</span></div>}
 {reaction === 'flower' && <div key={'petals' + noticeId} className="temple-petals" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} style={{ left: `${15 + i * 10}%`, animationDelay: `${i * .08}s` }}>❀</span>)}</div>}
 <div className="temple-wish-stream" aria-live="polite">{wishes.slice(-2).map(wish => <div key={wish.id}><span className="temple-wish-avatar">{wish.name[0]}</span><p><b>{wish.name}</b><span>{wish.text}</span></p><Flower2 size={13}/></div>)}</div>
 <footer className="temple-bottom"><div className="temple-bottom-heading"><span><Leaf size={12}/>{t('Temple invitation')}</span><button onClick={() => setSettings(true)} aria-label={t('Temple controls')}><Settings2 size={15}/></button></div><div className="temple-action-row"><button onClick={() => interact('incense')}><Flame /><span>{t(actionKeys.incense)}</span><small>{counts.incense}</small></button><button onClick={() => interact('flower')}><Flower2 /><span>{t(actionKeys.flower)}</span><small>{counts.flower}</small></button><button onClick={() => interact('wish')}><Heart /><span>{t(actionKeys.wish)}</span><small>{t('Temple write wish')}</small></button><button onClick={() => interact('bell')}><Bell /><span>{t(actionKeys.bell)}</span><small>{counts.bell}</small></button></div><p className="temple-disclaimer">{t('Temple disclaimer')}</p></footer>
 {wishOpen && <div className="temple-scrim" onClick={() => setWishOpen(false)}><section className="temple-sheet" role="dialog" aria-modal="true" aria-labelledby="temple-wish-title" onClick={e => e.stopPropagation()}><button className="temple-close" aria-label={t('Temple close')} onClick={() => setWishOpen(false)}><X size={19}/></button><Flower2 size={30}/><h2 id="temple-wish-title">{t('Temple share wish')}</h2><p>{t('Temple wish help')}</p><form onSubmit={e => {
        e.preventDefault();
        sendWish();
    }}><label htmlFor="temple-wish-input">{t('Temple your wish')}</label><textarea autoFocus id="temple-wish-input" maxLength={160} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('Temple wish placeholder')}/><button className="temple-primary" disabled={!message.trim()}><Send size={15}/>{t('Temple send wish')}</button></form></section></div>}
 {settings && <div className="temple-scrim" onClick={() => setSettings(false)}><section className="temple-sheet" role="dialog" aria-modal="true" aria-labelledby="temple-settings-title" onClick={e => e.stopPropagation()}><button className="temple-close" aria-label={t('Temple close')} onClick={() => setSettings(false)}><X size={19}/></button><span className="temple-eyebrow">{t('Temple simulation only')}</span><h2 id="temple-settings-title">{t('Temple controls')}</h2><p>{t('Temple controls help')}</p><label>{t('Temple mock person')}<select value={selected} onChange={e => setSelected(e.target.value)}>{TEMPLE_PEOPLE.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="temple-setting-row" onClick={() => setPlaying(p => !p)}>{playing ? <Pause size={17}/> : <Play size={17}/>}<span>{t(playing ? 'Temple pause simulation' : 'Temple start simulation')}</span><ChevronDown size={13}/></button><button className="temple-setting-row" onClick={() => {
        const next = !sound;
        setSound(next);
        if (next) {
            const ctx = audio.current ?? new AudioContext();
            audio.current = ctx;
            void ctx.resume().catch(() => setSound(false));
        }
    }}>{sound ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>{t(sound ? 'Temple sound on' : 'Temple sound off')}</span></button><p className="temple-sheet-note">{t('Temple simulation note')}</p></section></div>}
 </section>
 <aside className="temple-right"><span className="temple-eyebrow">{t('Temple today')}</span><h2>{t('Temple right headline')}</h2><div className="temple-stat"><Flame size={21}/><span>{t('Temple incense moment')}<b>{counts.incense}</b></span></div><div className="temple-stat"><Flower2 size={21}/><span>{t('Temple flowers moment')}<b>{counts.flower}</b></span></div><div className="temple-stat"><Bell size={21}/><span>{t('Temple bell moment')}<b>{counts.bell}</b></span></div><div className="temple-side-divider"/><p>{t('Temple right note')}</p><button onClick={() => setSettings(true)}><Settings2 size={16}/>{t('Temple controls')}</button><div className="temple-right-bottom"><Flower2 size={40}/><span>{t('Temple breathe')}</span><small>{t('Temple mindfulness')}</small></div></aside>
 </main>;
}
