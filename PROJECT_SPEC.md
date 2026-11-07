# Current increment — temple event foundation, no real TikTok

Keep the Đại Hùng Điện PNG and 108 calibrated seats unchanged. Add a transport-
independent, validated temple event path for join/comment/like/gift/leave and mock
incense/flower using existing adapter/envelope and contribution rules. Profiles
use stable string userId, nickname and avatar metadata; do not use names as keys.
MOCK works normally; unconfigured LIVE must stay disconnected and retain MOCK.

Acceptance: persistent scores/receipts/counters in one IndexedDB transaction,
refresh/replay without duplicate contribution, safe missing identity/gift streak/
cumulative likes and out-of-order presence. Leave frees a seat without deleting
points. Vacancies fill immediately; contribution ranking coalesces to <=1 update
per five seconds. Preserve all controls/layout/game rules, show Vietnamese source
and storage diagnostics in simulator, validate full tests/build and browser DB/
refresh scenarios. Research current public TikTok options with sources; no SDK,
credentials, paid service, backend deploy or actual TikTok connection. Create PR.
See docs/TEMPLE_LIVE_FOUNDATION.md for remaining approval/integration gates.

# Previous visual milestone

# Current increment — Đại Hùng Điện PNG and complete names

Use the owner's exact `public/images/476F2A78-424C-424C-8954-C43DFEC82BC7.png`
from main commit 1849a59, replacing the old default background. Verify PNG bytes
before use; render the entire image centered with contain, without zoom, crop,
stretch or camera inset. Never fall back to the previous image.

The actual image contains 108 valid red/gold cushions: ten rows of ten and a last
row of eight. Recalibrate every contact/scale to these cushions; do not reuse the
previous map or invent seats. Preserve the existing score calculation and
row-first/center-first assignment algorithm. All seated users must have visible,
ellipsized names, including front rows and lower corners; pack names around
existing chat/footer without moving avatars or hiding names. Preserve the three
Buddhas, altar, censer, center carpet and all mock interactions/statistics.

Acceptance: verify image HTTP 200/hash, exact contain projection for every seated
user, 20/108 occupancy, all names visible without overlap or corner clipping,
768×1024 screenshots, targeted tests and final production/TypeScript build.
Create a PR for owner review; do not auto-merge this increment. No real TikTok,
new backend, paid service or dependency.

# Previous contribution-seat milestone

# Current increment — contribution-ranked cushion seating

Keep the exact official PNG and centered contain rendering unchanged. Replace
24 reserved slots with all 108 cushion centers visible inside the source image:
14 rows, with the last two rows containing six usable centers each. Two tiny
edge fragments with off-image centers are not seats. Every seat has stable id,
normalized x/y contact, normalized scale, zone and rankPriority.

Acceptance: user scores come only from validated session mock actions: incense 5,
flower 8, like 1, gift coins ×10 (configurable). Join/wish score zero. Keep academic
XP separate. Sort descending score with stable arrival-order ties, then assign
seats descending priority: front rows dominate, center wins within each row.
Capacity comes from the map; excess users wait and can displace lower scores;
fewer users leave seats empty. Keep sprites/animation and all previous controls,
comments and activity counters. Hide only colliding name labels; tapping/selecting
prioritizes that name. Validate identity/gift amounts/duplicate deliveries, seat
priority, under/over-capacity, projection and labels; build and inspect actual
768×1024 screenshot. No new dependency, real TikTok, paid gifts or backend.

PR #16 was accepted by the owner, merged as 9eb8fdb and deployed successfully.
Use the existing safe routine PR/CI workflow for this feature.

# Previous official-background milestone

# Current increment — official Phật Tâm Live background

Bundle the owner's exact 1086×1448 PNG, uploaded on main as
`3821EC21-C34F-4B9D-9C8B-278D76987EC7.png`, unchanged at
`public/images/phat-tam-live-background-ipad.png`. This supersedes cover and
local-photo selection for the default experience. Never render the old persisted
photo or silently substitute another asset; leave stored data intact.

Acceptance: one centered object-fit:contain image, full roof/altar/cushions visible,
no crop/zoom/stretch or decorative frame. Warm letterboxing is permitted.
Calibrate actual cushion contact points in normalized source coordinates and use
the exact contain transform including offsets. Preserve devotee sprites, animation,
stable identities and all session-only mock controls; no altar/carpet seating.
The owner no longer requires exactly 20 visible people: use the existing bounded
roster and available cushion positions. Verify HTTP 200, source integrity, portrait
768×1024 plus landscape placement, interactions, targeted tests and final build;
provide an actual screenshot. Keep PR #16 draft until visual acceptance.

# Previous full-window background (superseded)

# Current increment — one full-window portrait background

Owner supplies a portrait temple photo with cushions and a red central aisle and
requests it as the fullscreen background. Use the selected image as one centered,
aspect-preserving `cover` image across the entire viewport by default. Remove floor
sampling/stitching and the separate upper photo panel. Keep contain/photo-only and
optional 9:16 framing available; native fullscreen remains capability-based.
The new image must be chosen in the existing iPad picker; do not silently overwrite
the device-local photo or claim the chat image has been bundled when no file exists.

Seat 20–24 mock visitors on two sides of the red carpet, using the decoded image
aspect and actual object-fit bounds. Adapt their scale/rows to keep names clear of
comments/footer on portrait and landscape. Preserve source Blob, storage, all
simulation behavior and legacy modes. Acceptance: one image spans the full viewport,
no stitched floor, no name overlap/overflow, clear center aisle, 9:16/contain options
still work, full tests/build and browser checks pass. Keep PR #16 draft.

