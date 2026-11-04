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

See [PROJECT_SPEC.md](PROJECT_SPEC.md), [ROADMAP.md](ROADMAP.md), [TASKS.md](TASKS.md) and [AGENTS.md](AGENTS.md). The first milestone separates event rules and mock transport, persists player balances and replaces the static leaderboard. Future ranks, quizzes, exams, appointments, admin, database and live integration are planned, not implemented.

## Validation status

`npm test` passes eight dependency-free engine/storage tests on Node 24. These verify rules and storage-port round trips, not React rendering or a real browser reload. Dependency installation failed with `EPERM` connecting to the cloud proxy at `172.31.0.221:8080`. `npm run build` cannot run without the missing TypeScript dependency. No network security settings were changed; no lockfile was generated. Frontend typechecking, browser behavior and iPad performance remain unverified. Retry `npm install` then `npm run build` when connectivity is restored.
