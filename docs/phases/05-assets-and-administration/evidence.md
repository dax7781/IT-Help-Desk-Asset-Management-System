# Phase 5 evidence

Verified: 2026-10-09. All seven tasks and exit criteria passed locally using fictional equipment and accounts.

| Task ID / exit criterion | Date | Result | Evidence link or command | Notes |
| --- | --- | --- | --- | --- |
| P05-T01 | 2026-10-09 | Passed | Integration tests / HTTP smoke | Strict fields/dates, unique tags and optional serial numbers, date ordering, lifecycle consistency, final retirement. |
| P05-T02 | 2026-10-09 | Passed | Integration tests / browser | Search/type/status filters, pagination beyond one page, employee scope. |
| P05-T03 | 2026-10-09 | Passed | Browser | Registered a fictional Dell monitor, edited and assigned it to Alex; detail, pending, feedback, and confirmation controls checked. |
| P05-T04 | 2026-10-09 | Passed | Transaction tests / browser | Atomic assignment history, stale/rollback cases, concurrent assignment/deactivation; history showed Available → Assigned and unassigned → Alex. |
| P05-T05 | 2026-10-09 | Passed | Integration tests / browser | Linked repair requests respect ownership; report issue preselects eligible equipment; historical safe summary survives access changes. |
| P05-T06 | 2026-10-09 | Passed | Integration tests / HTTP smoke / browser | Safe employee equipment, staff inventory history, admin provisioning and role/active controls; hashes never returned. |
| P05-T07 | 2026-10-09 | Passed | Integration tests / HTTP smoke | Retirement/duplicates, role changes, blocked deactivation with equipment/active work, inactive sessions, concurrent last-admin protection. |

## Final verification

- `npm.cmd run test`: **33 tests passed across four files** for phases 01–06, including isolated real MongoDB fixtures.
- `npm.cmd run test:smoke`: passed, including inventory registration/assignment/retirement, safe projections, user provisioning/deactivation, and last-admin protection.
- `npm.cmd run lint`, `npm.cmd run typecheck`, and final `npm.cmd run build`: passed.
- [Equipment detail, mobile](../../design/screenshots/equipment-mobile.jpg); [user management, mobile](../../design/screenshots/users-mobile.jpg). At 390×844 neither page overflowed horizontally; user fields were labelled and keyboard focus visible.

## Blockers and handoff

Phase 06 followed. User selectors intentionally cap at 500; repair links show the latest 50, documented in the README. Deactivation requires clearing all assigned equipment and active ticket assignments. No production account, commit, push, or deployment was created.
