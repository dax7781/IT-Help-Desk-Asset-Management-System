# Phase 8: Local release package and deployment instructions — M2

Status: Complete | Owner: Codex | Target: Week 8, 8–12 hours

[Progress](../../tracking/progress.md) | [Docs](../../README.md)

Version 1.0.0 task evidence is the original delivery baseline; current maintenance release 1.1.0 is documented in the [refresh review](../../quality/enterprise-refresh-review.md).

## Goal

Verified local production package, operational instructions, and portfolio handoff. Scope revised by the user on 2026-10-12; hosting and Git publishing are deferred. [Previous hosted criteria](../../archive/hosted-release-plan.md).

## Entry criteria

Phase 07 passes; an isolated verification database and local production runtime are available.

## References

- [architecture](../../specifications/architecture.md)
- [product-scope](../../specifications/product-scope.md)

## Task checklist

- [x] **P08-T01** Validate local/runtime configuration and document private Atlas/HTTPS setup.
- [x] **P08-T02** Provide one controlled index/data preparation step and explicit isolated-demo initialization.
- [x] **P08-T03** Start the local production build and smoke-test every role on an isolated database.
- [x] **P08-T04** Establish repeatable, guarded demo reset and database recovery instructions.
- [x] **P08-T05** Finish README with setup, actual features, screenshots, local demo, tests, and limitations.
- [x] **P08-T06** Write architecture/decision notes and an interview walkthrough.
- [x] **P08-T07** Package version 1.0.0 without secrets/data, pass local acceptance, and record follow-up issues locally.

## Exit criteria

Local production role workflows pass; fresh package installation and verification pass; reset/recovery are documented; README reflects real behavior; local release checklist passes. No hosted deployment or remote CI is claimed.

## Evidence and handoff

Record actual commands, test outcomes, screenshots or artifact links, and verification dates in [evidence.md](evidence.md). Check tasks after verification; mark this phase complete only when every task and exit criterion passes. Record blockers in the shared log.
