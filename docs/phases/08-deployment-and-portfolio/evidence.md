# Phase 8 evidence

Historical version 1.0.0 delivery evidence. The current version 1.1.0 interface/audit release has separate [verification evidence](../../quality/enterprise-refresh-review.md); use its package and current screenshots.

The obsolete 1.0.0 archive and extracted verification folders were removed during the user's final cleanup. These dated verification records remain; the current 1.1.0 package is the deliverable.

Local-release scope selected by the user on 2026-10-12. Hosted deployment, remote CI, commits/pushes and Git tags are excluded; the former hosted criteria are preserved in [the archive](../../archive/hosted-release-plan.md).

| Task ID / exit criterion | Date | Result | Evidence link or command | Notes |
| --- | --- | --- | --- | --- |
| P08-T01 | 2026-10-12 | Passed | Release environment tests / Atlas template / guide | Explicit database, valid origin/secret; local production config works. Supplied Atlas templates contain placeholders and were not used to authenticate. |
| P08-T02 | 2026-10-12 | Passed | db:prepare / isolated demo tests | One controlled index/session-default step; demo initialization restricted to named disposable databases, refusing unmarked business records including orphan comments/history. |
| P08-T03 | 2026-10-12 | Passed | Production HTTP + Chromium scenario | Actual next start with isolated replica set; every role and full ticket/inventory/admin/report flow verified. Persistent localhost preview also started successfully. |
| P08-T04 | 2026-10-12 | Passed | Reset integration tests / recovery runbook | Exact-name and marker guards, atomic reset, rollback under seed failure, session revocation. MongoDB/Atlas backup procedures documented; cloud/tool restore not claimed as executed. |
| P08-T05 | 2026-10-12 | Passed | README / screenshots | Setup, actual features, demo access, test commands, architecture, limits and deferred hosting accurately described. |
| P08-T06 | 2026-10-12 | Passed | [Decision 003](../../decisions/003-local-release-and-security.md) / [walkthrough](../../operations/interview-walkthrough.md) | Engineering tradeoffs and five-minute portfolio demonstration documented. |
| P08-T07 | 2026-10-12 | Passed | Local version 1.0.0 source archive / acceptance / backlog | package-lock included; dependencies, credentials, .local data, .next output, Git and test-session artifacts excluded. Follow-up issues recorded locally; no tag or publishing. |

## Reproducibility and package evidence

- Extracted source ZIP into a fresh workspace folder, installed pinned dependencies with `npm.cmd ci`, then ran `npm.cmd run verify` from that extracted directory. The final pipeline includes **46 Vitest tests**, lint/typecheck, production build, real HTTP and **one Chromium role scenario**. The MongoDB postinstall pre-download was deferred during install; runtime tests still use a real MongoDB vendor binary.
- Next.js root/tracing configuration explicitly uses the project working directory, preventing a nested verification folder from selecting its parent's lockfile.
- The package is produced by `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-release.ps1`; final ZIP is under ignored output/techdesk-1.0.0.zip. Its source whitelist includes the lockfile, templates, documentation and browser tests. SHA-256 is recorded alongside the delivered archive.
- Final verification preserves the project .env.local/persistent MongoDB. Temporary fixtures are removed with their own replica sets. No reset was run on the ordinary techdesk database or the supplied Atlas cluster.

See [local acceptance](../../quality/release-checklist.md), [deployment instructions](../../operations/deployment-guide.md), [backup/recovery](../../operations/backup-and-recovery.md), and [source review](../../quality/source-review.md).

## Blockers and handoff

Local MVP delivery is complete under the revised phase 08 scope. Hosting still needs a real private Atlas URI and a chosen platform, with separate hosted acceptance and a backup drill. No account connector, commit, push, remote repository or deployment was performed. [F-001 through F-007](../../tracking/follow-ups.md) are future work, not silent additions to this release.
