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

Input: a task about "Check the load stage a plugin reached including late arrivals". Output: open [Check the load stage a plugin reached including late arrivals](references/chapter.md#check-the-load-stage-a-plugin-reached-including-late-arrivals) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level TRACING THE ORIGIN OF A PLUGIN table of contents:

- [Plugin loading reference](references/chapter.md#plugin-loading-reference)
  - [Check the load stage a plugin reached including late arrivals](references/chapter.md#check-the-load-stage-a-plugin-reached-including-late-arrivals)
  - [Find a plugin source manifest name and shared repository sync](references/chapter.md#find-a-plugin-source-manifest-name-and-shared-repository-sync)
  - [Find where a plugin is enabled and resolve settings conflicts](references/chapter.md#find-where-a-plugin-is-enabled-and-resolve-settings-conflicts)
  - [Find plugins on disk copies cleanup and dependencies](references/chapter.md#find-plugins-on-disk-copies-cleanup-and-dependencies)
  - [Versions marketplace refresh auto-update and command re-runs](references/chapter.md#versions-marketplace-refresh-auto-update-and-command-re-runs)
  - [Name conflicts and keeping a session-only plugin out](references/chapter.md#name-conflicts-and-keeping-a-session-only-plugin-out)
  - [Related Docs](references/chapter.md#related-docs)
