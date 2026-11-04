import { createReplay, processEvent, eventKey } from '../src/events/processor.ts';
import type { ReplayState } from '../src/events/processor.ts';
import { isNormalizedEvent } from '../src/events/types.ts';
import { parseProgress, promotePlayer, startSession, appointOffice } from '../src/game/engine.ts';
import { openQuiz } from '../src/missions/rules.ts';
import type { Receipt, RewardTransaction } from '../local/repository.ts';
import type { Message, SnapshotMessage, DeltaMessage } from '../src/realtime/protocol.ts';
export interface SqlPort {
    exec(query: string, ...bindings: (string | number | null)[]): Record<string, unknown>[];
    transaction<T>(fn: () => T): T;
}
export class Store {
    constructor(privateSql: SqlPort) {
        this.sql = privateSql;
        this.sql.transaction(() => {
            for (const statement of [
                'CREATE TABLE IF NOT EXISTS meta(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL,epoch TEXT NOT NULL)',
                'CREATE TABLE IF NOT EXISTS snapshots(sequence INTEGER PRIMARY KEY,body TEXT NOT NULL)',
                'CREATE TABLE IF NOT EXISTS receipts(key TEXT PRIMARY KEY,body TEXT NOT NULL)',
                'CREATE TABLE IF NOT EXISTS outbox(sequence INTEGER PRIMARY KEY,body TEXT NOT NULL,pending INTEGER NOT NULL)',
                'CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY,expires INTEGER NOT NULL,role TEXT NOT NULL)',
                'CREATE TABLE IF NOT EXISTS budgets(id TEXT PRIMARY KEY,minute INTEGER NOT NULL,total INTEGER NOT NULL)'
            ])
                this.sql.exec(statement);
            const meta = this.sql.exec('SELECT * FROM meta WHERE id=1')[0];
            if (meta && meta.version !== 1)
                throw Error('schema');
            if (!meta) {
                if (this.sql.exec('SELECT * FROM snapshots LIMIT 1').length || this.sql.exec('SELECT * FROM receipts LIMIT 1').length || this.sql.exec('SELECT * FROM outbox LIMIT 1').length)
                    throw Error('schema');
                this.sql.exec('INSERT INTO meta VALUES(1,1,?)', crypto.randomUUID());
                this.sql.exec('INSERT INTO snapshots VALUES(0,?)', JSON.stringify(createReplay()));
            }
        });
        this.read();
    }
    private sql: SqlPort;
    read() {
        const row = this.sql.exec('SELECT * FROM snapshots ORDER BY sequence DESC LIMIT 1')[0];
        if (!row)
            throw Error('snapshot');
        const state = JSON.parse(String(row.body)) as ReplayState;
        if (!parseProgress(JSON.stringify(state.game)) || !Array.isArray(state.seen) || state.seen.length > 10000 || !state.seen.every(s => typeof s === 'string') || new Set(state.seen).size !== state.seen.length || !Array.isArray(state.closed) || state.closed.length > 10000 || !state.closed.every(s => typeof s === 'string') || new Set(state.closed).size !== state.closed.length || !state.counters || Object.getPrototypeOf(state.counters) !== Object.prototype || Object.keys(state.counters).length > 10000 || !Object.values(state.counters).every(v => Number.isSafeInteger(v) && v >= 0 && v <= 1e9) || !Number.isSafeInteger(state.clock) || state.clock < 0 || state.clock > 8e15 || (state.game.live?.now ?? 0) > state.clock)
            throw Error('snapshot');
        return { sequence: Number(row.sequence), state, epoch: String(this.sql.exec('SELECT epoch FROM meta WHERE id=1')[0].epoch) };
    }
    snapshot(): SnapshotMessage {
        const r = this.read();
        const game = structuredClone(r.state.game);
        game.processedIds = [];
        for (const p of game.live?.records ?? []) {
            p.texts = [];
            p.acceptedIds = [];
        }
        return { v: 1, type: 'snapshot', sequence: r.sequence, epoch: r.epoch, game };
    }
    private commit(before: SnapshotMessage, state: ReplayState, sequence: number) {
        this.sql.exec('INSERT INTO snapshots VALUES(?,?)', sequence, JSON.stringify(state));
        const after = this.snapshot();
        const delta: DeltaMessage = { v: 1, type: 'delta', epoch: after.epoch, from: before.sequence, sequence, players: after.game.players.filter(p => JSON.stringify(p) !== JSON.stringify(before.game.players.find(b => b.id === p.id))) };
        if (JSON.stringify(after.game.academy) !== JSON.stringify(before.game.academy))
            delta.academy = after.game.academy;
        if (JSON.stringify(after.game.live) !== JSON.stringify(before.game.live))
            delta.live = after.game.live ?? null;
        this.sql.exec('INSERT INTO outbox VALUES(?,?,1)', sequence, JSON.stringify(delta));
        this.sql.exec('DELETE FROM snapshots WHERE sequence NOT IN (SELECT sequence FROM snapshots ORDER BY sequence DESC LIMIT 20)');
        this.sql.exec('DELETE FROM outbox WHERE sequence NOT IN (SELECT sequence FROM outbox ORDER BY sequence DESC LIMIT 200)');
    }
    processBatch(events: unknown[], fault?: () => void): Receipt[] {
        if (!Array.isArray(events) || events.length < 1 || events.length > 25 || !events.every(e => isNormalizedEvent(e) && /^[\w-]{1,20}$/.test(e.source) && (e.viewer.id === null || e.viewer.id === e.viewer.id.trim())))
            throw Error('invalid');
        return this.sql.transaction(() => {
            const before = this.snapshot();
            let { state, sequence } = this.read();
            const receipts: Receipt[] = [];
            for (const input of events) {
                const key = eventKey(input as Parameters<typeof eventKey>[0]);
                const existing = this.sql.exec('SELECT body FROM receipts WHERE key=?', key)[0];
                if (existing) {
                    receipts.push({ ...JSON.parse(String(existing.body)), duplicate: true });
                    continue;
                }
                const next = processEvent(state, input);
                if (['capacity', 'invalid'].includes(next.outcome))
                    throw Error(next.outcome);
                const rewards: RewardTransaction[] = next.state.game.players.flatMap(p => {
                    const old = state.game.players.find(o => o.id === p.id);
                    const xp = p.xp - (old?.xp ?? 0), contribution = p.contribution - (old?.contribution ?? 0);
                    return xp || contribution ? [{ playerId: p.id, xp, contribution }] : [];
                });
                state = next.state;
                sequence++;
                const receipt: Receipt = { key, sequence, outcome: next.outcome, units: next.units, rewards, duplicate: false };
                this.sql.exec('INSERT INTO receipts VALUES(?,?)', key, JSON.stringify(receipt));
                receipts.push(receipt);
            }
            if (sequence !== before.sequence)
                this.commit(before, state, sequence);
            fault?.();
            return receipts;
        });
    }
    command(id: string, body: unknown, now: number) {
        if (typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id) || !body || typeof body !== 'object')
            throw Error('invalid');
        return this.sql.transaction(() => {
            const key = 'admin:' + id, old = this.sql.exec('SELECT body FROM receipts WHERE key=?', key)[0];
            if (old)
                return JSON.parse(String(old.body));
            if (Number(this.sql.exec("SELECT count(*) n FROM receipts WHERE key LIKE 'admin:%'")[0].n) >= 1000)
                throw Error('capacity');
            const cmd = body as Record<string, unknown>, before = this.snapshot(), r = this.read();
            let game = r.state.game;
            if (cmd.type === 'quiz.open' && typeof cmd.question === 'string' && typeof cmd.seconds === 'number' && Object.keys(cmd).length === 3)
                game = openQuiz(game, id, cmd.question, now, cmd.seconds);
            else if (cmd.type === 'session.start' && Object.keys(cmd).length === 1)
                game = startSession(game, id);
            else if (cmd.type === 'promote' && typeof cmd.playerId === 'string' && typeof cmd.target === 'number' && Object.keys(cmd).length === 3)
                game = promotePlayer(game, cmd.playerId, now, cmd.target);
            else if (cmd.type === 'office.appoint' && typeof cmd.office === 'string' && Object.keys(cmd).length === 2)
                game = appointOffice(game, cmd.office);
            else
                throw Error('invalid');
            if (game === r.state.game)
                throw Error('ineligible');
            r.state.game = game;
            r.state.clock = Math.max(r.state.clock, now);
            const result = { sequence: r.sequence + 1 };
            this.sql.exec('INSERT INTO receipts VALUES(?,?)', key, JSON.stringify(result));
            this.commit(before, r.state, r.sequence + 1);
            return result;
        });
    }
    sync(epoch: string | null, since: number): Message[] {
        const snapshot = this.snapshot();
        if (epoch !== snapshot.epoch || !Number.isSafeInteger(since) || since < 0 || since > snapshot.sequence)
            return [snapshot];
        if (since === snapshot.sequence)
            return [];
        const messages = this.sql.exec('SELECT body FROM outbox WHERE sequence>? ORDER BY sequence', since).map(r => JSON.parse(String(r.body)) as DeltaMessage);
        let cursor = since;
        for (const m of messages) {
            if (m.from !== cursor)
                return [snapshot];
            cursor = m.sequence;
        }
        return cursor === snapshot.sequence ? messages : [snapshot];
    }
    pending() {
        return this.sql.exec('SELECT sequence,body FROM outbox WHERE pending=1 ORDER BY sequence').map(r => ({ sequence: Number(r.sequence), message: JSON.parse(String(r.body)) as Message }));
    }
    markPublished(sequence: number) {
        this.sql.exec('UPDATE outbox SET pending=0 WHERE sequence=?', sequence);
    }
    ticket(id: string, role: string, now: number) {
        this.sql.exec('DELETE FROM tickets WHERE expires<=?', now);
        if (Number(this.sql.exec('SELECT count(*) n FROM tickets')[0].n) >= 1000)
            throw Error('capacity');
        this.sql.exec('INSERT INTO tickets VALUES(?,?,?)', id, now + 30000, role);
    }
    consumeTicket(id: string, now: number) {
        return this.sql.transaction(() => {
            const row = this.sql.exec('SELECT * FROM tickets WHERE id=?', id)[0];
            this.sql.exec('DELETE FROM tickets WHERE id=?', id);
            return row && Number(row.expires) > now ? String(row.role) : null;
        });
    }
    budget(id: string, now: number, units: number) {
        return this.sql.transaction(() => {
            const minute = Math.floor(now / 60000), old = this.sql.exec('SELECT * FROM budgets WHERE id=?', id)[0], total = old?.minute === minute ? Number(old.total) : 0;
            if (total + units > 1000)
                return false;
            this.sql.exec('INSERT OR REPLACE INTO budgets VALUES(?,?,?)', id, minute, total + units);
            return true;
        });
    }
    backup() {
        const r = this.read();
        return { version: 1 as const, ...r, receipts: this.sql.exec('SELECT * FROM receipts ORDER BY key') };
    }
    restore(value: ReturnType<Store['backup']>) {
        return this.sql.transaction(() => {
            if (this.read().sequence !== 0)
                throw Error('nonempty');
            if (value.version !== 1 || !Number.isSafeInteger(value.sequence) || value.sequence < 0 || !parseProgress(JSON.stringify(value.state.game)) || !Array.isArray(value.receipts) || value.receipts.length > 11000)
                throw Error('backup');
            this.sql.exec('DELETE FROM snapshots');
            this.sql.exec('DELETE FROM outbox');
            this.sql.exec('DELETE FROM receipts');
            this.sql.exec('DELETE FROM tickets');
            this.sql.exec('UPDATE meta SET epoch=? WHERE id=1', crypto.randomUUID());
            this.sql.exec('INSERT INTO snapshots VALUES(?,?)', value.sequence, JSON.stringify(value.state));
            for (const r of value.receipts)
                this.sql.exec('INSERT INTO receipts VALUES(?,?)', String(r.key), String(r.body));
            this.read();
            return this.snapshot();
        });
    }
}
