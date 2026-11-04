# TASK-018C — local SQLite transactions and crash recovery

## Implementation and scope

`local/repository.ts` defines GameRepository: atomic process, latest versioned
snapshot, player balances and original event receipt/reward transactions.
The aggregate snapshot includes progression/history, academic session, missions,
quiz deadlines/submissions, pending exams, counters, closed streaks and clock.
`local/sqliteRepository.ts` uses Node's built-in node:sqlite DatabaseSync; Node
22.18+ is required. Node's SQLite API may emit an experimental warning on Node 22.
The only added package is development-only @types/node for strict type checking.

Nothing in local/ is imported by the browser. No server, endpoint, connector,
credentials, paid service or AGPL code is introduced. Browser mock gameplay and
Vietnamese Broadcast Mode still work independently via their existing storage.
Tests create isolated temporary on-disk databases, never modify browser saves,
and remove only their own temporary files.

## Transaction and recovery contract

Database schema version is PRAGMA user_version=1. WAL + synchronous=FULL are used,
foreign keys enabled, with a 5-second busy timeout. BEGIN IMMEDIATE serializes
writers, including separate Node processes/connections. Every transaction rereads
the latest snapshot under that lock; no stale in-memory game copy is authoritative.

Tables:
- snapshots(sequence PRIMARY KEY, version, body): immutable full ReplayState JSON.
- events(event_key PRIMARY KEY, sequence UNIQUE, outcome, units): durable dedup/ack.
- rewards(event_key, player_id, xp, contribution): actual nonnegative balance deltas
  for every affected player, including collective mission recipients.

Within one transaction: look up the event key; return its original receipt if
already committed; otherwise run the existing pure processor, derive actual XP/
contribution changes, insert snapshot + event receipt + rewards, then commit.
Only acknowledge after COMMIT succeeds. Crash before commit leaves none of these
writes. Crash after commit/before ack is recovered by retrying the same key: the
original receipt is returned with duplicate=true, without applying rewards again.
Blocked/anonymous/pending/stale observations still get durable receipts and a
sequence; malformed inputs and capacity rejection do not consume one.

`duplicate` in a receipt means an existing source message key. A *new* message
closing an already-closed gift streak can have outcome=duplicate but duplicate=false:
it is a new observation, with no repeated reward. Reward rows report actual XP/
contribution changes, not the nominal event count. Existing game quotas remain in
force, so normalization never guarantees an otherwise ineligible reward.

Snapshot version=1 and sequence=0 initialize a new empty repository. Each new valid
committed observation increments sequence once. Retries return the original sequence,
which may be older than the latest snapshot. Future clients must keep their highest
sequence and resync gaps, not rewind on an older ack. Unknown schema/snapshot
versions, invalid state or missing snapshots fail closed; an existing damaged
repository is not silently reset. No migration or import API is claimed.

## Idempotency and ordering

Shared eventKey() uses JSON array encoding of provider, room, source session,
event kind and stable source event ID; no nickname, random retry UUID or receive
time participates. Keep the same room/session identity across transport reconnects.
A provider without reliable message IDs cannot support this guarantee by simply
hashing text: repeated equal comments may be distinct. Room aggregate likes lack
an attributable viewer; gift streaks without stable streak/transaction IDs cannot
be safely finalized. Reject/quarantine such source data until an adapter provides
an explicitly validated policy. Missing numeric/string identity never falls back
to nickname; long IDs remain strings.

Existing processor policies are persisted unchanged: monotonic receipt clock,
30-second late-event window, cumulative-like baseline/high water, one final gift
payment, closed-streak protection, anonymous no-reward observations and all XP/
mission/quiz/exam/promotion rules. Gift contribution remains separate from XP.

## Limits and future Cloudflare adapter

The local implementation retains the offline 10,000-observation capacity and game
snapshot-size limits; it fails closed at capacity and never prunes dedup keys to
keep awarding. Full snapshot history grows on disk and is not yet a production
retention/backup design. This task proves recovery across process termination,
not arbitrary filesystem damage, hardware power loss or cross-region replication.
Initialize the database once before launching concurrent worker processes; concurrent cold-start schema creation is not a supported migration protocol. Local database files remain sensitive local data; only synthetic fixtures were used.

A future Durable Object adapter should implement this repository contract with its
SQLite storage/transaction API, not import node:sqlite into Workers or Vite. Keep
per-room serialized processing and unique event keys, rewards and snapshots atomic;
server-stamp receipt time and authenticate ingress. Connector lease/room lifecycle,
shared multi-room player ownership, client authorization, durable publication/outbox,
retention and backups remain separate design work. No cloud database is provisioned.

## Verification and TASK-018D

77 tests run in the full suite. Durable tests use real on-disk SQLite and SIGKILL child processes before/after commit,
concurrent writers, restart+replay, cumulative likes/streak finals, malformed and
missing IDs, immutable receipts, session/quiz/promotion recovery, sequencing and
unsupported schema/missing-snapshot refusal. All existing gameplay regression
tests and strict local/frontend TypeScript checks run in npm test/npm run build.
No browser smoke is needed for an unmodified UI; physical Safari remains unverified.

Proposed TASK-018D: local transactional outbox and snapshot/delta client protocol,
gap recovery, backup/restore tests and an adapter contract suite. Only after owner
approval: actual Durable Object implementation/deployment, authenticated ingest,
real provider selection/permissions and live connectivity. No credentials are
requested by this task.
