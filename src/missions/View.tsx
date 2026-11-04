import { t } from '../i18n/vi';
import type { GameState } from '../game/engine';
import { QUESTIONS } from '../game/progression';
import { quizLeaders,dayKey } from './rules';
export function MissionView({game,now,student,compact=false}:{game:GameState;now:number;student?:string;compact?:boolean}){
 const live=game.live,q=live?.quiz,question=QUESTIONS.find(x=>x.id===q?.questionId),active=q&&now<q.closesAt;
 const exam=live?.records.find(r=>r.exam&&r.session===game.academy.session);const examQuestion=exam?.exam?QUESTIONS[exam.exam.answers.length]:undefined;
 const r=live?.records.find(r=>r.id===student&&r.day===dayKey(now));const school=live?.school.day===dayKey(now)?live.school:null;
 return <div className="mission-view">{!(compact&&q)&&<div className="school-missions"><b>{t("Nhiệm vụ toàn trường")}</b><span>♥ {school?.likes??0}{t("/100 · Bình luận")} {school?.comments??0}{t("/10 · Chia sẻ")} {school?.shares??0}/5</span>{school?.claimed&&<strong>{t("Đã hoàn thành ✓")}</strong>}</div>}
 {student&&<div><b>{t("Nhiệm vụ hằng ngày")}</b><ul><li>{t("Điểm danh:")} {r?.attendance?'✓':t("Chưa")}</li><li>{t("3 bình luận:")} {Math.min(3,r?.counts.comment??0)}/3</li><li>{t("Chia sẻ:")} {Math.min(1,r?.counts.share??0)}/1</li><li>{t("Quiz đúng:")} {Math.min(1,r?.quizCorrect??0)}/1</li></ul><p>{t("XP hôm nay:")} {r?.dailyXP??0}/{live?.config.dailyCap??500}  {t("· XP phiên:")} {r?.sessionXP??0}/{live?.config.sessionCap??200}</p>{r?.exam&&<p>{t("Đang thi: đáp án")} {r.exam.answers.length}/5</p>}</div>}
 {exam&&examQuestion&&<section className="timed-quiz"><b>{t("Kỳ thi:")} {game.players.find(p=>p.id===exam.id)?.nickname}</b><p>{examQuestion.prompt}</p><div>{examQuestion.options.map((o,i)=><span key={o}>{'ABCD'[i]}. {o}</span>)}</div></section>}
 {q&&question&&<section className="timed-quiz" aria-label={t("Quiz trực tiếp mô phỏng")}><b>{active?t("Còn {0} giây",Math.max(0,Math.ceil((q.closesAt-now)/1000))):t("Quiz đã kết thúc")}</b><p>{question.prompt}</p><div>{question.options.map((o,i)=><span key={o}>{'ABCD'[i]}. {o}</span>)}</div>{!active&&<p>{t("Đáp án:")} {question.answer}</p>}<details><summary>{t("Top trả lời đúng")}</summary><ol>{quizLeaders(live!).map(a=><li key={a.playerId}>{game.players.find(p=>p.id===a.playerId)?.nickname} · {((a.at-q.openedAt)/1000).toFixed(1)}  {t("giây")}</li>)}</ol></details></section>}
 </div>;
}
