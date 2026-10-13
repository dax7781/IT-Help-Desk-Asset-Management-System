# Archived planning baseline

Historical reference captured 2026-10-09; current phase plans and specifications supersede this baseline.

# TechDesk — Project and Implementation Plan

Status: planned; implementation has not started.

This plan turns the supplied planning document into an actionable specification for a portfolio web application. Target effort is eight weeks at 8–12 hours per week (64–96 hours). Treat the schedule as a capacity estimate; carry unfinished acceptance criteria forward instead of skipping them.

## 1. Product goal and scope

TechDesk helps a single organization's employees report technical problems, technicians manage support work, and administrators track equipment and support performance. The finished repository should demonstrate a real database, authentication, server-enforced permissions, meaningful tests, a responsive interface, and clear engineering documentation.

Primary demonstration: an employee submits a Wi-Fi problem against their assigned laptop; a technician claims it, records troubleshooting, resolves it, and closes it; an administrator reviews the repair history and reporting.

### Release milestones

| Milestone | Required outcome | Target |
| --- | --- | --- |
| M1: Working help desk | Login, three roles, ticket submission, authorized lists/detail, assignment, comments, status workflow, history | End of week 4 |
| M2: Portfolio release | Asset inventory and assignments, repair history, database-backed dashboards, security verification, responsive UI, hosted demo, repository documentation | End of week 8 |
| Optional extension | QR asset lookup, after M2 requirements pass | Remaining capacity or later release |

MVP excludes attachments, email, real-time notifications, device monitoring, AI assistance, multi-organization tenancy, SLA automation, procurement, and native mobile apps. In-app notifications are a later enhancement. These features must not delay the required releases. QR lookup is the preferred first extension because it supports equipment audits without introducing another service.

## 2. Technical architecture

Use the supplied stack: Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js, Recharts, and Vitest. Use Neon as the initial managed PostgreSQL provider and Vercel for deployment. Record actual compatible versions and authentication configuration when scaffolding, then commit the package lockfile. Do not mix multiple authentication or database providers.

Use Auth.js with a supported OAuth provider for the initial implementation. Administrators provision allowed email addresses and roles; sign-in must match an active, provisioned user. Never let a client choose its role or automatically grant access to an unknown account. The first administrator is bootstrapped through a controlled seed/configuration step. A public recruiter demo needs a separate, isolated demo environment; choose and document its login mechanism during week 2 before building it. Do not use production administrator credentials for demo access.

Request flow: page or client component → route handler → authentication and input validation → service-level authorization and business rules → Prisma → PostgreSQL. Pages may call the same services directly on the server. Avoid duplicating business rules between pages and APIs.

Server Components load initial data; Client Components handle interactive forms, filters, and charts. Mutation routes return structured results and trigger data refresh. Database credentials and authentication secrets remain server-side. Use UTC timestamps in storage and local formatting in the interface.

```text
prisma/                  schema, migrations, fictional seed data
public/                  static assets
src/app/(auth)/login/     sign-in screen
src/app/(app)/            authenticated layout and routes
  dashboard/             role-specific overview
  tickets/               list, new, and [id] detail
  assets/                staff inventory and [id] detail
  my-assets/             employee equipment view
  admin/users/           account and role management
src/app/api/             route handlers
src/components/          layout, UI, tickets, assets, dashboard
src/lib/                 auth, db, permissions, shared errors
src/services/            ticket, asset, user, reporting rules
src/validators/          request schemas
tests/                   business rules and integration tests
docs/                    architecture, decisions, demo walkthrough
```

## 3. Roles and authorization

All users are authenticated and active. Check both role and record ownership on the server. Filtering a list and authorizing a detail request are separate requirements.

| Action | Employee | Technician | Administrator |
| --- | --- | --- | --- |
| Create ticket | Yes | Yes | Yes |
| Read tickets | Own only | All support tickets | All |
| Add public comment | Own tickets | All support tickets | All |
| Read/write internal note | No | Yes | Yes |
| Set ticket priority | No; initial priority is Medium | Yes | Yes |
| Claim unassigned ticket | No | Self only | Yes |
| Assign/reassign another technician | No | No | Yes |
| Work/resolve/close ticket | No | Assigned tickets only | Yes |
| Reopen resolved/closed ticket | Own only | Assigned tickets only | Yes |
| Read assets | Own assigned assets, limited fields | All | All |
| Create/update/assign/retire asset | No | Yes | Yes |
| View dashboard | Own ticket totals | Queue and own workload | Organization reports |
| Manage users/roles | No | No | Yes |

