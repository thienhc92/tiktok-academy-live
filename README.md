# TikTok Academy Live

A 3D virtual school powered by TikTok LIVE interactions. This is the project vision; the current implementation uses local mock events.

A local, interactive 3D school courtyard built with Vite, React, TypeScript, React Three Fiber, and Drei. All students, comments, likes, and gifts are mocked; no TikTok account, credentials, or API connection is required. Fonts use system fallbacks and the scene has no external asset dependencies.

## Develop

Requires Node.js 22.18+ and npm (Node 24 recommended).

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Select any of the 20 students to inspect their profile. Drag to orbit and pinch to zoom. Use Campus chat / Top 10 to change panels, submit a comment, send love, or send a star to increase contribution points. Likes, comments and shares earn academic XP; gifts do not. Pause stops automatic mock events. Sound is opt-in and generates a short local interaction tone. Player XP and contribution persist on this browser. The chat feed and session like display reset on reload. Browser storage is demo-only and supports one active tab; it is not a server database. Invalid saves are preserved with a warning.

## Layout and rendering

The layout adapts to portrait 9:16 screens and iPad; touch orbit controls disable page gestures only within the canvas. Low-poly geometry, shared lighting, 1024px shadow maps, a 256px contact shadow, and device pixel ratio capped at 1.5 limit GPU cost. Fullscreen uses feature detection with a Safari fallback message. WebGL is required. Physical iPad Safari performance and the final visual composition still require device/browser validation.

## Project ownership and status

See [PROJECT_SPEC.md](PROJECT_SPEC.md), [ROADMAP.md](ROADMAP.md), [TASKS.md](TASKS.md) and [AGENTS.md](AGENTS.md). The first milestone separates event rules and mock transport, persists player balances and replaces the static leaderboard. Mock ranks, quiz answers, exams, ceremonies and basic limited appointments are now implemented. Timed quizzes, full governance, server database/authentication and live integration remain planned.

## CI and Cloudflare Pages

The committed lockfile supports repeatable `npm ci` installs. GitHub Actions runs
`npm ci`, `npm test` and `npm run build` for PRs and pushes to main using Node
22.18.0 (`.node-version`). The check is named **Test and build**. Making it required
for all merges remains a repository branch-protection setting.

Cloudflare Pages preparation is in [docs/CLOUDFLARE_PAGES.md](docs/CLOUDFLARE_PAGES.md)
and `wrangler.toml`. Vite preset, repository root, output `dist`, build command
`npm ci && npm run build`, Node 22.18.0. No secrets or app environment variables
are needed. No deployment workflow or public deployment is enabled by these files.

## Validation status

Elevated dependency installation succeeds. Thirty-two rule/storage/presentation tests pass on
Node 24 and TypeScript/Vite production compilation succeeds. CI independently
validates the pinned Node 22.18.0 runtime. Browser rendering, reload behavior and
physical iPad performance remain unverified.

Vite reports a roughly 1 MB minified JavaScript bundle (284 KB gzip); mobile load
and rendering performance still need measurement. Drei 9 pulls deprecated
`three-mesh-bvh@0.7.8`; the current scene does not use its BVH APIs. A compatible
Drei/BVH upgrade should be evaluated separately rather than forcing an untested
transitive override. No TypeScript or Vite compilation errors were found.

## Livestream presentation

Use **Broadcast Mode** (or `?mode=broadcast`) for the dedicated 9:16 scene and overlays. **Admin Mode** keeps the dashboard. See [broadcast guide](docs/BROADCAST.md) for iPad sharing, notification previews, performance limits and validation. No TikTok API connection or deployment is enabled.

## Academic ranks and ceremonies

Admin Mode now includes configurable academic progression, mock quizzes/exams, promotion history and capacity-limited office commands. New ranks trigger a 3D ceremony; gifts cannot buy academic XP or office priority. Existing local saves retain their balances. See [progression guide](docs/PROGRESSION.md) for thresholds, exam/session rules and mock-only limitations.

## QA simulation lab

Use the clearly labeled Admin-only QA panel for isolated test XP, exams, promotions, office assignments and 3D previews. It has its own memory-only students and reset confirmation; regular player saves are untouched. See [QA guide](docs/QA_SIMULATION.md).
