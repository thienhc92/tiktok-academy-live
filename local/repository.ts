import type {ReplayState,Outcome} from '../src/events/processor.ts';
import type {Player} from '../src/game/engine.ts';
export type Snapshot={version:1;sequence:number;state:ReplayState};
export type RewardTransaction={playerId:string;xp:number;contribution:number};
export type Receipt={key:string;sequence:number;outcome:Outcome;units:number;rewards:RewardTransaction[];duplicate:boolean};
/** Implementations serialize dedup, rewards and snapshot commit; never acknowledge before commit. */
export interface GameRepository {
 process(event:unknown):Receipt;
 snapshot():Snapshot;
 player(id:string):Player|undefined;
 receipt(key:string):Receipt|undefined;
 close():void;
}
