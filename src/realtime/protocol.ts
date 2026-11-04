import { parseProgress } from '../game/engine.ts';
import type { GameState, Player } from '../game/engine.ts';
export type SnapshotMessage = {
    v: 1;
    type: 'snapshot';
    epoch: string;
    sequence: number;
    game: GameState;
};
export type DeltaMessage = {
    v: 1;
    type: 'delta';
    epoch: string;
    from: number;
    sequence: number;
    players: Player[];
    academy?: GameState['academy'];
    live?: GameState['live'] | null;
};
export type Message = SnapshotMessage | DeltaMessage;
export function applyMessage(current: SnapshotMessage | null, message: Message): {
    state: SnapshotMessage | null;
    resync: boolean;
} {
    try {
        if (!message || typeof message.epoch !== 'string' || !message.epoch || message.epoch.length > 100 || message.v !== 1 || !Number.isSafeInteger(message.sequence) || message.sequence < 0)
            return { state: current, resync: true };
        if (message.type === 'snapshot') {
            if (current?.epoch === message.epoch && current.sequence > message.sequence)
                return { state: current, resync: false };
            if (!parseProgress(JSON.stringify(message.game)))
                return { state: current, resync: true };
            return { state: message, resync: false };
        }
        if (message.type !== 'delta' || !Array.isArray(message.players) || message.players.length > 1000 || !Number.isSafeInteger(message.from) || message.sequence <= message.from)
            return { state: current, resync: true };
        if (!current || current.epoch !== message.epoch)
            return { state: current, resync: true };
        if (message.sequence <= current.sequence)
            return { state: current, resync: false };
        if (message.from !== current.sequence)
            return { state: current, resync: true };
        const players = [...current.game.players];
        for (const p of message.players) {
            const i = players.findIndex(x => x.id === p.id);
            if (i < 0)
                players.push(p);
            else
                players[i] = p;
        }
        const state: SnapshotMessage = { ...current, sequence: message.sequence, game: { ...current.game, players, ...(message.academy ? { academy: message.academy } : {}), ...(message.live !== undefined ? { live: message.live ?? undefined } : {}) } };
        if (!parseProgress(JSON.stringify(state.game)))
            return { state: current, resync: true };
        return { state, resync: false };
    }
    catch {
        return { state: current, resync: true };
    }
}
