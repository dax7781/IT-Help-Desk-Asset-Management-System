# Phase 01 wireframes and navigation

Historical phase 01 baseline. Current implemented layouts are documented in [Enterprise workspace design](enterprise-workspace.md); inventory and staff controls listed as future work below were delivered in phases 04–06.

Desktop: persistent left sidebar (brand, role, Overview/Tickets, submit action, signed-in user); top breadcrumb; main content; quiet footer. Mobile: compact header, role/sign-out, navigation row; single-column content. A skip-to-content link and visible focus indicators support keyboard navigation.

| Screen | Layout and navigation |
| --- | --- |
| Login | Brand/story panel + email/password form; generic failure message; local demo hints only in local runner |
| Overview | Greeting + new ticket action; support introduction; links to create and browse tickets; no fabricated analytics |
| Tickets | Heading/count + create action; search/status/priority/category filters; linked rows; stable pagination; empty state |
| New ticket | Back link; title; category; permitted equipment selector; description; validation; cancel/submit |
| Ticket detail | Number/title/status; description and public conversation; details/equipment; filtered timeline; public comment form |
| Inventory (later) | Planned search/filter table + register action; detail with equipment specs, assignment, repair history; not implemented through phase 03 |

Flow: login → overview → new ticket → detail with success → add public comment → ticket list. Direct inaccessible records return a safe not-found page. Logged-out protected routes redirect to login. Assignment/status/internal-note editing controls are deferred to phase 04.
