# Phase 4 evidence

Verified: 2026-10-09. All seven tasks and M1 exit criteria passed locally using fictional records and a real MongoDB replica set.

| Task ID / exit criterion | Date | Result | Evidence link or command | Notes |
| --- | --- | --- | --- | --- |
| P04-T01 | 2026-10-09 | Passed | Integration tests / HTTP smoke | Staff queue filters, stable pagination, and role boundaries. |
| P04-T02 | 2026-10-09 | Passed | Integration tests / HTTP smoke / browser | Claim, admin assignment/reassignment/unassignment; one winner under concurrent claims, stale versions rejected. |
| P04-T03 | 2026-10-09 | Passed | Integration tests / HTTP smoke / browser | Full lifecycle, required resolution/reopen reasons, invalid skipped transitions, reopening with cleared current resolution fields. |
| P04-T04 | 2026-10-09 | Passed | Integration tests / HTTP smoke / browser | Staff priority and private notes; employee comments and history omit private content/events. |
| P04-T05 | 2026-10-09 | Passed | Real MongoDB transaction tests | Expected versions, atomic history, rollback, shared guard for cross-record races. |
| P04-T06 | 2026-10-09 | Passed | Integration tests / HTTP smoke | Ownership, current roles, assignment eligibility, invalid transitions, reopening, private-note confidentiality. |
| P04-T07 / M1 | 2026-10-09 | Passed | [Demo walkthrough](../../../README.md) / browser | Employee created a linked ticket; technician claimed, started, noted, resolved, closed; employee reopened. |

## Final verification

- `npm.cmd run test`: **33 tests passed across four files** for phases 01–06, including isolated real MongoDB integration fixtures.
- `npm.cmd run test:smoke`: passed against the running local app for three roles, ownership, origin/validation, full lifecycle, private notes, assets, users, and scoped analytics.
- `npm.cmd run lint`, `npm.cmd run typecheck`, and final `npm.cmd run build`: passed. The build completed compilation, TypeScript validation, page generation, and route output.
- [Technician controls and private note](../../design/screenshots/workflow-desktop.jpg); [employee view after reopening, mobile](../../design/screenshots/workflow-mobile.jpg). Ticket pages had no horizontal overflow at 390×844.

## Blockers and handoff

M1 complete; phase 05 followed. No commits, pushes, connector, or deployment. The development-only dependency advisory remains in [B-001](../../tracking/blockers.md); it does not block these local workflows.
