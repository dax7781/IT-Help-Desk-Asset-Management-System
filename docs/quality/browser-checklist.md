# Repeatable role and accessibility checks

Use fictional records in an isolated demo. Use the locally generated password privately; never paste it into evidence/screenshots. Desktop and a 390×844 viewport are the local checkpoints.

1. Sign in as employee. Check only owned tickets/equipment, report an issue from a laptop, submit a public comment, and deny direct access to another employee's ticket/equipment.
2. Sign out and sign in as technician. Claim/start the ticket, add a private note and a public comment, resolve with a summary, close it. Try another assignee's work controls and invalid transitions; expect denial.
3. Return as employee. Verify the public resolution/history and absence of private content/events, then reopen with a reason.
4. Sign in as administrator. Register and assign equipment, review its activity/repair links, edit user access with confirmation, verify last-admin safeguards and real dashboard totals/category table.
5. Check labelled form controls, keyboard Tab order, visible focus, skip-link focus on main, validation feedback, pending buttons, cancel links and empty states. At mobile width check lists/cards, forms, navigation and chart/table for horizontal overflow.
6. On production check no browser CSP violations or hydration failures, and that scripts have the document nonce. Reload and navigate between pages to catch policy problems that HTTP status alone cannot detect.
7. Sign out; confirm protected pages/API no longer grant access. After account access changes, an existing session must require fresh sign-in and remain revoked after reactivation.

8. Use workspace search on a record page; verify results remain role-scoped. Switch predefined ticket views and check the URL and active view indicator. Open a specific staff workload from the dashboard and apply filters; its selected staff member must remain selected. Check the record current workflow stage after reopen.

Record date/environment/result in the phase evidence. Hosted runs require separate evidence; prior local screenshots do not verify a hosted deployment.
