# TASK-018B — offline event boundary

## Implemented contract and adapter

`src/events/types.ts` defines a validated discriminated union for join, comment,
like and gift payloads plus share, with schema version, provider namespace,
room/session/event IDs, occurrence/receipt times and viewer identity. Viewer IDs
must be nonempty strings (not numbers, zero IDs or nicknames). Unknown identities
must explicitly use null; malformed/missing fields are rejected. Nicknames are
optional display data. Provider + viewer ID is the player key, across rooms.

`EventAdapter` reports unknown event inputs, connection states and errors without
importing React or any SDK. `OfflineAdapter` manually steps synthetic fixtures;
there are no HTTP requests, timers, external libraries, credentials or real room
names. The Vietnamese Admin inspector logs normalized payloads (technical field
names), outcomes, connection transitions/errors and independent test balances.
It renders nothing in Broadcast Mode. Switching modes preserves the run; reloading
or creating a new run intentionally discards it. Existing mock simulation and
regular player storage remain untouched.

## Processing semantics

- Dedup key: provider + room + session + event kind + source event ID, stored before processing.
  Duplicate/missing-identity/blocked observations cannot later become new rewards
  by reconnecting or changing the nickname. Keep the processor during reconnect.
- Exactly-once means at most one engine reward application for each eligible
  source event **within this offline run**; game cooldowns, caps, text validation
  and mission rules can deny a reward. No network delivery guarantee is claimed.
- Receipt/processing time is authoritative for reward deadlines; source time is
  metadata. A monotonic clock avoids rewinding missions/quizzes on out-of-order
  arrival. Events over 30 seconds older than the processing clock are rejected.
- Cumulative viewer likes need an explicit counter ID scoped to provider/room/
  session/viewer. First snapshot establishes a baseline with no reward; only
  positive high-water deltas can earn XP. Lower/out-of-order totals never reset
  the counter. New counter IDs establish new baselines. Room-wide totals have no
  attributable academic reward. Delta likes rely on source event dedup.
- Gifts require gift and streak IDs. Intermediate updates only record high water;
  a consistent final total pays once. Repeated final messages with different
  message IDs cannot repay a closed streak. A lower-than-observed final is stale.
  Repeated non-streak gifts must have distinct streak/transaction IDs. Missing a
  final means no gift reward; do not guess. Engine gift count caps still apply.
- Missing viewer IDs are informational only: no player, XP, contribution or school
  mission progress. Do not infer identity from nickname, room viewer totals or
  matching display names. Never coerce IDs through JavaScript Number.
- Immutable state transitions use the existing mission/progression reducer,
  preserving exam gates, quiz deadlines, mission claims, gift-only contribution
  and promotion rules. Normalizer logs credited units after existing batch caps;
  it does not split large batches or replay denied excess to evade quotas.
- At 10,000 observations the run fails closed instead of silently evicting dedup
  keys. Counter/streak state is bounded by that same run. UI logs retain 100 rows.
  This is not a durable cross-reload ledger or production anti-cheat mechanism.

## Proposed Cloudflare boundary — not deployed

Future connector Node process owns TikTok transport, signing, protocol decoding,
reconnect/backoff and raw-to-normalized mapping. It must validate actual provider
counter/identity semantics and send authenticated HTTPS messages to a Worker.
No AGPL implementation or connector dependency is included here.

Worker verifies machine authentication, schema/body size, source allowlist and
server receipt time; arbitrary browser payloads are not trusted event sources.
Route one room to a SQLite-backed Durable Object. In one serialized transaction:
insert a UNIQUE(provider,room,session,kind,eventId) ledger row, update counter/streak
high-water state, apply engine/reward changes and persist the resulting snapshot
and sequence number. Ack only after commit; repeated delivery returns the existing
ack. Keep room lifecycle separate from transport reconnects. Persist dedup and
counter state together; in-memory keys alone are insufficient after restart.

DO serves authorized snapshot/delta WebSockets to the Pages frontend. The frontend
renders state and sends authorized admin commands, never trusted XP amounts.
Use sequence numbers and snapshot resync after disconnection; enforce one active
connector lease per room and bounded queues. Define retention and privacy policy
before live data. Decide who owns shared school/day state before multi-room use.

Cloudflare hosting, SQLite migrations, authentication, real connectors and deployment
are **documentation only** in this task. No guarantee exists that unavailable
source events can be recovered. Durable retries do not recreate TikTok events
missed during an upstream outage.

## Tests and next scope

Unit tests cover ID precision, provider/room separation, immutability, identity
absence, cumulative/delta likes and resets, streak final/duplicate/out-of-order
handling, event staleness, reconnect replay, engine limits and adapter stop. Full
existing gameplay tests/build remain required. Browser smoke verifies Vietnamese
Admin inspection, reconnect with unchanged balances, Broadcast exclusion and
unchanged regular save. Physical Safari/device performance remains unverified.

TASK-018C proposal: implement a local durable repository/transaction contract and
crash/restart replay tests with fixtures first; specify authenticated ingest and
snapshot sequencing. Any actual Worker/DO deployment, provider dependency/license
choice, real TikTok requests or credentials remains a separate approval gate.
