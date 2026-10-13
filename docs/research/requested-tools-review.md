# Requested skill and plugin review

Update 2026-10-12: the built-in browser was unavailable for the final production check. The user's authorization to use suitable supplied tools was applied to official [Playwright Test](https://playwright.dev/docs/intro): pinned @playwright/test 1.64.0 and Chromium were installed for repeatable isolated local browser checks. The earlier table below records the phase 04–06 selection state; this update supersedes its unused-browser-tool decision for phase 07–08.

Reviewed on 2026-10-09 against the upstream pages supplied in the attachment. Selection is based on this Next.js/MongoDB help desk and the authorized phases 04–06. Pasted claims about earlier Claude installations were treated as unverified history.

| Tool | Decision | Project fit and verified state |
| --- | --- | --- |
| [Claude Code Setup](https://claude.com/marketplace/plugins/claude-code-setup) | Skip in Codex | A Claude Code setup recommender. It does not implement help desk features or provide a Codex plugin installation path. |
| [OmniRoute](https://github.com/diegosouzapw/OmniRoute) | Leave unused | An AI provider gateway; this MVP has no AI provider calls. An omniroute command shim exists on PATH, but its configuration and service were not changed or started. |
| [Find Skills](https://skills.sh/vercel-labs/skills/find-skills) | No additional installation | Useful for discovering agent skills. The existing Codex skill installer and plugin discovery cover this task. |
| [Strix](https://github.com/usestrix/strix) | Defer to a separately configured security assessment | Relevant to phase 07. The local scanner requires a running Docker environment and provider authentication; cloud scanning introduces a source upload. No strix command was found on PATH. No scan, upload, authentication, or new service was started. |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Install the existing-project review variant | Installed `skills/redesign-skill` through the Codex installer, read its SKILL.md, and used its focused audit of spacing, states, navigation, and typography. The rest of the collection was not needed. |
| [Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Install and apply | Installed the official Vercel skill, read it, and fetched its current [interface rules](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Applied label, focus, feedback, responsive-layout, motion, and contrast checks. |
| [Awesome Design](https://github.com/VoltAgent/awesome-design-md) | Reference only | A collection of brand design references. TechDesk already has a documented visual direction; copying another brand's design system is unnecessary. |
| [Image-to-code](https://github.com/Leonxlnx/taste-skill/tree/main/skills/image-to-code-skill) | Skip for this stage | An image-reference workflow. These phases extend an existing app with data and role workflows, so a new image generation pipeline would not help verification. |
| [Playwright CLI](https://github.com/microsoft/playwright-cli) | Use the available built-in browser instead | A playwright-cli shim already exists on PATH. The Codex browser supports the required workflow, responsive, keyboard, and screenshot checks, so no duplicate browser tooling was installed. |

## Installation evidence

The official Codex installer successfully downloaded:

- `vercel-labs/agent-skills`, path `skills/web-design-guidelines` → `C:/Users/Hiumonday/.codex/skills/web-design-guidelines`.
- `Leonxlnx/taste-skill`, path `skills/redesign-skill` → `C:/Users/Hiumonday/.codex/skills/redesign-skill`.

Both installed SKILL.md files were read in this session. Codex can discover the installed skills automatically on the next turn; their instructions were applied manually during this turn. They are development instructions, not application dependencies. Neither is needed to run TechDesk.

Plugin directory searches did not return exact Codex integrations for Claude Code Setup, OmniRoute, or Strix. No external account connector was added. Local implementation and browser verification did not need one.
