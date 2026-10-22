---
name: cpv-the-skills-menu
description: "Dynamic skill menu for this plugin. Teaches agents which skills are available, when to use them, and how to load them with the Skill() tool. Use when an agent needs to pick a downstream skill at runtime. Used by every agent in this plugin via cpv-the-skills-menu method."
user-invocable: false
allowed-tools: Read
---

# MODS EXPERT DEVELOPER SKILLS MENU

## Overview

This menu lists every skill an agent of `mods-expert-developer-plugin` can load at runtime: the four user-scope tool skills the agents use but the plugin does not ship, and the 61 chapter skills the plugin ships (60 adapted Claude Code documentation chapters and one community how-to). It names each skill once, says what it covers, and shows how to load it. It holds no chapter content itself.

## Prerequisites

- The calling agent can call the `Skill` tool.
- The chapter skills ship with `mods-expert-developer-plugin` and load under its namespace.
- The four standalone skills are user-scope and installed separately; this plugin does not ship them.

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
- A standalone tool skill does not resolve: report `[BLOCKED]` naming it; never substitute another tool for it.
- No skill matches the topic: say so and name the closest domain; do not load skills speculatively.
- A section anchor inside a chapter misses: follow that chapter skill's own Error Handling.

## Examples

Input: a step must register a tool from a mod's hooks module.

`Skill({skill: "mods-expert-developer-plugin:mods-doc-mods-api", args: "Add a command or a tool"})`

Input: a step must read lines 1 to 80 of the hooks module before editing it.

`Skill({skill: "tldr-code", args: "read hooks/index.ts lines 1-80"})`

## Resources

- [the skills catalog](references/skills-catalog.md): the full entry of every chapter skill (Use when, Do not use when, Load with, Inputs, Outputs, Dependencies), grouped by the same domains as the table below.

## Standalone Skills

### tldr-code

**Use when:** a scoped read of a file or a line range, or locating code by symbol: definitions, callers, impact, structure.

**Do not use when:** the job is a write (use fastedit), or locating code by what it does rather than by a name (use jgrep).

**Load with:** `Skill({skill: "tldr-code", args: "..."})`

**Inputs:** a file path with a line range, or a symbol name and a directory.

**Outputs:** only the requested lines or symbol facts, read into context; nothing is written.

**Dependencies:** the user-scope `tldr-code` skill and the `tldr` CLI; not shipped by this plugin.

### fastedit

**Use when:** any file change: creating a file, editing, inserting, renaming or deleting a symbol or a block.

**Do not use when:** the job is only reading (use tldr-code).

**Load with:** `Skill({skill: "fastedit", args: "..."})`

**Inputs:** the target file and a snippet, or the content of a new file on stdin.

**Outputs:** the validated write, with a backup; check it with `fastedit diff`.

**Dependencies:** the user-scope `fastedit` skill and the `fastedit` CLI; not shipped by this plugin.

### jgrep

**Use when:** locating code by what it does when the identifier is unknown.

**Do not use when:** the exact identifier or string is already known (plain grep is enough).

**Load with:** `Skill({skill: "jgrep", args: "..."})`

**Inputs:** a natural-language description of the behaviour and the directory to search.

**Outputs:** ranked file and line locations, to read next with tldr-code.

**Dependencies:** the user-scope `jgrep` skill and the `jgrep` CLI; not shipped by this plugin.

### quicksilver

**Use when:** a verdict over bulk input that would be expensive to read: which of many files, lines or items matter.

**Do not use when:** the input is small enough to read, the job is generation, editing, counting or multi-step reasoning, or the input may hold secrets (it is sent to an outside model).

**Load with:** `Skill({skill: "quicksilver", args: "..."})`

**Inputs:** the files, lines or items to triage and the question to decide.

**Outputs:** a per-item verdict, which is a lead to verify with tldr-code, never evidence.

**Dependencies:** the user-scope `quicksilver` skill, Node, and its qs.mjs script in that skill's scripts folder, plus a configured provider; not shipped by this plugin.

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
