# Roles and permissions

[Docs](../README.md) | [Progress](../tracking/progress.md)

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

Deactivation also requires reassignment/unassignment of equipment, because Assigned/Under Repair equipment references must remain active. Critical user edits require a current version and a transaction coordinated with assignment mutations. Existing sessions recheck current account status/role on every protected request. Employees do not receive organization category/workload reports or staff inventory notes/history.

Role/active-state changes now also increment sessionVersion. Existing sessions are revoked and require fresh sign-in; reactivation cannot revive an earlier session. Requests continue to use current DB roles rather than JWT role claims.
