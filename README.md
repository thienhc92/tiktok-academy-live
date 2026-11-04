# TikTok Academy Live

A local, interactive 3D school courtyard built with Vite, React, TypeScript, React Three Fiber, and Drei. All students, comments, likes, and gifts are mocked; no TikTok account, credentials, or API connection is required. Fonts use system fallbacks and the scene has no external asset dependencies.

## Develop

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

Select any of the 20 students to inspect their profile. Drag to orbit and pinch to zoom. Use Campus chat / Top 10 to change panels, submit a comment, send love, or send a star to increase community XP. Pause stops automatic mock events. Sound is opt-in and generates a short local interaction tone. All state resets on reload.

## Layout and rendering

The layout adapts to portrait 9:16 screens and iPad; touch orbit controls disable page gestures only within the canvas. Low-poly geometry, shared lighting, 1024px shadow maps, a 256px contact shadow, and device pixel ratio capped at 1.5 limit GPU cost. Fullscreen uses feature detection with a Safari fallback message. WebGL is required. Physical iPad Safari performance and the final visual composition still require device/browser validation.

## Validation status

Dependency installation was attempted in the cloud environment, but the network proxy at `172.31.0.157:8080` was unreachable (`EPERM` from npm; connection failure from curl). `npm run build` was attempted and stopped at `tsc: not found`, since dependencies could not be installed. No network security settings were changed. No lockfile could be generated. Retry installation and the build when the proxy is restored; build success and browser behavior are not yet verified.
