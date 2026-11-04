/** Presentation-only state: never awards XP, gifts or promotions. */
export const NOTICE_DURATION_MS = 3000;
export type NoticeKind = 'join' | 'like' | 'gift' | 'promotion';
export type Notice = { id: number; kind: NoticeKind; nickname: string; expiresAt: number };
export function enqueueNotice(current: Notice[], notice: Notice, now: number): Notice[] {
  return [...current.filter(n => n.expiresAt > now), notice].slice(-2);
}
export function communityGoal(xp: number) {
  const target = 5000;
  return { target, progress: Math.min(target, Math.max(0, xp)), complete: xp >= target };
}

/** Four wider columns with staggered rows; Admin coordinates are unchanged. */
export function broadcastPosition(index: number): [number, number, number] {
  const row = Math.floor(index / 4);
  return [(index % 4 - 1.5) * 1.8 + (row % 2 ? 0.25 : -0.25), 0, -1.1 + row * 1.8];
}
export function ceremonyScale(elapsedMs:number,reducedMotion=false):number {
  return reducedMotion?1:1+Math.sin(Math.min(1,Math.max(0,elapsedMs/6000))*Math.PI)*.6;
}
