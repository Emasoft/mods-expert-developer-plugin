---
name: mods-doc-tracing-the-origin-of-a-plugin
description: "Use when working on tracing the origin of a plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TRACING THE ORIGIN OF A PLUGIN

## Overview

Routes reads about tracing the origin of a plugin to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TRACING THE ORIGIN OF A PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs tracing the origin of a plugin; otherwise stop without opening the chapter.
2. Pick the TRACING THE ORIGIN OF A PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that tracing the origin of a plugin section; do not preload this or any other chapter.
4. Stop when the TRACING THE ORIGIN OF A PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TRACING THE ORIGIN OF A PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TRACING THE ORIGIN OF A PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Check which stage a plugin reached". Output: open [Check which stage a plugin reached](references/chapter.md#check-which-stage-a-plugin-reached) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level TRACING THE ORIGIN OF A PLUGIN table of contents:

- [Plugin loading reference](references/chapter.md#plugin-loading-reference)
  - [Check which stage a plugin reached](references/chapter.md#check-which-stage-a-plugin-reached)
  - [Find where a plugin came from](references/chapter.md#find-where-a-plugin-came-from)
  - [Find where a plugin is enabled](references/chapter.md#find-where-a-plugin-is-enabled)
  - [Find plugins on disk](references/chapter.md#find-plugins-on-disk)
  - [Versions and updates](references/chapter.md#versions-and-updates)
  - [Name conflicts](references/chapter.md#name-conflicts)
  - [Related Docs](references/chapter.md#related-docs)
