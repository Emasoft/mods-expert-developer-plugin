---
name: mods-doc-troubleshooting-plugins
description: "Use when working on troubleshooting plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TROUBLESHOOTING PLUGINS

## Overview

Routes reads about troubleshooting plugins to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TROUBLESHOOTING PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs troubleshooting plugins; otherwise stop without opening the chapter.
2. Pick the TROUBLESHOOTING PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that troubleshooting plugins section; do not preload this or any other chapter.
4. Stop when the TROUBLESHOOTING PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TROUBLESHOOTING PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TROUBLESHOOTING PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find where `/plugin` runs". Output: open [Find where `/plugin` runs](references/chapter.md#find-where-plugin-runs) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level TROUBLESHOOTING PLUGINS table of contents:

- [Troubleshoot plugins](references/chapter.md#troubleshoot-plugins)
  - [Find where `/plugin` runs](references/chapter.md#find-where-plugin-runs)
  - [Add a marketplace](references/chapter.md#add-a-marketplace)
  - [Install a plugin](references/chapter.md#install-a-plugin)
  - [Fix installed plugins whose hooks or servers fail](references/chapter.md#fix-installed-plugins-whose-hooks-or-servers-fail)
  - [Build a plugin](references/chapter.md#build-a-plugin)
  - [Host a marketplace](references/chapter.md#host-a-marketplace)
  - [Blocked by your organization](references/chapter.md#blocked-by-your-organization)
  - [Related Docs](references/chapter.md#related-docs)
