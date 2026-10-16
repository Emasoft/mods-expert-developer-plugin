---
name: mods-doc-code-intelligence-components-in-plugins
description: "Use when working on code intelligence components in plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CODE INTELLIGENCE COMPONENTS IN PLUGINS

## Overview

Routes reads about code intelligence components in plugins to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CODE INTELLIGENCE COMPONENTS IN PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs code intelligence components in plugins; otherwise stop without opening the chapter.
2. Pick the CODE INTELLIGENCE COMPONENTS IN PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that code intelligence components in plugins section; do not preload this or any other chapter.
4. Stop when the CODE INTELLIGENCE COMPONENTS IN PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CODE INTELLIGENCE COMPONENTS IN PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CODE INTELLIGENCE COMPONENTS IN PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Install a code intelligence plugin". Output: open [Install a code intelligence plugin](references/chapter.md#install-a-code-intelligence-plugin) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CODE INTELLIGENCE COMPONENTS IN PLUGINS table of contents:

- [Code intelligence plugins](references/chapter.md#code-intelligence-plugins)
  - [Install a code intelligence plugin](references/chapter.md#install-a-code-intelligence-plugin)
  - [See what Claude gains](references/chapter.md#see-what-claude-gains)
    - [Read the diagnostics yourself](references/chapter.md#read-the-diagnostics-yourself)
  - [Accept or dismiss the recommendation dialog](references/chapter.md#accept-or-dismiss-the-recommendation-dialog)
    - [When the recommendation dialog appears](references/chapter.md#when-the-recommendation-dialog-appears)
    - [Respond to the recommendation dialog](references/chapter.md#respond-to-the-recommendation-dialog)
    - [Turn recommendations back on](references/chapter.md#turn-recommendations-back-on)
  - [Troubleshoot code intelligence](references/chapter.md#troubleshoot-code-intelligence)
  - [Add a language without an official plugin](references/chapter.md#add-a-language-without-an-official-plugin)
  - [Related Docs](references/chapter.md#related-docs)
