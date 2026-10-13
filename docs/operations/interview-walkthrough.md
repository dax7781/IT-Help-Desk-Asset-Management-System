# Portfolio and interview walkthrough

TechDesk combines IT tickets with equipment context: an employee can report an issue from their laptop, support staff can maintain private diagnostics and public updates, and administrators can manage the inventory and see real activity.

## Five-minute demo

1. Employee: open My equipment, report a hardware issue, and show the ticket with public activity.
2. Technician: filter the queue, claim/start the request, write an internal note and resolve it. Explain that the public summary reaches the requester while diagnostic notes do not.
3. Employee: show the resolution and reopen with a reason; demonstrate that prior events remain.
4. Administrator: register/assign equipment, show repair links and current inventory state, then the live category/workload report and its equivalent data table.
5. Show the tests, local verification command and documentation evidence; explain what was verified and what is still deferred.

## Engineering discussion

- Authorization lives in reusable server services, with ownership independently enforced on detail and list operations. Current DB role/status/session version overrides stale client state. Responses deliberately project safe fields.
- MongoDB transactions pair mutations with history. Optimistic versions reject stale edits; a shared guard prevents cross-record races such as assignment versus deactivation or simultaneous final-administrator removal. The tradeoff is serialized writes, suitable for a small portfolio app.
- Reports distinguish current state from a trailing 30-day UTC cohort. Reopening clears the current resolution while preserving events, so averages are tested against explicit fixtures rather than UI guesses.
- Production HTML uses nonce CSP; authenticated quotas are stored in MongoDB for consistency across instances. Public-edge anonymous abuse controls still belong to the chosen host.
- Reset tests use a disposable marked database, with an atomic seed and rollback checks. Production HTTP verification uses a fresh temporary database, never the user's cluster.

Discuss the real limitations: no public signup/recovery/OAuth, Auth.js beta, selector limits, guard throughput, no public hosted demo or remotely run CI, and the documented development-only dependency advisory. Future work is in [follow-ups](../tracking/follow-ups.md). Do not present instructions or an unrun cloud configuration as a tested deployment.
