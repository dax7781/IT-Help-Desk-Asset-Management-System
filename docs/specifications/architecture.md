# Architecture

[Docs](../README.md) | [Progress](../tracking/progress.md)

User-confirmed decisions (2026-10-09): simple email/password login; MongoDB instead of PostgreSQL; local build only, no commits or pushes. These supersede the archived plan.

Use Next.js App Router, TypeScript, Tailwind CSS, MongoDB, Mongoose, Auth.js Credentials, bcryptjs, Vitest, and Recharts for phase 06 analytics. Installed compatible versions are pinned in package.json and package-lock.json. Vercel remains a later hosting candidate; no deployment is included now.

Auth.js manages signed/encrypted JWT sessions with an eight-hour lifetime; passwords are stored only as bcrypt hashes (cost 12). Accounts are provisioned/seeded, with no public sign-up, password reset, or OAuth in phases 01–03. Every authorized request reloads active status and role from MongoDB; client/JWT role claims do not grant access. Invalid sign-in uses a generic message. Login attempts are bounded per normalized email/time window in MongoDB with a TTL index.

Phase 07 adds session-version revocation after access changes, distributed mutation counters, bounded sign-in bodies, sanitized auth logs and nonce CSP. HTML dynamically renders per request to match its script nonce; styles permit inline attributes for React/Recharts. See [decision 003](../decisions/003-local-release-and-security.md). Phase 08 is now the user-selected local package and deployment instructions, not a hosted demo.

Request flow: page/client → route handler → authentication/validation → service authorization/business rules → Mongoose → MongoDB. Server pages use the same services. Server Components load records; Client Components handle forms and feedback.

MongoDB must support transactions: use a replica set locally or MongoDB Atlas later. A project-local mongodb-memory-server replica-set runner uses persistent WiredTiger storage under ignored .local/mongodb and a dedicated port 27027. It downloads the MongoDB vendor binary on first use. Test databases use isolated temporary replica sets. No cloud account or Docker engine is required for this initial build.

MongoDB replaces SQL migrations/foreign keys: Mongoose schemas and unique indexes enforce document shape/uniqueness; services validate referenced records and lifecycle rules. Ticket and history writes, and comment/history writes, run in one transaction. Index creation is explicit and repeatable; breaking schema changes later require documented scripts and backups.

Folder structure:

```text
scripts/          local MongoDB runner, safe seed, index setup
src/models/       Mongoose document schemas and indexes
src/app/          auth, protected pages, API route handlers
src/components/   shared UI and interactive forms
src/lib/          database, authentication, permissions, error handling
src/services/     authorized transactional business operations
src/validators/   Zod input schemas
 tests/           unit and real MongoDB integration checks
 docs/            specifications, phase tasks, decisions, evidence
```

Store timestamps in UTC; current UI renders explicitly labeled Eastern dates/times. Mutation APIs reject unverified origins, non-JSON bodies, excessive body sizes, unauthorized fields, and invalid references. Private notes and internal history are filtered before response serialization. Build-time rendering must not require a live database.

Sources: [Auth.js Credentials](https://authjs.dev/getting-started/authentication/credentials), [Mongoose transactions](https://mongoosejs.com/docs/transactions.html).
