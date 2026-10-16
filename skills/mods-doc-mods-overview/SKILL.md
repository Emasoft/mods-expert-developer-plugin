---
name: mods-doc-mods-overview
description: "Use when working on mods overview. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODS OVERVIEW

## Overview

Routes reads about mods overview to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODS OVERVIEW chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods overview; otherwise stop without opening the chapter.
2. Pick the MODS OVERVIEW section from the Table of Contents under Resources and follow its link.
3. Read only that mods overview section; do not preload this or any other chapter.
4. Stop when the MODS OVERVIEW section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS OVERVIEW section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS OVERVIEW headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Install, update, or try a sample mod". Output: open [Install, update, or try a sample mod](references/chapter.md#install-update-or-try-a-sample-mod) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS OVERVIEW table of contents:

- [What a mod can do](references/chapter.md#what-a-mod-can-do)
- [Install, update, or try a sample mod](references/chapter.md#install-update-or-try-a-sample-mod)
  - [Install or update a mod](references/chapter.md#install-or-update-a-mod)
  - [Try a sample mod](references/chapter.md#try-a-sample-mod)
- [Decide whether to trust a mod](references/chapter.md#decide-whether-to-trust-a-mod)
  - [What a mod can reach](references/chapter.md#what-a-mod-can-reach)
  - [List what a mod does before you install one](references/chapter.md#list-what-a-mod-does-before-you-install-one)
- [Turn mods on or off and see which loaded](references/chapter.md#turn-mods-on-or-off-and-see-which-loaded)
  - [See which mods a session loaded](references/chapter.md#see-which-mods-a-session-loaded)
- [How a mod works, what hooks do, and where mods run](references/chapter.md#how-a-mod-works-what-hooks-do-and-where-mods-run)
  - [What a hook can do with an event](references/chapter.md#what-a-hook-can-do-with-an-event)
  - [Where mods run](references/chapter.md#where-mods-run)
- [Control mods for your organization](references/chapter.md#control-mods-for-your-organization)
- [Compare mods, settings hooks, skills, and MCP servers](references/chapter.md#compare-mods-settings-hooks-skills-and-mcp-servers)
- [Mods built into Claude Code and their source](references/chapter.md#mods-built-into-claude-code-and-their-source)
  - [Read the source of built-in mods](references/chapter.md#read-the-source-of-built-in-mods)
- [Related Topics](references/chapter.md#related-topics)
