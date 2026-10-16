---
name: mods-doc-cc-debug-mode
description: "Use when working on claude code debug mode. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE CODE DEBUG MODE

## Overview

Routes reads about claude code debug mode to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE CODE DEBUG MODE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude code debug mode; otherwise stop without opening the chapter.
2. Pick the CLAUDE CODE DEBUG MODE section from the Table of Contents under Resources and follow its link.
3. Read only that claude code debug mode section; do not preload this or any other chapter.
4. Stop when the CLAUDE CODE DEBUG MODE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE CODE DEBUG MODE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE CODE DEBUG MODE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "See what loaded into context". Output: open [See what loaded into context](references/chapter.md#see-what-loaded-into-context) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level CLAUDE CODE DEBUG MODE table of contents:

- [Debug your configuration](references/chapter.md#debug-your-configuration)
  - [See what loaded into context](references/chapter.md#see-what-loaded-into-context)
  - [Check resolved settings](references/chapter.md#check-resolved-settings)
  - [Check MCP servers](references/chapter.md#check-mcp-servers)
  - [Check hooks](references/chapter.md#check-hooks)
  - [Test against a clean configuration](references/chapter.md#test-against-a-clean-configuration)
  - [Check common causes](references/chapter.md#check-common-causes)
  - [Related resources](references/chapter.md#related-resources)
