# Dependency audit — 2026-10-09

Rechecked 2026-10-12 for versions 1.0.0 and 1.1.0: full audit still reports the same five development-chain entries; runtime-only audit reports zero. The [upstream advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) still lists no patched version. This is an accepted local-release tooling follow-up, not a fixed vulnerability or an unresolved application-test failure. ESLint 9 also reports a support deprecation during a fresh install; compatible tooling updates remain in F-001.

Full npm audit reports five high-severity entries in the development-only Next.js ESLint dependency chain (eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces). These entries describe one underlying advisory, not five independent application vulnerabilities.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) covers brace-pattern stack exhaustion; the advisory lists no patched version at research time. npm proposes a major downgrade of the Next.js ESLint configuration. That downgrade was not applied because it would replace the selected compatible lint configuration without a verified fix for this project.

`npm audit --omit=dev --json` returned **zero runtime dependency vulnerabilities**. This does not prove the application is secure; authorization and transaction checks are verified separately.

Rechecked on 2026-10-09 after the phase 06 Recharts addition: runtime audit remains zero; the full development audit retains the same advisory.

Current treatment: keep the compatible lint dependency pinned, do not expose lint/glob evaluation to user-supplied patterns, and revisit an upstream fix/alternative in [F-001](../tracking/follow-ups.md). No lint rules were disabled and no forced framework downgrade was applied.
