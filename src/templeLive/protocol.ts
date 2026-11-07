import type {TempleState} from '../photo/live/processor.ts';
import type {RitualCue} from '../photo/live/rituals.ts';
import type {ProgressCue} from '../photo/live/progress.ts';
export type LiveStatus='disconnected'|'connecting'|'connected'|'error';
export type LiveError='unconfigured'|'offline'|'not-found'|'network'|'auth'|'invalid'|'storage'|'room-mismatch';
export type LiveFrame={v:1;epoch:string;sequence:number;status:LiveStatus;mode:'LIVE'|'SIMULATION';username:string;error:LiveError|null;snapshot:TempleState|null;rituals:RitualCue[];progress:ProgressCue[]};
export function cleanUsername(value:unknown):string|null {
    if(typeof value!=='string')return null;
    const name=value.trim().replace(/^@/,'');return /^[a-zA-Z0-9_][a-zA-Z0-9._]{1,23}$/.test(name)&&!name.endsWith('.')?name:null;
}
