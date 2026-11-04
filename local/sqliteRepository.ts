import {DatabaseSync} from 'node:sqlite';
import {createReplay,processEvent,eventKey} from '../src/events/processor.ts';
import {isNormalizedEvent} from '../src/events/types.ts';
import {parseProgress} from '../src/game/engine.ts';
import type {GameRepository,Receipt,RewardTransaction,Snapshot} from './repository.ts';
import type {Outcome} from '../src/events/processor.ts';
export type FaultPoint='beforeCommit'|'afterCommit';
/** Local Node adapter only. Never import into the Vite/browser graph. */
export class SQLiteGameRepository implements GameRepository {
 private db:DatabaseSync;
 private fault?: (point:FaultPoint)=>void;
 constructor(filename:string,fault?:(point:FaultPoint)=>void){
  this.db=new DatabaseSync(filename);this.fault=fault;
  try{
   this.db.exec('PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
   const version=Number(this.db.prepare('PRAGMA user_version').get()!.user_version);
   if(version!==0&&version!==1)throw Error('Unsupported database schema');
   if(version===0&&this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().length)throw Error('Refusing unknown existing database');
   this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;');
   try{
    this.db.exec(`CREATE TABLE IF NOT EXISTS snapshots(sequence INTEGER PRIMARY KEY,version INTEGER NOT NULL CHECK(version=1),body TEXT NOT NULL);
     CREATE TABLE IF NOT EXISTS events(event_key TEXT PRIMARY KEY,sequence INTEGER NOT NULL UNIQUE REFERENCES snapshots(sequence),outcome TEXT NOT NULL,units INTEGER NOT NULL);
     CREATE TABLE IF NOT EXISTS rewards(event_key TEXT NOT NULL REFERENCES events(event_key),player_id TEXT NOT NULL,xp INTEGER NOT NULL CHECK(xp>=0),contribution INTEGER NOT NULL CHECK(contribution>=0),PRIMARY KEY(event_key,player_id));
     PRAGMA user_version=1;`);
    if(version===0)this.db.prepare('INSERT OR IGNORE INTO snapshots VALUES(0,1,?)').run(JSON.stringify(createReplay()));
    this.db.exec('COMMIT');
   }catch(error){this.db.exec('ROLLBACK');throw error;}
   this.snapshot(); // Validate compatibility before accepting any work.
  }catch(error){this.db.close();throw error;}
 }
 snapshot():Snapshot{
  const row=this.db.prepare('SELECT sequence,version,body FROM snapshots ORDER BY sequence DESC LIMIT 1').get();
  if(!row||row.version!==1)throw Error('Unsupported snapshot version');
  const state=JSON.parse(String(row.body));
  if(!state||!parseProgress(JSON.stringify(state.game))||!Array.isArray(state.seen)||state.seen.length>10000||!state.seen.every((s:unknown)=>typeof s==='string')||new Set(state.seen).size!==state.seen.length||!Array.isArray(state.closed)||state.closed.length>10000||new Set(state.closed).size!==state.closed.length||!state.closed.every((s:unknown)=>typeof s==='string')||!state.counters||Object.keys(state.counters).length>10000||Object.getPrototypeOf(state.counters)!==Object.prototype||!Object.values(state.counters).every(v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=1e9)||!Number.isSafeInteger(state.clock)||state.clock<0||state.clock>8e15||(state.game.live?.now??0)>state.clock)throw Error('Invalid saved snapshot');
  return {version:1,sequence:Number(row.sequence),state};
 }
 receipt(key:string):Receipt|undefined{
  const row=this.db.prepare('SELECT * FROM events WHERE event_key=?').get(key);if(!row)return undefined;
  const rewards=this.db.prepare('SELECT player_id,xp,contribution FROM rewards WHERE event_key=? ORDER BY player_id').all(key).map(r=>({playerId:String(r.player_id),xp:Number(r.xp),contribution:Number(r.contribution)}));
  return {key,sequence:Number(row.sequence),outcome:String(row.outcome) as Outcome,units:Number(row.units),rewards,duplicate:false};
 }
 player(id:string){return this.snapshot().state.game.players.find(p=>p.id===id);}
 process(input:unknown):Receipt{
  if(!isNormalizedEvent(input))throw Error('Invalid normalized event');
  const key=eventKey(input);let receipt:Receipt;
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const existing=this.receipt(key);
   if(existing){this.db.exec('COMMIT');return {...existing,duplicate:true};}
   const before=this.snapshot(),result=processEvent(before.state,input);
   if(result.outcome==='capacity')throw Error('Offline replay capacity reached; no event committed');
   if(result.outcome==='invalid')throw Error('Invalid normalized event');
   const sequence=before.sequence+1;
   const rewards:RewardTransaction[]=result.state.game.players.flatMap(p=>{
    const previous=before.state.game.players.find(old=>old.id===p.id);
    const xp=p.xp-(previous?.xp??0),contribution=p.contribution-(previous?.contribution??0);
    if(xp<0||contribution<0)throw Error('Unexpected negative reward');
    return xp||contribution?[{playerId:p.id,xp,contribution}]:[];
   });
   this.db.prepare('INSERT INTO snapshots VALUES(?,1,?)').run(sequence,JSON.stringify(result.state));
   this.db.prepare('INSERT INTO events VALUES(?,?,?,?)').run(key,sequence,result.outcome,result.units);
   const insert=this.db.prepare('INSERT INTO rewards VALUES(?,?,?,?)');
   for(const reward of rewards)insert.run(key,reward.playerId,reward.xp,reward.contribution);
   receipt={key,sequence,outcome:result.outcome,units:result.units,rewards,duplicate:false};
   this.fault?.('beforeCommit');
   this.db.exec('COMMIT');
  }catch(error){this.db.exec('ROLLBACK');throw error;}
  // A fault here represents a lost acknowledgement; the transaction is already durable.
  this.fault?.('afterCommit');return receipt;
 }
 close(){this.db.close();}
}
