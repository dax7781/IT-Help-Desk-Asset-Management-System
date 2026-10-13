# Decision 003: Local release and security controls

Date: 2026-10-12. The user selected **finish the local package and deployment instructions**. No hosting, Git commits, pushes, release tags, or public demo is authorized. Phase 08 criteria now describe a local production release; the former hosted criteria are retained in [the archive](../archive/hosted-release-plan.md).

## Access and abuse controls

Auth.js encrypted sessions expire after eight hours, subject to its renewal behavior and 15-second verification tolerance. Protected requests load current active state, role, and sessionVersion. Changing role or active state increments sessionVersion atomically with the account edit; old sessions remain revoked after reactivation. Existing pre-upgrade sessions require sign-in again. Internal notes and record ownership remain service-layer decisions.

MongoDB TTL counters limit normalized-email sign-in attempts to 10 per ten-minute window. All authenticated mutation routes consume a shared quota of 60 requests per minute and 1,000 per UTC day per account, including rejected application inputs after origin validation. Fixed windows may allow a burst across a boundary; they are not a substitute for hosting-edge traffic controls. Client-controlled forwarded IP headers are not trusted. Public signup is absent. A public administrator demo still requires isolated data, controlled access, and provider-edge limits before publishing.

Body streams, including sign-in forms, are bounded to 32 KiB. The Auth.js route retains its CSRF checks and now also enforces same-origin POSTs. Logs include error classifications only, never credentials, bodies, tokens, or connection strings.

## Browser controls

Next.js Proxy supplies a fresh cryptographic nonce and CSP for HTML; the root layout waits for a request so every HTML document is rendered with its nonce. Production scripts permit neither unsafe-inline nor unsafe-eval. Styles allow inline attributes for React/Recharts. Development alone permits eval and WebSocket connections. Frame embedding and objects are denied; nosniff, no-referrer and feature restrictions apply to all routes. HSTS/upgrade-insecure-requests apply to HTTPS HTML requests, preserving loopback HTTP previews. Hosting must also enforce HTTPS at its trusted edge.

## Operational boundaries

Local production verification uses a separate ephemeral MongoDB replica set on a random database port and app port 3100. It overrides environment only in child processes, preserves .env.local and persistent records, and cleans up its own processes. The managed local runner refuses to override an external MONGODB_URI.

db:prepare performs index setup and session-version backfill outside request handling. Demo initialization/reset is restricted to techdesk_demo or techdesk_reset_test and an explicit fictional-demo marker. Reset requires exact database-name confirmation, writes in one transaction, and gives seed accounts new session versions. No reset was performed on the project database or Atlas.

The unpatched development-only braces advisory is accepted as a documented local-release tooling follow-up; it is not fixed by downgrading Next.js or disabling lint. Runtime-only audit and app-specific checks are reported separately.

## Coherent detail and UI updates

A rapid browser sequence revealed that parallel note/state actions could render new conversation content while work controls still held an older version. Ticket detail now reads current actor, ticket, comments, history, asset and names sequentially in one read-only snapshot transaction. Ticket forms share a client pending state through the server refresh transition, so the next action waits for current props. A regression inserts a comment between detail queries and proves each response remains coherent; the fast note-to-resolution browser scenario passes without retries or artificial sleeps.
