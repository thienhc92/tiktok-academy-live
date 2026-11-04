# TikTok Academy Live — project specification

## Goal and scope

A host-operated virtual school displayed on TikTok LIVE in portrait 9:16. Viewers participate exclusively through likes, comments, shares and gifts. The browser's direct controls are simulator/operator tools, not a required viewer interface. Default mode is offline mock simulation; no TikTok affiliation or API access is implied.

A working local MVP takes priority over production integration. This specification defines proposed defaults that can be changed before their milestone. No paid services are authorized. Existing Cloudflare automatic deployment follows the owner-approved merge workflow; new hosting/integrations require approval.

## Existing implementation audit (baseline 4aaabad)

Vite/React/TypeScript SPA; procedural R3F/Drei school exterior, gate, courtyard, stage, trees and benches. Twenty animated avatars and nickname labels; touch orbit/zoom, opt-in sound, portrait styling, mock comment/like/gift feed, pause control and fullscreen fallback. No classroom interior, functional learning loop, database, authentication, admin panel or live connection. Initial leaderboard and XP were static/session-only. Physical iPad performance and browser rendering have not been verified. Dependencies have not installed in this environment.

## Functional requirements and acceptance

| ID | Requirement | Acceptance criteria | Current status |
| --- | --- | --- | --- |
| F01 | 3D school | Courtyard, classroom interior and ceremony stage render; view switching preserves game state | Exterior/stage implemented; interior pending |
| F02 | Student avatars | At least 20 animated avatars, distinct nicknames, selected profile, reduced-motion support | Implemented; browser verification blocked |
| F03 | Profiles | Stable IDs survive nickname changes; XP and contribution survive reload; invalid saves handled visibly | Local implementation in M1; server durability pending |
| F04 | Eleven ranks | Ordered thresholds, examination gates and rank labels; exact boundary tests | Mock rank/exam implementation complete; see docs/PROGRESSION.md |
| F05 | Separate currencies | Academic XP and contribution independent; gifts give no academic XP | Implemented M1; engine tests passed |
| F06 | Missions | Per-player like/comment/share/gift objectives, visible progress, capped rewards exactly once per mission | Pending M2 |
| F07 | Quizzes | Host opens question; first valid A/B/C/D comment per ID wins submission; deadline, scoring and answer reveal | Pending M2 |
| F08 | Exams and ceremony | Eligible players enter; score gate; no duplicate promotion; stage animation confirms outcome | Mock rank/exam implementation complete; see docs/PROGRESSION.md |
| F09 | Management positions | Capacity, published eligibility, deterministic tie breaks, terms, audit and no paid appointment | Mock capacity-limited session appointments; full governance pending |
| F10 | Top 10 | Sort XP descending, contribution descending, then stable ID ascending; update after events | Implemented M1; engine tests passed |
| F11 | Effects | Bounded, pooled gift effects and promotion animation; reduced-motion option | Pending M5; avatar animation exists |
| F12 | Admin | Pause intake, open/close quiz/exam, inspect events, reset with confirmation; production authentication | Pending M2/M6 |
| F13 | Event adapters | Mock and live transport share validated contract; reconnect/replay cannot duplicate awards | Mock boundary M1; live pending M7 |
| F14 | Database | Transactional profiles, event dedup, quiz submissions, missions, appointments; survives server restart | Pending M6; local storage is not the production database |
| F15 | Deployment | Reproducible locked install/build, documented service startup, health checks, backups and environment template | Pending M6/M7; no public deployment |

## Rules and proposed balancing

The M1 rules award per accepted normalized event: like 1 XP / 1 contribution (batch capped at 100); comment 5 XP / 2 contribution (one); share 10 XP / 5 contribution (one); gift 0 XP / 20 contribution (batch capped at 10). Count must be a positive integer no greater than 10,000. Gift units are mock completed gifts, not diamonds or currency. Comment volume and repeated shares need per-player time budgets before live integration. No reward for submitting the same event ID twice within the retained window.

All demo players start at zero; the previous decorative scores had no saved progress to migrate. Mock identities are mock-0 through mock-19; operator interactions use mock-host. Nicknames are display text only. Ranked IDs tie-break by exact string order. Replay protection retains 2,000 IDs; roster capped at 1,000; balances saturate at one billion. These are memory bounds, not production anti-abuse guarantees.

Proposed rank ladder (thresholds are eligibility, not automatic awards): Student 0; Active Student 100; Scholar 300; Senior Scholar 600; Mentor 1,000; Class Leader 1,500; Teaching Assistant 2,200; Teacher 3,200; Department Head 4,500; Vice Principal 6,000; Principal 8,000. Promotions require exams from Mentor onward (at least 80% correct); exam attempts limited to one per session. M3 must encode and test this policy. Rank qualification is permanent academic progress; holding a limited office is a separate, expiring assignment.

Proposed offices: Class Leader 4, Department Head 2, Vice Principal 1, Principal 1. Eligibility: corresponding rank, passed exam, active this session, no overlapping office, no moderation restriction. Score by exam results then completed learning missions then earlier eligibility timestamp then stable ID. Gifts and contribution cannot decide appointments. Terms last one session with rotation before repeat terms. M4 must define tie-break and vacancy tests before activating offices.

## Architecture

