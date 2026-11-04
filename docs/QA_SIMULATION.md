# Admin QA simulation lab

The **QA simulation lab** below the regular Admin progression panel is explicitly
simulation-only. It owns a new in-memory roster of the 20 school students, starting
from zero XP/rank. It never loads the regular save, calls useGame, writes storage,
changes the main scene/player selection, sends events, or connects to TikTok.
No production player service is configured or accessed.

Controls:
- Select any school student; QA selection is independent of the regular scene.
- Add 1–1,000,000 mock XP per grant, positive integers only. This is a labeled test
  override, not a change to normal comment/like/share/quiz/gift XP rules. It cannot
  grant contribution, an earned rank, exam evidence or an office.
- Check eligibility and request the next promotion. The existing engine enforces
  XP thresholds, exam gates and target-rank replay protection.
- Simulate 0%, 60%, 80% or 100% exams. Presets generate actual A/B/C/D answers for
  engine grading, with one valid attempt per player/session and no gate bypass.
- Start a new QA session to retry failed exams; only QA seats expire.
- Fill a limited office from eligible QA candidates, using existing academic-only
  tie breaks, capacity and one-office restrictions. Selection of a student does
  not override the fair candidate ranking.
- Preview the six-second 3D ceremony in a separate canvas. A visual preview may
  depict the next rank even when ineligible; it never grants rank, XP or history.
  Valid QA promotions also preview the ceremony. Test preview lights/particles are
  confined to this canvas and stop when it expires or Broadcast Mode opens.
- Reset QA progress after confirmation. Cancel preserves the test data; confirm
  creates a fresh QA roster and clears test history, exams, seats and preview.
  Regular player progress is unaffected in either case.

The panel renders no DOM or preview canvas in Broadcast Mode. Its QA data survives
mode switching within the current page, but is intentionally discarded on reload.
Do not use the older regular progression panel for destructive test setup if you
want to preserve the main browser-local mock save. The normal mock event simulator
can independently change regular progress while it is running; pause it before
comparing save snapshots during isolation checks.

Validation: 32 Node tests, production build and browser smoke. QA tests cover state
isolation, invalid/bounded XP, rank/replay/exam checks, seat limits, visual-only
previews and reset. Chromium smoke selects a student, exercises failure/retry and
promotion, renders a ceremony, checks Broadcast exclusion and mode-state retention,
and compares the regular storage value before/after the QA flow. Physical iPad
performance/Safari behavior remain unverified. No additional dependencies or
production data access were introduced.
