---
name: mods-doc-plugins-security-and-trust
description: "Use when working on plugins security and trust. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGINS SECURITY AND TRUST

## Overview

Routes reads about plugins security and trust to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGINS SECURITY AND TRUST chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugins security and trust; otherwise stop without opening the chapter.
2. Pick the PLUGINS SECURITY AND TRUST section from the Table of Contents under Resources and follow its link.
3. Read only that plugins security and trust section; do not preload this or any other chapter.
4. Stop when the PLUGINS SECURITY AND TRUST section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGINS SECURITY AND TRUST section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGINS SECURITY AND TRUST headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Understand what a plugin can do". Output: open [Understand what a plugin can do](references/chapter.md#understand-what-a-plugin-can-do) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLUGINS SECURITY AND TRUST table of contents:

- [Plugin security and trust](references/chapter.md#plugin-security-and-trust)
  - [Understand what a plugin can do](references/chapter.md#understand-what-a-plugin-can-do)
  - [Review plugins before and after you install](references/chapter.md#review-plugins-before-and-after-you-install)
  - [Recognize when Claude Code refuses or warns](references/chapter.md#recognize-when-claude-code-refuses-or-warns)
  - [Enforce plugin controls for your organization](references/chapter.md#enforce-plugin-controls-for-your-organization)
  - [Find plugins in telemetry](references/chapter.md#find-plugins-in-telemetry)
  - [Related Docs](references/chapter.md#related-docs)
