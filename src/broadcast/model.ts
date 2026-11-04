/** Presentation-only state: never awards XP, gifts or promotions. */
export type NoticeKind = 'join' | 'like' | 'gift' | 'promotion';
export type Notice = { id: number; kind: NoticeKind; nickname: string; expiresAt: number };
export function enqueueNotice(current: Notice[], notice: Notice, now: number): Notice[] {
  return [...current.filter(n => n.expiresAt > now), notice].slice(-3);
}
export function communityGoal(xp: number) {
  const target = 5000;
  return { target, progress: Math.min(target, Math.max(0, xp)), complete: xp >= target };
}
