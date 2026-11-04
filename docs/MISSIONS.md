# TASK-017 — simulated LIVE missions

No TikTok SDK, credentials or external event connection is used. The Admin section
“Nhiệm vụ TikTok LIVE · Chỉ mô phỏng” sends normalized mock join/like/comment/share/
gift events through one pure reducer. Existing chat and automatic mock events use
this same path. The separate QA lab remains memory-only and isolated; the new LIVE
simulator intentionally advances the normal browser-local mock roster.

## Commands and learning

Comments normalize case/outer whitespace. `nhaphoc` enrolls once per player;
`diemdanh` checks in once per Vietnamese calendar day (UTC+7). `thi` starts a
five-answer examination only with the existing next-rank XP/exam prerequisites.
The next five A/B/C/D comments go to that exam, one at a time. During an exam,
answers do not also score the public quiz. Existing 80% pass, one attempt per
session, rank separation and limited-office rules still apply.

The operator opens a bank question for 15–300 seconds. Its absolute deadline is
persisted; countdown refreshes locally every second while the tab is visible.
The first valid A/B/C/D per player before the exclusive deadline is final. Wrong,
late, duplicate or unrecognized answers earn no quiz XP. Leaderboard orders correct
answers by submission time, then stable ID; it shows the top 10. Expired quizzes
reveal the answer. A new round cannot replace an active one. No client-supplied
correctness flag is accepted.

## Rewards and missions

Defaults: join 2 XP; like 1/unit; distinct comment 5; share 10; first enrollment 20;
daily attendance 10; correct timed quiz 25; daily mission 20; school mission 25 per
active non-gift participant. Gifts give 20 contribution/unit and zero academic XP.
Admin can configure all XP amounts, daily/session caps and cooldown using labeled
Vietnamese number inputs. Default XP caps are 500/day and 200/session, including
mission/quiz bonuses. Rewards are clipped to remaining budget; excess is not banked.
Existing academic XP is never reduced. Operator-only legacy quiz/exam/QA harnesses
retain their documented rules; they are not LIVE event ingestion endpoints.

Daily missions auto-complete once: attendance, three accepted comments, one share,
one correct timed quiz. Whole-school daily goal: 100 likes, 10 accepted comments,
five shares; completion rewards participants active that day once. Gifts never
advance academic goals. Rewards automatically check academic promotions through
all currently eligible ranks; senior ranks stop at their exam gate. Passed exams
resume eligible promotion and trigger the existing 3D ceremony. No office is
automatically granted. Bounded 3D particle/text effects mark missions and gifts.

## Spam, persistence and limits

Event IDs share the existing persisted 2,000-entry replay window. Valid but rejected
spam IDs are consumed. Accepted IDs are additionally retained per player/day (bounded to 600 by action limits), preventing same-day repayment after shared-window eviction. Per-player/per-kind default cooldown is 3 seconds (minimum
configurable 1 second). Identical normalized non-answer comments cannot repeat in
one day. Repeat enrollment/attendance and invalid exam/answer commands do not farm
comment missions. Counts are capped per session: join 1, like 100, comment 30,
share 5, gift 50; daily limits are three times those values. Like batches cap at
20/event; gift batches cap at 10; comments/joins/shares use one unit. XP budgets
are additional limits, not alternatives to cooldown/count restrictions.

A new academic session clears per-session budgets/counts and pending exams on the
next event, not daily claims or XP budgets. Daily rollover resets daily missions,
not a still-active session's budget. Backdated events are rejected. Quiz answers,
ledgers, config, collective state and pending exams are validated on load as an
additive live section; old saves load unchanged. Invalid saves retain the existing
preserve-and-warn behavior. Local browser time/storage is editable and single-tab;
this is not production anti-cheat or a durable server ledger. Replay protection
is bounded, and local storage/snapshot capacity still applies. No unlimited event
history, live authentication or production readiness is claimed.

## Presentation and validation

Vietnamese Broadcast shows collective progress in the corner and the current quiz
in its reserved upper region, with a compact scrollable leaderboard. Pending exams
show the next bank question with the candidate nickname. Personal daily progress,
budgets and full simulator are in Admin Mode. Effects are bounded and respect
reduced motion; there are no new external assets/dependencies.

52 Node tests cover prior rules plus event validation, replay/spam, command rewards,
Vietnam-local rollover, day/session caps, quiz deadlines/scoring/persistence,
collective completion, exam/promotion integration and corrupt/legacy saves.
Production TypeScript/Vite build and Chromium software-WebGL smoke pass. Browser
flow covers attendance/mission XP, timed answer reward, countdown expiry, top-answer
leaderboard, reload restoration and 9:16 phone/iPad bounds. Physical iPad Safari
performance, actual stream readability and long-session storage stress remain
unverified. Existing large-bundle warning remains.
