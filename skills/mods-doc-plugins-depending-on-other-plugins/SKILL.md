---
name: mods-doc-plugins-depending-on-other-plugins
description: "Use when working on plugins depending on other plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGINS DEPENDING ON OTHER PLUGINS

## Overview

Routes reads about plugins depending on other plugins to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGINS DEPENDING ON OTHER PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugins depending on other plugins; otherwise stop without opening the chapter.
2. Pick the PLUGINS DEPENDING ON OTHER PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that plugins depending on other plugins section; do not preload this or any other chapter.
4. Stop when the PLUGINS DEPENDING ON OTHER PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGINS DEPENDING ON OTHER PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGINS DEPENDING ON OTHER PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Declare and release plugin dependencies with version constraints". Output: open [Declare and release plugin dependencies with version constraints](references/chapter.md#declare-and-release-plugin-dependencies-with-version-constraints) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLUGINS DEPENDING ON OTHER PLUGINS table of contents:

- [Plugin dependencies](references/chapter.md#plugin-dependencies)
  - [Declare and release plugin dependencies with version constraints](references/chapter.md#declare-and-release-plugin-dependencies-with-version-constraints)
  - [How dependency constraints resolve and combine for your users](references/chapter.md#how-dependency-constraints-resolve-and-combine-for-your-users)
  - [See also](references/chapter.md#see-also)
