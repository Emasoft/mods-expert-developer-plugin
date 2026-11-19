---
name: mods-the-skills-menu
description: "Dynamic skill menu for this plugin. Teaches agents which skills are available, when to use them, and how to load them with the Skill() tool. Use when an agent needs to pick a downstream skill at runtime. Used by mods-forge-agent as its preloaded menu; mods-expert-developer-agent keeps its own preload list."
user-invocable: false
allowed-tools: Read
---

# MODS EXPERT DEVELOPER SKILLS MENU

## Overview

This menu lists every skill an agent of `mods-expert-developer-plugin` can load at runtime: the four optional, recommended user-scope tool skills the agents use but the plugin does not ship, the 61 chapter skills the plugin ships (60 adapted Claude Code documentation chapters and one community how-to), two skills that install and uninstall mod plugins, one skill that turns an existing skill into a mod, three reference-only tutorials with example mods, and twelve reference-only example skills that excerpt installed mods or community repositories at pinned commits, or describe their sources in this plugin's own words. It also names the one skill an agent cannot load, the launcher the user types to start the mods expert agent. It names each skill once, says what it covers, and shows how to load it, or, for the launcher, how the user starts it. It holds no chapter content itself.

## Prerequisites

- The calling agent can call the `Skill` tool.
- The chapter skills ship with `mods-expert-developer-plugin` and load under its namespace.
- The four standalone skills are user-scope, optional and recommended; they are installed separately and this plugin does not ship them.

## Instructions

1. Name the topic the current step needs (an API call, a manifest field, a hook event, a failure).
2. Find its domain under Plugin Skills and pick the one skill whose topic matches. When two look close, read both entries in [the skills catalog](references/skills-catalog.md) and pick by their Use when and Do not use when lines.
3. Load it with `Skill({skill: "mods-expert-developer-plugin:<skill>", args: "<section title or question>"})`. Standalone skills load by their bare name.
4. Read only the section the step needs. Load another skill only when the next step needs it.
5. Load each skill once per task and reuse what is already in context.

## Output

The menu returns nothing itself. The chosen skill puts its content into context; the chapter skills route reads only and write nothing.

## Error Handling

- A chapter skill does not resolve: `mods-expert-developer-plugin` is not installed or is another version; report `[BLOCKED]` naming the skill.
- A standalone tool skill (optional, recommended) does not resolve: use the native tool for the job (Read for reading, Edit and Write for writing, Grep and Glob for locating, plain reading for triage) and say in the report that the skill was missing; never report `[BLOCKED]` only because it is absent.
- No skill matches the topic: say so and name the closest domain; do not load skills speculatively.
- A section anchor inside a chapter misses: follow that chapter skill's own Error Handling.

## Examples

Input: a step must register a tool from a mod's hooks module.

`Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-api", args: "Add a command or a tool"})`

Input: a step must read lines 1 to 80 of the hooks module before editing it.

`Skill({skill: "tldr-code", args: "read hooks/index.ts lines 1-80"})`

## Resources

