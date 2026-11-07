# Engineering instructions — FAST DEVELOPMENT

Use the existing isolated checkout; do not create worktrees unless requested.
Preserve user changes and existing commits.

## Default workflow

Quick analysis → focused implementation → relevant tests → one final production
build → commit → Pull Request → concise Vietnamese report.

1. Read AGENTS.md and only the specification/source/tests needed for the request.
   Define brief acceptance criteria. Inspect unrelated files only when a concrete
   dependency or failure requires it.
2. Combine related tasks into one run, branch and PR. Do not split cohesive work
   into unnecessary milestones, intermediate PRs or repeated verification.
3. Implement exactly the requested scope with the smallest maintainable changes.
   Reuse existing engine rules, components, types and utilities. Do not refactor,
   rewrite components or change architecture unless necessary for the request.
4. Record unrelated defects for later; fix them now only if they directly block
   the requested functionality. Do not add adjacent features.
5. Run targeted unit tests during development. Run one final production build for
   application changes. After an actual failure or fix that invalidates evidence,
   rerun only necessary affected checks/build; do not repeat successful checks
   without a concrete reason. Documentation-only exceptions are in the table below.
6. Keep type checking, relevant security validation and all required CI checks.
   For high-risk changes, add necessary persistence/authentication/integration or
   full regression checks based on affected behavior; speed never justifies
   skipping a necessary check or weakening a test/CI requirement.
7. Capture screenshots only for UI changes. Default to iPad portrait 768×1024;
   use other viewports only when requested or necessary for an affected behavior.
   Do not run a broad viewport matrix or repeat cosmetic CSS/screenshot cycles
   to tune minor details.
8. Test time-dependent behavior with fake timers, explicit test clocks or mock
   data. Never wait through real cooldowns, countdowns, animation TTLs or simulated
   long runs. Synchronize on DOM/transaction readiness instead of adding sleeps;
   advance/freeze the relevant animation frame for visual checks.
9. Avoid unnecessary installs, dependencies, repeated full builds/audits, verbose
   logs and repetitive research. Reuse valid evidence until changed code or a
   concrete failure invalidates it. Prefer installed/free tools.
10. Keep visible UI text in Vietnamese. Preserve the current Chùa Online portrait
    experience, full-image contain rendering, 108 calibrated seats and existing
    9:16 Broadcast option. No application changes in instructions-only tasks.
11. Add/update documentation only when requested or necessary for a changed
    contract, migration, setup or material operational risk. Do not automatically
    expand specs/roadmaps/tasks or write long reports for routine changes.
12. Use a focused feature branch and PR; reuse an existing open PR for the same
    work. Batch finished code and verification into one push. Do not merge, enable
    auto-merge or deploy production without explicit owner approval for that
    release and its connected deployment side effects. Never bypass failing checks,
    force-push or reset history. Keep requested review/preview holds intact.
13. Inspect CI once after pushing; report queued/blocked checks accurately instead
    of polling or waiting indefinitely. Do not rerun unchanged jobs or create
    documentation-only commits merely to record CI results. Provide a verified
    preview link when available; label pending/unavailable previews honestly.
14. Obtain approval for paid services, credentials, destructive/breaking changes,
    production security changes or real TikTok connectivity. Keep LIVE locked and
    MOCK working until specifically approved. Never put secrets in Git, UI or logs.
15. Final report, in Vietnamese, includes only: completed tasks; changed files;
    test/build results; PR and preview links if available; unresolved issues if any.
    Keep status concise and distinguish passed, failed, pending and unrun checks.

## Local verification by change type

| Change | Necessary local checks |
| --- | --- |
| Instructions/documentation only | Review scope and `git diff --check`; no application tests, build, browser or screenshot. |
| UI/CSS/copy/imagery | Relevant behavior tests if needed, one 768×1024 visual check/screenshot, one final build. |
| Isolated component/game rule | Relevant unit tests, focused browser flow only if needed, one final build; screenshot only if UI changed. |
| Persistence/authentication/shared engine/dependencies/CI | Relevant unit plus necessary security/integration/regression checks; run the full suite when risk warrants it, then one final build. |

Explicit task requirements and concrete failures can justify additional checks.
Never claim physical iPad Safari behavior or a deployment was verified without
successful evidence. Required GitHub CI remains mandatory even when local checks
are targeted.

## Architecture and safety invariants

- Keep game rules pure and separate from transport/presentation. Normalize and validate incoming events and saved data before use.
- Use stable player IDs, never nicknames as identities. Academic XP and contribution are separate; gifts cannot buy academic promotion or appointments.
- Preserve existing school code/local progress separately; the default Chùa Online experience is a 2D simulated LIVE presentation using the owner's bundled official PNG with centered contain sizing and source-calibrated cushion positions, with a toggle back to the still viewer. Keep all interactions explicitly mock and separate from academic XP. Preserve the mesh-based 3D sanctuary at ?experience=3d. Never substitute generated artwork for a missing reference file. Keep the earlier 52-visitor LIVE simulation available separately at ?experience=live. Prefer procedural/local assets and bounded rendering/effect costs.
- When networking is blocked, preserve completed work, run useful independent checks and report the exact blocker. Do not weaken TLS verification or change proxy/network policy to make commands pass. Use the supported permission flow when authorized.
- Commit reviewable changes. Do not reset history, discard user work or claim a local commit is published without verifying the remote result.
- Production requires server authority, authenticated admin access, durable transactions, replay protection and a data-retention policy. Browser storage is an MVP convenience, not a secure production source of truth.
