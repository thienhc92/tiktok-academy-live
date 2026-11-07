# Engineering instructions

Use the existing isolated checkout; do not create worktrees unless requested. Preserve user changes and existing commits.

## Focused development workflow

1. Before coding, read AGENTS.md and the relevant specification sections. Consult ROADMAP.md and TASKS.md for the requested milestone, and inspect only related source, tests and configuration.
2. Prefer small, focused implementation tasks. Avoid unrelated refactoring or rewriting existing components.
3. Reuse existing game engine rules, UI components, TypeScript types and utilities.
4. Define concise, verifiable acceptance criteria before implementation.
5. Implement the simplest maintainable solution that satisfies those criteria and preserves existing functionality/data.
6. During development, run only targeted checks for affected behavior. Do not add tests for reversible cosmetic changes or tests that merely mirror the implementation.
7. Scale local verification to the change using the table below. Run a production build once after the final application changes, rather than after every adjustment. Let required CI run the complete test suite for routine UI work; do not duplicate it locally without a concrete regression concern. After a fix, rerun failed or invalidated checks, not every previously passed check.
8. Never skip type checking, relevant security validation or required CI checks. Keep passed, failed, blocked and unrun checks distinct; never claim unverified browser/device behavior works.
9. Avoid unnecessary package installations, repeated full builds/audits, excessive logging and repetitive research. Reuse valid results until a change or failure justifies another run. Do not repeat the whole browser viewport matrix for a small CSS adjustment; check representative affected sizes.
10. Add dependencies only when necessary; prefer existing or built-in capabilities and lockfile-based installs.
11. Keep all visible UI text in natural Vietnamese using the central translation catalog. The active product is Chùa Online; keep the previous TikTok Academy implementation and data isolated for reference. Preserve portrait 9:16 presentation; optimize for iPad Safari, safe areas, reduced motion and user-initiated audio.
12. For routine changes, use a focused feature branch and PR without requiring manual code review. Reuse an existing open feature PR when continuing the same work. Batch the finished implementation, verification and necessary documentation into one push. Enable auto-merge only after all required checks pass and within existing release authorization; preserve the current product-preview hold. Never bypass failures, force-push or merge an unverified head; verify the actual merge outcome. If auto-merge is unavailable, report why.
13. Do not wait indefinitely for CI. Normally inspect status once after pushing and report pending/blocked checks without a polling loop. Do not rerun unchanged jobs or weaken protections to work around a runner queue. Do not create follow-up documentation commits merely to record CI results; use the PR status and handoff report. Leave pending or unauthorized releases unmerged.
14. Obtain approval before introducing paid services, credentials, destructive or breaking changes, production security changes, or real TikTok connectivity. Default to mock mode. Preserve existing authorization for routine actions and the approved Cloudflare deployment workflow; new public deployment or hosting requires approval. Never put credentials in repository files, logs or chat.
15. Finish with a concise Vietnamese report: changes, verification, commit/PR, actual release status and any blocker. Update specifications/roadmap/tasks when requirements or a meaningful milestone change; routine cosmetic fixes need only a concise PR/handoff note. Instructions-only tasks should not trigger application edits or unrelated documentation churn.

## Local verification by change type

| Change | Necessary local checks |
| --- | --- |
| Instructions/documentation only | `git diff --check` and review the changed scope. No application tests, build or browser run. |
| CSS, spacing, imagery or copy without behavior changes | Inspect the affected UI in one representative portrait and one landscape size when relevant; exercise only affected controls. Build once at the end. No full local regression suite or new cosmetic unit tests. |
| Component behavior or isolated game rule | Run the relevant existing tests and a focused browser flow if needed; build once at the end. Full regression runs in required CI. |
| Shared game engine, persistence, authentication, dependencies or CI configuration | Run full `npm test` and the final build locally, plus security/integration checks relevant to the risk. |

Explicit task requirements and concrete failures can justify broader checks. Never skip required CI, type checking or relevant security validation, and never describe an unrun check as passed.

## Architecture and safety invariants

- Keep game rules pure and separate from transport/presentation. Normalize and validate incoming events and saved data before use.
- Use stable player IDs, never nicknames as identities. Academic XP and contribution are separate; gifts cannot buy academic promotion or appointments.
- Preserve existing school code/local progress separately; the default Chùa Online experience is a 2D simulated LIVE presentation using the owner’s device-local photo, with a toggle back to the still viewer. Keep all interactions explicitly mock and separate from academic XP. Preserve the mesh-based 3D sanctuary at ?experience=3d. Never substitute generated artwork for a missing reference file. Keep the earlier 52-visitor LIVE simulation available separately at ?experience=live. Prefer procedural/local assets and bounded rendering/effect costs.
- When networking is blocked, preserve completed work, run useful independent checks and report the exact blocker. Do not weaken TLS verification or change proxy/network policy to make commands pass. Use the supported permission flow when authorized.
- Commit reviewable changes. Do not reset history, discard user work or claim a local commit is published without verifying the remote result.
- Production requires server authority, authenticated admin access, durable transactions, replay protection and a data-retention policy. Browser storage is an MVP convenience, not a secure production source of truth.
