# Repository, configuration, and later delivery

Current authorization (2026-10-12): finish the local package and deployment instructions through phase 08; no commits, pushes, remote repository, release tags, or hosted deployment. CI checks run locally via npm run verify; the workflow cannot run remotely until publishing is requested. See [current delivery guide](deployment-guide.md).

Keep npm scripts and lockfile reproducible. Never commit .env.local, .local database/binaries, test outputs, or real employee records. Track verified task IDs in phase evidence/progress; never mark untested behavior complete.

Environment: MONGODB_URI (replica set or Atlas), AUTH_SECRET, AUTH_URL, DEMO_PASSWORD for local seed only. SHOW_DEMO_ACCOUNTS is enabled by the local runner, not required in an external deployment. Seed refuses databases other than techdesk/techdesk_test and inserts only missing fictional records; it does not reset or overwrite records/passwords.

Later hosting must use separate development/test/demo databases, proper database credentials, secure cookies over HTTPS, a documented index/data-change step, backups, and an intentional demo reset strategy. The local managed database is for development/testing, not a production hosting service. Never run seed/reset against production.

Configure connection pool limits for hosting rather than SQL migration connections. Do not create indexes or perform schema-data changes per request. Preview apps must not share a live production/demo database for mutations.

README reflects real features, setup, local demo, screenshots, tests, architecture and limits. Hosting/recruiter demo publishing is deferred in [F-002/F-003](../tracking/follow-ups.md). Version 1.1.0 is a local package, not a Git release/tag; version 1.0.0 phase evidence remains historical.
