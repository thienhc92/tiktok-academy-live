import type { EventKind, LiveEvent } from './engine';
/** Mock transport emits the same contract a future server connector will use. */
export function mockEvent(playerId: string, nickname: string, kind: EventKind, count = 1): LiveEvent {
  return { id: `mock:${globalThis.crypto.randomUUID()}`, playerId, nickname, kind, count };
}
