# Decision 002: Workflow, inventory, and reporting

Date: 2026-10-09. Scope: implement phases 04–06 locally, with no commits, pushes, or deployment.

## Mutation integrity

All application mutations use a MongoDB transaction. A shared `WorkflowGuard` document is written before reading current user and reference state. This serializes relevant mutations so an assignment cannot race account deactivation, and simultaneous administrator removals cannot pass separate counts and leave zero administrators. MongoDB retries conflicting transactions; explicit client versions still reject stale ticket/asset/user edits with 409. History failures roll back the mutation.

The shared guard is deliberately simple for a small portfolio application. It limits concurrent write throughput; a larger installation should replace it with carefully scoped coordination while preserving the tested invariants. Read-only lists/reports do not use the guard. Setup scripts should run before serving requests.

## Inventory and administration

Registration starts Available and unassigned. Assigned equipment requires an active user; Available/Retired requires no user; Under Repair may retain a user. Retirement is final in this MVP. Existing ticket links retain safe equipment summaries after reassignment/retirement. Employee asset detail and repair history are restricted to their currently assigned equipment and their own tickets.

Deactivation is blocked until equipment is reassigned or unassigned, in addition to the planned active-ticket restriction. This follows the existing active-assignee inventory rule. Resolved/closed tickets retain historical staff references; reopening clears an inactive or ineligible assignee. There is no hard user deletion. New user passwords require at least 12 characters and at most 72 UTF-8 bytes to prevent bcrypt truncation.

Assignment controls show up to 500 active users; the new-ticket selector shows up to 100 permitted non-retired assets. Larger directories need searchable selectors. Inventory/user lists are independently paginated.

## Reports and interface

MongoDB aggregates live records for a trailing 30-day UTC window. Current active status/workload counts span all creation dates. Resolution averages use current Resolved/Closed tickets resolved within the window, from creation to latest resolution. Reopened tickets leave that cohort. Employees receive their own counts; technicians receive queue counts and their own workload; administrators receive category and organization workload reports.

Recharts 3.10.1 supplies the category chart. A visible data table provides the same counts. Empty cohorts have no average; small positive averages display `<0.1 hours` instead of rounding to zero. Forms, focus, labels, navigation, mobile layout, and key text contrast were checked with the selected review skills and the built-in browser.
