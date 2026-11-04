# Cloudflare Pages preparation (not deployed)

This config prepares the static mock SPA only. It does not provide a database,
TikTok connector or multi-user server. No Cloudflare account or credentials are
needed to build locally. Do not connect the repository to Pages or run a deploy
until the owner authorizes public hosting: Git integration may deploy immediately,
including preview deployments for pull requests.

## Future dashboard settings

- Project name: tiktok-academy-live (subject to availability).
- Framework preset: Vite.
- Root directory: repository root (leave blank).
- Production branch: main.
- Build command: npm ci && npm run build.
- Build output directory: dist.
- Build environment variable: NODE_VERSION=22.18.0, matching .node-version.
- No application environment variables, secrets, Functions or bindings required.
- Disable automatic deployment/preview creation until public deployment is approved.

wrangler.toml declares the Pages output directory and project name for a future
Wrangler deployment. It is configuration, not a deployment hook. The CI workflow
only installs, tests and builds; it has no deploy step or Cloudflare token.

Vite emits a static index.html and asset files. Pages uses its default SPA fallback
when no top-level 404.html is present; no catch-all rewrite is needed for the
current single-screen app. Keep assets served from the root (Vite default base).
Browser-local profiles remain tied to each deployment origin; preview and production
do not share progress. Never place credentials in VITE_* variables: these are public.

Before an authorized launch: verify a clean npm ci/build, iPad Safari behavior,
WebGL support, safe areas, and reload persistence. This milestone does not certify
physical-device performance or deploy anything publicly.
