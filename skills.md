# TechDesk skills and plugin guide

Updated 2026-10-12 for local version 1.1.0. This is a project guide; installed Codex skills have their own SKILL.md and are discovered separately. Read the guide and current phase plan when continuing work. The [enterprise UI refresh](docs/design/enterprise-workspace.md) applies both installed interface skills and official Salesforce/ServiceNow references.

## Installed and applied

| Skill | Use in this project | Source |
| --- | --- | --- |
| Web Design Guidelines | Review forms, labels, keyboard focus, async feedback, navigation, responsive layout, and contrast | [Vercel source](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) |
| Redesign Existing Projects | Audit the existing interface and apply focused improvements within the current stack | [Taste Skill variant](https://github.com/Leonxlnx/taste-skill/tree/main/skills/redesign-skill) |

Installed under C:/Users/Hiumonday/.codex/skills through Codex's official skill installer. Both instructions were read and used in this session. Automatic skill discovery is available on the next turn. No additional app connector was installed. These skills do not become npm/runtime dependencies.

The [review of all nine requested tools](docs/research/requested-tools-review.md) records sources, suitability, observed installation state, and exclusions. The older [research record](docs/research/skills-and-plugins.md) is preserved as dated planning history.

## Workflow

1. Read the phase README and referenced specifications.
2. Implement only the authorized phase scope with current MongoDB/email-password decisions.
3. Apply the installed UI review skills to relevant pages/components; fetch current upstream rules as instructed.
4. Verify service permissions and transactions with isolated MongoDB integration tests. Use the built-in Codex browser when available; the user explicitly authorized local Playwright checks when it is unavailable. The current repeatable command is npm run test:browser.
5. Run lint, typecheck, tests, build, and the local HTTP smoke test. Record evidence before checking tasks.
6. Keep progress, specifications, and README aligned with actual implementation.

## Later tools

Phase 07 uses repository-specific authorization, session, concurrency, quota and real MongoDB tests, plus production HTTP checks. Strix needs separately configured scanner authentication; no scan or upload was performed. GitHub/hosting tooling remains deferred. No new external connector was required for the local release.

OmniRoute is unnecessary for this MVP without AI calls. Image-to-code and new brand design kits are unnecessary. The built-in browser covered phases 01–06; it was unavailable on 2026-10-12. The user's earlier authorization for suitable tools from the supplied list supports the official pinned Playwright Test 1.64.0 development dependency and repeatable local Chromium verification. It tests only the isolated demo and is not a runtime dependency or external account connector.

Preserve server-side current-role/ownership checks, private-note filtering, transactional history, version conflicts, active-assignee invariants, and last-admin protection. Use real aggregate data in charts. Keep secrets and local database files ignored. Commits, pushes, and deployment remain deferred by the user.
