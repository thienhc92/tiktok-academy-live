# Work tracker

## M0 — completed
- [x] Inspect source, README, manifest, TypeScript config, Git state and existing history.
- [x] Record baseline capabilities and gaps in PROJECT_SPEC.md.
- [x] Add engineering instructions, acceptance criteria and staged roadmap.

## M1 — implemented, validation incomplete
- [x] Extract transport-independent validated event reducer and mock adapter.
- [x] Stable per-player identity; separate XP and contribution balances.
- [x] Bound event counts, player count, numeric balances and replay IDs.
- [x] Persist versioned local profiles and replay IDs; reject invalid snapshots.
- [x] Preserve unreadable saved data; report storage access/write failures.
- [x] Route mock likes/comments/gifts/shares into rules; preserve existing scene and controls.
- [x] Replace static leaderboard and profile counters with live saved balances.
- [x] Add eight dependency-free rule/storage tests; npm test passes on Node 24.
- [ ] Install frontend dependencies — blocked by proxy connection EPERM at 172.31.0.221:8080.
- [ ] Production build — blocked: TypeScript not installed.
- [ ] Browser reload, restricted-storage handling, portrait rendering and iPad performance checks.

## Next — M2
- [ ] First restore dependency access and finish M1 build/browser verification.
- [ ] Define quiz and mission state with injected time, immutable question bank and input validation.
- [ ] Add first-answer-only A/B/C/D submissions, closing deadline, reveal and single scoring.
- [ ] Add per-player cooldown/time budgets before rewarding repeated comments and shares.
- [ ] Add mission completion once per session and progress display.
- [ ] Add clearly labeled local operator controls; viewer participation remains event-only.
- [ ] Test complete simulated lesson round and document outcomes.

## Known limitations / risks
- Browser-local progress is not a database or a secure source of truth; single-tab only.
- Replay IDs expire after 2,000 entries; not sufficient for real connector retries.
- No real connector, ranks, exams, missions, governance, classroom interior or admin authentication yet.
- Existing UI source remains densely formatted; component extraction should accompany later UI work.
- No build, browser, frame-rate, physical-device or production claims until checks succeed.
- No public deployment, push or hosted PR created in this milestone. Read-only Git access also fails through the proxy; prepared PR text is in docs/PR_M1.md.
