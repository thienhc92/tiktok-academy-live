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

## TASK-018C — local SQLite persistence and recovery
- [x] Typed repository, SQLite ledger/reward/snapshot transaction and shared event key.
- [x] Versioned snapshots and sequences; restart preserves complete engine state.
- [x] Real SIGKILL before/after commit and concurrent-process reward/dedup tests.
- [x] Like/streak, identity, quiz/promotion and schema recovery checks.
- [x] Frontend remains backend-free; local adapter is not in its import graph.
- [ ] Production outbox, backup/retention and Cloudflare adapter/deployment (TASK-018D+).
- [x] 77 tests, strict local/frontend type checking and production build validated.

## TASK-019 — Worker/SQLite và đồng bộ thời gian thực
- [x] Repository SQL tái sử dụng bộ xử lý sự kiện/quy tắc hiện có, receipt + snapshot + outbox trong cùng giao dịch.
- [x] Worker phân quyền ingest/admin/view, Origin chính xác, vé WebSocket một lần và giới hạn request/batch.
- [x] Snapshot/delta theo epoch/sequence, resume/gap recovery, hibernation và retry/alarm.
- [x] Giao diện quản trị tiếng Việt: trạng thái, sequence, kết nối cục bộ/backend, quiz có quyền và tải backup.
- [x] Cô lập bản lưu cục bộ, chặn chỉnh XP từ client khi dùng backend; cảnh 20 avatar giữ ID máy chủ.
- [x] Retention 20 snapshot/200 delta; backup HMAC và restore chỉ tới kho trống, mặc định tắt.
- [x] Cấu hình Worker/SQLite và hướng dẫn triển khai, không triển khai backend công khai.
- [x] 95 kiểm thử qua (77 hồi quy + 18 realtime), TypeScript frontend/local/backend và build production qua; audit không còn lỗ hổng.
- [x] Chromium: kết nối/xác thực, nickname, quiz, backup download, 3 kích thước portrait 9:16, ẩn Admin và cô lập/khôi phục bản lưu. Chưa kiểm thiết bị Safari vật lý.
- [x] PR #14 đã merge sau CI/Pages thành công; backend không được triển khai.
- [ ] Backlog hardening: compaction chống trùng dài hạn, thử tải mạng/thiết bị và backup vận hành trước khi phát hành live.

## TASK-020 — Chuẩn bị staging Cloudflare Free
- [x] Cấu hình staging riêng: origin Pages chính xác, namespace SQLite riêng, workers.dev/preview tắt và routes rỗng.
- [x] Đối chiếu Workers Free/SQLite, quota/chi phí và giới hạn SQL theo tài liệu chính thức; chưa xác minh account thực tế.
- [x] Hướng dẫn iPad: Secrets không ghi đè, deployment kín, rollback không xóa DB và cổng phê duyệt mở endpoint riêng.
- [x] Checklist thủ công giám sát request/CPU/DO/rows/storage với ngân sách staging bảo thủ.
- [x] 99 kiểm thử qua (22 realtime/staging), TypeScript frontend/local/backend và production build qua; audit 0 lỗ hổng.
- [ ] CI/PR/merge: xem kết quả GitHub khi xuất bản, chỉ merge khi checks đạt.
- [x] Không triển khai; không tạo/cấp/đổi secret, endpoint hoặc dịch vụ trả phí; Pages settings và mã ứng dụng giữ nguyên.

## Product pivot — Chùa Online visual MVP
- [x] Default temple experience; preserve Academy implementation at a separate legacy URL and leave its storage untouched.
- [x] Original local golden altar SVG, 28 procedural gray-robed visitors and stable nickname labels.
- [x] Portrait 9:16, compact mock interactions, three-second notices, reflection cards and wish composer.
- [x] Vietnamese catalog, optional synthesized bell, operator controls, fullscreen fallback, reduced motion/hidden-tab rendering.
- [x] 101 tests and production build passed; Chromium verified 5 viewports, non-overlapping labels, interactions and preservation of existing storage.
- [ ] Draft PR/CI verification; no automatic production merge for this product pivot.
- [ ] Owner review of the new product direction before merging the default experience into production.
- [ ] Physical iPad Safari and real screen-sharing validation.
- Paused: TASK-021 school backend deployment. No Cloudflare deployment, credentials or live TikTok connection added.

## Reference-fidelity refinement (owner requests exact screenshot match)
- [x] Replace flat temple/low-poly people with local generated realistic artwork and two visitor sprites.
- [x] Reproduce 888×1280 capture, 720×1280 inner scene, fortune overlay anchors, calligraphy, clustered crowd/foreground and mock LIVE chrome.
- [x] 52 stable IDs, local mock follow/like/gift/wish/card interactions; no external requests or saved Academy data changes.
- [x] Charm font self-hosted with OFL; no dependency/service added.
- [x] 102 tests, TypeScript/build and audit passed; browser verified 6 viewports, frame/card anchors, simulation interactions, reduced/hidden motion, no external calls and unchanged Academy save.
- [ ] Draft PR/CI status: update existing PR #16; do not merge until owner accepts the revised visuals.
- [ ] Exact-match certification blocked by absence of original artwork/models/fonts/icons; do not label this 100% identical.

