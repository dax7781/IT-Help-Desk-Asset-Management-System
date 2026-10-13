# Phase 7: Security and reliability

Status: Complete | Owner: Codex | Target: Week 7, 8–12 hours

[Progress](../../tracking/progress.md) | [Docs](../../README.md)

## Goal

Verify authorization, integrity, and release readiness.

## Entry criteria

Phase 06 passes; core feature scope frozen.

## References

- [permissions](../../specifications/permissions.md)
- [ticket-workflow](../../specifications/ticket-workflow.md)
- [api-contract](../../specifications/api-contract.md)
- [data-model](../../specifications/data-model.md)

## Task checklist

- [x] **P07-T01** Complete business-rule tests for transitions and permission matrix.
- [x] **P07-T02** Add API/database integration tests for ownership and internal-note isolation.
- [x] **P07-T03** Verify transaction rollback, uniqueness failures, and concurrent updates.
- [x] **P07-T04** Verify session expiration/deactivation and role changes take effect server-side.
- [x] **P07-T05** Review secrets, input limits, origin protection, logs, and demo abuse controls.
- [x] **P07-T06** Run full role-by-role workflow and responsive accessibility review.
- [x] **P07-T07** Fix release-blocking defects and pass the same checks configured for CI locally; remote Actions remain deferred with Git publishing.

## Exit criteria

Business/API/database tests and lint/typecheck/build pass; release-blocking defects fixed; secrets and demo abuse controls reviewed.

## Evidence and handoff

Record actual commands, test outcomes, screenshots or artifact links, and verification dates in [evidence.md](evidence.md). Check tasks after verification; mark this phase complete only when every task and exit criterion passes. Record blockers in the shared log.
