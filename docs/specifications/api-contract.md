# API contract

[Docs](../README.md) | [Progress](../tracking/progress.md)

Implemented through phase 08 local release: all routes below, with phase 07 session-version checks, bounded sign-in requests and shared write quotas. GET /api/assets returns paginated role-scoped inventory. Pages use a separate limited new-ticket equipment selector.

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

Do not accept createdById, actorId, arbitrary history, or role from ordinary ticket inputs. Derive them from the session. Require same-origin mutations and retain Auth.js CSRF checks. All authenticated POST/PATCH operations share MongoDB quotas of 60/minute and 1,000/UTC day per account; 429 responses include Retry-After and no-store. Sign-in attempts allow 10 per normalized email per ten-minute window. Host-edge limits for anonymous traffic remain a deployment responsibility.

Ticket mutations require `{ action, version, ...fields }`. Priority PATCH accepts only PRIORITY with priority. Assignment accepts CLAIM or ASSIGN with nullable assignedToId. Transitions accept START, RESOLVE, CLOSE, or REOPEN; RESOLVE/REOPEN require reason. Other endpoint actions and unknown fields are rejected. Comments accept message; an internal note additionally requires isInternal:true and current staff access.

Asset registration accepts inventory fields and starts Available/unassigned. Asset PATCH accepts the full editable inventory record plus status, assignedUserId, and version. Assignment POST accepts version and nullable assignedUserId; it preserves Under Repair, otherwise sets Assigned/Available. User creation requires name/email/role/password; update accepts only role/isActive/version. Body limit is 32 KiB of actual UTF-8 bytes, independent of declared Content-Length. JSON media type and exact same-origin headers are required. Success and error responses are no-store.
