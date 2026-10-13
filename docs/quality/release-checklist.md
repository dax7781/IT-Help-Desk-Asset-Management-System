# Verification and release acceptance

Use Vitest for meaningful business-rule tests and integration tests against a dedicated MongoDB replica-set test database. Add browser automation for the main role workflow if capacity permits; otherwise keep a repeatable documented browser checklist. Mocked authorization tests alone do not demonstrate safe database access.

Required cases: employee cannot enumerate another employee's tickets; direct URL/API access is denied; internal notes and related metadata are absent from employee payloads; non-staff cannot assign or set priority; technician cannot change another assignee's work state; invalid transitions fail; resolution requires summary; reopening preserves prior events; stale updates fail; failed history insertion rolls back mutation; duplicate asset tags fail; employee cannot link someone else's asset; inactive users lose access; last active administrator is protected; metrics match the known dataset.

Local release checklist (scope selected 2026-10-12):
- [x] Fresh source package installs, creates indexes, seeds, and runs using documented instructions.
- [x] Employee submits a ticket linked to their laptop and sees public updates.
- [x] Technician claims, starts work, adds internal/public notes, resolves, and closes it.
- [x] Employee reopens it with a reason and history remains accurate.
- [x] Administrator registers and assigns equipment and reviews actual reports.
- [x] Role and record permissions pass direct API checks.
- [x] Desktop and mobile workflows are usable with keyboard-accessible controls.
- [x] Lint, typecheck, tests, and production build pass.
- [x] Local production sign-in, database, and complete workflows pass HTTP and Chromium checks.
- [x] README reflects implemented features and the demo contains only fictional records.

Hosted sign-in/cookies, provider-edge controls, real Atlas connection, cloud recovery and remote Actions are excluded by the user's local-package decision and tracked separately in [follow-ups](../tracking/follow-ups.md). No checklist entry claims a hosted deployment. Evidence is in phases 07–08.