Employees cannot edit the original report after submission; corrections go in public comments. Technicians may discuss any queue ticket, but work-state changes require assignment. Administrators can override assignment and work-state restrictions through the same validated services.

User deletion is excluded. Deactivation prevents access and new assignments while retaining historical records. Block deactivation or technician-role removal while the user has active assigned tickets until an administrator reassigns them. Preserve at least one active administrator.

## 4. Ticket workflow and business rules

Statuses: Open, Assigned, In Progress, Resolved, Closed. Priorities: Low, Medium, High, Critical. Categories: Hardware, Software, Network, Access, Other.

| Operation | From → To | Rule |
| --- | --- | --- |
| Submit | New → Open | Creator is current user; no assignee; default Medium |
| Assign/claim | Open → Assigned | Assignee is an active technician or administrator |
| Start work | Assigned → In Progress | Assigned technician or administrator |
| Resolve | In Progress → Resolved | Require resolution summary; record resolvedAt |
| Close | Resolved → Closed | Assigned technician or administrator; record closedAt |
| Reopen | Resolved/Closed → Assigned or Open | Require reason; retain active assignee if available, otherwise clear it |
| Reassign | Assigned/In Progress → same status | Administrator selects active eligible staff |
| Unassign | Assigned/In Progress → Open | Administrator; clear assignee |

Reject skipped transitions. Reopening clears current resolvedAt/closedAt; historical resolution events remain in history. Comments are allowed in every status, but do not implicitly reopen a ticket. Priority changes and assignment changes always create history entries. A public resolution summary is visible to the requester.

Create/update the ticket and its history within one database transaction. Use a version field for optimistic concurrency: stale updates return 409 and prompt a refresh instead of overwriting another user's changes. Apply equivalent concurrency protection to asset assignments and critical user administration.

Validation defaults: title 5–150 characters, description 10–5,000, comment 1–5,000, resolution/reopen reason 5–2,000. Trim text, validate enums and IDs, and reject unauthorized fields. Treat submitted content as plain text.

## 5. Data model

Use UUID primary keys, createdAt/updatedAt where appropriate, foreign keys, explicit delete behavior, and migrations. Add Auth.js adapter tables required by the selected session/provider configuration.

| Entity | Fields and constraints |
| --- | --- |
| User | id, name, normalized unique email, role, isActive, version, timestamps |
| Ticket | id, unique human-readable number, title, description, category, priority, status, createdById, nullable assignedToId/assetId, resolutionSummary, resolvedAt, closedAt, version, timestamps |
| Comment | id, ticketId, authorId, message, isInternal, createdAt; immutable in MVP |
| TicketHistory | id, ticketId, actorId, eventType, structured old/new values, createdAt; append-only |
| Asset | id, unique assetTag, type, manufacturer, model, optional unique serialNumber, location, status, nullable assignedUserId, purchaseDate, warrantyExpiresAt, notes, version, timestamps |
| AssetHistory | id, assetId, actorId, eventType, old/new assignment or status values, createdAt; append-only |
| Notification (later) | id, recipientId, ticketId, eventType, readAt, createdAt |

Asset types: Laptop, Desktop, Monitor, Printer, Network Device, Other. Asset statuses: Available, Assigned, Under Repair, Retired. Assigned assets require an active assigned user. Available and Retired assets have no assigned user. Under Repair may retain the employee assignment. Retired assets cannot receive new assignments or new ticket links. Employees may link only their own non-retired equipment; staff may link any non-retired asset.

Asset repair history is derived from linked tickets; no duplicate repair table is needed. AssetHistory separately preserves equipment assignment and lifecycle changes. Do not hard-delete tickets, assets, comments, or history in MVP. Internal note text and internal-comment events must never appear in employee responses, history, counts, exports, or search results.

