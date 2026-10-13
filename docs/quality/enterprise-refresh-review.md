# Version 1.1.0 implementation and documentation review

Date: 2026-10-12. This is a maintenance release after the completed 55-task local MVP, including the user-requested Salesforce/ServiceNow-inspired frontend. No Git operations, hosting, external account connections, or persistent database reset are part of this review.

## Fixed findings

| Finding | Fix | Verification |
| --- | --- | --- |
| Asset detail could combine an old asset version/ownership with newly committed history | Sequential reads in a read-only MongoDB snapshot transaction, including current actor, asset, history, linked tickets and assignee | Real concurrent assignment regression; subsequent read sees the new version/history |
| Managed local runner accepted another database on port 27027, then silently used techdesk; it also edited configuration before refusing external MongoDB | Validate exact managed host/port/database/replica-set boundary before any configuration writes | Accept/reject URI cases, including other database names, ports, credentials, replica sets and Atlas |
| Applying filters after a staff workload deep link could discard its specific assignee | Render an option retaining that selected staff ID | Browser follows a workload link, submits filters and checks the same assignee stays selected |
| Screen specification promised serial/location filtering, collapsible mobile navigation and uniform list sorting that were not implemented | Align specification with actual search fields, visible mobile navigation and entity ordering | Source/specification comparison |
| Phase 01 wireframe and older README screenshots could be mistaken for current UI | Label the baseline historical; publish current workspace design and new PNG evidence | Documentation link and artifact checks |

## Review scope

Reviewed authored services, permissions, validators, models/indexes, authentication/session/origin/request boundaries, route handlers, workflow controls, reporting definitions, local/release scripts, frontend and phase/operations documentation. Existing security and workflow regression coverage remains in place. Installed dependencies and generated output are outside authored source review. A review and passing checks do not establish that every possible bug has been eliminated.

## Current verification

- Next.js route type generation, full ESLint, TypeScript and production build passed.
- **57/57 Vitest checks across six files passed**, including the concurrent asset-detail regression and ten managed-URI boundary cases.
- Production HTTP smoke passed all three roles, expired/tampered sessions, nonce/security headers, request boundaries, ownership, lifecycle, private notes, inventory, administration/session revocation, last-admin protection and scoped analytics.
- **Chromium role scenario passed** after waiting for client navigation in the new workload-link test. Workspace search, predefined views, assignee preservation, record stages, confidential notes, keyboard focus and sign-out passed. Overflow checks cover 320, 390 and 768 pixel widths; desktop evidence uses 1440 pixels.
- Desktop dashboard/list/record and mobile dashboard/record/inventory/users screenshots were inspected. Captures wait for streamed content rather than recording loading placeholders; keyboard focus is checked separately from screenshots captured at rest.
- Runtime-only npm audit returned **zero vulnerabilities**. The full audit retains five development-chain entries for the same unpatched braces advisory; see [dependency audit](dependency-audit.md). No unverified downgrade or lint-rule removal was applied.
- All **51 Markdown files** passed local-link existence checks. Package/root lock versions agree at 1.1.0. A current source ZIP and SHA-256 sidecar are generated under output/; the whitelist excludes private environment, dependency, database and build files.
- The verified production preview was restarted successfully on localhost:3000 using the existing managed database and credentials.

Tests used disposable replica sets and random temporary credentials, preserving .env.local and ordinary local records. Version 1.0.0 had a fresh extracted installation check; version 1.1.0 retains the same pinned dependency versions and was verified in the project workspace. The source archive is inspected separately for source consistency, excluded files and private credential values. This is local verification, not a hosted or fresh Git clone claim.

## New-ticket follow-up

New-ticket follow-up (2026-10-12): the intake page now displays the signed-in requester's name, email, actual TechDesk account ID and role as read-only account context. It has numbered issue sections, impact/troubleshooting guidance, a live permitted-equipment preview, and initial processing details. Account ID is a system identifier, not an invented employee/student number; ticket numbers are generated only after submission. Creator identity still comes from server authentication. Updated-file ESLint, production build/TypeScript and the production HTTP/Chromium workflow passed, including requester details for employee and technician, equipment preview changes, submission and 320/390/768 pixel overflow checks. Desktop/mobile intake screenshots were inspected, and the local preview was restored. No new database fields or external services were introduced.

## Cleanup and final recheck

User-requested cleanup on 2026-10-12 removed two disposable extracted release-test projects (1,524,767,044 bytes before removal), the obsolete version 1.0.0 ZIP/checksum, the stopped development server cache, and an unreferenced employee dashboard screenshot. Referenced screenshots and phase/planning evidence are retained. Browser tests still check the employee dashboard's mobile layout without producing that unused image.

Removed 24 unused CSS rules and 94 earlier declarations always overridden by identical unconditional selectors, reducing globals.css by 255 lines without changing the current design. Removed unreachable reopen branches from the start/resolve/close form; the dedicated reopen form remains. TypeScript now excludes .local, output and coverage; inspection found zero temporary project files in its 95-file source set.

The initial check encountered the temporary MongoDB instance's 10-second startup limit during heavy disk activity. Integration and release harnesses now use the managed runner's existing 60-second launch allowance; workflow assertions and their time limits are unchanged. The complete rerun passed route type generation, full ESLint, TypeScript, all 57 unit/integration checks, production build, isolated HTTP smoke and the Chromium role workflow. Desktop/mobile intake and dashboard screenshots were inspected after CSS cleanup. Local documentation links remain valid; .env.local has the same SHA-256 as before cleanup. Persistent MongoDB and actual node_modules remain; temporary-directory junctions were unlinked without recursively deleting their targets. The current 1.1.0 source ZIP/checksum was refreshed; stale browser output and the regenerable TypeScript build cache were cleared after verification.

## Upgrade ideas

Recommended next work is tracked in the [follow-up backlog](../tracking/follow-ups.md): SLA/business-hour policies and escalation; searchable selectors; larger-volume query/load testing; account recovery and stable authentication evaluation; accessible personal saved views. These ideas require their own agreed scope and are not implied by the UI refresh.

Real Atlas credentials are still unconfigured in the project's active local environment. The supplied cluster templates cannot authenticate. Deployment/backup instructions are available, but an Atlas connection, hosted demo and real restore drill are not claimed as tested.
