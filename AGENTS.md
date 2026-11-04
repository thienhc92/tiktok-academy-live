# Engineering instructions

Use the existing isolated checkout; do not create worktrees unless requested. Preserve user changes and existing commits.

## Focused development workflow

1. Before coding, read AGENTS.md and the relevant specification sections. Consult ROADMAP.md and TASKS.md for the requested milestone, and inspect only related source, tests and configuration.
2. Prefer small, focused implementation tasks. Avoid unrelated refactoring or rewriting existing components.
3. Reuse existing game engine rules, UI components, TypeScript types and utilities.
4. Define concise, verifiable acceptance criteria before implementation.
5. Implement the simplest maintainable solution that satisfies those criteria and preserves existing functionality/data.
6. During development, run targeted tests for the affected behavior.
7. Before finalizing code changes, run the complete `npm test` and `npm run build`. After fixes, rerun affected checks; repeat the full final checks when code changes invalidate their results. For instructions-only changes, validate the diff and scope locally; required CI still applies.
8. Never skip type checking, relevant security validation or required CI checks. Keep passed, failed, blocked and unrun checks distinct; never claim unverified browser/device behavior works.
9. Avoid unnecessary package installations, repeated full builds, excessive logging and repetitive research. Reuse valid results until a change or failure justifies another run.
10. Add dependencies only when necessary; prefer existing or built-in capabilities and lockfile-based installs.
11. Keep all visible UI text in natural Vietnamese using the central translation catalog. Preserve TikTok Academy, XP and portrait 9:16 Broadcast Mode; optimize for iPad Safari, safe areas, reduced motion and user-initiated audio.
12. For routine changes, create a focused feature branch and PR without requiring manual code review. Enable auto-merge only after all required checks pass. Never bypass failures, force-push or merge an unverified head; verify the actual merge outcome. If auto-merge is unavailable, report why.
13. Do not wait indefinitely for CI. Observe briefly, then report queued/blocked status accurately. Do not rerun unchanged jobs or weaken protections to work around a runner queue. If checks remain pending, leave the PR unmerged and report the next step.
14. Obtain approval before introducing paid services, credentials, destructive or breaking changes, production security changes, or real TikTok connectivity. Default to mock mode. Preserve existing authorization for routine actions and the approved Cloudflare deployment workflow; new public deployment or hosting requires approval. Never put credentials in repository files, logs or chat.
15. Finish with a concise Vietnamese report: changed files, tests, build, commit, PR, actual merge/deployment status, blockers and next step. Update relevant task/specification documentation after implementation milestones unless the user restricts the task to instructions or another narrower scope.

## Architecture and safety invariants

- Keep game rules pure and separate from transport/presentation. Normalize and validate incoming events and saved data before use.
- Use stable player IDs, never nicknames as identities. Academic XP and contribution are separate; gifts cannot buy academic promotion or appointments.
- Preserve the 20-avatar scene, local progress and existing gameplay. Prefer procedural/local assets and bounded rendering/effect costs.
- When networking is blocked, preserve completed work, run useful independent checks and report the exact blocker. Do not weaken TLS verification or change proxy/network policy to make commands pass. Use the supported permission flow when authorized.
- Commit reviewable changes. Do not reset history, discard user work or claim a local commit is published without verifying the remote result.
- Production requires server authority, authenticated admin access, durable transactions, replay protection and a data-retention policy. Browser storage is an MVP convenience, not a secure production source of truth.
