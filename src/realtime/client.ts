import { applyMessage } from './protocol.ts';
import type { SnapshotMessage, Message } from './protocol.ts';
export type Status = 'offline' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export function backendUrl(value: string) {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || !(url.protocol === 'https:' || url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
        throw Error('url');
    return url.origin;
}
export const retryDelay = (attempt: number) => Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
export class RealtimeClient {
    private url: string;
    private token: string;
    private onState: (value: SnapshotMessage) => void;
    private onStatus: (status: Status) => void;
    private current: SnapshotMessage | null = null;
    private ws: WebSocket | null = null;
    private stopped = true;
    private generation = 0;
    private attempt = 0;
    private retry: ReturnType<typeof setTimeout> | undefined;
    private poll: ReturnType<typeof setInterval> | undefined;
    private abort: AbortController | null = null;
    constructor(url: string, token: string, onState: (value: SnapshotMessage) => void, onStatus: (status: Status) => void) {
        this.url = backendUrl(url);
        this.token = token;
        this.onState = onState;
        this.onStatus = onStatus;
    }
    async request(path: string, value: unknown) {
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
        this.abort = controller;
        try {
            const response = await fetch(this.url + path, { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(value), signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store' });
            if (!response.ok)
                throw Error('request');
            return await response.json() as unknown;
        }
        finally {
            clearTimeout(timer);
            if (this.abort === controller)
                this.abort = null;
        }
    }
    start() {
        this.stopped = false;
        this.onStatus('connecting');
        void this.connect();
    }
    private resume() {
        if (this.ws?.readyState === WebSocket.OPEN)
            this.ws.send(JSON.stringify({ type: 'resume', epoch: this.current?.epoch ?? null, sequence: this.current?.sequence ?? 0 }));
    }
    private async connect() {
        const generation = ++this.generation;
        try {
            const value = await this.request('/ticket', {}) as {
                ticket: string;
            };
            if (this.stopped || this.generation !== generation)
                return;
            if (!/^ticket-[\da-f-]{36}$/.test(value.ticket))
                throw Error('ticket');
            const ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/ws', ['academy-v1', value.ticket]);
            this.ws = ws;
            const opening = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN)
                    ws.close();
            }, 10000);
            ws.onopen = () => {
                clearTimeout(opening);
                if (this.stopped || generation !== this.generation) {
                    ws.close();
                    return;
                }
                this.attempt = 0;
                this.resume();
                this.poll = setInterval(() => this.resume(), 15000);
            };
            ws.onmessage = event => {
                if (this.stopped || generation !== this.generation)
                    return;
                try {
                    if (typeof event.data !== 'string' || event.data.length > 2 * 1024 * 1024)
                        throw Error('message');
                    const message = JSON.parse(event.data) as Message;
                    const applied = applyMessage(this.current, message);
                    if (applied.resync) {
                        this.resume();
                        return;
                    }
                    if (applied.state) {
                        this.current = applied.state;
                        this.onState(applied.state);
                        this.onStatus('connected');
                    }
                }
                catch {
                    ws.close(1008);
                }
            };
            ws.onerror = () => ws.close();
            ws.onclose = () => {
                clearTimeout(opening);
                clearInterval(this.poll);
                if (!this.stopped && generation === this.generation)
                    this.reconnect();
            };
        }
        catch {
            if (!this.stopped && generation === this.generation)
                this.reconnect();
        }
    }
    private reconnect() {
        this.onStatus(this.current ? 'reconnecting' : 'error');
        clearTimeout(this.retry);
        this.retry = setTimeout(() => void this.connect(), retryDelay(this.attempt++));
    }
    async command(command: unknown) {
        return this.request('/commands', { id: crypto.randomUUID(), command });
    }
    stop() {
        this.stopped = true;
        this.generation++;
        clearTimeout(this.retry);
        clearInterval(this.poll);
        this.abort?.abort();
        this.ws?.close();
        this.ws = null;
        this.token = '';
        this.onStatus('offline');
    }
}
