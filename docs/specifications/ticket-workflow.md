# Ticket workflow

[Docs](../README.md) | [Progress](../tracking/progress.md)

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
