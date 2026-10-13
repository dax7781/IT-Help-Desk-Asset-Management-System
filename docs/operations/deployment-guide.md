# Local production release and later deployment

User-selected scope on 2026-10-12: local release package and deployment instructions. No publishing or Git activity. Node.js 24, npm and a transaction-capable MongoDB replica set are required; a static export cannot run the authenticated database app.

## Run the local package

Extract the supplied techdesk-1.1.0.zip into a new folder (its root is TechDesk/), then open PowerShell there:

```powershell
npm.cmd ci
npm.cmd run dev
```

The first start generates private .env.local demo credentials and a secret, downloads MongoDB if absent, creates indexes, inserts missing fictional seed records, and starts loopback port 3000. Data persists under .local/mongodb; do not delete it to upgrade the app. Existing accounts and passwords are preserved.

For the production build on the same managed local database, stop dev first:

```powershell
npm.cmd run build
npm.cmd run preview
```

Open http://localhost:3000. preview uses next start and the managed persistent local replica set. Stop with Ctrl+C. dev and preview cannot occupy the same database/app ports simultaneously. No cloud service is involved.

## Configure the supplied Atlas cluster privately

The user's cluster template is recorded in [.env.atlas.example](../../.env.atlas.example). Its placeholders cannot authenticate. In Atlas, create a database user restricted to this application's database, and add your current client/server outbound address to Network Access. Enter the real connection string into ignored .env.local, replacing the username and password and percent-encoding reserved characters. Specify /techdesk explicitly:

```text
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.hdfssqu.mongodb.net/techdesk?appName=Cluster0
AUTH_URL=http://localhost:3000
AUTH_SECRET=<random secret of at least 32 characters>
```

Keep the existing AUTH_SECRET when simply restarting; change it intentionally when revoking all sessions. Generate a new secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never put database secrets in NEXT_PUBLIC variables or commit .env.local. Template files contain no working credential.

With the real URI set:

```powershell
npm.cmd run db:prepare
npm.cmd run dev:external
```

Preparation validates the origin/secret, creates declared indexes, and adds missing session-version defaults. It does not reset records or seed an existing database. The managed dev/preview runner accepts only the techdesk database on localhost/127.0.0.1:27027, without URI credentials and with the techdesk-dev replica set (or no replica-set parameter). It refuses other configurations before editing .env.local; use dev:external or, after build, `npm.cmd start -- --hostname 127.0.0.1 --port 3000` for a local external-database preview.

An empty techdesk local/Atlas demo can use the existing non-destructive `npm.cmd run db:seed` after a private DEMO_PASSWORD is set. The seed CLI only accepts techdesk or techdesk_test. It creates only missing fictional records and cannot change an existing user's password. Do not seed a real employee database. A resettable fictional demo instead uses the separately named database below.

## Later hosting procedure

1. Select a Next.js Node hosting platform, its HTTPS app origin, and isolated MongoDB database. Previews need a separate database from the live demo. Provide provider-approved outbound addresses for Atlas rather than broadly opening access.
2. Configure MONGODB_URI, AUTH_SECRET and AUTH_URL privately at runtime. AUTH_URL is the exact origin with no path, query or credentials. Auth.js uses /api/auth; no GitHub OAuth callback is needed. Configure secure HTTPS at the edge and limits for anonymous traffic, sign-in and body size. The app does not trust arbitrary client X-Forwarded-For values for rate limits.
3. Run `npm.cmd ci`, `npm.cmd run browser:install`, and `npm.cmd run verify` in the release environment. Linux CI installs Chromium with its system dependencies using the committed workflow. verify generates route types, checks lint/types/tests/build, and exercises production HTTP/browser workflows against an ephemeral database. This is not a live reset or hosted smoke test.
4. With the intended runtime database privately configured, run db:prepare once as a controlled release step. Review backup/restore first. Do not run index creation or seed on every request. Connection pools are capped at 10 per app instance; account for instance count against Atlas limits.
5. Start the built app using npm start (the provider supplies PORT, binding and HTTPS proxy). Do not use the mongodb-memory-server runner as a hosted database. SHOW_DEMO_ACCOUNTS is optional and never displays passwords.
6. Verify HTTPS secure/HttpOnly/SameSite session cookies, nonce CSP without unsafe-eval, sign-in/out, employee ownership, staff private notes, ticket lifecycle, inventory, access revocation and aggregates on that host. The local smoke script refuses non-loopback targets; use the [browser checklist](../quality/browser-checklist.md) on the hosted isolated demo.
7. Verify provider backups and logs; then review the separately deferred Git/publication work. No hosted tests have been claimed in this delivery.

## Controlled resettable demo

Use only a disposable techdesk_demo database (tests use techdesk_reset_test). Set MONGODB_URI to that explicit database and a private DEMO_PASSWORD, then run `npm.cmd run db:prepare -- --seed-demo`. A populated unmarked database is refused. Initialization sets a fictional-demo marker and inserts missing demo records.

For an intentional reset, stop the app, take a backup if you want to preserve demo edits, verify the configured database, and run:

```powershell
$env:CONFIRM_DEMO_RESET = 'techdesk_demo'
npm.cmd run db:reset-demo
Remove-Item Env:\CONFIRM_DEMO_RESET
```

Only explicit application collections are replaced; reset is transactional and revokes old seeded sessions. The ordinary techdesk database and unmarked databases are refused, even with confirmation. No automatic scheduler or public reset endpoint is installed. A public demo reset should run during a controlled maintenance interval; finish by checking all four seeded roles.

See [backup and recovery](backup-and-recovery.md), [release evidence](../phases/08-deployment-and-portfolio/evidence.md), and [follow-up work](../tracking/follow-ups.md).
