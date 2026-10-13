# Release follow-up backlog

Local issue records only; no remote issues or Git activity. These are future work outside the user-selected local release.

| ID | Priority | Work | Acceptance |
| --- | --- | --- | --- |
| F-001 / B-001 | Tooling | Revisit unpatched braces dependency in the Next.js lint chain | Compatible upstream fix/alternative; lint and full audit rechecked without disabling rules |
| F-002 | Publishing | Configure and test real Atlas/hosting credentials privately | Named isolated database, HTTPS/cookies, provider-edge abuse controls, backup drill and hosted role workflows pass |
| F-003 | Delivery | Initialize/commit/push repository, run Actions, and create release tag only when requested | Reviewed secret-free changes and actual remote CI evidence |
| F-004 | Scale | Replace 100-asset/500-user selectors with searchable selectors | Large-directory fixtures and mobile/keyboard access pass |
| F-005 | Scale | Narrow mutation coordination while preserving invariants | Assignment/deactivation and last-admin races remain safe under load |
| F-006 | Accounts | Evaluate stable Auth.js release and password recovery/OAuth if needed | Explicit authentication requirements and secure recovery/revocation tests |
| F-007 | Operations | Execute provider-specific backup and restore drill | Recorded restore point, recovery duration and role/record checks on separate environment |
| F-008 | Product — first choice | SLA targets with business hours and escalation | Agree severity targets/calendar; server-computed due dates, pause/reopen rules and tested breach/escalation behavior; display only configured targets |
| F-009 | Workspace | Personal saved views and selectable table columns | User-owned preferences, URL sharing, reset defaults, keyboard/mobile behavior and unchanged record permissions |
| F-010 | Product | Knowledge articles and related solutions | Staff-published articles, searchable approved content, ticket links and permission checks |
| F-011 | Performance | Measure larger inventory/queue load and optimize queries | Representative fixtures, measured latency/concurrency and query explain results; evaluate compound indexes and cursor pagination before broad architecture changes |

Optional product extensions remain in [phase 09](../phases/09-optional-extensions/README.md); they were not silently added to the MVP.

Suggested order after the UI refresh: F-008 for stronger service-management behavior; F-004/F-011 before scaling the directory; F-006 before real external users; F-009/F-010 for daily operator efficiency. Existing publishing/recovery/tooling work remains separate. No major framework upgrade was applied merely to change version numbers.
