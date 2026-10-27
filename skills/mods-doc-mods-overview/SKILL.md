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

The MODS OVERVIEW chapter shipped in the references folder of this skill, and beside it the user's own additional notes on mods, opened only by step 4 of the Instructions.

## Instructions

1. Confirm the task needs mods overview; otherwise stop without opening the chapter.
2. Pick the MODS OVERVIEW section from the Table of Contents under Resources and follow its link.
3. Read only that mods overview section; do not preload this or any other chapter.
4. Open [the additional notes](references/additional-notes.md) only when the chapter does not settle the question, for example version-specific behaviour, limits, or which events and methods exist. They are the user's own notes, not an Anthropic chapter. Each claim carries a DOC, TYPES, UNVERIFIED or INFERRED marker; an UNVERIFIED claim needs a live probe before code relies on it. The live docs and the generated types win over the notes. Read only the notes section the task needs.
5. Stop when the MODS OVERVIEW section, and any notes section step 4 opened, is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODS OVERVIEW section the task needs, plus any additional-notes section step 4 opened, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODS OVERVIEW headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Install, update, or try a mod". Output: open [Install, update, or try a mod](references/chapter.md#install-update-or-try-a-mod) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODS OVERVIEW table of contents:

- [What a mod can do](references/chapter.md#what-a-mod-can-do)
- [Install, update, or try a mod](references/chapter.md#install-update-or-try-a-mod)
  - [Install or update a mod](references/chapter.md#install-or-update-a-mod)
  - [Try a sample mod](references/chapter.md#try-a-sample-mod)
- [Decide whether to trust a mod](references/chapter.md#decide-whether-to-trust-a-mod)
  - [What a mod can reach](references/chapter.md#what-a-mod-can-reach)
  - [List what a mod does before you install one](references/chapter.md#list-what-a-mod-does-before-you-install-one)
- [Turn mods on or off](references/chapter.md#turn-mods-on-or-off)
  - [See which mods a session loaded](references/chapter.md#see-which-mods-a-session-loaded)
- [How a mod works](references/chapter.md#how-a-mod-works)
  - [What a hook can do with an event](references/chapter.md#what-a-hook-can-do-with-an-event)
  - [Where mods run](references/chapter.md#where-mods-run)
- [Control mods for your organization](references/chapter.md#control-mods-for-your-organization)
- [Compare mods, settings hooks, skills, and MCP servers](references/chapter.md#compare-mods-settings-hooks-skills-and-mcp-servers)
- [Mods built into Claude Code](references/chapter.md#mods-built-into-claude-code)
  - [Read the source of built-in mods](references/chapter.md#read-the-source-of-built-in-mods)
- [Related Topics](references/chapter.md#related-topics)

Additional notes: [the additional notes](references/additional-notes.md), the user's own notes on mods, not an Anthropic chapter. Each claim carries a DOC, TYPES, UNVERIFIED or INFERRED marker; an UNVERIFIED claim needs a live probe before code relies on it, and the live docs and the generated types win over the notes. Their table of contents:

- [How to read the markers](references/additional-notes.md#how-to-read-the-markers)
- [1. What a mod is, how it ships, runtime, surfaces, version, trust](references/additional-notes.md#1-what-a-mod-is-how-it-ships-runtime-surfaces-version-trust)
- [2. Events a mod can hook, and what it can do with each](references/additional-notes.md#2-events-a-mod-can-hook-and-what-it-can-do-with-each)
- [3. Native tools, programmatic commands, turns, waking, timers](references/additional-notes.md#3-native-tools-programmatic-commands-turns-waking-timers)
- [4. Rewriting context](references/additional-notes.md#4-rewriting-context)
- [5. UI a mod can add](references/additional-notes.md#5-ui-a-mod-can-add)
- [6. State, persistence, access, limits, error isolation](references/additional-notes.md#6-state-persistence-access-limits-error-isolation)
- [7. Does a mod run with no session open?](references/additional-notes.md#7-does-a-mod-run-with-no-session-open)
- [8. Interaction with hooks, plugins, skills, agents, MCP; distribution](references/additional-notes.md#8-interaction-with-hooks-plugins-skills-agents-mcp-distribution)
- [9. Stability, limitations, troubleshooting](references/additional-notes.md#9-stability-limitations-troubleshooting)
- [10. Local copies versus the live docs](references/additional-notes.md#10-local-copies-versus-the-live-docs)
- [11. Common mechanism to mods mapping](references/additional-notes.md#11-common-mechanism-to-mods-mapping)
- [Risks and limits to plan around](references/additional-notes.md#risks-and-limits-to-plan-around)
