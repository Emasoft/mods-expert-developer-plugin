---
name: mods-doc-mods-development
description: "Use when working on mods development. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# Mods Development

## Overview

Routes reads about mods development to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the Mods Development chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs mods development; otherwise stop without opening the chapter.
2. Pick the Mods Development section from the Table of Contents under Resources and follow its link.
3. Read only that mods development section; do not preload this or any other chapter.
4. Stop when the Mods Development section is read: this wrapper routes reads only and authorizes no writes.

## Output

The Mods Development section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the Mods Development headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Ask Claude for a mod". Output: open [Ask Claude for a mod](references/chapter.md#ask-claude-for-a-mod) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete Mods Development table of contents:

- [Create a mod](references/chapter.md#create-a-mod)
  - [Ask Claude for a mod](references/chapter.md#ask-claude-for-a-mod)
    - [Use the mod in other sessions](references/chapter.md#use-the-mod-in-other-sessions)
  - [Write a mod yourself](references/chapter.md#write-a-mod-yourself)
    - [How the example mod works](references/chapter.md#how-the-example-mod-works)
  - [Keep working on a mod](references/chapter.md#keep-working-on-a-mod)
    - [Change a mod with Claude](references/chapter.md#change-a-mod-with-claude)
    - [Check what Claude Code reads from your mod](references/chapter.md#check-what-claude-code-reads-from-your-mod)
    - [Test the mod](references/chapter.md#test-the-mod)
  - [Share your mod](references/chapter.md#share-your-mod)
  - [Related Topics](references/chapter.md#related-topics)
