---
name: mods-doc-manage-plugins-from-cli
description: "Use when working on manage plugins from cli. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MANAGE PLUGINS FROM CLI

## Overview

Routes reads about manage plugins from cli to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MANAGE PLUGINS FROM CLI chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs manage plugins from cli; otherwise stop without opening the chapter.
2. Pick the MANAGE PLUGINS FROM CLI section from the Table of Contents under Resources and follow its link.
3. Read only that manage plugins from cli section; do not preload this or any other chapter.
4. Stop when the MANAGE PLUGINS FROM CLI section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MANAGE PLUGINS FROM CLI section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MANAGE PLUGINS FROM CLI headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Emit the hint". Output: open [Emit the hint](references/chapter.md#emit-the-hint) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MANAGE PLUGINS FROM CLI table of contents:

- [Recommend your plugin from your CLI](references/chapter.md#recommend-your-plugin-from-your-cli)
  - [Emit the hint](references/chapter.md#emit-the-hint)
  - [Hint format](references/chapter.md#hint-format)
  - [Check when the prompt appears](references/chapter.md#check-when-the-prompt-appears)
  - [Preview what the user sees](references/chapter.md#preview-what-the-user-sees)
  - [Related Docs](references/chapter.md#related-docs)
