---
name: mods-doc-add-components-to-a-plugin
description: "Use when working on add components to a plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# ADD COMPONENTS TO A PLUGIN

## Overview

Routes reads about add components to a plugin to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the ADD COMPONENTS TO A PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs add components to a plugin; otherwise stop without opening the chapter.
2. Pick the ADD COMPONENTS TO A PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that add components to a plugin section; do not preload this or any other chapter.
4. Stop when the ADD COMPONENTS TO A PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The ADD COMPONENTS TO A PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the ADD COMPONENTS TO A PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Explore the plugin directory". Output: open [Explore the plugin directory](references/chapter.md#explore-the-plugin-directory) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level ADD COMPONENTS TO A PLUGIN table of contents:

- [Add components to a plugin](references/chapter.md#add-components-to-a-plugin-1)
  - [Explore the plugin directory](references/chapter.md#explore-the-plugin-directory)
  - [Add and configure every plugin component type](references/chapter.md#add-and-configure-every-plugin-component-type)
  - [Related Docs](references/chapter.md#related-docs)
