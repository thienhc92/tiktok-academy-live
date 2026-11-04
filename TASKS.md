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
- No real connector, timed quiz/mission engine, full governance, classroom interior or admin authentication yet. Mock progression/exams/basic appointments are now implemented.
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
- [ ] Timed mission/quiz rounds remain M2 work; mock exam/promotion engine is now implemented.

## Broadcast portrait refinement
- [x] Compact header (~35% reduction), closer camera and wider four-column stagger.
- [x] Nickname scale reduced 20%; no overlaps detected at three portrait sizes.
- [x] Three-second compact notices, two-entry cap and reserved announcement region.
- [x] Corner goal/top-three panels with expandable top 10; dedicated fullscreen/fallback.
- [x] Eleven Node tests and production build pass; gameplay engine/Admin layout retained.
- [ ] Verify physical iPad Safari fullscreen, screen-share readability and frame rate.

## iPad portrait Broadcast View
- [x] Clear Enter Broadcast action and clean view with revealable operator controls.
- [x] Safe-area-aware largest-fit 9:16 frame and TikTok right/bottom reserved margins.
- [x] Readable minimum font sizes and compact label padding without rule changes.
- [x] Fullscreen capability adapter with persistent unsupported/rejected fallback.
- [x] Twelve Node tests and production build; phone/iPad portrait browser validation.
- [ ] Physical Safari chrome/fullscreen, screen-sharing and thermal validation.

## Academic progression / promotion increment
- [x] Eleven configurable rank thresholds; one-step promotions and target replay guard.
- [x] Mentor+ exam gate, 80% pass and one attempt per session.
- [x] Validated first-answer quiz XP; gifts remain contribution only.
- [x] Separate academic-only capacity-limited session office appointments.
- [x] Admin rank, eligibility, question/exam controls, history and threshold settings.
- [x] Additive local save loading preserves legacy balances/replay IDs.
- [x] Six-second 3D spotlight ceremony, scale envelope, particles and rank title.
- [x] Separate rank/nickname lines with portrait spacing; reduced motion preserved.
- [x] 25 tests and production build; portrait and progression browser smoke pass.
- [ ] Timed quizzes, live activity/moderation policy and cross-session office rotation.
- [ ] Physical iPad Safari and screen-share validation.

## Isolated Admin QA simulation lab
- [x] Memory-only test roster, independent of regular useGame/storage.
- [x] All-student selection, validated configurable QA XP and eligibility checks.
- [x] Existing exam/promotion/appointment validators reused without bypasses.
- [x] Separate six-second 3D preview; no rank is granted by preview.
- [x] Confirmed QA-only reset; QA data retained across mode switches, no Broadcast UI.
- [x] 32 tests and production build; browser isolation/reset/preview smoke.
- [ ] Physical iPad Safari and QA preview performance validation.

## TASK-015 — Vietnamese localization
- [x] Central Vietnamese catalog for all built-in UI, ranks, questions and help.
- [x] Keep TikTok Academy/XP, saved IDs, numeric ranks and gameplay rules intact.
- [x] Vietnamese document language and number/date formatting.
- [x] Portrait wrapping and type adjustments; five phone/iPad sizes checked.
- [x] 35 tests, production build and browser smoke passed.
- [ ] Physical iPad Safari font/readability verification.

## Vietnamese responsive layout / camera correction
- [x] Flow-positioned mode-entry controls, separated from page content.
- [x] Aspect-aware default camera, bounded orbit/zoom and Đặt lại camera.
- [x] Wider shared student spacing and screen-space label declutter.
- [x] 38 unit tests and production build; portrait/landscape browser checks.
- [ ] Physical iPad Safari framing, touch/stream capture and performance.

## TASK-017 — simulated LIVE mission system
- [x] Validated five-event adapter, commands and rate/count/replay controls.
- [x] Configurable day/session XP caps and gift contribution separation.
- [x] Daily and collective missions, timed quiz/deadline/scoring/top 10.
- [x] Real exam/promotion validators and automatic eligible ceremonies.
- [x] Vietnamese Admin simulator and portrait Broadcast mission/quiz views.
- [x] Additive validated local persistence; bounded success/gift 3D effects.
- [x] 52 tests, production build and browser mission/quiz/reload smoke.
- [ ] Physical iPad Safari, long-running storage/performance verification.
- [ ] Real TikTok/server authority remains explicitly out of scope.

## TASK-018B — offline event architecture
- [x] Typed and validated normalized union, stable string IDs and missing-ID policy.
- [x] Transport-independent adapter and deterministic anonymized synthetic replay.
- [x] Dedup/reconnect, monotonic receipt clock, like high water and gift finalization.
- [x] Existing capped engine rules reused; regular player data unchanged.
- [x] Vietnamese Admin inspector isolated from Broadcast and local gameplay save.
- [x] Document Worker/DO transactional boundaries without backend deployment.
- [ ] TASK-018C: durable transaction/crash recovery contract and tests.
- [x] 66 automated tests and production build; browser replay/isolation checks passed.
