# Reporting definitions

[Docs](../README.md) | [Progress](../tracking/progress.md)

Compute reports from database records using server-side aggregation. Default organization reporting window: trailing 30 days, with explicit start/end timestamps shown in the interface.

- Active tickets: current Open, Assigned, or In Progress tickets, regardless of creation date; label as a current snapshot.
- Resolved tickets: currently Resolved/Closed tickets whose current resolvedAt falls in the selected window.
- Average resolution time: mean of current resolvedAt minus createdAt for that resolved cohort; reopening removes the ticket until it is resolved again. This measures elapsed creation-to-latest-resolution time, including reopened time; display that definition.
- Categories: tickets created in the window grouped by category.
- Technician workload: current active tickets grouped by assignee, plus Unassigned.
- Employee metrics: identical status definitions scoped to createdById; no organization breakdowns.

Show zero counts and “No resolved tickets in this period” instead of inventing an average. Charts need text labels and an accessible tabular or textual equivalent. More advanced first-response and SLA reports are deferred because they require additional event definitions.
