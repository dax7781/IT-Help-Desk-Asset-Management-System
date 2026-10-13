# Phase 2: Database and authentication

Status: Complete | Owner: Codex | Target: Week 2, 8–12 hours

[Progress](../../tracking/progress.md) | [Docs](../../README.md)

## Goal

Fictional records and server-enforced identity/access.

## Entry criteria

Phase 01 passes; MongoDB replica-set and email/password approach selected.

## References

- [architecture](../../specifications/architecture.md)
- [data-model](../../specifications/data-model.md)
- [permissions](../../specifications/permissions.md)

## Task checklist

- [x] **P02-T01** Choose compatible dependency versions, email/password session design, and demo login approach; record decisions.
- [x] **P02-T02** Connect development MongoDB replica set and configure Mongoose.
- [x] **P02-T03** Implement core document schemas, unique indexes, and repeatable index setup.
- [x] **P02-T04** Add repeatable fictional seed users/assets/tickets with all three roles.
- [x] **P02-T05** Implement Auth.js sign-in/session integration and active-account admission.
- [x] **P02-T06** Implement shared server permission guards and safe response projections.
- [x] **P02-T07** Verify role/ownership boundaries and document administrator bootstrap.

## Exit criteria

Fresh index setup/seed works; three roles sign in; inactive/unprovisioned users and unauthorized access are denied.

## Evidence and handoff

Record actual commands, test outcomes, screenshots or artifact links, and verification dates in [evidence.md](evidence.md). Check tasks after verification; mark this phase complete only when every task and exit criterion passes. Record blockers in the shared log.
