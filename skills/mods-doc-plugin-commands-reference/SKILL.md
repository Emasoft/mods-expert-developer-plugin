---
name: mods-doc-plugin-commands-reference
description: "Use when working on plugin commands reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGIN COMMANDS REFERENCE

## Overview

Routes reads about plugin commands reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGIN COMMANDS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugin commands reference; otherwise stop without opening the chapter.
2. Pick the PLUGIN COMMANDS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that plugin commands reference section; do not preload this or any other chapter.
4. Stop when the PLUGIN COMMANDS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGIN COMMANDS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGIN COMMANDS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Claude plugin commands for plugin lifecycle and validation". Output: open [Claude plugin commands for plugin lifecycle and validation](references/chapter.md#claude-plugin-commands-for-plugin-lifecycle-and-validation) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLUGIN COMMANDS REFERENCE table of contents:

- [Plugin commands reference](references/chapter.md#plugin-commands-reference-1)
  - [Claude plugin commands for plugin lifecycle and validation](references/chapter.md#claude-plugin-commands-for-plugin-lifecycle-and-validation)
  - [Claude plugin marketplace commands and plugin reloading](references/chapter.md#claude-plugin-marketplace-commands-and-plugin-reloading)
  - [Flags that load a plugin for one session](references/chapter.md#flags-that-load-a-plugin-for-one-session)
  - [See Also:](references/chapter.md#see-also)