# Previous layout — photo floor continuation (superseded)

Owner iPad screenshot shows visitors on a separate brown floor outside the temple
photo. Replace that stage with a continuation of the selected photo's bottom 8%,
anchored at the corresponding source-image row using the decoded aspect ratio.
Keep the original Blob unchanged and all interactions untouched. Move the crowd
closer to the altar; rows narrow/shrink toward the altar and grow toward the viewer.
Foreground arrivals fill the center first without moving earlier guests.
Acceptance: floor and hero use the same local image URL, source seam aligns in
contain/cover, every visitor stays on that photographic floor, labels do not overlap
or hit footer on 5 portrait/landscape viewports; tests/build and regression pass.
No new gameplay, dependency, TikTok connection or production merge.

# Current increment — 2D temple LIVE simulation on the selected photo

Owner has selected the reference photo locally on iPad and now requests a temple
LIVE presentation inspired by the supplied TikTok trend. Keep that exact device-local
photo/database and never silently substitute a generated background. Default to a
9:16 composition with the full photo in an upper altar area, a floor continuation sampled from the selected photo below, 20 initial/24 maximum 2D visitors with stable IDs, compact nicknames, session
activity top 3, comments, incense/flower/heart actions and 3-second notices. Reuse
existing visitor assets/roster, add no dependencies, paid gifts, divination promises
or real TikTok connectivity. Simulation is explicit, opt-in automatic playback,
paused in hidden tabs; reduced motion honored. The image-only viewer remains a toggle.
Acceptance: local photo survives updates/reload, composition does not cover the
central Buddha with large banners, responsive slots keep labels separated, actions
and comments work, bounded session memory, no academic XP/storage mutation, full
tests/build and portrait browser checks pass. Keep PR #16 draft and production unchanged.

# Current increment — original 2D photo, 3D paused

Owner requests switching to a still 2D image and waiting for further direction.
Use the exact supplied sanctuary image, not a generated replacement. The landscape
reference is visible in chat but its original file is not mounted in this workspace;
only the old TikTok screenshot file is available, and must not be silently substituted.
Prepare a 2D photo viewer with an iPad picker while waiting for the original file.
Acceptance: original aspect/full image by default, optional explicit cover crop and
9:16 frame, hideable controls, native fullscreen/fallback; persist chosen raster
photo only in a separate device-local IndexedDB database. No uploads, WebGL/GLB on
the default route, gameplay changes or effects. Keep 3D at ?experience=3d, LIVE at
?experience=live and Academy at ?experience=academy. Do not merge production.

# Sculpture rebuild — owner-approved reference study

Replace the rejected blocky Buddha body with an original continuous-surface model.
Acceptance: integrated facial relief and shorter anatomical neck/shoulders; tapered
arms and articulated fingers; smoothly joined crossed legs; drapery that clears the
body without the earlier penetrations; shared normals at periodic mesh seams;
source geometry at higher sampling density kept separately from the web GLB.
Validate front/side/close/portrait views, UV/normal data and the existing 12 MB /
500k-triangle web budget. Preserve camera controls, legacy routes/storage and keep
PR #16 draft until visual acceptance. This is digital geometry authored from the
reference, not a scan, a professional artist's hand-sculpt claim or certified
photoreal equivalence. See tools/sculpt_buddha.py and docs/TEMPLE_3D.md.

# Current increment — reference-based 3D sanctuary

The owner now requests a navigable 3D sanctuary based on the supplied landscape
image: monumental seated golden Buddha/lotus/mandorla, carved timber hall, tiled
reflective floor, altar, porcelain flower vases, lanterns and sunlight. The default
experience is a real mesh-based glTF scene with orbit/zoom, front/side/close presets,
mobile quality controls, a 9:16 frame option and downloadable GLB. Geometry and
textures are generated locally with the versioned Blender script; this is a
hand-authored procedural interpretation, not a photogrammetric copy of the image.
Acceptance: camera movement reveals depth, model contains non-planar sculpture and
architecture, no external asset/decoder requests, bounded mobile rendering costs,
Vietnamese controls and unchanged legacy storage/backend. Refinement acceptance: central
aisle camera remains below crossbeams within bounded orbit; manual camera input clears
selected preset; reset is exact; baked PBR texture pixels remain valid after export. Preserve earlier LIVE
simulation at ?experience=live and Academy at ?experience=academy. No TikTok or
backend deployment in this increment. See docs/TEMPLE_3D.md.

# Chùa Online — active product direction

The owner has replaced the school direction with an online temple inspired by the supplied portrait livestream reference. The active MVP recreates the supplied livestream screenshot composition: a realistic generated temple/altar background, 52 gray-robed image-based 2.5D visitors, a large fortune-card overlay and mock LIVE header/chat/gift controls. A 720:1280 inner scene sits inside an 888:1280 reference frame, both scaled to fit. No desktop sidebars. All LIVE UI and values are synthetic; no TikTok requests or payments. The image and visitor assets are newly generated, not the original artwork; exact pixel identity cannot be certified from the screenshot alone.

Acceptance: no horizontal overflow; all 52 mock visitor slots use bounded reference coordinates; short notifications expire after three seconds; wishes/cards/operator controls work; sound requires an explicit gesture; reduced motion and hidden-tab throttling remain available. No payments, real TikTok connection or real religious merit scores are introduced; fortune labels and gift values are entertainment-only mock presentation. Academy progress is neither read nor modified by the temple UI. The former experience remains isolated at `?experience=academy` to preserve previous work. The earlier Cloudflare backend deployment task is paused; no backend is deployed for this pivot. See docs/TEMPLE.md.

The following specification records the previous school implementation for reference.

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