- [the skills catalog](references/skills-catalog.md): the full entry of every chapter skill and every tutorial (Use when, Do not use when, Load with, Inputs, Outputs, Dependencies), grouped by the same domains as the tables below.
  - [Mods](references/skills-catalog.md#mods)
  - [Plugins](references/skills-catalog.md#plugins)
  - [Marketplaces](references/skills-catalog.md#marketplaces)
  - [Hooks, Subagents and Skills](references/skills-catalog.md#hooks-subagents-and-skills)
  - [Settings and Configuration](references/skills-catalog.md#settings-and-configuration)
  - [Sessions and Runtime](references/skills-catalog.md#sessions-and-runtime)
  - [Troubleshooting](references/skills-catalog.md#troubleshooting)
  - [Mod install and uninstall](references/skills-catalog.md#mod-install-and-uninstall)
  - [Skill to mod](references/skills-catalog.md#skill-to-mod)
  - [Agent launcher](references/skills-catalog.md#agent-launcher)
  - [Tutorials (reference only)](references/skills-catalog.md#tutorials-reference-only)
  - [Example skills (reference only)](references/skills-catalog.md#example-skills-reference-only)
- [the example skills menu](references/example-skills-menu.md): the twelve example skills with their discovery text; read it when building a component like an installed mod.
  - [Example skills (reference only)](references/example-skills-menu.md#example-skills-reference-only)

## Standalone Skills

These four user-scope tool skills are optional, recommended. Load each on demand when it is installed; when one is not, use the native tool for the job (Read, Edit and Write, Grep and Glob, plain reading).

The use, the non-use, the inputs, the outputs and the dependencies of each tool are in [references/standalone-skills.md](references/standalone-skills.md).
  - [tldr-code](references/standalone-skills.md#tldr-code)
  - [fastedit](references/standalone-skills.md#fastedit)
  - [jgrep](references/standalone-skills.md#jgrep)
  - [quicksilver](references/standalone-skills.md#quicksilver)

### tldr-code

**Load with:** `Skill({skill: "tldr-code", args: "..."})`

### fastedit

**Load with:** `Skill({skill: "fastedit", args: "..."})`

### jgrep

**Load with:** `Skill({skill: "jgrep", args: "..."})`

### quicksilver

**Load with:** `Skill({skill: "quicksilver", args: "..."})`

## Plugin Skills

Every skill below loads as `mods-expert-developer-plugin:<skill>`. Its full entry is in [the skills catalog](references/skills-catalog.md).

### Mods

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-mods-overview | What a mod can do; Install, update, or try a mod; Decide whether to trust a mod |
| mods-expert-developer-plugin:mods-doc-mods-development | Create a mod |
| mods-expert-developer-plugin:mods-doc-mods-interfaces | Draw in the interface with a mod |
| mods-expert-developer-plugin:mods-doc-mods-basic-examples | Interface examples for mods |
| mods-expert-developer-plugin:mods-doc-mods-and-events | React to events with a mod |
| mods-expert-developer-plugin:mods-doc-mods-api | Use the mods API |
| mods-expert-developer-plugin:mods-doc-mods-testing | Test a mod |
| mods-expert-developer-plugin:mods-doc-mods-troubleshooting | Troubleshoot a mod |
| mods-expert-developer-plugin:mods-doc-mods-reference | Files; The hook function; Events a mod can hook |
| mods-expert-developer-plugin:mods-doc-manage-mods-for-organizations | Manage mods for your organization |

### Plugins

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-plugins-creation | Create a Claude Code plugin |
| mods-expert-developer-plugin:mods-doc-add-components-to-a-plugin | Add components to a plugin |
| mods-expert-developer-plugin:mods-doc-plugins-depending-on-other-plugins | Plugin dependencies |
| mods-expert-developer-plugin:mods-doc-test-plugins-with-evals | Test plugins with evals |
| mods-expert-developer-plugin:mods-doc-publish-a-plugin | Publish and distribute a plugin |
| mods-expert-developer-plugin:mods-doc-manage-costs-of-a-plugin | Measure plugin cost and usage |
| mods-expert-developer-plugin:mods-doc-manage-plugins-from-cli | Recommend your plugin from your CLI |
| mods-expert-developer-plugin:mods-doc-install-and-manage-plugins | Install and manage plugins |
| mods-expert-developer-plugin:mods-doc-code-intelligence-components-in-plugins | Code intelligence plugins |
| mods-expert-developer-plugin:mods-doc-plugins-security-and-trust | Plugin security and trust |
| mods-expert-developer-plugin:mods-doc-manage-plugins-in-organizations | Manage Claude Code plugins for your organization |
| mods-expert-developer-plugin:mods-doc-plugin-manifest-reference | Plugin manifest reference |
| mods-expert-developer-plugin:mods-doc-plugin-commands-reference | Plugin commands reference |
| mods-expert-developer-plugin:mods-doc-recomended-plugins-to-create-plugins | skill-creator; Plugin Development Toolkit; Overview |
| mods-expert-developer-plugin:mods-doc-large-monorepo-plugin-development | Set up Claude Code in a monorepo or large codebase |
| mods-expert-developer-plugin:mods-doc-cc-security-plugin | Scan your codebase for vulnerabilities |

### Marketplaces

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-official-marketplaces | Anthropic's marketplaces |
| mods-expert-developer-plugin:mods-doc-create-a-marketplace | Create a marketplace; Add plugin entries; Rules for plugin entries |
| mods-expert-developer-plugin:mods-doc-how-to-host-a-marketplace | Host and maintain a marketplace |
| mods-expert-developer-plugin:mods-doc-plugin-recomendations | Recommend plugins for your org |
| mods-expert-developer-plugin:mods-doc-marketplace-manifest-reference | Marketplace reference |

### Hooks, Subagents and Skills

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-hooks-reference | Hooks reference |
| mods-expert-developer-plugin:mods-doc-automate-actions-with-hooks | Automate actions with hooks |
| mods-expert-developer-plugin:mods-doc-subagents-reference | Create custom subagents |
| mods-expert-developer-plugin:mods-doc-skills-reference | Extend Claude with skills |
| mods-expert-developer-plugin:mods-doc-dynamic-workflows-reference | Orchestrate subagents at scale with dynamic workflows |
| mods-expert-developer-plugin:mods-doc-mcp-servers-reference | Connect Claude Code to tools via MCP |
| mods-expert-developer-plugin:mods-doc-output-style-reference | Output styles |
| mods-expert-developer-plugin:mods-doc-status-line-customization | Customize your status line |
| mods-expert-developer-plugin:mods-doc-native-toolset-reference | Tools reference |

### Settings and Configuration

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-cc-settings-reference | Settings files and precedence |
| mods-expert-developer-plugin:mods-doc-settings-precedence-and-scopes | Settings files and precedence |
| mods-expert-developer-plugin:mods-doc-cc-permissions-modes | Choose a permission mode |
| mods-expert-developer-plugin:mods-doc-models-configuration | Model configuration |
| mods-expert-developer-plugin:mods-doc-cc-native-memory-and-rules | How Claude remembers your project |
| mods-expert-developer-plugin:mods-doc-cc-projects-directory-structure | Explore the .claude directory |
| mods-expert-developer-plugin:mods-doc-prompt-caching-reference | How Claude Code uses prompt caching |

### Sessions and Runtime

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-sessions-reference | Manage sessions |
| mods-expert-developer-plugin:mods-doc-cross-session-messaging-reference | Message your other Claude Code sessions |
| mods-expert-developer-plugin:mods-doc-worktrees-reference | Run parallel sessions with worktrees |
| mods-expert-developer-plugin:mods-doc-channels-reference | Push events into a running session with channels |
| mods-expert-developer-plugin:mods-doc-loop-and-chron-reference | Run prompts on a schedule |
| mods-expert-developer-plugin:mods-doc-headless-mode-reference | Run Claude Code programmatically |
| mods-expert-developer-plugin:mods-doc-deep-links-reference | Launch sessions from links |
| mods-expert-developer-plugin:mods-doc-run-background-sessions | Who runs what; Security first; Ask the user to mint a long-lived token |
| mods-expert-developer-plugin:mods-doc-platforms-overview | Platforms and integrations |
| mods-expert-developer-plugin:mods-doc-cc-github-actions | Claude Code GitHub Actions |

### Troubleshooting

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-doc-troubleshooting-plugins | Troubleshoot plugins |
| mods-expert-developer-plugin:mods-doc-tracing-the-origin-of-a-plugin | Plugin loading reference |
| mods-expert-developer-plugin:mods-doc-troubleshooting-cc-setup | Troubleshoot installation and login |
| mods-expert-developer-plugin:mods-doc-cc-debug-mode | Debug your configuration |

### Mod install and uninstall

Tool skills of this plugin that install and uninstall mod plugins with the claude CLI, then reload the plugins. Both are user-invocable, and both act only on the names the user gives and the choices the user confirms.

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-install-mod | Install a mod plugin by its names, a --marketplace source or the GitHub repos, then reload the plugins |
| mods-expert-developer-plugin:mods-uninstall-mod | Uninstall a mod plugin named approximately, after the user picks it, then reload the plugins |

### Skill to mod

A tool skill of this plugin that the mods expert agent loads: it decides whether an existing skill should become a mod and, when it should, scaffolds the mod and verifies it. It is model-invocable, not user-invocable.

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-skill-to-mod | Decide whether a skill should become a mod; scaffold a mod plugin that bundles it, with a switch for every function and an opt-in debug log; verify it |

### Agent launcher

A skill only the user starts, by typing it with a prompt: it starts the mods expert agent in the background and relays its questions and report. It sets `disable-model-invocation: true`, so no agent can load it.

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-expert-developer-agent | Start the mods expert agent with the user's prompt, relay its questions and the answers, show its report |

### Tutorials (reference only)

Worked examples for reading and copying, not chapters: the chapter skills above win on any disagreement, except API names and type shapes, where the type files your running build generates win. Example code is never loaded as part of the plugin. Details, and what the quickstart scripts are, are in [the catalog](references/skills-catalog.md#tutorials-reference-only).

| Skill | Covers |
|---|---|
| mods-expert-developer-plugin:mods-tutorial-quickstart | Checklist for a first mod; traps the chapters do not settle; example index; house conventions; engine traps by symptom; a threat-model template; a review checklist; check-mod, new-mod and keep-mod scripts |
| mods-expert-developer-plugin:mods-tutorial-call-intercept-mods | Example mods that block, rewrite and answer tool calls, add a tool, or guard file paths fail-closed |
| mods-expert-developer-plugin:mods-tutorial-interface-mods | Example mods that draw a band above the prompt, a pane, a status line, and a band kept current by a git poller |

### Example skills (reference only)

Twelve guides, each with short excerpts of installed third-party mods or of community repositories at pinned commits or, where it shows none, with its sources described in this plugin's own words, for reading and adapting, not chapters. When the task is building a component like an installed mod (band, status line, pane, chart, tool, slash command, state, settings, call intercept, instruction injection, session start, timer, toast, process run, network call, scrubbing, compaction, model call, cost math, saved-account registry, login swap, keychain item store, token refresh, refresh lock, security guard), read [the example skills menu](references/example-skills-menu.md) and pick the skill there.
