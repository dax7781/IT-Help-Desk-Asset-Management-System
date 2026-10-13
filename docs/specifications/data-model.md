# MongoDB data model

[Docs](../README.md) | [Architecture](architecture.md)

MongoDB/Mongoose replaces PostgreSQL/Prisma by user request. Documents use string UUID primary keys; reference IDs are validated in services because MongoDB does not enforce foreign keys. Unique indexes are created explicitly before seeding or application use.

| Collection | Required fields and rules |
| --- | --- |
| Users | UUID, name, unique normalized email, role, passwordHash (excluded by default), isActive, version, sessionVersion, createdAt/updatedAt |
| Tickets | UUID, unique TD-prefixed public number, title, description, category, priority, status, createdById, nullable assignedToId/assetId, resolutionSummary/resolvedAt/closedAt, version, timestamps |
| Assets | UUID, unique assetTag, type, manufacturer/model, optional unique serialNumber, location, status, assignedUserId, staff-only notes, version, timestamps; purchase/warranty fields added with inventory implementation |
| Comments | UUID, ticketId, authorId, plain-text message, isInternal, createdAt; immutable in MVP |
| TicketHistory | UUID, ticketId, actorId, eventType, PUBLIC/INTERNAL visibility, optional old/new values, createdAt; append-only |
| RateLimits | Hashed subject/scope/time-window key, count, expiresAt; TTL cleanup. Shared login and authenticated write quotas. Legacy LoginAttempts expire through their existing TTL index. |
| WorkflowGuard | Shared workflow document/version; coordinates cross-record transaction invariants |
| demo_environment | Explicit fictional-demo marker only for guarded disposable demo operations; not a public endpoint |
| AssetHistory (phase 05) | assetId, actorId, eventType, old/new lifecycle or assignment, createdAt |
| Notifications (optional) | recipientId, ticketId, eventType, readAt, createdAt |

Types: Laptop, Desktop, Monitor, Printer, Network Device, Other. Asset lifecycle: Available, Assigned, Under Repair, Retired. Assigned requires an active user. Available/Retired have no user; Under Repair may retain one. Retired assets cannot be newly linked or assigned. Employees can select their own non-retired equipment; staff can select permitted non-retired equipment.

Phase 02 seeds fictional laptops; phase 03 provides safe selection and linked summaries; phase 05 implements inventory writes, purchase/warranty dates and AssetHistory. Historical tickets show only safe asset fields after equipment reassignment; inaccessible asset detail links are omitted.

Ticket/history, comment/history, and asset/history mutations use MongoDB transactions. Comment writes increment ticket version. Ticket/asset/user edits require expected versions; new comments do not overwrite existing text. WorkflowGuard coordinates application mutations to prevent cross-record write skew. See decision 002 for the performance tradeoff.

Indexes: unique user email, ticket number, assetTag; partial unique serialNumber for string values; ticket creator+creation date+ID, assignee+status, status+creation date, assetId; comment/history ticket+date+ID; asset assignedUserId/status; login expiry TTL. Ticket numbers use a random UUID-derived suffix with uniqueness enforced by the index.

No hard deletion through application APIs. A separately invoked, guarded reset CLI can replace explicitly disposable demo collections; ordinary techdesk is refused. Employee projections never include staff notes, internal comments/events or password hashes. Auth.js Credentials/JWT needs no OAuth adapter collections here. Account access edits increment sessionVersion; preparation backfills missing defaults without changing records or passwords.