## True 3D sanctuary from the new landscape reference
- [x] Versioned Blender generator, original sculpture, lotus/halo, hall/roof, altar, flowers, lamps and exterior geometry.
- [x] Self-contained GLB and editable Blender source; no photo background used for the new 3D scene.
- [x] R3F viewer with orbit/zoom, front/left/right/close, reset, local lighting/reflection, quality and 9:16 options.
- [x] Preserve LIVE and Academy at separate routes; no backend/credential/payment changes.
- [x] 104 tests, complete production build/TypeScript and full npm audit passed. Chromium verified 5 viewports, real camera/orbit/reset, download, settings/9:16, legacy routes/storage, no external requests.
- [x] Draft PR #16 updated; implementation commit b2c17f6 passed GitHub CI and Cloudflare Pages preview. No production merge; owner visual acceptance pending.
- [ ] Physical iPad Safari performance, visual feedback and higher-detail sculpture/ornament refinement.


## 3D refinement after owner iPad screenshot
- [x] Fix roof-exposing orbit, central aisle framing, preset/manual selection and exact reset.
- [x] Widen inner column spacing; refine statue/robe/lotus and restrained gold/wood lighting.
- [x] Embed timber normal/roughness, fix Blender pixel/color-space export and test decoded PBR channels.
- [x] Keep 12 MB / 500k triangle budget, static shadow bake, existing routes/data and Vietnamese 9:16 UI.
- [x] Final 106 tests/build/audit passed; 5 viewport smoke and pixel-accurate orbit/reset checks passed; screenshots updated.
- [x] Visual refinement commit 7e6258b pushed to draft PR #16; GitHub CI and Cloudflare Pages passed. Preview bc192756 verified; production remains unmerged.
- [ ] Photoreal sculpted asset, detailed carvings/landscape, physical iPad performance and visual acceptance.


## Owner-approved Buddha sculpture rebuild
- [x] Replace old whole-body primitive/voxel assembly with authored facial, anatomical and cloth surfaces.
- [x] Separate source-quality geometry from the web mesh; maintain UVs, normals and named sculpt regions.
- [x] Refine ears/hair/eyes/lips, neck/shoulders, tapering limbs, fingers and robe clearance.
- [x] Inspect crossed-leg silhouette and front/side/close/portrait captures; 11.876.860 bytes / 461.600 triangles within existing budgets.
- [x] 107 tests, production build, npm audit and 5-viewport browser smoke passed; prepare update to the existing draft PR #16, report remote CI/preview at handoff.
- [ ] Owner visual acceptance, physical iPad performance, professional-level reference fidelity.


## Switch to the owner's original 2D photo
- [x] Pause 3D as default; preserve it at ?experience=3d and keep LIVE/Academy routes/data.
- [x] Original-aspect photo viewer, explicit cover/9:16 options, hide controls and fullscreen fallback.
- [x] iPad photo picker, bounded raster validation and isolated IndexedDB persistence; no server upload.
- [x] 108 tests/build passed; browser verified persistence/reload, corrupt-image rejection, 5 viewports, controls/fullscreen/storage fallback and preserved routes/data. Prepare draft PR update; report remote checks at handoff.
- [ ] Obtain the exact landscape reference file to bundle it as the default photo; no substitute artwork.
- [ ] Await owner's next instructions; physical iPad validation remains pending.


## Photo-based temple LIVE simulation
- [x] Preserve owner-selected IndexedDB photo; add a separate 9:16 LIVE overlay and photo-only toggle.
- [x] Reuse stable roster and 2D visitor assets: 20 initial/24 max, separated nickname slots.
- [x] Session-only mock joins/likes/incense/flowers/wishes, bounded comments/activity/receipts and 3-second notices.
- [x] Explicit simulation label, automatic simulation opt-in/hidden-tab pause, reduced-motion CSS.
- [x] 112 tests/build passed; browser verified all actions, 3s notices, hidden pause, 5 layouts without name/footer overlap, original photo persistence and no external requests. Prepare existing draft PR update; remote checks reported at handoff.
- [ ] Owner iPad visual acceptance; no merge or real TikTok connection.


## Place devotees within the sanctuary composition
- [x] Replace separate brown stage with a bottom-8% crop of the exact selected local photo.
- [x] Align seam to decoded image aspect; perspective rows and center-first foreground seats; preserve original image/game state.
- [x] 113 tests/build passed; browser verifies source binding, indoor-floor bounds, label/footer separation at 5 sizes and interaction/photo persistence regressions.
- [x] Prepare existing draft PR update; remote CI/preview reported at handoff.
- [ ] Physical iPad seam review; keep production unmerged.