Initial indexes: Ticket(createdById, createdAt), Ticket(assignedToId, status), Ticket(status, createdAt), Ticket(assetId); Comment(ticketId, createdAt); TicketHistory(ticketId, createdAt); Asset(assignedUserId), Asset(status); AssetHistory(assetId, createdAt). Revisit indexes from observed query behavior.

## 6. Screens and interaction design

Use a consistent sidebar, page heading, primary action, and reusable form/table components. On small screens use a collapsible navigation and compact ticket/asset cards. Include accessible labels, keyboard focus, inline validation, loading states, empty states, error states, and clear success feedback.

| Screen | Required behavior |
| --- | --- |
| Login | Sign-in, useful unauthorized-account feedback, redirect to permitted home |
| Employee dashboard | Own active/resolved ticket totals, recent tickets, submit action |
| Staff dashboard | Queue totals and own workload; organization analytics only for admin |
| Tickets | Role-filtered list; search number/title; status, priority, category, assignee filters as permitted; pagination |
| New ticket | Title, description, category, optional permitted asset; Medium initial priority |
| Ticket detail | Report, priority/status, assignee, permitted asset summary, public conversation, filtered history, role-appropriate actions |
| Assets | Staff inventory, search asset tag/serial/model, filter type/status/location; add/edit forms |
| Asset detail | Specs, current employee, lifecycle history, linked authorized ticket history |
| My assets | Employee-safe fields and report-issue action; omit staff notes |
| Admin users | Provision user, change role, activate/deactivate, actionable reassignment errors |

List defaults: 20 records per page, maximum 100; stable newest-first ordering with ID tie-breaker. Carry filters in query parameters so views can be refreshed and shared. Demo data must be clearly fictional. Never show hardcoded metrics as actual reports.

## 7. API contract

Use route handlers for mutations and reusable services for all authorization. Return 401 for no session, 403 for forbidden role actions, 404 for missing or inaccessible records, 422 for invalid input or workflow, and 409 for stale versions or uniqueness conflicts. Use a common error shape: `{ error: { code, message, fieldErrors? } }`.

| Method and path | Purpose |
| --- | --- |
| GET/POST /api/tickets | Authorized paginated list/create |
| GET /api/tickets/:id | Authorized detail with safe response projection |
| PATCH /api/tickets/:id | Staff priority update, expected version required |
| POST /api/tickets/:id/assignment | Claim, assign, reassign, or unassign |
| POST /api/tickets/:id/transitions | Validated start/resolve/close/reopen operation |
| POST /api/tickets/:id/comments | Public comment or staff-only internal note |
| GET /api/tickets/:id/history | Role-filtered activity |
| GET/POST /api/assets | Authorized inventory/create |
| GET/PATCH /api/assets/:id | Authorized detail/update |
| POST /api/assets/:id/assignment | Validated assignment/unassignment |
| GET /api/dashboard/stats | Role-scoped computed metrics |
| GET/POST /api/admin/users | Admin list/provision |
| PATCH /api/admin/users/:id | Admin role/active-state update |

Do not accept createdById, actorId, arbitrary history, or role from ordinary ticket inputs. Derive them from the session. Validate same-origin mutation requests and the selected authentication integration's CSRF protections. Bound queries and mutation payload sizes; add rate limiting backed by a deployment-appropriate shared store if the demo exposes public mutation access.

## 8. Reporting definitions

Compute reports from database records using server-side aggregation. Default organization reporting window: trailing 30 days, with explicit start/end timestamps shown in the interface.

- Active tickets: current Open, Assigned, or In Progress tickets, regardless of creation date; label as a current snapshot.
- Resolved tickets: currently Resolved/Closed tickets whose current resolvedAt falls in the selected window.
- Average resolution time: mean of current resolvedAt minus createdAt for that resolved cohort; reopening removes the ticket until it is resolved again. This measures elapsed creation-to-latest-resolution time, including reopened time; display that definition.
- Categories: tickets created in the window grouped by category.
- Technician workload: current active tickets grouped by assignee, plus Unassigned.
- Employee metrics: identical status definitions scoped to createdById; no organization breakdowns.

