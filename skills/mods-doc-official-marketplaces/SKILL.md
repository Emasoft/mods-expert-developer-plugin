---
name: mods-doc-official-marketplaces
description: "Use when working on anthropic marketplaces. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# ANTHROPIC MARKETPLACES

## Overview

Routes reads about anthropic marketplaces to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the ANTHROPIC MARKETPLACES chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs anthropic marketplaces; otherwise stop without opening the chapter.
2. Pick the ANTHROPIC MARKETPLACES section from the Table of Contents under Resources and follow its link.
3. Read only that anthropic marketplaces section; do not preload this or any other chapter.
4. Stop when the ANTHROPIC MARKETPLACES section is read: this wrapper routes reads only and authorizes no writes.

## Output

The ANTHROPIC MARKETPLACES section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the ANTHROPIC MARKETPLACES headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Anthropic's marketplaces". Output: open [Anthropic's marketplaces](references/chapter.md#anthropics-marketplaces-1) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level ANTHROPIC MARKETPLACES table of contents:

- [Anthropic's marketplaces](references/chapter.md#anthropics-marketplaces)
  - [Anthropic's marketplaces](references/chapter.md#anthropics-marketplaces-1)
  - [Find plugins in the official marketplace](references/chapter.md#find-plugins-in-the-official-marketplace)
  - [Browse and install from Anthropic's marketplaces](references/chapter.md#browse-and-install-from-anthropics-marketplaces)
  - [Third-party marketplaces](references/chapter.md#third-party-marketplaces)
  - [Related Docs](references/chapter.md#related-docs)
