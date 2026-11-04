# Engineering instructions

Read PROJECT_SPEC.md, ROADMAP.md and TASKS.md before implementing a milestone. Use the current isolated checkout; do not create worktrees unless requested.

- Keep game rules pure in src/game/engine.ts; transport adapters normalize inputs and must not import presentation code. Treat incoming events and saved data as untrusted.
- Use stable player IDs, never nicknames as identities. XP and contribution are separate; gifts cannot buy academic promotion or appointments.
- Default to local mock mode. Do not add credentials, paid services, public deployment, or a real connector without the required authorization/access.
- Preserve the 20-avatar scene and portrait layout. Cap rendering costs; prefer procedural/local assets. Respect reduced motion and user-initiated audio.
- Work in small milestones with explicit acceptance criteria. Update TASKS.md and relevant documentation with actual results, limitations and next work. Do not mark unexecuted checks passed.
- Run npm test and npm run build. When networking is blocked, preserve work, run dependency-free tests, and report the exact blocker. Do not weaken TLS or network policy.
- Commit reviewable changes. Do not reset user changes. PR creation requires an available remote branch and GitHub capability; report local commits accurately.
- Production requires server authority, authenticated admin access, durable transactions, replay protection and data-retention policy. Browser storage is a demo convenience only.
