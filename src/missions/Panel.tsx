import { t } from '../i18n/vi';
import { useState } from 'react';
import type { GameState } from '../game/engine';
import { QUESTIONS } from '../game/progression';
import { DEFAULT_CONFIG, receive, openQuiz, configureLive } from './rules';
import type { Kind } from './rules';
import { MissionView } from './View';
import './style.css';
export function MissionPanel({game,update,now}:{game:GameState;update:(r:(s:GameState)=>GameState)=>void;now:number}){
 const [student,setStudent]=useState(game.players[0].id),[kind,setKind]=useState<Kind>('comment'),[text,setText]=useState('nhaphoc'),[count,setCount]=useState('1'),[question,setQuestion]=useState('q1'),[seconds,setSeconds]=useState('30');
 const [config,setConfig]=useState(JSON.stringify(game.live?.config??DEFAULT_CONFIG,null,2)),[message,setMessage]=useState('');
 return <section className="mission-panel"><h2>{t("Nhiệm vụ TikTok LIVE · Chỉ mô phỏng")}</h2><p>{t("Dùng dữ liệu mô phỏng trên trình duyệt này; không kết nối TikTok thật. Lệnh: nhaphoc, diemdanh, thi và A/B/C/D. Mỗi bình luận cách nhau ít nhất 3 giây theo cấu hình mặc định.")}</p>
 <label>{t("Học sinh mô phỏng")}<select value={student} onChange={e=>setStudent(e.target.value)}>{game.players.map(p=><option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>
 <label>{t("Loại sự kiện")}<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{(['join','like','comment','share','gift'] as Kind[]).map((k,i)=><option key={k} value={k}>{[t("Vào trường"),t("Thả tim"),t("Bình luận"),t("Chia sẻ"),t("Tặng quà")][i]}</option>)}</select></label>
 <label>{t("Nội dung bình luận")}<input value={text} onChange={e=>setText(e.target.value)} maxLength={160}/></label><label>{t("Số lượng")}<input type="number" value={count} onChange={e=>setCount(e.target.value)} min="1" max="10000"/></label>
 <button onClick={()=>{const p=game.players.find(p=>p.id===student)!;update(s=>receive(s,{id:crypto.randomUUID(),playerId:p.id,nickname:p.nickname,kind,count:Number(count),text},Date.now()));setMessage(t("Đã gửi sự kiện mô phỏng. Sự kiện không hợp lệ, trùng hoặc quá giới hạn sẽ không được thưởng."));}}>{t("Gửi sự kiện mô phỏng")}</button>
 <label>{t("Câu hỏi quiz")}<select value={question} onChange={e=>setQuestion(e.target.value)}>{QUESTIONS.map(q=><option key={q.id} value={q.id}>{q.prompt}</option>)}</select></label><label>{t("Thời gian quiz (15–300 giây)")}<input type="number" value={seconds} onChange={e=>setSeconds(e.target.value)}/></label><button onClick={()=>update(s=>openQuiz(s,crypto.randomUUID(),question,Date.now(),Number(seconds)))}>{t("Mở quiz có thời hạn")}</button>
 <p>{t("Thi: gửi lệnh thi khi đủ XP, sau đó gửi 5 đáp án A/B/C/D theo thứ tự ngân hàng câu hỏi. Mỗi phiên chỉ được thi một lần. Trong lúc thi, đáp án được dùng cho kỳ thi thay vì quiz.")}</p>
 <MissionView game={game} now={now} student={student}/>
 <details><summary>{t("Cấu hình XP và giới hạn mô phỏng")}</summary><p>{t("Giới hạn XP áp dụng cả phần thưởng nhiệm vụ và quiz. Quà chỉ cộng điểm cống hiến. Cooldown tối thiểu 1 giây.")}</p>{Object.keys(DEFAULT_CONFIG).map(key=><label key={key}>{({join:t("XP vào trường"),like:t("XP thả tim"),comment:t("XP bình luận"),share:t("XP chia sẻ"),enroll:t("XP nhập học"),attendance:t("XP điểm danh"),quiz:t("XP quiz đúng"),mission:t("XP nhiệm vụ cá nhân"),school:t("XP nhiệm vụ toàn trường"),dailyCap:t("Giới hạn XP mỗi ngày"),sessionCap:t("Giới hạn XP mỗi phiên"),cooldownMs:t("Khoảng cách sự kiện (mili giây)")} as Record<string,string>)[key]}<input type="number" value={JSON.parse(config)[key]} onChange={e=>setConfig(JSON.stringify({...JSON.parse(config),[key]:Number(e.target.value)}))}/></label>)}<button onClick={()=>{try{const c=JSON.parse(config);update(s=>configureLive(s,c,Date.now()));setMessage(t("Chỉ cấu hình số nguyên hợp lệ mới được áp dụng."));}catch{setMessage(t("Cấu hình JSON không hợp lệ."));}}}>{t("Áp dụng cấu hình mô phỏng")}</button></details><p role="status">{message}</p></section>;
}
