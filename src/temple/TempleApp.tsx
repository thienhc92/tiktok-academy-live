import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Flower2, Maximize2, Pause, Play, Send, Volume2, VolumeX, X } from 'lucide-react';
import { t } from '../i18n/vi';
import { toggleFullscreen } from '../broadcast/fullscreen';
import { LiveOverlay } from './LiveOverlay';
import { TempleScene } from './Scene';
import { BLESSING_KEYS, TEMPLE_NOTICES_MS, TEMPLE_PEOPLE } from './model';
import './style.css';
type Action = 'incense' | 'flower' | 'wish' | 'bell';
export function TempleApp() {
    const [selected, setSelected] = useState(TEMPLE_PEOPLE[0].id), [card, setCard] = useState(0), [notice, setNotice] = useState(''), [noticeId, setNoticeId] = useState(0), [playing, setPlaying] = useState(false), [sound, setSound] = useState(false), [settings, setSettings] = useState(false), [wishOpen, setWishOpen] = useState(false), [message, setMessage] = useState(''), [wishes, setWishes] = useState<{
        id: number;
        name: string;
        text: string;
    }[]>([]), [counts, setCounts] = useState({ incense: 604, flower: 560, bell: 180 }), [reaction, setReaction] = useState<Action | null>(null);
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
    return <main className="temple-app"><div className="temple-reference-frame" ref={stage} aria-label={t('Replica demo experience')}>
 <section className="temple-stage" aria-label={t('Temple scene')}><div className="temple-altar" role="img" aria-label={t('Temple altar description')}/><TempleScene selected={selected} onSelect={setSelected}/></section>
 <LiveOverlay person={currentPerson} card={card} counts={counts} wishes={wishes} onAction={interact} onCard={() => {
        setCard(c => (c + 1) % BLESSING_KEYS.length);
        announce(t('Temple new card'), 'wish');
    }} onSettings={() => setSettings(true)} onWish={() => setWishOpen(true)} onNotice={() => announce(t('Replica simulation notice'), 'wish')}/>
 {notice && <div key={noticeId} className={`temple-notice notice-${reaction}`} role="status"><Flower2 size={17}/><span>{notice}</span></div>}
 {reaction === 'flower' && <div key={'petals' + noticeId} className="temple-petals" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} style={{ left: `${15 + i * 10}%`, animationDelay: `${i * .08}s` }}>🌸</span>)}</div>}
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
            }}>{sound ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>{t(sound ? 'Temple sound on' : 'Temple sound off')}</span></button><button className="temple-setting-row" onClick={() => void fullscreen()}><Maximize2 size={17}/>{t('Temple fullscreen')}</button><button className="temple-setting-row" onClick={() => interact('bell')}><Bell size={17}/>{t('Temple bell')}</button><p className="temple-sheet-note">{t('Temple simulation note')}</p></section></div>}
 </div></main>;
}
