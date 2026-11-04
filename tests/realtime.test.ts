import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { Store } from '../backend/store.ts';
import { RealtimeClient, backendUrl, retryDelay } from '../src/realtime/client.ts';
import { applyMessage } from '../src/realtime/protocol.ts';
import type { Message, SnapshotMessage } from '../src/realtime/protocol.ts';
const staging = JSON.parse(readFileSync(new URL('../backend/wrangler.staging.json', import.meta.url), 'utf8'));
const stagingOrigin = staging.vars.FRONTEND_ORIGIN;
const event = { version: 1, source: 'fixture', roomId: 'school', sessionId: 'live-1', eventId: 'enroll', occurredAt: 100000, receivedAt: 100000, viewer: { id: '90071992547409931234', nickname: 'Học sinh mẫu' }, kind: 'comment', text: 'nhaphoc' };
function open(path: string) {
    const db = new DatabaseSync(path);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=10000');
    const store = new Store({ exec: (q, ...b) => db.prepare(q).all(...b) as Record<string, unknown>[], transaction: fn => {
            db.exec('BEGIN IMMEDIATE');
            try {
                const result = fn();
                db.exec('COMMIT');
                return result;
            }
            catch (e) {
                db.exec('ROLLBACK');
                throw e;
            }
        } });
    return { db, store };
}
test('staging configuration is isolated, SQLite-backed, secret-free and has no public ingress', () => {
    assert.equal(staging.name, 'tiktok-academy-realtime-staging');
    assert.equal(staging.main, 'worker.ts');
    assert.equal(staging.compatibility_date, '2026-07-01');
    assert.equal(staging.workers_dev, false);
    assert.equal(staging.preview_urls, false);
    assert.deepEqual(staging.routes, []);
    assert.deepEqual(staging.vars, { FRONTEND_ORIGIN: 'https://tiktok-academy-live.pages.dev', RESTORE_ENABLED: 'false' });
    assert.deepEqual(staging.durable_objects.bindings, [{ name: 'SCHOOLS', class_name: 'School' }]);
    assert.deepEqual(staging.migrations, [{ tag: 'v1', new_sqlite_classes: ['School'] }]);
    const allowed = ['name', 'main', 'compatibility_date', 'workers_dev', 'preview_urls', 'routes', 'vars', 'durable_objects', 'migrations'];
    assert.ok(Object.keys(staging).every(key => allowed.includes(key)), 'additional deployment capabilities require review');
    for (const name of ['INGEST_TOKEN', 'ADMIN_TOKEN', 'VIEW_TOKEN', 'BACKUP_KEY'])
        assert.equal(Object.hasOwn(staging.vars, name), false);
});
test('transaction rolls back rewards, dedup and outbox together; restart after lost ack pays once', t => {
    const dir = mkdtempSync(join(tmpdir(), 'academy-outbox-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const path = join(dir, 'state.db');
    let { db, store } = open(path);
    assert.throws(() => store.processBatch([event], () => {
        throw Error('crash before commit');
    }));
    assert.equal(store.read().sequence, 0);
    assert.equal(store.pending().length, 0);
    db.close();
    ({ db, store } = open(path));
    store.processBatch([event]);
    db.close(); // committed, acknowledgement and broadcast lost
    ({ db, store } = open(path));
    assert.equal(store.processBatch([event])[0].duplicate, true);
    assert.equal(store.snapshot().game.players[0].xp, 20);
    assert.equal(store.pending().length, 1);
    const pending = store.pending()[0];
    store.markPublished(pending.sequence);
    assert.equal(store.pending().length, 0);
    assert.equal(store.sync(store.snapshot().epoch, 0).length, 1);
    db.close();
});
test('batch is atomic, anonymous events cannot earn XP and malformed identity cannot consume sequence', () => {
    const { db, store } = open(':memory:');
    assert.throws(() => store.processBatch([event, { ...event, eventId: 'bad', viewer: { id: 42 } }]));
    assert.equal(store.read().sequence, 0);
    assert.equal(store.processBatch([{ ...event, viewer: { id: null } }])[0].outcome, 'anonymous');
    assert.equal(store.snapshot().game.players.length, 0);
    assert.equal(store.processBatch([event])[0].duplicate, true);
    db.close();
});
test('cumulative likes, gift streaks, stale events and repeated final gifts retain engine rules', () => {
    const { db, store } = open(':memory:');
    const like = { ...event, kind: 'like', likes: { mode: 'cumulative', scope: 'viewer', counterId: 'one', total: 10 } };
    store.processBatch([like]);
    store.processBatch([{ ...like, eventId: 'grow', occurredAt: 104000, receivedAt: 104000, likes: { ...like.likes, total: 15 } }]);
    store.processBatch([{ ...like, eventId: 'older', receivedAt: 108000, likes: { ...like.likes, total: 12 } }]);
    const gift = { ...event, kind: 'gift', eventId: 'g1', occurredAt: 112000, receivedAt: 112000, giftId: 'rose', streakId: 's1', repeatCount: 3, final: false };
    store.processBatch([gift]);
    store.processBatch([{ ...gift, eventId: 'g2', final: true }]);
    store.processBatch([{ ...gift, eventId: 'g3', final: true, occurredAt: 116000, receivedAt: 116000 }]);
    assert.deepEqual(store.snapshot().game.players.map(p => [p.xp, p.contribution]), [[5, 60]]);
    db.close();
});
test('sequence gaps, duplicates, stale snapshots and epoch changes recover deterministically', () => {
    const { db, store } = open(':memory:');
    const initial = store.snapshot();
    store.processBatch([event]);
    const delta = store.sync(initial.epoch, 0)[0];
    const applied = applyMessage(initial, delta);
    assert.deepEqual(applied.state, store.snapshot());
    assert.equal(applyMessage(applied.state, delta).state, applied.state);
    assert.equal(applyMessage(null, delta).resync, true);
    assert.equal(applyMessage({ ...initial, sequence: 10 }, delta).state?.sequence, 10);
    assert.equal(applyMessage({ ...initial, epoch: 'old' }, delta).resync, true);
    const wrong = { ...delta, type: 'delta' as const, from: 4, sequence: 5, players: [] };
    assert.equal(applyMessage(initial, wrong).resync, true);
    assert.deepEqual(store.sync('old', 0), [store.snapshot()]);
    db.close();
});
test('snapshot and outbox retention falls back to snapshot; backup restores idempotency with new epoch', () => {
    const { db, store } = open(':memory:');
    for (let i = 0; i < 205; i++)
        store.processBatch([{ ...event, eventId: 'event-' + i, viewer: { id: null } }]);
    assert.equal(Number(db.prepare('SELECT count(*) n FROM snapshots').get()!.n), 20);
    assert.equal(store.pending().length, 200);
    assert.equal(store.sync(store.snapshot().epoch, 0)[0].type, 'snapshot');
    const backup = store.backup(), other = open(':memory:');
    other.store.restore(backup);
    assert.notEqual(other.store.snapshot().epoch, store.snapshot().epoch);
    assert.equal(other.store.read().sequence, 205);
    assert.equal(other.store.processBatch([{ ...event, eventId: 'event-0', viewer: { id: null } }])[0].duplicate, true);
    assert.throws(() => other.store.restore(backup), /nonempty/);
    db.close();
    other.db.close();
});
test('admin command allowlist rejects arbitrary XP updates and invalid promotions', () => {
    const { db, store } = open(':memory:');
    store.processBatch([event]);
    assert.throws(() => store.command('xp', { type: 'xp', amount: 100 }, 104000));
    assert.throws(() => store.command('promotion', { type: 'promote', playerId: 'fixture:' + event.viewer.id, target: 10 }, 104000));
    assert.throws(() => store.command('office', { type: 'office.appoint', office: 'principal' }, 104000));
    const q = store.command('question', { type: 'quiz.open', question: 'q1', seconds: 30 }, 104000);
    assert.deepEqual(store.command('question', { type: 'quiz.open', question: 'q1', seconds: 30 }, 104000), q);
    assert.equal(store.snapshot().game.players[0].xp, 20);
    db.close();
});
test('100 players are processed in four bounded transactional batches', () => {
    const { db, store } = open(':memory:');
    let client = store.snapshot();
    for (let batch = 0; batch < 4; batch++) {
        store.processBatch(Array.from({ length: 25 }, (_, i) => ({ ...event, eventId: 'p' + (batch * 25 + i), viewer: { id: 'p' + (batch * 25 + i), nickname: 'Học sinh ' + (batch * 25 + i) } })));
        for (const message of store.sync(client.epoch, client.sequence)) {
            const result = applyMessage(client, message);
            assert.equal(result.resync, false);
            client = result.state!;
        }
    }
    assert.equal(store.snapshot().game.players.length, 100);
    assert.equal(store.snapshot().sequence, 100);
    assert.equal(store.pending().length, 4);
    assert.deepEqual(client, store.snapshot());
    assert.ok(client.game.players.every(p => p.xp === 20));
    assert.throws(() => store.processBatch(Array.from({ length: 26 }, () => event)));
    assert.throws(() => store.processBatch([{ ...event, source: 'ambiguous:source' }]));
    db.close();
});
test('transport URL, retry bounds, wire validation and expiring tickets fail safely', () => {
    assert.equal(backendUrl('https://academy.example/'), 'https://academy.example');
    assert.equal(backendUrl('http://localhost:8787'), 'http://localhost:8787');
    for (const value of ['http://academy.example', 'https://user:secret@academy.example', 'https://academy.example/?token=bad', 'https://academy.example/path'])
        assert.throws(() => backendUrl(value));
    assert.equal(retryDelay(0), 1000);
    assert.equal(retryDelay(100), 30000);
    assert.equal(applyMessage(null, {} as Message).resync, true);
    assert.equal(applyMessage(null, { v: 1, type: 'snapshot', epoch: 'e', sequence: 0, game: {} } as Message).resync, true);
    const { db, store } = open(':memory:');
    store.ticket('expired', 'view', 0);
    assert.equal(store.consumeTicket('expired', 30000), null);
    store.ticket('one-use', 'view', 100000);
    assert.equal(store.consumeTicket('one-use', 100001), 'view');
    assert.equal(store.consumeTicket('one-use', 100002), null);
    assert.equal(store.budget('test', 100000, 1000), true);
    assert.equal(store.budget('test', 100000, 1), false);
    assert.equal(store.budget('test', 160000, 1), true);
    db.close();
});
test('client reconnects with a fresh ticket, resumes gaps, polls tail losses and cancels on stop', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    const original = globalThis.WebSocket;
    const instances: FakeSocket[] = [];
    const statuses: string[] = [];
    class FakeSocket {
        static OPEN = 1;
        readyState = 0;
        sent: string[] = [];
        onopen: (() => void) | null = null;
        onclose: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onmessage: ((e: {
            data: string;
        }) => void) | null = null;
        constructor() {
            instances.push(this);
        }
        send(value: string) {
            this.sent.push(value);
        }
        close() {
            this.readyState = 3;
            this.onclose?.();
        }
        open() {
            this.readyState = 1;
            this.onopen?.();
        }
        message(value: unknown) {
            this.onmessage?.({ data: JSON.stringify(value) });
        }
    }
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
    t.after(() => {
        globalThis.WebSocket = original;
    });
    let tickets = 0;
    t.mock.method(globalThis, 'fetch', async () => {
        tickets++;
        return Response.json({ ticket: 'ticket-00000000-0000-0000-0000-000000000000' });
    });
    const flush = () => new Promise<void>(resolve => setImmediate(resolve));
    const { db, store } = open(':memory:');
    t.after(() => db.close());
    const initial = store.snapshot();
    let sequence = -1;
    const client = new RealtimeClient('https://worker.example', 'fixture', s => sequence = s.sequence, s => statuses.push(s));
    client.start();
    await flush();
    instances[0].open();
    instances[0].message(initial);
    assert.equal(sequence, 0);
    instances[0].close();
    assert.equal(statuses.at(-1), 'reconnecting');
    t.mock.timers.tick(1000);
    await flush();
    assert.equal(tickets, 2);
    instances[1].open();
    assert.equal(JSON.parse(instances[1].sent[0]).epoch, initial.epoch);
    instances[1].message({ v: 1, type: 'delta', epoch: initial.epoch, from: 2, sequence: 3, players: [] });
    assert.equal(sequence, 0);
    assert.equal(instances[1].sent.length, 2);
    t.mock.timers.tick(15000);
    assert.equal(instances[1].sent.length, 3);
    client.stop();
    t.mock.timers.tick(60000);
    await flush();
    assert.equal(instances.length, 2);
    assert.equal(statuses.at(-1), 'offline');
});
test('real Worker + Durable Object SQLite: auth, WebSocket, concurrent delivery, restart, backup', { timeout: 60000 }, async (t) => {
    const output = await build({ entryPoints: ['backend/worker.ts'], bundle: true, write: false, format: 'esm', platform: 'browser', external: ['cloudflare:workers'] });
    const dir = mkdtempSync(join(tmpdir(), 'academy-workerd-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const admin = 'fixture-admin-'.padEnd(40, 'a'), ingest = 'fixture-ingest-'.padEnd(40, 'i'), view = 'fixture-view-'.padEnd(40, 'v');
    const options = { modules: true as const, script: output.outputFiles[0].text, compatibilityDate: '2026-07-01', durableObjects: { SCHOOLS: { className: 'School', useSQLite: true } }, durableObjectsPersist: dir, bindings: { ADMIN_TOKEN: admin, INGEST_TOKEN: ingest, VIEW_TOKEN: view, BACKUP_KEY: 'fixture-backup-'.padEnd(40, 'b'), FRONTEND_ORIGIN: stagingOrigin, RESTORE_ENABLED: 'false' } };
    let mf = new Miniflare(options);
    t.after(() => mf.dispose());
    const req = (path: string, token: string, body?: unknown, origin = stagingOrigin) => mf.dispatchFetch('https://worker.example' + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + token, Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    await t.test('unauthorized requests, wrong origin, view mutations, ingest reads are rejected', async () => {
        assert.equal((await req('/state', 'bad')).status, 403);
        assert.equal((await req('/state', admin, undefined, 'https://evil.example')).status, 403);
        assert.equal((await req('/events', view, [event])).status, 403);
        assert.equal((await req('/state', ingest)).status, 403);
        assert.equal((await mf.dispatchFetch('https://worker.example/state', { headers: { 'X-Academy-Role': 'admin' } })).status, 401);
        assert.equal((await req('/commands', admin, { id: 'xp', command: { type: 'xp', amount: 100 } })).status, 400);
    });
    await t.test('staging CORS preflight permits only the exact frontend origin without credentials', async () => {
        const preflight = (origin: string) => mf.dispatchFetch('https://worker.example/events', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
        const allowed = await preflight(stagingOrigin);
        assert.equal(allowed.status, 204);
        assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), stagingOrigin);
        assert.equal(allowed.headers.get('Vary'), 'Origin');
        assert.equal(allowed.headers.get('Access-Control-Allow-Credentials'), null);
        assert.equal(allowed.headers.get('Access-Control-Allow-Headers'), 'Authorization, Content-Type');
        for (const origin of ['https://evil.example', 'https://preview.tiktok-academy-live.pages.dev', stagingOrigin + '.evil.example', 'null']) {
            const denied = await preflight(origin);
            assert.equal(denied.status, 403);
            assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null);
        }
        const response = await req('/state', view);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('Access-Control-Allow-Origin'), stagingOrigin);
        assert.equal(response.headers.get('Cache-Control'), 'no-store');
    });
    await t.test('route and method protections cannot be bypassed with a role header or another token', async () => {
        assert.equal((await req('/events', admin, [event])).status, 403);
        assert.equal((await req('/commands', ingest, { id: 'denied', command: { type: 'session.start' } })).status, 403);
        assert.equal((await req('/events', ingest)).status, 403);
        assert.equal((await req('/state', view, {})).status, 404);
        assert.equal((await mf.dispatchFetch('https://worker.example/state', { method: 'PUT', headers: { Origin: stagingOrigin, Authorization: 'Bearer ' + view } })).status, 405);
        assert.equal((await req('/unknown', admin)).status, 403);
        const forged = await mf.dispatchFetch('https://worker.example/commands', { method: 'POST', headers: { Origin: stagingOrigin, Authorization: 'Bearer ' + view, 'X-Academy-Role': 'admin' }, body: JSON.stringify({ id: 'forged', command: { type: 'session.start' } }) });
        assert.equal(forged.status, 403);
        const state = await (await req('/state', view)).json() as SnapshotMessage;
        assert.equal(state.sequence, 0);
    });
    await t.test('WebSocket denies wrong or missing origin and forged tickets', async () => {
        for (const origin of [undefined, 'https://evil.example']) {
            const headers: Record<string, string> = { Upgrade: 'websocket', 'Sec-WebSocket-Protocol': 'academy-v1, ticket-00000000-0000-0000-0000-000000000000' };
            if (origin)
                headers.Origin = origin;
            assert.equal((await mf.dispatchFetch('https://worker.example/ws', { headers })).status, 403);
        }
        assert.equal((await mf.dispatchFetch('https://worker.example/ws', { headers: { Origin: stagingOrigin, Upgrade: 'websocket', 'Sec-WebSocket-Protocol': 'academy-v1, ticket-00000000-0000-0000-0000-000000000000' } })).status, 401);
    });
    let socket: NonNullable<Awaited<ReturnType<typeof mf.dispatchFetch>>['webSocket']>;
    let messages: Message[] = [];
    await t.test('one-use ticket authenticates WebSocket; snapshot is first message', async () => {
        const { ticket } = await (await req('/ticket', view, {})).json() as {
            ticket: string;
        };
        const connect = () => mf.dispatchFetch('https://worker.example/ws', { headers: { Upgrade: 'websocket', Origin: stagingOrigin, 'Sec-WebSocket-Protocol': 'academy-v1, ' + ticket } });
        const response = await connect();
        assert.equal(response.status, 101);
        socket = response.webSocket!;
        socket.accept();
        socket.addEventListener('message', e => messages.push(JSON.parse(String(e.data))));
        await new Promise(r => setTimeout(r, 50));
        assert.equal(messages[0]?.type, 'snapshot');
        assert.equal((await connect()).status, 401);
    });
    const incoming = { ...event, occurredAt: Date.now(), receivedAt: 0 };
    await t.test('concurrent duplicate requests reward once and publish durable delta', async () => {
        const result = await Promise.all([req('/events', ingest, [incoming]), req('/events', ingest, [incoming]), req('/events', ingest, [{ ...incoming, eventId: 'second', viewer: { id: 'second' } }])]);
        assert.ok(result.every(r => r.status === 200));
        const snapshot = await (await req('/state', view)).json() as SnapshotMessage;
        assert.equal(snapshot.sequence, 2);
        assert.equal(snapshot.game.players.length, 2);
        assert.ok(snapshot.game.players.every(p => p.xp === 20));
        await new Promise(r => setTimeout(r, 50));
        assert.ok(messages.some(m => m.type === 'delta'));
        let local = messages[0] as SnapshotMessage;
        for (const message of messages.slice(1)) {
            const result = applyMessage(local, message);
            assert.equal(result.resync, false);
            local = result.state!;
        }
        assert.deepEqual(local, snapshot);
    });
    await t.test('resume fills missing sequence; socket does not accept XP commands', async () => {
        messages = [];
        socket.send(JSON.stringify({ type: 'resume', epoch: null, sequence: 0 }));
        await new Promise(r => setTimeout(r, 50));
        assert.equal(messages[0]?.type, 'snapshot');
        socket.send(JSON.stringify({ type: 'xp', amount: 100000 }));
        await new Promise(r => setTimeout(r, 50));
        assert.equal((await (await req('/state', view)).json() as SnapshotMessage).game.players[0].xp, 20);
    });
    await t.test('SQLite survives runtime restart; duplicate replay cannot repay', async () => {
        const before = await (await req('/state', admin)).json();
        await mf.dispose();
        mf = new Miniflare(options);
        const after = await (await req('/state', admin)).json();
        assert.deepEqual(after, before);
        const duplicate = await (await req('/events', ingest, [incoming])).json() as {
            receipts: {
                duplicate: boolean;
            }[];
        };
        assert.equal(duplicate.receipts[0].duplicate, true);
        assert.deepEqual(await (await req('/state', view)).json(), before);
    });
    await t.test('backup restricted to admin; restore disabled by default; response contains signed payload', async () => {
        assert.equal((await req('/backup', view)).status, 403);
        const backup = await (await req('/backup', admin)).json() as {
            payload: string;
            signature: string;
        };
        assert.equal(backup.signature.length, 64);
        assert.equal(JSON.parse(backup.payload).sequence, 2);
        assert.equal((await req('/restore', admin, backup)).status, 403);
    });
    await t.test('signed backup restores only to empty SQLite; tampering is rejected', async () => {
        const backup = await (await req('/backup', admin)).json();
        await mf.dispose();
        mf = new Miniflare({ ...options, durableObjectsPersist: join(dir, 'restored'), bindings: { ...options.bindings, RESTORE_ENABLED: 'true' } });
        assert.equal((await req('/restore', admin, { ...(backup as object), signature: 'tampered' })).status, 403);
        assert.equal((await req('/restore', admin, backup)).status, 200);
        assert.equal((await req('/restore', admin, backup)).status, 400);
        const duplicate = await (await req('/events', ingest, [incoming])).json() as {
            receipts: {
                duplicate: boolean;
            }[];
        };
        assert.equal(duplicate.receipts[0].duplicate, true);
    });
    await t.test('each missing secret, short or duplicate secret and absent origin fail closed', async () => {
        const keys = ['ADMIN_TOKEN', 'INGEST_TOKEN', 'VIEW_TOKEN', 'BACKUP_KEY'];
        const cases = [...keys.map(missing => Object.fromEntries(Object.entries(options.bindings).filter(([key]) => key !== missing))), { ...options.bindings, VIEW_TOKEN: 'short' }, { ...options.bindings, INGEST_TOKEN: admin }, { ...options.bindings, FRONTEND_ORIGIN: '' }];
        for (const bindings of cases) {
            await mf.setOptions({ ...options, bindings });
            for (const path of ['/state', '/events', '/commands', '/ticket', '/backup', '/restore'])
                assert.equal((await req(path, admin, path === '/state' ? undefined : {})).status, 503);
            assert.equal((await mf.dispatchFetch('https://worker.example/ws', { headers: { Upgrade: 'websocket', Origin: stagingOrigin } })).status, 503);
            const health = await mf.dispatchFetch('https://worker.example/health');
            assert.equal(health.status, 200);
            assert.deepEqual(await health.json(), { service: 'TikTok Academy', version: 1 });
        }
    });
});
