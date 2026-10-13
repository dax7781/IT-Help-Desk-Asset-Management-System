# Phase 7 evidence

Verified on 2026-10-12 for the local version 1.0.0 release. Real isolated replica sets are used for database checks; production HTTP/browser tests use ephemeral data and credentials. Existing project records and .env.local are preserved.

| Task ID / exit criterion | Date | Result | Evidence link or command | Notes |
| --- | --- | --- | --- | --- |
| P07-T01 | 2026-10-12 | Passed | Vitest workflow fixtures | Role/work-state restrictions, reasons, transition boundaries, eligible assignees, last-admin rules. |
| P07-T02 | 2026-10-12 | Passed | Real MongoDB integration / production HTTP | Own-only enumeration/detail/equipment, private comments/history/projections, direct API action allowlists. |
| P07-T03 | 2026-10-12 | Passed | Transaction/concurrency fixtures | Rollback, unique identifiers, stale writes, assignment/deactivation races, simultaneous admin removal, coherent snapshot reads during concurrent comments. |
| P07-T04 | 2026-10-12 | Passed | Auth.js encryption / actual credential HTTP tests | Expired/tampered/wrong-secret tokens denied; account access changes revoke sessions; reactivation does not revive them; fresh sign-in reflects current role. |
| P07-T05 | 2026-10-12 | Passed | Security integration / HTTP / source review | Actual-stream 32 KiB bounds including authentication, same-origin and Auth.js CSRF, sanitized logs, 10/email login quota, 60/minute and 1,000/day write quotas, TTL counters and Retry-After. Source archive excludes credentials/data. |
| P07-T06 | 2026-10-12 | Passed | Isolated production Chromium scenario | Three roles, equipment-linked submission, claim/start/private note/resolve/close/reopen, admin reports/users, mobile overflow, Tab/skip-link focus and sign-out. No browser console/page errors or CSP violations. |
| P07-T07 | 2026-10-12 | Passed | Shared verify pipeline | Route type generation, lint, typecheck, unit/integration tests, production build, HTTP and browser scenario. Same command configured for Actions; no remote workflow run claimed. |

## Checks and defects fixed

- **46 Vitest tests across five files**, plus **one complete Playwright production scenario**. `npm.cmd run verify` is the shared local/CI check; Chromium requires the one-time `npm.cmd run browser:install`.
- `npm.cmd run db:prepare` passed on the configured local database, creating indexes/backfilling missing session-version defaults without changing passwords or resetting records.
- The browser caught a rapid note-to-resolution conflict. Detail reads now use a coherent MongoDB snapshot; ticket forms share pending state through server refresh completion. The new concurrent-comment regression and the rapid browser sequence pass.
- Production sign-in request reconstruction, Windows JSON BOM handling, persistent startup recovery timeout, fresh route type generation and external-URI preservation were corrected during verification.
- Runtime audit: **zero vulnerabilities**. Full audit retains the unpatched development-only lint-chain advisory; see [audit](../../quality/dependency-audit.md).

## Browser artifacts

[Desktop dashboard](../../design/screenshots/release-dashboard-desktop.png), [mobile dashboard](../../design/screenshots/release-dashboard-mobile.png), [reopened employee ticket](../../design/screenshots/release-workflow-mobile.png), [mobile administrator users](../../design/screenshots/release-users-mobile.png). Screenshots show the isolated fictional test dataset; its database is discarded after the scenario. No real password or session trace is included.

## Blockers and handoff

The local release accepts B-001 as a tooling follow-up; no application check remains failing. Hosted edge controls, real Atlas credentials, provider recovery and remote CI are deferred in the [follow-up backlog](../../tracking/follow-ups.md). No Strix/cloud source upload or external connector was used.
