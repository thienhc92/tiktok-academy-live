import {DatabaseSync} from 'node:sqlite';
import {restoreTempleSnapshot,validTempleSnapshot} from '../src/photo/live/repository.ts';
import type {TempleRepository} from '../src/photo/live/repository.ts';
import type {TempleState,TempleResult} from '../src/photo/live/processor.ts';
export class SQLiteTempleRepository implements TempleRepository {
 private db:DatabaseSync;
 constructor(filename:string){
  this.db=new DatabaseSync(filename);
  const version=Number(this.db.prepare('PRAGMA user_version').get()!.user_version);
  const app=Number(this.db.prepare('PRAGMA application_id').get()!.application_id);
  const tables=this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  if((tables.length&&app!==1414351956)||(version!==0&&version!==1)){this.db.close();throw Error('Unknown database; preserved');}
  this.db.exec('PRAGMA busy_timeout=5000;PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;');
  this.db.exec('CREATE TABLE IF NOT EXISTS temple_trial(room TEXT PRIMARY KEY, body TEXT NOT NULL);PRAGMA user_version=1;PRAGMA application_id=1414351956;');
 }
 async transact(mode:'MOCK'|'LIVE',seed:TempleState,change:(state:TempleState)=>TempleResult){
  if(mode!=='LIVE')throw Error('LIVE only');this.db.exec('BEGIN IMMEDIATE');
  try{
   const row=this.db.prepare('SELECT body FROM temple_trial WHERE room=?').get(seed.roomId);
   const state=row?restoreTempleSnapshot(JSON.parse(String(row.body)),'LIVE'):seed;
   const result=change(state);if(!validTempleSnapshot(result.state,'LIVE')||result.state.roomId!==seed.roomId)throw Error('Invalid state');
   this.db.prepare('INSERT INTO temple_trial VALUES(?,?) ON CONFLICT(room) DO UPDATE SET body=excluded.body').run(seed.roomId,JSON.stringify({...result.state,game:{...result.state.game,notice:null}}));
   this.db.exec('COMMIT');return result;
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 close(){this.db.close();}
}
