# mods-expert-developer-plugin

<!--BADGES-START-->
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
<!--BADGES-END-->

A Claude Code plugin that bundles an expert agent and 60 preserved Claude Code documentation chapters (mods, plugins, hooks, skills, subagents, marketplaces, settings). Use it to create, fix, improve and evaluate Claude Code mods and plugins.

## Components

Agent: `mods-expert-developer-plugin:mods-expert-developer-agent`

Skills: plugin skills are namespaced `mods-expert-developer-plugin:<skill>` and are reference-only (`user-invocable: false`).

| Skill | SKILL.md heading |
|---|---|
| mods-doc-add-components-to-a-plugin | ADD COMPONENTS TO A PLUGIN |
| mods-doc-official-marketplaces | ANTHROPIC MARKETPLACES |
| mods-doc-automate-actions-with-hooks | AUTOMATE ACTIONS WITH HOOKS |
| mods-doc-channels-reference | CHANNELS REFERENCE |
| mods-doc-cc-debug-mode | CLAUDE CODE DEBUG MODE |
| mods-doc-cc-native-memory-and-rules | CLAUDE CODE NATIVE MEMORY AND RULES |
| mods-doc-cc-settings-reference | CLAUDE CODE SETTINGS REFERENCE |
| mods-doc-cc-github-actions | CLAUDE GITHUB ACTIONS |
| mods-doc-cc-permissions-modes | CLAUDE PERMISSIONS MODES |
| mods-doc-cc-projects-directory-structure | CLAUDE PROJECTS DIRECTORY STRUCTURE |
| mods-doc-cc-security-plugin | CLAUDE SECURITY PLUGIN |
| mods-doc-code-intelligence-components-in-plugins | CODE INTELLIGENCE COMPONENTS IN PLUGINS |
| mods-doc-create-a-marketplace | Create a marketplace |
| mods-doc-cross-session-messaging-reference | CROSS SESSION MESSAGING REFERENCE |
| mods-doc-deep-links-reference | DEEP LINKS REFERENCE |
| mods-doc-dynamic-workflows-reference | DYNAMIC WORKFLOWS REFERENCE |
| mods-doc-headless-mode-reference | HEADLESS MODE REFERENCE |
| mods-doc-hooks-reference | HOOKS REFERENCE |
| mods-doc-how-to-host-a-marketplace | HOW TO HOST A MARKETPLACE |
| mods-doc-large-monorepo-plugin-development | HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) |
| mods-doc-install-and-manage-plugins | INSTALL AND MANAGE PLUGINS |
| mods-doc-loop-and-chron-reference | LOOP AND CHRON REFERENCE |
| mods-doc-manage-costs-of-a-plugin | MANAGE COSTS OF A PLUGIN |
| mods-doc-manage-mods-for-organizations | MANAGE MODS FOR ORGANIZATIONS |
| mods-doc-manage-plugins-from-cli | MANAGE PLUGINS FROM CLI |
| mods-doc-manage-plugins-in-organizations | MANAGE PLUGINS IN ORGANIZATIONS |
| mods-doc-marketplace-manifest-reference | MARKETPLACE MANIFEST REFERENCE |
| mods-doc-mcp-servers-reference | MCP SERVERS REFERENCE |
| mods-doc-models-configuration | MODELS CONFIGURATION |
| mods-doc-mods-and-events | MODS AND EVENTS |
| mods-doc-mods-api | MODS API |
| mods-doc-mods-basic-examples | MODS BASIC EXAMPLES |
| mods-doc-mods-development | Mods Development |
| mods-doc-mods-interfaces | MODS INTERFACES |
| mods-doc-mods-overview | MODS OVERVIEW |
| mods-doc-mods-reference | MODS REFERENCE |
| mods-doc-mods-testing | MODS TESTING |
| mods-doc-mods-troubleshooting | MODS TROUBLESHOOTING |
| mods-doc-native-toolset-reference | NATIVE TOOLS REFERENCE |
| mods-doc-output-style-reference | OUTPUT STYLE REFERENCE |
| mods-doc-platforms-overview | PLATFORMS OVERVIEW |
| mods-doc-plugin-commands-reference | PLUGIN COMMANDS REFERENCE |
| mods-doc-plugin-manifest-reference | PLUGIN MANIFEST REFERENCE |
| mods-doc-plugin-recomendations | PLUGIN RECOMENDATIONS |
| mods-doc-plugins-creation | PLUGINS CREATION |
| mods-doc-plugins-depending-on-other-plugins | PLUGINS DEPENDING ON OTHER PLUGINS |
| mods-doc-plugins-security-and-trust | PLUGINS SECURITY AND TRUST |
| mods-doc-prompt-caching-reference | PROMPT CACHING REFERENCE |
| mods-doc-publish-a-plugin | PUBLISH A PLUGIN |
| mods-doc-recomended-plugins-to-create-plugins | RECOMENDED PLUGINS TO CREATE PLUGINS |
| mods-doc-sessions-reference | SESSIONS REFERENCE |
| mods-doc-settings-precedence-and-scopes | SETTINGS PRECEDENCE AND SCOPES |
| mods-doc-skills-reference | SKILLS REFERENCE |
| mods-doc-status-line-customization | STATUS LINE CUSTOMIZATION |
| mods-doc-subagents-reference | SUBAGENTS REFERENCE |
| mods-doc-test-plugins-with-evals | TEST PLUGINS WITH EVALS |
| mods-doc-tracing-the-origin-of-a-plugin | TRACING THE ORIGIN OF A PLUGIN |
| mods-doc-troubleshooting-cc-setup | TROUBLESHOOTING CLAUDE SETUP |
| mods-doc-troubleshooting-plugins | TROUBLESHOOTING PLUGINS |
| mods-doc-worktrees-reference | WORKTREES REFERENCE |

