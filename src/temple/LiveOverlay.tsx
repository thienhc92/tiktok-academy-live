import { useState } from 'react';
import { BatteryCharging, Wifi, X, Gift, Heart, MoreHorizontal, Smile, Gamepad2 } from 'lucide-react';
import { t } from '../i18n/vi';
import { BLESSING_KEYS, FORTUNE_NUMBERS, TEMPLE_PEOPLE } from './model';
type Action = 'incense' | 'flower' | 'wish' | 'bell';
export function LiveOverlay({ person, card, counts, wishes, onAction, onCard, onSettings, onWish, onNotice }: {
    person: typeof TEMPLE_PEOPLE[number];
    card: number;
    counts: {
        incense: number;
        flower: number;
        bell: number;
    };
    wishes: {
        id: number;
        name: string;
        text: string;
    }[];
    onAction: (action: Action) => void;
    onCard: () => void;
    onSettings: () => void;
    onWish: () => void;
    onNotice: () => void;
}) {
    const [following, setFollowing] = useState(false), [likes, setLikes] = useState(386);
    return <>
 <div className="live-motto" aria-hidden="true">{t('Replica motto')}</div>
 <div className="live-statusbar" aria-hidden="true"><span>19:55&nbsp; {t('Replica date')}</span><span>◉&nbsp; <Wifi /> 18% <BatteryCharging /></span></div>
 <header className="live-header"><div className="live-channel"><span className="live-channel-avatar"/><span><b>{t('Temple title')}</b><small>♥ 23.6K</small></span><button className="live-follow" aria-pressed={following} onClick={() => setFollowing(v => !v)}>{t(following ? 'Replica following' : 'Replica follow')}</button></div><div className="live-audience"><i>🌸</i><i>10+</i><span>160</span></div><button className="live-close" aria-label={t('Replica mock close')} onClick={onNotice}><X /></button></header>
 <span className="replica-simulation">{t('Replica simulation')}</span>
 <div className="live-rank"><Gamepad2 />{t('Replica game ranking')}</div>
 <div className="live-rooms"><span>{t('Replica room')}</span><span>{t('Replica journey')} 🪷</span></div>
 <div className="temple-hanging-copy"><span>{t('Temple hanging 1')}</span><span>{t('Temple hanging 2')}</span><span>{t('Temple hanging 3')}</span></div>
 <div className="temple-welcome"><b>{t('Replica welcome 1')}</b><b>{t('Replica welcome 2')}</b><b>{t('Replica welcome 3')}</b></div>
 <aside className="live-gift-menu" aria-label={t('Replica simulated gifts')}>
 {[['🌹', String(counts.incense), 'Replica incense gift', 'incense'], ['🧿', String(counts.flower), 'Replica fortune gift', 'card'], ['🦋', '180', 'Replica relationship gift', 'wish'], ['🍑', '90', 'Replica peace gift', 'wish'], ['🦋', '40', 'Replica good fortune gift', 'wish']].map(([icon, number, label, action]) => <button key={label} onClick={() => action === 'card' ? onCard() : onAction(action as Action)}><span><em>{icon}</em><small>{number}</small></span><b>{t(label)}</b></button>)}
 </aside>
 <section className="temple-blessing" aria-label={t('Replica fortune card')}><div className="temple-incense" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ transform: `rotate(${(i - 3) * 3}deg)`, height: `${74 + i % 3 * 5}%` }}/>)}<span>籤</span></div><div className="temple-blessing-body"><span className="temple-eyebrow">{t('Replica fortune card')}</span><h2>{person.name}</h2><div className="fortune-card-name"><b>{t('Replica fortune number', FORTUNE_NUMBERS[card], t(BLESSING_KEYS[card] + ' title'))}</b><span>{t('Replica medium auspicious')}</span></div><p>{t(BLESSING_KEYS[card])}</p></div></section>
 <div className="replica-prayer-bubble">{t('Replica prayer')}</div>
 <div className="live-floating-gift"><span className="chat-avatar">B</span><div><b>Bao Chau…</b><small>{t('Replica sent rose')}</small></div><span>🌹</span><em>×1</em></div>
 <div className="live-chat" aria-live="polite"><div className="chat-message"><span className="chat-avatar grey">✦</span><p><small>{t('Replica chat name')}</small><b>{t('Replica chat wish')}</b></p></div><div className="chat-joined"><span>✋</span><p>minfin91294 {t('Replica joined')}</p></div><div className="chat-host"><span className="live-channel-avatar"/><p><span>{t('Temple title')} <small>{t('Replica host')}</small></span><b>{t('Replica host invitation')}</b></p></div>{wishes.slice(-1).map(wish => <div className="chat-new-wish" key={wish.id}><b>{wish.name}</b><span>{wish.text}</span></div>)}</div>
 <button className="live-game-switch" onClick={onSettings}><Gamepad2 /><b>LIVE</b></button><button className="live-event-bag" onClick={onNotice} aria-label={t('Replica mock rewards')}><Gift /></button>
 <div className="live-rose-announcement"><span>🔷₁₂</span><b>Bao Chau…</b> 🦋 {t('Replica rose message')} 🌹 × 1</div>
 <footer className="temple-bottom"><div className="temple-bottom-heading">🪷 <span>{t('Replica altar dedication')}</span> 🪷</div><div className="temple-action-row"><button onClick={() => onAction('incense')}><svg className="offering-icon incense-action" viewBox="0 0 44 48" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M8 34h28l-5 10H13ZM4 44h36M10 34 7 3m10 31L16 1m8 33V0m7 34 2-31m4 31 4-29"/></svg><small>1 COIN</small><b>{t('Replica incense action')}</b></button><button onClick={() => onAction('flower')}><span className="offering-icon">🌷</span><small>1 COIN</small><b>{t('Temple flowers')}</b></button><button onClick={() => onAction('flower')}><span className="offering-icon">🪷</span><small>10+</small><b>{t('Replica lotus action')}</b></button><button onClick={onCard}><span className="offering-icon">🎋</span><small>1 COIN</small><b>{t('Replica draw fortune')}</b></button></div></footer>
 <aside className="live-contributions"><h3>{t('Replica sincerity')}</h3>{[['phong suy…', 540], ['Ying', 330], ['thuận…', 200]].map(([name, score], i) => <div key={name}><i>{i + 1}</i><span>{name}</span><b>{score}</b></div>)}<small>{t('Replica sample counts')}</small></aside>
 <div className="live-input-bar"><button className="live-comment-input" onClick={onWish}>{t('Replica input')}</button><button onClick={onWish} aria-label={t('Temple share wish')}><Smile /></button><span className="live-gift-strip" aria-hidden="true">🦋🌷👑🌹</span><button className="live-gift-button" onClick={() => onAction('flower')} aria-label={t('Replica send mock gift')}><Gift /></button><button className="live-heart-button" onClick={() => setLikes(v => v + 1)} aria-label={t('Replica mock like')}><Heart /><small>{likes}</small></button><button onClick={onSettings} aria-label={t('Temple controls')}><MoreHorizontal /></button></div>
 </>;
}
