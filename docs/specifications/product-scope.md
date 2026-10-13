# Product scope

[Docs](../README.md) | [Progress](../tracking/progress.md)

TechDesk helps a single organization's employees report technical problems, technicians manage support work, and administrators track equipment and support performance. The finished repository should demonstrate a real database, authentication, server-enforced permissions, meaningful tests, a responsive interface, and clear engineering documentation.

Primary demonstration: an employee submits a Wi-Fi problem against their assigned laptop; a technician claims it, records troubleshooting, resolves it, and closes it; an administrator reviews the repair history and reporting.

### Release milestones

| Milestone | Required outcome | Target |
| --- | --- | --- |
| M1: Working help desk | Login, three roles, ticket submission, authorized lists/detail, assignment, comments, status workflow, history | End of week 4 |
| M2: Portfolio release | Asset inventory and assignments, repair history, database-backed dashboards, security verification, responsive UI, hosted demo, repository documentation | End of week 8 |
| Optional extension | QR asset lookup, after M2 requirements pass | Remaining capacity or later release |

MVP excludes attachments, email, real-time notifications, device monitoring, AI assistance, multi-organization tenancy, SLA automation, procurement, and native mobile apps. In-app notifications are a later enhancement. These features must not delay the required releases. QR lookup is the preferred first extension because it supports equipment audits without introducing another service.

Assumptions: one organization; no real employee data; no self-registration; staff accounts are provisioned; inventory represents equipment records rather than physical discovery; English interface; online operation only. The original source has an incomplete role table and missing weeks 2–8 task details; this plan makes those choices explicit.

Largest risks are authentication/demo access design, server authorization, inconsistent workflow history, and scope growth. Resolve authentication early, centralize permission rules, use transactional writes, and defer optional modules until release acceptance passes. If capacity is tight, simplify charts and visual polish before reducing permissions, history integrity, or the working demonstration.

Current delivery: phases 01–03 are implemented locally using MongoDB/Mongoose and simple email/password login. GitHub repository creation, commits, pushes, and deployment are deferred by user instruction. Phase 04 remains the next implementation milestone when requested.
