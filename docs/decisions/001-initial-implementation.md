# 001 — Initial implementation decisions

Date: 2026-10-09. Scope: phases 01–03 only.

The user prefers simple login, requires MongoDB, and defers GitHub publishing/commits. Use Auth.js Credentials with bcrypt hashes and JWT sessions, Mongoose document models, and a local transaction-capable MongoDB replica set. This avoids OAuth/provider account setup while retaining server-side account/permission checks. Mongoose fits MongoDB directly; Prisma/SQL migrations are removed from the current plan.

Docker is installed but its engine is stopped. The local development runner starts a vendor MongoDB binary in a replica set with persistent ignored storage; tests use temporary isolated replica sets. A dedicated port avoids interfering with an existing database listener. External replica-set/Atlas configuration is supported by a separate development command later.

No signup/reset or production demo distribution is included. Local passwords are generated into ignored .env.local and hashed during seed; seed never changes existing user passwords. Full technician workflow, inventory CRUD, analytics, and deployment remain later phases.

GitHub CI is prepared locally. Repository creation, Git initialization/commits/pushes, and live CI execution are deferred; this is an explicit scope adjustment, not a silently completed remote task. No assistant skill/plugin installation is needed.

Operational risks: first local run needs MongoDB binary download; replica-set transaction support is required; Auth.js is a pinned beta and should be reviewed before production; account recovery and stronger public-demo abuse controls are future work.
