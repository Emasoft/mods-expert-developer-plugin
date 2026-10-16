---
name: mods-doc-manage-costs-of-a-plugin
description: "Use when working on manage costs of a plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MANAGE COSTS OF A PLUGIN

## Overview

Routes reads about manage costs of a plugin to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MANAGE COSTS OF A PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs manage costs of a plugin; otherwise stop without opening the chapter.
2. Pick the MANAGE COSTS OF A PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that manage costs of a plugin section; do not preload this or any other chapter.
4. Stop when the MANAGE COSTS OF A PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MANAGE COSTS OF A PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MANAGE COSTS OF A PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Measure what a plugin costs". Output: open [Measure what a plugin costs](references/chapter.md#measure-what-a-plugin-costs) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MANAGE COSTS OF A PLUGIN table of contents:

- [Measure plugin cost and usage](references/chapter.md#measure-plugin-cost-and-usage)
  - [Measure what a plugin costs](references/chapter.md#measure-what-a-plugin-costs)
  - [Check whether a plugin is used](references/chapter.md#check-whether-a-plugin-is-used)
  - [Measure across a fleet](references/chapter.md#measure-across-a-fleet)
  - [Related Docs](references/chapter.md#related-docs)