Current: React presentation → useGame persistence coordinator → pure applyEvent reducer. mockAdapter creates normalized events; engine has no SDK, DOM or React dependency. Versioned browser localStorage snapshots persist balances and bounded replay IDs. A corrupt/incompatible save is preserved and a temporary session warning displayed. Failed writes show a warning. One browser/tab is supported; concurrent tabs can overwrite each other. This data is editable by the operator and unsuitable for real prizes.

Target: connector process (server-side credentials only) → validated, normalized event queue → authoritative engine → SQLite transactions/event ledger → WebSocket snapshots → React rendering. Start with one Node server and SQLite on a persistent volume, not distributed services. Store processed source IDs durably and atomically with rewards; use server timestamps for deadlines. Normalize completed gift streaks and incremental likes; reject malformed traffic, bound queues and rate-limit by stable viewer identity. Mock and live transports remain interchangeable. Local UI never grants trusted production rewards.

Suggested records: players(id, nickname, xp, contribution, rank); events(source, event_id unique, received_at, player_id); quizzes/questions/submissions(unique quiz_id + player_id); mission_progress(unique mission_id + player_id); exam_attempts; office_terms; admin_audit. Schema changes require migrations and restart/backup tests.

## Quality, safety and operations

Target current iPad Safari with WebGL2 and modern mobile browsers, portrait 9:16 and tablet widths. Aim for at least 30 FPS with 20 avatars on representative hardware; cap DPR at 1.5, limit effects/draw calls, pause hidden-tab work, add a low-quality preset. Measure before claiming the target. Safe-area controls, readable stream text, keyboard-accessible admin tools, reduced motion, opt-in sound and context-loss recovery are acceptance targets.

Production gates: authenticated admin authorization on the server; no secrets in Vite variables; validate connector permissions/terms; minimize retained viewer data; decide retention/deletion policy before live collection; TLS/WSS; abuse budgets; observable rejected events and reconnect state; backup/restore verification; graceful shutdown. Credentials and any public launch require owner approval. No real TikTok connectivity is promised without an available authorized integration.

## Verification strategy

Dependency-free Node tests cover engine rules, identity, invalid inputs, ordering, replay, storage round trips and limits. Build must typecheck and bundle. Future milestones add deterministic clock-driven mission/quiz tests, database restart/transaction tests, adapter contract tests and browser flows. Manual iPad checks: portrait layout, touch orbit, text legibility, sound unlock, fullscreen fallback, storage restrictions, reload persistence and 10-minute thermal/frame-rate run. Distinguish tests of the storage port from an actual browser reload.

## Broadcast presentation increment

Dedicated 9:16 Broadcast Mode and separate Admin Mode share existing game state. Overlays show XP, top 10 and the existing 5,000 XP community goal. Join/like/gift notices and an explicit promotion preview are presentation only; the original presentation increment did not include learning rules; academic progression and exams are now implemented in the increment below. See docs/BROADCAST.md for rendering budgets and browser validation evidence. No TikTok API or public deployment added.

## Academic progression implementation

The eleven-rank ladder, configurable thresholds, exam gates, local rank/history persistence and 3D promotion ceremony are implemented. A mock question-bank harness awards validated quiz XP; full timed/live quizzes remain M2 work. Academic-only limited session appointments are separate from rank. See docs/PROGRESSION.md for exact implemented rules, migration, bounded records and remaining governance limitations. Existing browser balance saves are retained.

## TASK-017 simulated LIVE missions

Normalized mock events and Vietnamese commands now drive capped academic rewards, daily/collective missions, timed quizzes and command-based examinations. Mission XP triggers eligible academic promotions/ceremonies, with gifts excluded from academic rewards. The Admin simulator and Broadcast question/goal overlays are implemented; see docs/MISSIONS.md for exact limits, persistence and mock-only scope. No real connector or production anti-cheat is introduced.

## TASK-019 — Authoritative realtime increment

Current implementation adds an opt-in Cloudflare Worker + SQLite Durable Object
backend alongside existing browser-only simulation. The server reuses normalized
processing and academic rules; event receipts, reward deltas, snapshots and
outbox commit atomically. Browser state is a projection, never a source of trusted
XP. Separate ingest/admin/view bearer roles, one-use WebSocket tickets, exact
Origin checks and bounded requests protect the boundary. Snapshot/delta epoch and
sequence support reconnect/gap recovery. Vietnamese Admin diagnostics and signed
backup export are included; restore is disabled by default and only supports an
empty repository. See docs/REALTIME_BACKEND.md for acceptance criteria, protocol,
retention, free-tier verification, deployment gates and explicit runtime limits.
No real connector, public backend deployment or automatic frontend connection is
introduced. Previous Node-only architecture notes describe earlier milestones;
Worker/DO is the target for this increment. Long-running compaction, operations,
physical-device/performance verification and public launch remain release gates.

## TASK-020 — Staging preparation only

The isolated staging configuration is `backend/wrangler.staging.json`: same
Worker entry and SQLite class, a separate Worker/namespace, exact existing Pages
origin, workers.dev/preview disabled and no routes. No account changes, real
secrets, deploy workflows, frontend changes or public backend are introduced.
The iPad runbook in docs/CLOUDFLARE_STAGING.md distinguishes Free-plan compatibility
from unverified account readiness, documents quota/secret/deployment side effects
and separates approval for a closed deployment from public ingress approval.
