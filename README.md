# emasoft-mods-development-plugin

A Claude Code plugin that bundles an expert agent and 60 preserved Claude Code documentation chapters (mods, plugins, hooks, skills, subagents, marketplaces, settings). Use it to create, fix, improve and evaluate Claude Code mods and plugins.

## Components

Agent: `emasoft-mods-development-plugin:mods-expert-developer-agent`

Skills: plugin skills are namespaced `emasoft-mods-development-plugin:<skill>` and are reference-only (`user-invocable: false`).

| Skill | SKILL.md heading |
|---|---|
| mods-doc-add-components-to-a-plugin | ADD COMPONENTS TO A PLUGIN |
| mods-doc-anthropic-marketplaces | ANTHROPIC MARKETPLACES |
| mods-doc-automate-actions-with-hooks | AUTOMATE ACTIONS WITH HOOKS |
| mods-doc-channels-reference | CHANNELS REFERENCE |
| mods-doc-claude-code-debug-mode | CLAUDE CODE DEBUG MODE |
| mods-doc-claude-code-native-memory-and-rules | CLAUDE CODE NATIVE MEMORY AND RULES |
| mods-doc-claude-code-settings-reference | CLAUDE CODE SETTINGS REFERENCE |
| mods-doc-claude-github-actions | CLAUDE GITHUB ACTIONS |
| mods-doc-claude-permissions-modes | CLAUDE PERMISSIONS MODES |
| mods-doc-claude-projects-directory-structure | CLAUDE PROJECTS DIRECTORY STRUCTURE |
| mods-doc-claude-security-plugin | CLAUDE SECURITY PLUGIN |
| mods-doc-code-intelligence-components-in-plugins | CODE INTELLIGENCE COMPONENTS IN PLUGINS |
| mods-doc-create-a-marketplace | Create a marketplace |
| mods-doc-cross-session-messaging-reference | CROSS SESSION MESSAGING REFERENCE |
| mods-doc-deep-links-reference | DEEP LINKS REFERENCE |
| mods-doc-dynamic-workflows-reference | DYNAMIC WORKFLOWS REFERENCE |
| mods-doc-headless-mode-reference | HEADLESS MODE REFERENCE |
| mods-doc-hooks-reference | HOOKS REFERENCE |
| mods-doc-how-to-host-a-marketplace | HOW TO HOST A MARKETPLACE |
| mods-doc-how-to-use-a-large-monorepo-with-claude-usuall-f868e63e | HOW TO USE A LARGE MONOREPO WITH CLAUDE (Usually the case when developing Plugins) |
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
| mods-doc-native-tools-reference | NATIVE TOOLS REFERENCE |
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
| mods-doc-troubleshooting-claude-setup | TROUBLESHOOTING CLAUDE SETUP |
| mods-doc-troubleshooting-plugins | TROUBLESHOOTING PLUGINS |
| mods-doc-worktrees-reference | WORKTREES REFERENCE |

## Prerequisites

The agent preloads the user-scope skills `tldr-code`, `fastedit`, `jgrep` and `quicksilver`, and delegates to the user-scope agents `fast-worker` and `cheap-worker`. These are NOT bundled with this plugin; without them the agent reports `[BLOCKED]`. Node is also required.

## Install / test locally

```bash
claude --plugin-dir /absolute/path/to/emasoft-mods-development-plugin
```

## Validate

```bash
claude plugin validate .
```

## License

The plugin's own files are licensed under MIT (see LICENSE). The reference chapters are Anthropic documentation and are not covered by MIT; see NOTICE.
