# Decision log

| ID | Decision | State | Evidence |
| --- | --- | --- | --- |
| D-001 | Next.js/TypeScript/Tailwind, MongoDB/Mongoose, Auth.js Credentials, Vitest; Recharts for analytics | Confirmed for local version 1.0.0 | package.json/lockfile |
| D-002 | Local persistent MongoDB replica set; Atlas possible later | Confirmed initial development setup | scripts/dev.ts |
| D-003 | Email/password with bcrypt hashes and JWT sessions; current DB roles/status checked server-side | Confirmed | User preference and authentication code |
| D-004 | Fictional seeded accounts; no public registration | Confirmed for local demo; hosted reset/access deferred | scripts/seed-data.ts |
| D-005 | MIT license | Default retained from pre-implementation clarification | LICENSE |
| D-006 | Local browser inspection and real replica-set integration tests | Selected | Phase evidence |
| D-007 | Shared login and authenticated mutation quotas; anonymous edge controls belong to hosting | Local controls implemented; host-edge configuration deferred | [Security decisions](003-local-release-and-security.md) |
| D-008 | No commits, pushes, remote creation, or deployment now | User-confirmed | Latest user instruction |
| D-009 | Serialize cross-record mutations with a shared transaction guard | Implemented and race-tested | [Workflow decisions](002-workflow-inventory-and-reports.md) |
| D-010 | Clear assigned equipment and active work before deactivation; preserve an active administrator | Implemented and verified | [Workflow decisions](002-workflow-inventory-and-reports.md) |
| D-011 | Label snapshots separately from 30-day UTC resolution cohorts; scope report fields by role | Implemented and fixture-tested | [Reporting](../specifications/reporting.md) |
| D-012 | Install two relevant interface-review skills from the requested list | Applied during phase 06 | [Tool review](../research/requested-tools-review.md) |
| D-013 | Revoke sessions after access changes, including reactivation | Implemented and regression-tested | [Security decisions](003-local-release-and-security.md) |
| D-014 | Revise phase 08 to a local production package and deployment instructions | User-selected 2026-10-12 | [Delivery guide](../operations/deployment-guide.md) |
| D-015 | Guard disposable-demo reset with database whitelist, marker, confirmation and transaction | Implemented; no project/Atlas reset | [Security decisions](003-local-release-and-security.md) |
| D-016 | Adapt Salesforce/ServiceNow workspace patterns within the current stack and role model | Implemented in local version 1.1.0 | [Enterprise workspace](../design/enterprise-workspace.md) |
| D-017 | Snapshot asset detail and validate the exact managed database before configuration writes | Regression-tested in version 1.1.0 | [Refresh audit](../quality/enterprise-refresh-review.md) |

See [initial implementation](001-initial-implementation.md) and [workflow, inventory, and reports](002-workflow-inventory-and-reports.md) for rationale. Record future changes with context, alternatives, trade-offs, and verification; update specifications/phase criteria when behavior changes.
