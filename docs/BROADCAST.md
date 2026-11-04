# Broadcast and Admin modes

Use **Broadcast Mode** in the mode selector, or open `?mode=broadcast` directly.
Admin Mode remains the original desktop dashboard and simulation controls. Both
modes share one game state; switching recreates only the camera/scene, not saved
progress, simulation state or event feed.

Broadcast fits a 9:16 stage into the available viewport without stretching; tablet
landscape shows dark sidebars. For iPad screen sharing, use portrait orientation,
hide Safari's browser chrome using its supported controls, and select Broadcast.
The expand control requests browser fullscreen when supported; unsupported Safari
versions show guidance and continue in viewport mode. Browser permissions cannot
be overridden by the app. The mode selector and pause/sound/fullscreen controls
remain available. Top/right/bottom margins reserve room for typical LIVE overlays;
check placement in the actual TikTok sharing flow before going live.

The fixed camera shows larger students, high-contrast screen-sized nickname tags,
community XP, session likes, top 10, and a school community goal. The existing
5,000 XP milestone is presentation-only, with no additional mission reward.
Timed per-player missions remain future work. Mock joins announce roster students;
likes and gifts follow simulated/operator events. Notices expire after 3 seconds
and are capped at two during bursts. **Preview ceremony** in Admin Mode plays
a clearly labeled promotion preview; it does not grant a rank or change balances.
Actual promotion rules remain pending. No real TikTok API is connected.

Mobile cost controls: broadcast DPR 1, no shadow maps or contact-shadow pass,
fixed camera, demand rendering with a 30 Hz idle-animation ticker, no animation
ticker with reduced motion, and stopped render/simulation tickers while hidden.
Orbit controls can request extra frames in Admin Mode. CSS notice motion respects
reduced motion. The existing large Three.js bundle still needs a separate loading
optimization; this change does not claim measured 30 FPS on physical iPads.

Validation: ten Node tests; TypeScript/Vite production build; temporary headless
Chromium smoke at 390×844, 768×1024 and 1024×768. Smoke checks 9:16 bounds, 20
nickname labels, top 10, like/gift/promotion notifications and expiry, mode switch
state preservation, and direct broadcast URL without page errors. Chromium with
software WebGL is not Safari or a physical-device performance test. Still verify
on iPad: text legibility in the stream, safe-area overlap, fullscreen fallback,
screen-share capture, thermal performance, background resume and WebGL recovery.

## Portrait refinement

The header removes its tagline and reduces title/chip spacing for an approximately
35% shorter block. The closer camera and four-column staggered student layout
prioritize the school and faces. Nickname type is exactly 80% of the previous
clamp scale, with shorter padding and width bounds. Admin coordinates are unchanged.
Corner panels show the community goal and a top-three preview; tap Top 10 to open
the full ranking. The empty upper-middle announcement region is reserved for future
quizzes and promotion notices, rather than consuming the courtyard with banners.
Gifts and other notices are compact, last 3 seconds and retain at most two entries.

**Broadcast fullscreen** requests fullscreen on the page and exits if already full.
When Safari lacks/rejects the API, an on-screen message explains portrait orientation
and toolbar hiding; the viewport layout remains 9:16. Physical Safari behavior still
needs device validation. Browser portrait checks cover 320×568, 390×844 and 768×1024,
including no horizontal overflow and no label-to-label overlaps at those viewports.

The narrow Admin header also reserves space below the mode selector so the ceremony preview stays clickable. Gameplay engine, persistence and Admin student coordinates remain unchanged.
