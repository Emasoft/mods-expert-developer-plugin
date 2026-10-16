---
name: mods-doc-install-and-manage-plugins
description: "Use when working on install and manage plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# INSTALL AND MANAGE PLUGINS

## Overview

Routes reads about install and manage plugins to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the INSTALL AND MANAGE PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs install and manage plugins; otherwise stop without opening the chapter.
2. Pick the INSTALL AND MANAGE PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that install and manage plugins section; do not preload this or any other chapter.
4. Stop when the INSTALL AND MANAGE PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The INSTALL AND MANAGE PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the INSTALL AND MANAGE PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Install plugins with a chosen scope from session or shell". Output: open [Install plugins with a chosen scope from session or shell](references/chapter.md#install-plugins-with-a-chosen-scope-from-session-or-shell) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level INSTALL AND MANAGE PLUGINS table of contents:

- [Install and manage plugins](references/chapter.md#install-and-manage-plugins-1)
  - [Install plugins with a chosen scope from session or shell](references/chapter.md#install-plugins-with-a-chosen-scope-from-session-or-shell)
  - [Add public and private marketplaces and install in one step](references/chapter.md#add-public-and-private-marketplaces-and-install-in-one-step)
  - [Manage installed plugins and their dependencies and usage](references/chapter.md#manage-installed-plugins-and-their-dependencies-and-usage)
  - [Keep plugins updated](references/chapter.md#keep-plugins-updated)
  - [Manage marketplaces](references/chapter.md#manage-marketplaces)
  - [Related Docs](references/chapter.md#related-docs)
