import { useEffect,useRef,useState } from 'react';
import { t } from '../i18n/vi';
import { OfflineAdapter } from './OfflineAdapter';
import { FIXTURES } from './fixtures';
import { createReplay,processEvent } from './processor';
import type {ConnectionState} from './types';
import './style.css';
const statuses={disconnected:'Ngắt kết nối',connecting:'Đang kết nối mô phỏng',connected:'Đã kết nối mô phỏng',reconnecting:'Đang kết nối lại',ended:'Kết thúc bộ dữ liệu'};
const outcomes={invalid:'Không hợp lệ',duplicate:'Trùng sự kiện',anonymous:'Thiếu ID · Không thưởng',aggregate:'Tổng hợp phòng · Không thưởng',stale:'Cũ hoặc không tăng',pending:'Đã ghi nhận · Chưa thưởng',processed:'Đã xử lý hợp lệ',blocked:'Bị giới hạn bởi luật chơi',capacity:'Đã đầy bộ nhớ chống trùng'};
export function OfflineEventsPanel({active}:{active:boolean}){
 const replay=useRef(createReplay()),adapter=useRef<OfflineAdapter|null>(null);
 const [state,setState]=useState<ConnectionState>('disconnected'),[rows,setRows]=useState<{event:string;result:string}[]>([]),[position,setPosition]=useState(0),[revision,setRevision]=useState(0);
 function setup(){const a=new OfflineAdapter(FIXTURES);a.start({connection:setState,error:message=>setRows(r=>[...r,{event:'—',result:message}].slice(-100)),event:input=>{const result=processEvent(replay.current,input);replay.current=result.state;setRows(r=>[...r,{event:JSON.stringify(input),result:t(outcomes[result.outcome])}].slice(-100));setRevision(v=>v+1);}});adapter.current=a;}
 useEffect(()=>{setup();return()=>adapter.current?.stop();},[]);
 if(!active)return null;
 return <section className="offline-events"><h2>{t('Offline events title')}</h2><p>{t('Offline events help')}</p>
 <p role="status">{t(statuses[state])} · {position}/{FIXTURES.length}</p>
 <button onClick={()=>{adapter.current?.step();setPosition(adapter.current?.position??0);}}>{t('Replay next')}</button>
 <button onClick={()=>{while(adapter.current?.step()){}setPosition(adapter.current?.position??0);}}>{t('Replay all')}</button>
 <button onClick={()=>{adapter.current?.stop();}}>{t('Replay disconnect')}</button>
 <button onClick={()=>{setup();setPosition(0);}}>{t('Replay reconnect')}</button>
 <button onClick={()=>{adapter.current?.stop();replay.current=createReplay();setup();setRows([]);setPosition(0);setRevision(v=>v+1);}}>{t('Replay reset')}</button>
 <p data-revision={revision}>{t('Replay balances')}: {replay.current.game.players.map(p=>t('Replay player balance',p.nickname,p.xp,p.contribution)).join(' | ')||'—'}</p>
 <div className="offline-log"><table><thead><tr><th>{t('Normalized event')}</th><th>{t('Processing result')}</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td><code>{r.event}</code></td><td>{r.result}</td></tr>)}</tbody></table></div></section>;
}