Show zero counts and “No resolved tickets in this period” instead of inventing an average. Charts need text labels and an accessible tabular or textual equivalent. More advanced first-response and SLA reports are deferred because they require additional event definitions.

## 9. Eight-week backlog — 55 tasks

### Week 1 — Foundation (6 tasks)
- [ ] Confirm MVP boundaries, role matrix, and workflow in this plan.
- [ ] Sketch login, dashboard, ticket list/detail, and inventory screens.
- [ ] Verify local Node/Git tools and scaffold Next.js in the existing project root.
- [ ] Configure TypeScript, Tailwind, linting, formatting, and package scripts.
- [ ] Create repository hygiene: .gitignore, safe .env.example, README outline, license selection.
- [ ] Set up GitHub repository and baseline CI for lint/typecheck/build.

Deliverable: app runs locally, navigation shell exists, planning and setup are documented.

### Week 2 — Data and authentication (7 tasks)
- [ ] Choose compatible dependency versions, OAuth provider, and demo login approach; record decisions.
- [ ] Connect development PostgreSQL and configure Prisma.
- [ ] Implement core schema, indexes, and initial migration.
- [ ] Add repeatable fictional seed users/assets/tickets with all three roles.
- [ ] Implement Auth.js sign-in/session integration and active-account admission.
- [ ] Implement shared server permission guards and safe response projections.
- [ ] Verify role/ownership boundaries and document administrator bootstrap.

Deliverable: reproducible database setup and authenticated role-specific application shell.

### Week 3 — Employee ticket experience (7 tasks)
- [ ] Add ticket input schemas and creation service.
- [ ] Build new-ticket form and permitted asset selection.
- [ ] Implement paginated employee ticket list and filters.
- [ ] Build authorized ticket detail screen.
- [ ] Add public comments with validation.
- [ ] Record creation/comment events transactionally and display safe history.
- [ ] Verify submission, direct-record access denial, empty/error states, and mobile behavior.

Deliverable: employees can report and track their own issues.

### Week 4 — Technician workflow / M1 (7 tasks)
- [ ] Implement support queue and staff filters.
- [ ] Implement claim and admin assignment/reassignment/unassignment.
- [ ] Implement validated status transitions and required resolution/reopen reasons.
- [ ] Add staff priority control and internal notes.
- [ ] Add version checks and atomic history creation.
- [ ] Verify assignment restrictions, invalid transitions, reopening, and internal-note confidentiality.
- [ ] Publish M1 README/demo walkthrough and run the employee-to-technician scenario.

Deliverable: complete working help desk with reliable history.

### Week 5 — Assets and administration (7 tasks)
- [ ] Implement asset validation, unique identifiers, and lifecycle rules.
- [ ] Build inventory list, search, filters, and pagination.
- [ ] Build asset creation/edit/detail screens.
- [ ] Implement assignment with asset history and concurrency checks.
- [ ] Link tickets to assets and show repair history.
- [ ] Add employee my-assets view and administrator user management.
- [ ] Verify retirement, duplicate identifiers, deactivation, and last-admin protection.

Deliverable: equipment and user management integrated with support work.

### Week 6 — Analytics and interface polish (7 tasks)
- [ ] Implement role-scoped dashboard aggregates.
- [ ] Build ticket totals and recent-ticket panels.
- [ ] Add category chart and accessible data equivalent.
- [ ] Add technician workload and resolution-time display.
- [ ] Standardize forms, tables, navigation, and feedback.
- [ ] Check mobile layout, keyboard navigation, focus, labels, and contrast.
- [ ] Verify metric values against a deterministic seeded dataset.

Deliverable: polished, database-backed role-specific dashboards.

### Week 7 — Reliability and security (7 tasks)
- [ ] Complete business-rule tests for transitions and permission matrix.
- [ ] Add API/database integration tests for ownership and internal-note isolation.
- [ ] Verify transaction rollback, uniqueness failures, and concurrent updates.
- [ ] Verify session expiration/deactivation and role changes take effect server-side.
- [ ] Review secrets, input limits, origin protection, logs, and demo abuse controls.
- [ ] Run full role-by-role workflow and responsive accessibility review.
- [ ] Fix release-blocking defects and pass CI.

