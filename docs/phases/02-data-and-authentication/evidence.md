# Phase 02 evidence

Completed: 2026-10-09. Owner: Codex.

| Task | Verification | Evidence |
| --- | --- | --- |
| P02-T01 | Compatible dependencies pinned; Credentials + bcrypt + JWT chosen | package.json/package-lock.json, [decision](../../decisions/001-initial-implementation.md) |
| P02-T02 | Actual MongoDB replica set starts and accepts transactional writes | scripts/dev.ts, real database integration tests |
| P02-T03 | Document schemas and unique/query/TTL indexes established | src/models/index.ts, scripts/indexes.ts; duplicate assetTag rejected in integration test |
| P02-T04 | Four fictional users (three roles), equipment, tickets, private note/history seeded | scripts/seed-data.ts; restart retained browser-created records and inserted no replacement users |
| P02-T05 | All three roles authenticated through HTTP; employee login also exercised in browser | scripts/smoke.ts; bcrypt hashes are excluded by default; eight-hour JWT session configuration |
| P02-T06 | Server loads current active status/role; owner filters and safe projections used | src/lib/current-user.ts, src/services/tickets.ts; forged-role and inactive-account integration checks pass |
| P02-T07 | Administrator bootstrap documented; ownership and private-note boundaries verified | README demo/seed instructions; API returns 401/404 as expected; employee payload excludes private notes/events |

Exit criteria pass. Local persistent storage survived a stop/restart. Test replicas are isolated from the development database. Signup, password recovery, OAuth, and production admission remain outside this delivery.
