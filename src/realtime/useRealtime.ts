import { useEffect, useRef, useState } from 'react';
import { RealtimeClient } from './client';
import type { Status } from './client';
import type { SnapshotMessage } from './protocol';
export function useRealtime() {
    const client = useRef<RealtimeClient | null>(null), [enabled, setEnabled] = useState(false), [snapshot, setSnapshot] = useState<SnapshotMessage | null>(null), [status, setStatus] = useState<Status>('offline');
    useEffect(() => () => client.current?.stop(), []);
    function connect(url: string, token: string) {
        client.current?.stop();
        setSnapshot(null);
        try {
            client.current = new RealtimeClient(url, token, setSnapshot, setStatus);
            setEnabled(true);
            client.current.start();
            return true;
        }
        catch {
            setEnabled(false);
            setStatus('error');
            return false;
        }
    }
    function disconnect() {
        client.current?.stop();
        client.current = null;
        setSnapshot(null);
        setEnabled(false);
    }
    return { enabled, snapshot, status, connect, disconnect, backup: () => client.current?.request('/backup', {}), command: (command: unknown) => client.current?.command(command) };
}
