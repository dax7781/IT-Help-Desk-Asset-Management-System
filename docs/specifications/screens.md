# Screens and interactions

[Docs](../README.md) | [Progress](../tracking/progress.md)

Use a consistent sidebar, contextual breadcrumb, workspace ticket search, page heading, primary action, and reusable form/table components. On small screens use a visible wrapping navigation row and compact ticket/asset cards. Include accessible labels, keyboard focus, inline validation, loading states, empty states, error states, and clear success feedback. The [enterprise workspace refresh](../design/enterprise-workspace.md) defines current design decisions.

| Screen | Required behavior |
| --- | --- |
| Login | Sign-in, useful unauthorized-account feedback, redirect to permitted home |
| Employee dashboard | Own active/resolved ticket totals, recent tickets, submit action, focused request/equipment shortcuts |
| Staff dashboard | Queue totals and own workload, focused queue shortcuts; organization analytics only for admin |
| Tickets | Role-filtered list; predefined URL-based views; search number/title; status, priority, category, assignee filters as permitted; pagination; preserve staff workload deep links |
| New ticket | Read-only signed-in requester name/email/account ID/role; title, description, category, optional permitted asset with linked-device preview; numbered form sections and troubleshooting/impact guidance; ticket number generated after submission; Open/Medium initial state |
| Ticket detail | Compact record header/summary, current workflow stage, report, priority/status, assignee, permitted asset summary, public conversation, filtered history, role-appropriate actions |
| Assets | Staff inventory, search asset tag/manufacturer/model, filter type/status; add/edit forms |
| Asset detail | Specs, current employee, lifecycle history, linked authorized ticket history |
| My assets | Employee-safe fields and report-issue action; omit staff notes |
| Admin users | Provision user, change role, activate/deactivate, actionable reassignment errors |

List defaults: 20 records per page. Ticket/asset APIs accept at most 100; user pages use 20. Tickets sort newest first with ID tie-breaker; assets by tag/ID and users by name/ID. Carry filters in query parameters so views can be refreshed and shared. Demo data must be clearly fictional. Never show hardcoded metrics as actual reports. Stage indicators describe the current state and are not controls; actual transitions require authorized actions and server validation.
