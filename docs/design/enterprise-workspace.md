# Enterprise workspace refresh — version 1.1.0

Reviewed and implemented on 2026-10-12. TechDesk keeps its own brand and existing role workflows. Vendor products are design references; no Salesforce or ServiceNow integration is claimed.

## References and interpretation

- [Salesforce Lightning layout guidance](https://www.lightningdesignsystem.com/2e1ef8501/v/55835/p/33e9af-layout) describes list views and record layouts with a shared header, main content, and contextual sidebar. TechDesk adopts compact headers, readable tables, contextual actions, and URL-based views.
- [ServiceNow Horizon workspace guidance](https://horizon.servicenow.com/workspace/basics/creating-an-experience) distinguishes task-oriented landing pages, lists, and record pages. TechDesk adopts next-work shortcuts, breadcrumbs, an activity stream, and role-specific context.
- [Vercel interface review guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) informed accessible controls, focus, responsive overflow, numeric typography, reduced motion, and URL state checks.

These are adapted patterns. A single-record breadcrumb flow fits the present MVP; concurrent record tabs, customizable saved views, and SLA displays require additional product rules and remain proposals.

## Implemented surfaces

| Surface | Behavior |
| --- | --- |
| Shell | Navy navigation with a visible active marker, signed-in role, sign-out, contextual breadcrumbs, and an accessible GET ticket search |
| Dashboard | Role-scoped task shortcuts above actual metrics; compact reporting cards; recent requests and accessible category data remain visible |
| Ticket lists | All, Open/unassigned, own assignments for staff, In progress, and Resolved links; selected view marked; extra filters retained in URL |
| Record | Number/title/status, priority/category/assignee/update summary, five read-only workflow stages, conversation, actions, and filtered activity |
| New request | Signed-in requester name/email/account ID/role; numbered issue sections; live equipment preview; initial processing details and description guidance |
| Inventory/users/forms | Shared border, spacing, typography, button, field and table styles; existing role restrictions and confirmations retained |
| Mobile | Wrapping navigation and list views, full-width search, single-column task shortcuts/record content, two-column numeric summaries, card-style lists |

Workspace search searches only records the signed-in role can access. “Assigned to you” shows an active-work count but links to all that user's assignments, including completed records; the count is labelled active. Resolved views match currently Resolved records, not the dashboard's 30-day Resolved/Closed cohort.

## Verification evidence

The [refresh review](../quality/enterprise-refresh-review.md) records implementation fixes and current checks. New PNG screenshots are generated only after sign-in using disposable fictional data. Earlier JPGs are historical phase evidence.

- [Desktop dashboard](screenshots/release-dashboard-desktop.png)
- [Mobile dashboard](screenshots/release-dashboard-mobile.png)
- [Desktop request list](screenshots/release-tickets-desktop.png)
- [Mobile request list](screenshots/release-tickets-mobile.png)
- [Desktop record](screenshots/release-record-desktop.png)
- [Mobile record](screenshots/release-workflow-mobile.png)
- [Mobile equipment](screenshots/release-equipment-mobile.png)
- [Mobile administration](screenshots/release-users-mobile.png)
- [Desktop new request](screenshots/release-new-ticket-desktop.png)
- [Mobile new request](screenshots/release-new-ticket-mobile.png)
