# Define the MVP and add persistent player progress

The courtyard demo previously reset progress on reload and displayed a static leaderboard. This change routes simulated events through a standalone game engine, keeps XP separate from contribution, saves versioned browser-local profiles, and ranks players from current balances. Gift events award contribution only. Invalid saved data is preserved and storage failures are shown to the operator.

Adds the project specification, acceptance criteria, engineering instructions, roadmap and task tracker. Real TikTok connectivity, a server database, ranks, quizzes, exams and offices remain future milestones.

Validation: eight engine/storage tests pass via npm test on Node 24; git diff --check passes. Frontend installation is blocked by proxy connectivity (EPERM); npm run build fails because tsc is unavailable. Browser/iPad checks have not run. Git remote access also fails through the proxy, so this is a prepared PR description, not a hosted PR.

Limitations: browser-local persistence is single-tab and editable, replay protection is bounded, and production ingestion still needs cooldowns, durable transactions and server authority. No public deployment or network policy changes.
