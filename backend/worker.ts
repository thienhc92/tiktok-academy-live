import { DurableObject } from 'cloudflare:workers';
import { Store } from './store.ts';
interface Env {
    SCHOOLS: DurableObjectNamespace<School>;
    FRONTEND_ORIGIN: string;
    ADMIN_TOKEN: string;
    INGEST_TOKEN: string;
    VIEW_TOKEN: string;
    BACKUP_KEY: string;
    RESTORE_ENABLED?: string;
}
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const errors = { invalid: 'Yêu cầu không hợp lệ.', denied: 'Không có quyền truy cập.', unavailable: 'Máy chủ chưa được cấu hình an toàn.', failure: 'Không thể xử lý; hãy kiểm tra trạng thái và thử lại với cùng mã yêu cầu.' };
async function equal(a: string, b: string) {
    const hash = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
    const [x, y] = await Promise.all([hash(a), hash(b)]);
    let diff = 0;
    for (let i = 0; i < x.length; i++)
        diff |= x[i] ^ y[i];
    return diff === 0;
}
async function signature(body: string, key: string) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(body)))).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function body(request: Request, max: number) {
    if (Number(request.headers.get('Content-Length')) > max)
        throw Error('invalid');
    if (!request.body)
        throw Error('invalid');
    const reader = request.body.getReader();
    let text = '', size = 0;
    const decoder = new TextDecoder();
    while (true) {
        const chunk = await reader.read();
        if (chunk.done)
            break;
        size += chunk.value.length;
        if (size > max) {
            await reader.cancel();
            throw Error('invalid');
        }
        text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
}
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url), origin = request.headers.get('Origin');
        if (url.pathname === '/health' && request.method === 'GET')
            return json({ service: 'TikTok Academy', version: 1 });
        const keys = [env.ADMIN_TOKEN, env.INGEST_TOKEN, env.VIEW_TOKEN, env.BACKUP_KEY];
        if (keys.some(k => typeof k !== 'string' || k.length < 32) || new Set(keys).size !== 4 || !env.FRONTEND_ORIGIN)
            return json({ error: errors.unavailable }, 503);
        if (origin && origin !== env.FRONTEND_ORIGIN)
            return json({ error: errors.denied }, 403);
        const cors = { 'Access-Control-Allow-Origin': env.FRONTEND_ORIGIN, 'Vary': 'Origin', 'Cache-Control': 'no-store' };
        if (request.method === 'OPTIONS')
            return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' } });
        const socket = url.pathname === '/ws' && request.method === 'GET' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
        let role = '';
        if (!socket) {
            const auth = request.headers.get('Authorization') ?? '';
            if (!auth.startsWith('Bearer ') || auth.length > 512)
                return json({ error: errors.denied }, 401);
            const token = auth.slice(7);
            for (const [name, key] of [['admin', env.ADMIN_TOKEN], ['ingest', env.INGEST_TOKEN], ['view', env.VIEW_TOKEN]])
                if (await equal(token, key))
                    role = name;
            const allowed = role === 'ingest' ? request.method === 'POST' && url.pathname === '/events' : role === 'admin' ? ['/state', '/ticket', '/commands', '/backup', '/restore'].includes(url.pathname) : role === 'view' && ['/state', '/ticket'].includes(url.pathname);
            if (!allowed)
                return new Response(JSON.stringify({ error: errors.denied }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
        else if (origin !== env.FRONTEND_ORIGIN)
            return json({ error: errors.denied }, 403);
        const headers = new Headers(request.headers);
        headers.delete('Authorization');
        headers.set('X-Academy-Role', role);
        const response = await env.SCHOOLS.get(env.SCHOOLS.idFromName('academy')).fetch(new Request(request, { headers }));
        if (response.status === 101)
            return response;
        const result = new Response(response.body, response);
        for (const [key, value] of Object.entries(cors))
            result.headers.set(key, value);
        return result;
    }
};
export class School extends DurableObject<Env> {
    private store: Store;
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.store = new Store({ exec: (q, ...b) => Array.from(ctx.storage.sql.exec(q, ...b)), transaction: fn => ctx.storage.transactionSync(fn) });
    }
    private async schedule() {
        await this.ctx.storage.setAlarm(Date.now() + 5000);
    }
    private flush() {
        for (const row of this.store.pending()) {
            const text = JSON.stringify(row.message);
            for (const ws of this.ctx.getWebSockets()) {
                const attachment = ws.deserializeAttachment() as {
                    expires: number;
                } | null;
                if (!attachment || attachment.expires <= Date.now()) {
                    ws.close(1008, 'Phiên kết nối đã hết hạn');
                    continue;
                }
                try {
                    ws.send(text);
                }
                catch {
                    ws.close(1011, 'Vui lòng kết nối lại');
                }
            }
            this.store.markPublished(row.sequence);
        }
    }
    async fetch(request: Request) {
        try {
            const url = new URL(request.url), role = request.headers.get('X-Academy-Role') ?? '', now = Date.now();
            if (url.pathname === '/ws') {
                const protocols = (request.headers.get('Sec-WebSocket-Protocol') ?? '').split(',').map(s => s.trim());
                if (protocols.length !== 2 || protocols[0] !== 'academy-v1' || !/^ticket-[\da-f-]{36}$/.test(protocols[1]) || !this.store.consumeTicket(protocols[1], now))
                    return json({ error: errors.denied }, 401);
                if (this.ctx.getWebSockets().length >= 100)
                    return json({ error: errors.failure }, 429);
                const pair = new WebSocketPair();
                pair[1].serializeAttachment({ expires: now + 15 * 60000 });
                this.ctx.acceptWebSocket(pair[1]);
                pair[1].send(JSON.stringify(this.store.snapshot()));
                await this.schedule();
                return new Response(null, { status: 101, webSocket: pair[0], headers: { 'Sec-WebSocket-Protocol': 'academy-v1' } });
            }
            if (!this.store.budget(role, now, 1))
                return json({ error: errors.failure }, 429);
            if (request.method === 'GET' && url.pathname === '/state')
                return json(this.store.snapshot());
            if (request.method !== 'POST' && !(request.method === 'GET' && url.pathname === '/backup'))
                return json({ error: errors.invalid }, 405);
            if (url.pathname === '/ticket') {
                const ticket = 'ticket-' + crypto.randomUUID();
                this.store.ticket(ticket, role, now);
                return json({ ticket });
            }
            if (url.pathname === '/events') {
                const input = await body(request, 65536);
                if (!Array.isArray(input) || input.length < 1 || input.length > 25 || !this.store.budget(role, now, input.length))
                    return json({ error: errors.invalid }, 400);
                // Transport receive time is authoritative. Occurrence time is untrusted and validated by the engine.
                const events = input.map(e => e && typeof e === 'object' ? { ...e, receivedAt: now } : e);
                await this.schedule();
                const receipts = this.store.processBatch(events);
                this.flush();
                return json({ receipts, sequence: this.store.read().sequence });
            }
            if (url.pathname === '/commands') {
                const value = await body(request, 4096) as {
                    id: string;
                    command: unknown;
                };
                await this.schedule();
                const result = this.store.command(value.id, value.command, now);
                this.flush();
                return json(result);
            }
            if (url.pathname === '/backup') {
                const payload = JSON.stringify(this.store.backup());
                if (new TextEncoder().encode(JSON.stringify({ payload, signature: '0'.repeat(64) })).length > 16 * 1024 * 1024)
                    throw Error('capacity');
                return json({ payload, signature: await signature(payload, this.env.BACKUP_KEY) });
            }
            if (url.pathname === '/restore') {
                if (this.env.RESTORE_ENABLED !== 'true')
                    return json({ error: errors.denied }, 403);
                const value = await body(request, 16 * 1024 * 1024) as {
                    payload: string;
                    signature: string;
                };
                if (typeof value.payload !== 'string' || typeof value.signature !== 'string' || !await equal(value.signature, await signature(value.payload, this.env.BACKUP_KEY)))
                    return json({ error: errors.denied }, 403);
                const snapshot = this.store.restore(JSON.parse(value.payload));
                return json(snapshot);
            }
            return json({ error: errors.invalid }, 404);
        }
        catch {
            return json({ error: errors.failure }, 400);
        }
    }
    async alarm() {
        this.flush();
        for (const ws of this.ctx.getWebSockets()) {
            const a = ws.deserializeAttachment() as {
                expires: number;
            } | null;
            if (!a || a.expires <= Date.now())
                ws.close(1008, 'Phiên kết nối đã hết hạn');
        }
        if (this.ctx.getWebSockets().length || this.store.pending().length)
            await this.schedule();
    }
    webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
        try {
            const attachment = ws.deserializeAttachment() as {
                expires: number;
            } | null;
            if (!attachment || attachment.expires <= Date.now() || typeof message !== 'string' || message.length > 512 || !this.store.budget('socket', Date.now(), 1))
                throw Error('invalid');
            const input = JSON.parse(message) as {
                type: string;
                epoch: string | null;
                sequence: number;
            };
            if (input.type !== 'resume' || !(input.epoch === null || typeof input.epoch === 'string'))
                throw Error('invalid');
            for (const item of this.store.sync(input.epoch, input.sequence))
                ws.send(JSON.stringify(item));
        }
        catch {
            ws.close(1008, errors.invalid);
        }
    }
    webSocketClose(ws: WebSocket, code: number) {
        ws.close(code === 1005 ? 1000 : code);
    }
    webSocketError(ws: WebSocket) {
        ws.close(1011, 'Vui lòng kết nối lại');
    }
}
