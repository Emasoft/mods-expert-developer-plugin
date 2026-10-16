---
name: mods-doc-install-and-manage-plugins
description: "Use when working on install and manage plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# INSTALL AND MANAGE PLUGINS

## Overview

Routes reads about install and manage plugins to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "Install a plugin". Output: open [Install a plugin](references/chapter.md#install-a-plugin) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete INSTALL AND MANAGE PLUGINS table of contents:

- [Install and manage plugins](references/chapter.md#install-and-manage-plugins-1)
  - [Install a plugin](references/chapter.md#install-a-plugin)
    - [Choose an install scope](references/chapter.md#choose-an-install-scope)
    - [Install from your shell](references/chapter.md#install-from-your-shell)
  - [Add a marketplace](references/chapter.md#add-a-marketplace)
    - [Add a marketplace and install in one command](references/chapter.md#add-a-marketplace-and-install-in-one-command)
      - [Add and install in a session](references/chapter.md#add-and-install-in-a-session)
      - [Add and install from your shell](references/chapter.md#add-and-install-from-your-shell)
    - [Add a private marketplace](references/chapter.md#add-a-private-marketplace)
  - [Manage installed plugins](references/chapter.md#manage-installed-plugins)
    - [Manage plugins synced from claude.ai](references/chapter.md#manage-plugins-synced-from-claudeai)
    - [Uninstall a plugin the project enables](references/chapter.md#uninstall-a-plugin-the-project-enables)
    - [See what an installed plugin adds to your sessions](references/chapter.md#see-what-an-installed-plugin-adds-to-your-sessions)
    - [Find plugins you no longer use](references/chapter.md#find-plugins-you-no-longer-use)
    - [Plugins with dependencies](references/chapter.md#plugins-with-dependencies)
    - [Manage plugins from your shell](references/chapter.md#manage-plugins-from-your-shell)
  - [Keep plugins updated](references/chapter.md#keep-plugins-updated)
    - [Turn auto-update on or off for a marketplace](references/chapter.md#turn-auto-update-on-or-off-for-a-marketplace)
    - [Update plugins now](references/chapter.md#update-plugins-now)
    - [Auto-update from a private marketplace](references/chapter.md#auto-update-from-a-private-marketplace)
  - [Manage marketplaces](references/chapter.md#manage-marketplaces)
  - [Related Docs](references/chapter.md#related-docs)