## Prerequisites

The agent preloads the user-scope skills `tldr-code`, `fastedit`, `jgrep` and `quicksilver`, and delegates to the user-scope agents `fast-worker` and `cheap-worker`. These are NOT bundled with this plugin; without them the agent reports `[BLOCKED]`. Node is also required.

## Installation

Local install for development and testing:

```bash
claude --plugin-dir /absolute/path/to/mods-expert-developer-plugin
```

Marketplace install: once this plugin is published in a Claude Code marketplace you have added, install it with the plugin install command and the marketplace name of your choice:

```bash
claude plugin install mods-expert-developer-plugin@<marketplace-name>
```

## Usage

Invoke the agent by its namespaced name, for example through the Agent tool or by asking Claude Code to use it:

```text
mods-expert-developer-plugin:mods-expert-developer-agent
```

Give it a task such as creating a new mod, fixing a broken plugin hook, or reviewing a plugin manifest. The agent plans with TRDD proposals, loads only the chapter skills it needs, and verifies each step before moving on.

## Validate

```bash
claude plugin validate .
```

## Adding or reordering a skill

Four artifacts list the skills, and the plugin's tests require specific relationships
between them. A skill addition is not one edit:

1. `skills/<name>/SKILL.md` — the wrapper, with its `references/chapter.md` and `agents/openai.yaml`.
2. `README.md` — a row in the Components table above. The table must cover every skill exactly once, its heading column must match each SKILL.md's H1, and it is ordered by heading (case-insensitive) — deliberately NOT the same order as the frontmatter.
3. `agents/mods-expert-developer-agent.md` — an entry in the `skills:` frontmatter AND a row in the "Chapter skill index" table, at the same position in the same order, so the two copies of the routing order agree. The body table must cover every skill exactly once, and its label column must match each SKILL.md's H1.
4. `PINNED_PRELOAD_SKILLS` in `tests/test_skills_menu.py` — the first 32 frontmatter entries, which are the ones Claude Code preloads in full. Only the window is mirrored, not the tail: adding a skill at position 30 or earlier pushes another skill out of that window, and the pinned set must be updated to match. Read the frontmatter's own diff too, since the pinned set records the membership and not which member was displaced.

Then run the tests:

```bash
uv run --project . pytest -q tests/
```

## License

The plugin's own files are licensed under MIT (see LICENSE). The reference chapters are Anthropic documentation and are not covered by MIT; see NOTICE.
