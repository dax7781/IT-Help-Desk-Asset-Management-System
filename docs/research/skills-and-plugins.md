# Skills and plugin research

Historical planning snapshot. For current installation decisions and verified tool state, see the [requested tools review](requested-tools-review.md) and [skills guide](../../skills.md). The no-installation statements below describe this earlier research stage.

Research record from 2026-10-09; subsequent user decisions switched the application to MongoDB/Mongoose and simple login. See ../decisions/001-initial-implementation.md for the current architecture. Scope: assistant development tooling for the existing Next.js/TypeScript/PostgreSQL plan. This is research and documentation only; no app implementation, package installation, plugin connection, repository publishing, or deployment was performed.

## Sources inspected

| Source | Finding used |
| --- | --- |
| [OpenAI curated skill catalog](https://github.com/openai/skills/tree/main/skills/.curated) | Confirms the shortlisted package names |
| [Playwright skill source](https://github.com/openai/skills/blob/main/skills/.curated/playwright/SKILL.md) | CLI browser automation, npx prerequisite, snapshots, traces, screenshots; not automatically test specs |
| [Security best practices source](https://github.com/openai/skills/blob/main/skills/.curated/security-best-practices/SKILL.md) | Explicit security trigger, TypeScript support, framework reference checks |
| [Threat model source](https://github.com/openai/skills/blob/main/skills/.curated/security-threat-model/SKILL.md) | Explicit trigger, repository evidence, context confirmation |
| [GitHub CI skill source](https://github.com/openai/skills/blob/main/skills/.curated/gh-fix-ci/SKILL.md) | GitHub CLI authentication, failing Actions checks, approval workflow |
| [Vercel deployment source](https://github.com/openai/skills/blob/main/skills/.curated/vercel-deploy/SKILL.md) | Preview default, explicit production request, deployment verification limits |

Official upstream sources were used rather than third-party skill collections. The specific package sources were read for research, not invoked to conduct a security review or deployment. Review upstream changes before later installation.

## Live plugin discovery

Queried the plugin directory for GitHub and Figma. Both were returned as available and not installed. GitHub supports repository/PR/issue/CI workflows; Figma supports design creation/review/implementation. GitBook was returned as another option but was not recommended because committed Markdown is sufficient here.

Recommended shortlist: GitHub; optional Figma. Availability is a dated directory observation, not a guarantee of account entitlement, connection, or every operation. No connection was made. The project can be implemented with ordinary local tools and provider dashboards.

## Local/session inspection

The available-skill catalog includes skill-installer, plugin-management, and computer-use. The user skill directory listed only .system; the researched curated packages were not exposed as callable session skills. This is not an exhaustive audit of every plugin cache. Recheck actual installation/session availability later.

## Selection rationale and exclusions

Browser checks align with role workflows and responsive UI. Security tools align with permission boundaries and internal notes. CI/deployment skills align with the GitHub portfolio and Vercel target. Figma helps collaboration but is optional. Additional hosted planning/documentation systems, AI features, and image generation add little to the MVP. No new plugin is required for MongoDB index/document changes or normal Next.js coding.

Package summaries are research-derived; suitability and phase priorities are project-specific judgments. The [skills.md guide](../../skills.md) contains setup and implementation sequencing.
