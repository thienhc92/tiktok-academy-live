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
- [x] Install frontend dependencies using elevated permissions; commit package-lock.json.
- [x] Production TypeScript/Vite build passes.
- [ ] Browser reload, restricted-storage handling, portrait rendering and iPad performance checks.

## Next — M2
- [ ] Finish M1 browser/device verification; dependency installation and build now pass.
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
- No browser, frame-rate, physical-device or production claims until checks succeed. Production compilation now passes.
- Original MVP published in PR #1 and merged into main. Elevated network access works; ordinary sandbox access previously failed. No public deployment.

## Build / CI / Pages preparation
- [x] Create feature branch from current origin/main after PR #1 merge.
- [x] Install dependencies; eight tests and production compilation pass.
- [x] Commit npm lockfile and pin CI/Pages Node version to 22.18.0.
- [x] Add pull_request/main-push GitHub Actions Test and build job, without deployment.
- [x] Prepare wrangler.toml and document Pages settings without connecting/deploying.
- [x] PR #2 hosted CI passed and merged; no deployment.
- [ ] Measure mobile bundle/frame costs and evaluate Drei/BVH dependency upgrade.

## Broadcast presentation milestone
- [x] Dedicated fitted 9:16 scene and separate Admin dashboard with shared game state.
- [x] Fixed front camera, enlarged avatars, high-contrast nicknames and safe-area overlays.
- [x] XP, top 10 and existing community-goal overlays; no new mission rewards.
- [x] Bounded expiring join/like/gift banners and labeled promotion preview.
- [x] Demand rendering, hidden-tab pause, reduced motion, DPR 1 and no broadcast shadows.
- [x] Ten Node tests and production build pass; Chromium portrait/tablet smoke passes.
- [ ] Physical iPad Safari and TikTok screen-sharing validation (see docs/BROADCAST.md).
- [ ] Actual mission/reward and exam/promotion engines remain M2/M3 work.
