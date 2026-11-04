# Mock academic progression and promotion

## Ranks and XP

Student → Active Student → Scholar → Senior Scholar → Mentor → Class Leader →
Teaching Assistant → Teacher → Department Head → Vice Principal → Principal.
Default XP thresholds: 0, 100, 300, 600, 1,000, 1,500, 2,200, 3,200, 4,500, 6,000,
8,000. Admin Mode's progression panel edits all 11 thresholds; values must be
strictly increasing nonnegative integers starting at zero, capped at one billion.
Changing thresholds never revokes an earned rank. XP is not spent on promotion.

Validated mock likes/comments/shares retain their existing XP awards and event
batch limits. Gifts grant contribution only, never academic XP. The local question
bank validates A/B/C/D answers and awards 25 XP for a correct first submission.
Each question can be answered once per player for this MVP, across reloads and
sessions; wrong first answers are final. This is an operator quiz harness, not the
future timed live-comment quiz transport. Ordinary comments still award their
existing 5 XP; no user-supplied correct=true flag can grant quiz rewards.

## Promotion and exams

Select an avatar in Admin Mode to inspect current rank, balances, eligibility and
promotion history. **Promote & celebrate** grants only the next rank if its XP
threshold is met. Requests include an expected target rank so replaying/double-
clicking a target cannot grant a second rank. No gifts, office selection or quiz
answer bypasses the eligibility check.

From Mentor onward, the next rank also requires a passed five-question exam (80%
minimum). The engine grades the answers against its question bank. One valid
attempt is permitted per player per session; malformed or ineligible attempts do
not consume the attempt. An exam does not award XP. A failed attempt requires a
new session before retrying. A passed attempt remains valid for its target rank.
Starting a new mock session is an explicit confirmed operator action.

For quick local QA, lower thresholds to `0,1,2,3,4,5,6,7,8,9,10`, earn 25 XP with
one quiz, then promote through the first ranks. Fill all exam answers and submit
to unlock Mentor. Default thresholds remain available in progression.ts.

## Ceremony and avatar labels

Newly granted ranks trigger a six-second 3D ceremony at the central courtyard
podium: the promoted student moves into the spotlight, grows to 1.6× and returns
to base scale, with 32 golden particles and a rank title. Reduced motion keeps the
character/particles static. The latest promotion replaces an in-flight ceremony;
all earned promotions remain in history. Reloading does not replay past ceremonies.
The separate **Preview ceremony** notification is still labeled as a preview.

Rank and nickname occupy separate lines in one bounded label. Long academic
titles are ellipsized in the portrait scene, with the full title available via
label title and Admin profile. The wider four-column rows were spaced further
apart; the gate/floor framing adapts to preserve the 9:16 composition.

## Limited appointments

Academic titles do **not** grant school office seats. Explicit mock operator
commands fill eligible seats only: Class Leader 4, Department Head 2, Vice
Principal 1, Principal 1. A player needs at least the office's academic rank and
may hold only one seat. Seats last for the current session; starting a new session
expires seats but preserves ranks, history, quizzes and exam evidence.

Within each requested office, candidates sort by exam score descending, earlier
last-promotion time, then exact stable player ID. Gift value/contribution never
enters selection. Existing occupants are not displaced. Office commands are
idempotent when capacity is full. Cross-session rotation, moderation restrictions,
mission-based tie breaks and live activity eligibility remain future governance
work; this MVP does not claim those policies are implemented.

## Persistence and limits

The existing browser storage key and version remain readable. Legacy snapshots
without academy data keep every player balance and replay ID and initialize all
players as Student; historical promotions are not invented from XP. The additive
academy section stores thresholds, current session, rank history, quiz submissions,
exam evidence and current appointments. Invalid academy records reject the save;
the existing warning/temporary-session behavior preserves unreadable data.

History is bounded to ten promotions and five quiz IDs per player. Up to 100 exam
records are retained per player; older failures are evicted before any passed
promotion evidence. Existing 1,000-player/2,000-event bounds and the snapshot size
limit still apply. Browser-local data is editable, single-tab and mock-only; no
production rewards, credentials, authoritative database or real TikTok connector
is introduced. Real event cooldowns, server validation and durable dedup remain
production prerequisites.

## Verification

25 Node tests cover exact boundaries, configurable thresholds, single-step/replayed
promotions, exam score/retry gates, all ranks through Principal, quizzes/replays,
gift separation, capacities/one-office/term expiry, deterministic gift-independent
appointments, legacy/corrupt saves, bounded evidence retention and ceremony scaling.
TypeScript/Vite build passes. Chromium software-WebGL verifies operator quiz →
promotion → exam → Mentor ceremony, title expiry, saved rank/history after reload,
and no automatic office. Portrait phone/iPad smoke checks confirm 9:16 bounds and
no collisions among all 20 two-line labels. Physical iPad Safari performance and
screen-sharing behavior remain unverified.
