import { useState } from 'react';
import { t } from '../i18n/vi';
import type { useRealtime } from './useRealtime';
import { QUESTIONS, RANKS, OFFICES, recordFor, eligibility } from '../game/progression';
import './style.css';
const labels = { offline: 'Realtime offline', connecting: 'Realtime connecting', connected: 'Realtime connected', reconnecting: 'Realtime reconnecting', error: 'Realtime error' };
export function RealtimePanel({ connection, active }: {
    connection: ReturnType<typeof useRealtime>;
    active: boolean;
}) {
    const [url, setUrl] = useState(''), [token, setToken] = useState(''), [feedback, setFeedback] = useState(''), [question, setQuestion] = useState<string>(QUESTIONS[0].id), [busy, setBusy] = useState(false),[playerId,setPlayerId]=useState(''),[office,setOffice]=useState<string>(OFFICES[0].id);
    const game=connection.snapshot?.game,player=game?.players.find(p=>p.id===playerId)??game?.players[0],record=game&&player?recordFor(game.academy,player.id):null,status=game&&player?eligibility(game.academy,player.id,player.xp):null;
    async function command(value: unknown) {
        setBusy(true);
        try {
            await connection.command(value);
            setFeedback(t('Realtime command accepted'));
        }
        catch {
            setFeedback(t('Realtime command failed'));
        }
        finally {
            setBusy(false);
        }
    }
    async function backup() {
        setBusy(true);
        try {
            const value = await connection.backup();
            if (!value)
                throw Error('offline');
            const url = URL.createObjectURL(new Blob([JSON.stringify(value)], { type: 'application/json' })), a = document.createElement('a');
            a.href = url;
            a.download = 'tiktok-academy-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            setFeedback(t('Realtime backup saved'));
        }
        catch {
            setFeedback(t('Realtime command failed'));
        }
        finally {
            setBusy(false);
        }
    }
    return <section className="realtime-panel" hidden={!active} aria-labelledby="realtime-title"><h2 id="realtime-title">{t('Realtime title')}</h2><p>{t('Realtime help')}</p><p role="status">{t(labels[connection.status])} · {t('Realtime sequence')}: {connection.snapshot?.sequence ?? '—'}</p>
 {!connection.enabled ? <form onSubmit={event => {
        event.preventDefault();
        setFeedback(connection.connect(url, token) ? '' : t('Realtime invalid URL'));
        setToken('');
    }}><label>{t('Realtime endpoint')}<input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" autoComplete="off"/></label><label>{t('Realtime token')}<input required type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" minLength={32}/></label><button>{t('Realtime connect')}</button></form> : <><p>{t('Realtime authority')}</p><button onClick={() => {
        connection.disconnect();
        setFeedback('');
    }}>{t('Realtime local')}</button><div className="realtime-commands"><label>{t('Quiz question')}<select value={question} onChange={e => setQuestion(e.target.value)}>{QUESTIONS.map(q => <option value={q.id} key={q.id}>{q.prompt}</option>)}</select></label><button disabled={busy || connection.status !== 'connected'} onClick={() => void command({ type: 'quiz.open', question, seconds: 30 })}>{t('Realtime open quiz')}</button></div><button disabled={busy || connection.status !== 'connected'} onClick={() => void backup()}>{t("Realtime backup")}</button><small>{t('Realtime permissions')}</small>
 {game&&<details><summary>{t("Realtime progression")}</summary><label>{t("Realtime player")}<select value={player?.id??''} onChange={e=>setPlayerId(e.target.value)}>{game.players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>{player&&record&&<><p>{player.nickname} · {RANKS[record.rank]} · {player.xp} XP · {player.contribution} {t("contribution")}</p><p>{status?.reason}</p><button disabled={busy||connection.status!=='connected'||!status?.eligible} onClick={()=>void command({type:'promote',playerId:player.id,target:record.rank+1})}>{t("Promote & celebrate")}</button><h3>{t("Promotion history")}</h3><ol>{record.history.map(h=><li key={h.to}>{RANKS[h.to]} · {new Date(h.at).toLocaleString('vi-VN')}</li>)}</ol></>}
 <label>{t("Realtime office")}<select value={office} onChange={e=>setOffice(e.target.value)}>{OFFICES.map(o=><option key={o.id} value={o.id}>{o.title} · {game.academy.appointments.filter(a=>a.office===o.id).length}/{o.capacity}</option>)}</select></label><button disabled={busy||connection.status!=='connected'} onClick={()=>void command({type:'office.appoint',office})}>{t("Realtime appoint")}</button><ul>{game.academy.appointments.map(a=><li key={a.playerId}>{game.players.find(p=>p.id===a.playerId)?.nickname} · {OFFICES.find(o=>o.id===a.office)?.title}</li>)}</ul>
 <button disabled={busy||connection.status!=='connected'} onClick={()=>{if(window.confirm(t("Start a new mock session? Current offices expire; academic progress stays.")))void command({type:'session.start'});}}>{t("Start new mock session")}</button></details>}
 </>}
 {feedback && <p role="status">{feedback}</p>}</section>;
}
