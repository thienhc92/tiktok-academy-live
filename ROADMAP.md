# Development roadmap

Each milestone ends with updated TASKS.md, verification evidence, a reviewable commit and remaining risks. Implementation does not imply browser validation.

| Milestone | Scope | Exit criteria | State |
| --- | --- | --- | --- |
| M0 — baseline | Audit, specification, architecture, acceptance criteria | Existing behavior and missing features documented | Complete |
| M1 — player foundation | Pure event reducer, mock adapter, XP/contribution, local saved profiles, reactive leaderboard | Rule/storage tests pass; build and browser reload checked when environment permits | Implemented; build passes, browser/device checks pending |
| M2 — learning loop | Timed quizzes via A/B/C/D, automatic missions, local operator panel | Fake-clock tests for deadlines, first submission, single rewards; host can complete full round | Next |
| M3 — advancement | Eleven ranks, eligibility, exam attempts and ceremony state | Boundary and duplicate-promotion tests; complete promotion on stage | Mock implementation and browser flow verified; physical device pending |
| M4 — school governance | Capacity, terms, rotation, auditable fair appointments | No overbooking; deterministic ties; gifts cannot buy office | Pending |
| M5 — campus polish | Classroom interior, ceremony/gift effects, low-quality mode, context recovery | Portrait stream legibility and measured iPad 30 FPS target; bounded effects | Pending |
| M6 — durable host | Node service, SQLite migrations, authoritative engine, authenticated admin, WebSockets | Transaction, restart, backup/restore and authorization tests; local startup docs | Pending |
| M7 — integration/release | Authorized TikTok adapter, reconnect/dedup/backpressure, health checks, deployment packaging | Contract/replay tests; staging smoke; owner approves any public deployment | Pending |

Critical path: browser/device baseline → learning loop → exams → governance → durable server → live transport. Visual polish can follow the learning loop without delaying core rule tests. No paid infrastructure is needed for local MVP development. Creating a hosted PR depends on remote capability; public deployment is a separate approval gate.

Build infrastructure: npm lockfile, PR test/build workflow, pinned Node and static Cloudflare Pages configuration prepared. Cloudflare automatic deployment was approved for the Broadcast PR #3 merge.

M5 presentation subset: dedicated Broadcast Mode, compact overlays, bounded notification animations and mobile rendering controls implemented. Classroom interior, real promotion/gift effects, context recovery and measured iPad validation remain pending.

Portrait refinement: compact header/corners, three-second notifications, reserved announcement region, improved student spacing and Safari fullscreen guidance. Device-specific validation remains open.

iPad Broadcast View increment: largest-fit safe-viewport composition, clean operator-control reveal, explicit entry, readable minimum type and capability-tested fullscreen fallback. Real-device Safari behavior remains a validation task.

Academic increment adds quiz answer harness and basic limited appointments. Full timed M2 rounds and M4 rotation/moderation/activity governance remain pending; see docs/PROGRESSION.md.

QA increment: isolated memory-only Admin simulation lab reuses academic validators, with independent XP grants/reset and a separate ceremony preview. No production/player storage or live event integration.

TASK-015: centralized Vietnamese UI implemented across Admin, Broadcast, progression and QA; portrait browser validation completed, physical-device validation remains open.

Layout correction: Vietnamese mode controls moved into document flow; aspect-aware camera fit/reset, bounded orbit and collision-aware labels added. Gameplay remains unchanged; physical device verification pending.

TASK-017 adds simulated timed quizzes, daily/collective missions, command-driven
exams and bounded academic rewards. The transport remains mock-only; server-ledger
anti-abuse and actual live integration are still release gates.

TASK-018B implements the offline normalized event boundary, synthetic replay,
identity/dedup/counter policies and Admin inspection. Real connector, durable
backend, authentication and deployment are not implemented; see docs/OFFLINE_EVENTS.md.

TASK-018C adds local Node SQLite repository/crash recovery with atomic dedup,
reward ledger and sequenced snapshots. Cloudflare integration remains a documented
boundary, with no deployed backend; next is outbox/client resync and backup tests.
