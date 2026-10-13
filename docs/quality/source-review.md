# Source review and verification

Review dates: 2026-10-09 and 2026-10-12. Scope: authored application code in src/, scripts/, tests/, and build/lint/CI configuration. Installed dependencies and generated Next.js output are outside the application source review; dependency advisories are tracked separately.

The subsequent version 1.1.0 audit and enterprise frontend refresh are recorded in [enterprise-refresh-review.md](enterprise-refresh-review.md), including asset snapshot consistency, exact local-database boundaries, staff filter preservation and specification corrections. Earlier evidence describes the original local release.

## Review coverage

- Models and validators: identifiers, unique indexes, date validity, lifecycle invariants, strict input fields, password byte limits, and expected versions.
- Auth and request helpers: normalized credentials, current active role, ownership, origin/JSON/body boundaries, safe errors, no-store responses, connection reuse/reconnect, and local runner cleanup.
- Every route handler and service: endpoint action allowlists, reference eligibility, atomic history, private projections, assignment/role/deactivation races, last-admin preservation, and aggregate cohort definitions.
- Pages and components: role-dependent actions/navigation, controlled/uncontrolled inputs, labels, errors/pending/success, focus and skip links, empty states, safe plain-text rendering, linked-equipment access, and responsive styles.
- Seed, smoke, integration tests, and configuration: preserved local data, isolated test databases, repeatability, meaningful assertions, Windows command handling, and deferred remote actions.

## Findings fixed

| Finding | Fix / verification |
| --- | --- |
| Cross-record checks could race assignments/deactivation or concurrent final-admin removals | Transaction guard; concurrent MongoDB regression cases |
| Password creation could exceed bcrypt's 72-byte limit | UTF-8 byte validation; ASCII and multibyte regression cases |
| A cached resolved connection promise could survive a disconnect | Reset when disconnected; integration files connect independently |
| Error responses did not explicitly prevent caching | No-store on every API error response; request-helper test |
| JSON MIME checking accepted misleading prefixes | Exact media type check while allowing charset parameters; regression case |
| New routes needed safe projections and strict action boundaries | Shared validated services; HTTP role and forged-field checks |
| Resolution/reopen controls initially competed in the same status | Separate close/reopen controls; completed browser lifecycle |
| Historical asset links could point employees to inaccessible inventory detail | Safe summary retained, detail link shown only when permitted |
| Sub-hour averages could appear as zero | Display `<0.1 hours` for small positive values |
| Skip link scrolled without moving keyboard focus | Focusable main target; verified activation and Tab navigation |
| Several small text/placeholder colors needed more contrast | Main text/state pairs measured above 4.5:1; visible focus ring strengthened |
| Local child startup errors and port fallback could leave misleading startup state | Error cleanup and explicit port 3000 |
| User access confirmation stayed checked after saving | Clear confirmation after a successful update |
| Empty label values could throw | Safe charAt-based capitalization |
| Old sessions could revive when an account was reactivated | Session-version revocation after access changes; real credential/session and HTTP regression checks |
| Only login attempts had abuse controls | Shared MongoDB write quotas with concurrent-window, origin ordering, TTL and Retry-After tests |
| Authentication POST bodies were not bounded before Auth.js processing | Same-origin checks and shared streamed 32 KiB limit; production sign-in and hostile/oversized requests checked |
| Browser responses lacked a script policy and baseline restrictions | Per-document nonce CSP, dynamic rendering, security headers; production HTML checks |
| Passing a consumed request to authentication was unreliable | Reconstruct a fresh NextRequest with method/headers/bounded body; production HTTP smoke passes |
| Windows metadata editing introduced a UTF-8 BOM rejected by MongoDB tooling | Normalize JSON without BOM; extracted-package install/startup checks |
| Persistent MongoDB recovery exceeded the default 10-second startup limit | Managed runner allows 60 seconds; preserved local database startup passed |
| Fresh CI typecheck could depend on generated route files | Generate Next.js route types before typecheck in the shared verify command |
| Local runner silently replaced an externally configured URI | Refuse external URI in managed runner; documented external commands |
| Rapid comment/state actions could mix visible updates with stale client versions | Snapshot-consistent detail reads plus shared ticket pending state through refresh completion; concurrent-comment regression and production browser sequence pass |

## Validation record

See phase 04–08 evidence for commands and results. The original release suite had 46 unit/integration tests; version 1.1.0 has 57 and an extended Chromium scenario (see the refresh review); production HTTP/browser verification uses a fresh temporary database. Screenshots reflect dated browser runs under docs/design/screenshots. Transient compiler messages are distinguished from final failures. Passing checks cannot guarantee absence of future defects.

The development-only ESLint dependency advisory remains open; see [dependency-audit.md](dependency-audit.md). Hosted verification is deferred by the user's local-release decision, along with Git publishing. [Follow-ups](../tracking/follow-ups.md) distinguish this future work from verified local behavior.
