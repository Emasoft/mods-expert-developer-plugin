---
name: mods-doc-plugins-creation
description: "Use when working on plugins creation. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGINS CREATION

## Overview

Routes reads about plugins creation to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGINS CREATION chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugins creation; otherwise stop without opening the chapter.
2. Pick the PLUGINS CREATION section from the Table of Contents under Resources and follow its link.
3. Read only that plugins creation section; do not preload this or any other chapter.
4. Stop when the PLUGINS CREATION section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGINS CREATION section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGINS CREATION headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Decide when to use a plugin". Output: open [Decide when to use a plugin](references/chapter.md#decide-when-to-use-a-plugin) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PLUGINS CREATION table of contents:

- [Create a Claude Code plugin](references/chapter.md#create-a-claude-code-plugin)
  - [Decide when to use a plugin](references/chapter.md#decide-when-to-use-a-plugin)
  - [Create your first plugin](references/chapter.md#create-your-first-plugin)
    - [Plugin layout](references/chapter.md#plugin-layout)
  - [Develop without a marketplace](references/chapter.md#develop-without-a-marketplace)
    - [Load a plugin from a directory or `.zip`](references/chapter.md#load-a-plugin-from-a-directory-or-zip)
      - [Load a folder of plugins](references/chapter.md#load-a-folder-of-plugins)
      - [Load a plugin from a URL](references/chapter.md#load-a-plugin-from-a-url)
      - [Load plugins from an environment variable](references/chapter.md#load-plugins-from-an-environment-variable)
      - [Scaffold the plugin with `claude plugin init`](references/chapter.md#scaffold-the-plugin-with-claude-plugin-init)
      - [Stop loading the plugin](references/chapter.md#stop-loading-the-plugin)
  - [Test and debug](references/chapter.md#test-and-debug)
    - [A component path isn't found](references/chapter.md#a-component-path-isnt-found)
    - [`--plugin-dir` at a marketplace root doesn't load the plugins under `plugins/`](references/chapter.md#--plugin-dir-at-a-marketplace-root-doesnt-load-the-plugins-under-plugins)
    - [The plugin loads but its skills are missing](references/chapter.md#the-plugin-loads-but-its-skills-are-missing)
    - [The `userConfig` dialog never appears](references/chapter.md#the-userconfig-dialog-never-appears)
    - [Check that the plugin changes Claude's behavior](references/chapter.md#check-that-the-plugin-changes-claudes-behavior)
  - [RELATED DOCS](references/chapter.md#related-docs)
