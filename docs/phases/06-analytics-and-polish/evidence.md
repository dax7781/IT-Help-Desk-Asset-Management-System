# Phase 6 evidence

Verified: 2026-10-09. All seven tasks and exit criteria passed. Report integration fixtures use a fixed clock; API callers cannot override the clock.

| Task ID / exit criterion | Date | Result | Evidence link or command | Notes |
| --- | --- | --- | --- | --- |
| P06-T01 | 2026-10-09 | Passed | Integration tests / HTTP smoke | Current-role scopes: employee own data, technician queue/own workload, organization breakdowns administrator-only. |
| P06-T02 | 2026-10-09 | Passed | Integration tests / browser | Live current totals/statuses, recent-ticket links, ownership, empty states. |
| P06-T03 | 2026-10-09 | Passed | Browser / build | Pinned Recharts 3.10.1 category bars with a visible equivalent table; decorative SVG hidden from assistive technology. |
| P06-T04 | 2026-10-09 | Passed | Deterministic integration tests | Workload includes unassigned and eligible active staff; mean latest resolution within labelled 30-day UTC window; reopened tickets excluded. Small positive means display <0.1 hours. |
| P06-T05 | 2026-10-09 | Passed | Source review / browser | Shared pending/error/success, first-error focus, unsaved-change warnings, labels, navigation, cancel links, confirmation resets. |
| P06-T06 | 2026-10-09 | Passed | Mobile / keyboard / contrast checks | No horizontal overflow on dashboard/ticket/equipment/users at 390×844. Tab/focus and skip-link activation checked; main receives focus. User fields labelled; main text/placeholder/status pairs above 4.5:1; reduced motion respected. |
| P06-T07 | 2026-10-09 | Passed | Fixed-clock MongoDB fixtures | Exact totals/categories/workload, administrator 4-hour and employee 2-hour means, technician suppression, empty cohorts, inclusive window boundaries. |

## Final verification and artifacts

- `npm.cmd run test`: **33 tests passed across four files** for phases 01–06.
- `npm.cmd run test:smoke`: passed, including role-scoped analytics and all phase 04/05 HTTP workflows.
- `npm.cmd run lint`, `npm.cmd run typecheck`, and final `npm.cmd run build`: passed. Build completed TypeScript validation, page generation, and route output.
- `npm.cmd audit --omit=dev --json`: **zero runtime vulnerabilities** after Recharts was added. Full audit retains [the development-only advisory](../../quality/dependency-audit.md).
- [Analytics chart and visible table](../../design/screenshots/analytics-desktop.jpg), [desktop overview](../../design/screenshots/dashboard-desktop.jpg), [mobile dashboard](../../design/screenshots/dashboard-mobile.jpg).
- [Authored source review and fixes](../../quality/source-review.md); [all nine requested tools reviewed](../../research/requested-tools-review.md). Vercel Web Design Guidelines and Taste Skill's redesign variant installed, read, and applied.

Screenshots reflect fictional records at capture time; later smoke runs add named demo records. Transient HMR errors during source edits were resolved before final build and browser workflows.

## Blockers and handoff

Phases 01–06 complete: **41/55 tasks (74.5%)**, M1 complete. Phases 07–08 remain. [B-001](../../tracking/blockers.md) remains open for development tooling. No commits, pushes, remote repository, connector, or deployment was created.