## Full-window portrait sanctuary background
- [x] Default to centered full-window cover, remove the upper image panel and stitched floor; keep optional 9:16/contain.
- [x] Project visitors into two perspective groups around the red carpet using image aspect/frame/footer bounds.
- [x] 114 tests/build passed; browser verifies full-window cover, 24 labels/clear aisle at 5 sizes, 9:16/contain, interaction/photo persistence and zero-size observer recovery. Prepare draft PR update; remote checks reported at handoff.
- [ ] Owner chooses the new portrait photo on iPad and checks real Safari appearance; no production merge.

## Official Phật Tâm Live PNG and measured cushion seating
- [x] Merge the owner's main upload without losing feature history; rename exact PNG into public/images (blob hash unchanged).
- [x] Replace default local-photo/cover source with one official centered contain image; explicit missing-file error and no fallback. Preserve old storage.
- [x] Measure 24 real cushion positions and project normalized floor contacts with contain letterbox offsets; preserve existing 20 initial/24 maximum mock roster and all controls.
- [x] 5 Photo LIVE + 3 Vietnamese tests and full production/TypeScript build passed. Chromium HTTP 200/hash, 24 contacts, actions/joins/notice checks passed at 768×1024 and 1024×768; screenshots inspected.
- [ ] Physical iPad Safari review and owner visual acceptance; PR #16 stays draft with no production merge. Required CI status reported at handoff.


## Full cushion map and contribution-ranked seating
- [x] Map 108 usable source-image cushion centers across 14 rows, with stable IDs, normalized contacts/scale, zones and row-first/center-first priority. Exclude only two off-image-center fragments.
- [x] Replace fixed 20/24 capacity with seat-derived mock occupancy; preserve roster identities and create extra anonymous fixtures for waitlist testing.
- [x] Validated session scores: incense 5, flower 8, like 1, mock coin 10; no academic XP changes. Preserve all action counters, comments and bounded duplicate receipts.
- [x] Stable descending-score allocation, empty seats, overflow waiting/replacement; collision-aware names and perspective sprites.
- [x] 11 Photo LIVE + 3 Vietnamese tests passed; production/TypeScript build passed. Chromium 108 floor contacts, waitlist displacement, score calculation, label collisions and existing actions passed at 768×1024 and 1024×768. Screenshots inspected.
- [ ] Required CI/PR/merge reported at handoff; physical iPad Safari crowd-readability verification remains pending.


## Đại Hùng Điện — new PNG / rebuilt 108 seats / all names
- [x] Fetch owner upload from main 1849a59; verify unchanged 1086×1448 PNG/blob 7218e527. Use exact existing filename; no crop/zoom/stretch or fallback image.
- [x] Rebuild all 108 seat contacts from real red/gold cushions: 10×10 + 8. Preserve score formulas and assignment algorithm; no invented seats.
- [x] Always-visible names in an independent layer, ellipsis, physical-row packing, chat/footer avoidance and compact labels for letterboxed views. Preserve sprites/actions/statistics.
- [x] 13 Photo LIVE and 3 Vietnamese tests passed. Final TypeScript/production build passed; existing archived 3D chunk warning remains.
- [x] Chromium: 20 users via isolated component fixture, 108 via production preview; 768×1024 + full-occupancy landscape. Exact PNG HTTP 200/hash; every cushion contact/name, no label collisions/clipped corners, contribution/actions/comments and two long comments after resize passed. Screenshots inspected.
- [ ] Draft PR and required CI reported at handoff; wait for owner review before merge. Physical iPad Safari/FPS remains unverified.


## Temple LIVE preparation — offline boundary and persistence
- [x] Reuse adapter/envelope and contribution reducers; add normalized temple join/comment/like/gift/leave with stable userId/profile/avatar metadata. No academic XP changes.
- [x] MOCK source and unconfigured LIVE source; selecting LIVE retains MOCK and explains missing approval/configuration, without network requests.
- [x] IndexedDB transactional receipt/point/presence/high-water updates, validated snapshots, separate mode namespaces; memory warning on storage failure without overwriting old records.
- [x] Leave/rejoin keeps points; cumulative likes, final gift streaks and duplicate/out-of-order events handled. Vacancies fill immediately and ranking updates at most every five seconds.
- [x] Review official TikTok products/webhook events and current unofficial connector README/license boundaries; document permissions, identity uncertainty, hosting and approval gates.
- [x] 131 full tests and production/TypeScript build passed; Miniflare required elevated localhost execution. Browser: refresh/leave/rejoin, no external requests, 30 concurrent IndexedDB transactions, rollback/replay/corrupt preservation and storage failure passed.
- [ ] Required PR checks/merge state reported at handoff. Real provider, server integration, production persistence/retention, physical iPad verification and actual TikTok connection remain unimplemented/unapproved.
