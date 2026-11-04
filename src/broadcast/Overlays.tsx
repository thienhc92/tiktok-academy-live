import type { Player } from '../game/engine';
import { communityGoal } from './model';
import type { Notice } from './model';

const titles = { join: 'Joined the courtyard', like: 'Sent some love', gift: 'Sent a star', promotion: 'Promotion preview · no rank awarded' };
const icons = { join: '✦', like: '♥', gift: '🎁', promotion: '🎓' };
export function Notifications({ notices }: { notices: Notice[] }) {
  return <div className="broadcast-notices" aria-live="polite" aria-atomic="false">
    {notices.map(n => <div key={n.id} className={`broadcast-notice notice-${n.kind}`}><span>{icons[n.kind]}</span><div><b>{n.nickname}</b><small>{titles[n.kind]}</small></div></div>)}
  </div>;
}
export function BroadcastOverlays({ xp, likes, players, notices, warning, paused }: {
  xp: number; likes: number; players: Player[]; notices: Notice[]; warning: string; paused: boolean;
}) {
  const goal = communityGoal(xp);
  return <div className="broadcast-overlays">
    <div className="broadcast-heading"><span className="live-badge">● MOCK LIVE{paused ? ' · PAUSED' : ''}</span><h1>TikTok Academy</h1><p>A little campus. Big possibilities.</p><div className="broadcast-stats"><span>✦ {xp.toLocaleString()} XP</span><span>♥ {likes.toLocaleString()}</span><span>20 students</span></div></div>
    <Notifications notices={notices}/>
    <div className="broadcast-bottom"><section className="broadcast-goal"><small>SCHOOL MISSION · COMMUNITY GOAL</small><b>{goal.complete ? 'Together, we did it! ✨' : 'Grow our academy together'}</b><progress aria-label="Community XP goal" max={goal.target} value={goal.progress}/><span>{goal.progress.toLocaleString()} / {goal.target.toLocaleString()} XP · no extra reward</span></section>
      <section className="broadcast-ranks"><h2>TOP STUDENTS <span>XP</span></h2><ol>{players.map(p => <li key={p.id}><span>{p.nickname}</span><b>{p.xp.toLocaleString()}</b></li>)}</ol></section>
      {warning && <p className="broadcast-warning" role="status">{warning}</p>}
      <p className="broadcast-disclaimer">Local simulation · Likes, comments, shares & gifts</p>
    </div>
  </div>;
}