Deliverable: release candidate with verified authorization and core workflows.

### Week 8 — Deployment and portfolio / M2 (7 tasks)
- [ ] Configure isolated hosted database, app secrets, and sign-in callback URLs.
- [ ] Run migrations through one controlled deployment step; seed only the demo database.
- [ ] Deploy and smoke-test every role on the hosted environment.
- [ ] Establish repeatable demo reset and database recovery instructions.
- [ ] Finish README with setup, actual features, screenshots, demo, tests, and limitations.
- [ ] Write architecture/decision notes and an interview walkthrough.
- [ ] Tag the release, complete acceptance checklist, and create follow-up issues.

Deliverable: usable live demo and professional GitHub repository.

## 10. Verification and release acceptance

Use Vitest for meaningful business-rule tests and integration tests against a dedicated PostgreSQL test database. Add browser automation for the main role workflow if capacity permits; otherwise keep a repeatable documented browser checklist. Mocked authorization tests alone do not demonstrate safe database access.

Required cases: employee cannot enumerate another employee's tickets; direct URL/API access is denied; internal notes and related metadata are absent from employee payloads; non-staff cannot assign or set priority; technician cannot change another assignee's work state; invalid transitions fail; resolution requires summary; reopening preserves prior events; stale updates fail; failed history insertion rolls back mutation; duplicate asset tags fail; employee cannot link someone else's asset; inactive users lose access; last active administrator is protected; metrics match the known dataset.

Release checklist:
- [ ] Fresh clone can install, migrate, seed, and run using documented instructions.
- [ ] Employee submits a ticket linked to their laptop and sees public updates.
- [ ] Technician claims, starts work, adds internal/public notes, resolves, and closes it.
- [ ] Employee reopens it with a reason and history remains accurate.
- [ ] Administrator registers and assigns equipment and reviews actual reports.
- [ ] Role and record permissions pass direct API checks.
- [ ] Desktop and mobile workflows are usable with keyboard-accessible controls.
- [ ] Lint, typecheck, tests, and production build pass.
- [ ] Hosted sign-in, database, and complete workflow pass smoke checks.
- [ ] README reflects implemented features and the demo contains only fictional records.

## 11. GitHub, configuration, and delivery

Commit small completed changes with descriptive messages. Track tasks as issues with milestone, module, acceptance criteria, and dependency. Keep main runnable; use short-lived branches when useful. Do not manufacture historical commits or mark unfinished features complete.

README contents: problem, supported roles, implemented features, screenshots, demo URL/access instructions, chosen stack and versions, prerequisites, install/setup/migration/seed commands, configuration variable descriptions, scripts, tests, architecture, known limitations, and license.

Environment template should list the selected integration's actual variable names for PostgreSQL, authentication secret/provider credentials, and app URL. Confirm those names against the installed versions during implementation. Use separate development/test/demo databases; never run resets or seeds against production. Ignore secret files while allowing .env.example. Log useful errors without credentials, full ticket bodies, or internal notes.

Deployment must document pooled application connections versus migration connections where required by the provider. Keep migrations out of individual request handling and avoid concurrent migration runners. Preview deployments must not mutate the live demo database.

## 12. Assumptions, risks, and next step

Assumptions: one organization; no real employee data; no self-registration; staff accounts are provisioned; inventory represents equipment records rather than physical discovery; English interface; online operation only. The original source has an incomplete role table and missing weeks 2–8 task details; this plan makes those choices explicit.

Largest risks are authentication/demo access design, server authorization, inconsistent workflow history, and scope growth. Resolve authentication early, centralize permission rules, use transactional writes, and defer optional modules until release acceptance passes. If capacity is tight, simplify charts and visual polish before reducing permissions, history integrity, or the working demonstration.

Next implementation step: scaffold the application in this existing root, add the responsive layout, configure the chosen development database/authentication approach, and implement the M1 ticket workflow. GitHub creation, pushing, and hosted deployment are future implementation tasks; this planning request does not perform them.
