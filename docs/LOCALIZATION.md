# TASK-015 — Vietnamese UI

All built-in interface copy is centralized in src/i18n/vi.ts. English phrases are
stable lookup keys; t(key, ...values) inserts positional {0} placeholders. Keep
whole sentences in the catalog rather than translating user input or saved data.
This MVP ships Vietnamese only. Product name TikTok Academy and XP stay unchanged.

The catalog covers Admin/Broadcast, QA, accessibility labels, confirmations,
storage/fullscreen guidance, mock feed, quizzes/exams, offices/ranks and ceremonies.
Numbers and promotion dates use vi-VN formatting; document language is vi.
Nickname text, rank indices, question/office/session IDs, correct-answer codes,
thresholds and persistence format remain unchanged. Rank/question display strings
are localized when the module loads, not stored as translated identifiers.

Portrait type and wrapping accommodate longer Vietnamese labels. Compact avatar
rank labels retain ellipsis and full-title tooltips. Physical Safari/iPad streaming
and font legibility still need a device check. No real TikTok integration added.

Validation: 35 Node tests, production build, Chromium software-WebGL at 320x568,
390x844, 768x1024, 820x1180 and 834x1194. Checks cover 9:16, horizontal overflow,
20 label collisions, overlay bounds, Vietnamese controls/exam/QA headings,
fullscreen fallback and unchanged saved progress across mode switches.
