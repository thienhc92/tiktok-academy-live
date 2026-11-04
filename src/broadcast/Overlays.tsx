import { t } from '../i18n/vi';
import type { Player } from '../game/engine';
import { communityGoal } from './model';
import type { Notice } from './model';

const titles = { join: t("Joined the courtyard"), like: t("Sent some love"), gift: t("Sent a star"), promotion: t("Promotion preview · no rank awarded") };
const icons = { join: '✦', like: '♥', gift: '🎁', promotion: '🎓' };
export function Notifications({ notices }: { notices: Notice[] }) {
  return <div className="broadcast-notices" aria-live="polite" aria-atomic="false">
    {notices.filter(n => n.kind !== 'promotion').map(n => <div key={n.id} className={`broadcast-notice notice-${n.kind}`}><span>{icons[n.kind]}</span><div><b>{n.nickname}</b><small>{titles[n.kind]}</small></div></div>)}
  </div>;
}
export function BroadcastOverlays({ xp, likes, players, notices, warning, paused }: {
  xp: number; likes: number; players: Player[]; notices: Notice[]; warning: string; paused: boolean;
}) {
  const goal = communityGoal(xp);
  return <div className="broadcast-overlays">
    <div className="broadcast-heading"><span className="live-badge">{t("● MOCK LIVE")}{paused ? t(" · PAUSED") : ''}</span><h1>TikTok Academy</h1><div className="broadcast-stats"><span>✦ {xp.toLocaleString('vi-VN')} XP</span><span>♥ {likes.toLocaleString('vi-VN')}</span><span>{t("20 students")}</span></div></div>
    <Notifications notices={notices}/>
    <section className="broadcast-announcement" aria-label={t("Quiz and promotion announcement area")} aria-live="polite">
      {notices.filter(n => n.kind === 'promotion').map(n => <div key={n.id} className="broadcast-notice notice-promotion"><span>🎓</span><div><b>{n.nickname}</b><small>{titles.promotion}</small></div></div>)}
    </section>
    <div className="broadcast-bottom"><section className="broadcast-goal"><small>{t("SCHOOL GOAL")}</small><b>{goal.complete ? t("Goal complete ✨") : t("Grow together")}</b><progress aria-label={t("Community XP goal")} max={goal.target} value={goal.progress}/><span>{goal.progress.toLocaleString('vi-VN')} / {goal.target.toLocaleString('vi-VN')} XP</span></section>
      <section className="broadcast-ranks"><details><summary>TOP 10 <span>XP ▾</span></summary><ol>{players.map(p => <li key={p.id}><span>{p.nickname}</span><b>{p.xp.toLocaleString('vi-VN')}</b></li>)}</ol></details><ol className="rank-preview">{players.slice(0,3).map(p => <li key={p.id}><span>{p.nickname}</span><b>{p.xp.toLocaleString('vi-VN')}</b></li>)}</ol></section>
      {warning && <p className="broadcast-warning" role="status">{warning}</p>}
      <p className="broadcast-disclaimer">{t("Local simulation · Likes, comments, shares & gifts")}</p>
    </div>
  </div>;
}
