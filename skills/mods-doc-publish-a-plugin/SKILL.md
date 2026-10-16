---
name: mods-doc-publish-a-plugin
description: "Use when working on publish a plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PUBLISH A PLUGIN

## Overview

Routes reads about publish a plugin to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PUBLISH A PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs publish a plugin; otherwise stop without opening the chapter.
2. Pick the PUBLISH A PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that publish a plugin section; do not preload this or any other chapter.
4. Stop when the PUBLISH A PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PUBLISH A PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PUBLISH A PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Choose how to distribute". Output: open [Choose how to distribute](references/chapter.md#choose-how-to-distribute) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PUBLISH A PLUGIN table of contents:

- [Publish and distribute a plugin](references/chapter.md#publish-and-distribute-a-plugin)
  - [Choose how to distribute](references/chapter.md#choose-how-to-distribute)
  - [Prepare your plugin for release](references/chapter.md#prepare-your-plugin-for-release)
  - [Share a plugin without a marketplace](references/chapter.md#share-a-plugin-without-a-marketplace)
    - [Ship a plugin with your own tool](references/chapter.md#ship-a-plugin-with-your-own-tool)
  - [Publish through your own marketplace](references/chapter.md#publish-through-your-own-marketplace)
    - [Add the marketplace file to your repository](references/chapter.md#add-the-marketplace-file-to-your-repository)
    - [Control who can install](references/chapter.md#control-who-can-install)
    - [Tell users how to install](references/chapter.md#tell-users-how-to-install)
    - [Ship updates to users](references/chapter.md#ship-updates-to-users)
    - [How a listed plugin reaches Claude Code users](references/chapter.md#how-a-listed-plugin-reaches-claude-code-users)
  - [Ship updates, renames, and removals](references/chapter.md#ship-updates-renames-and-removals)
    - [Release a new version](references/chapter.md#release-a-new-version)
    - [Tag a release](references/chapter.md#tag-a-release)
    - [Rename or remove a plugin](references/chapter.md#rename-or-remove-a-plugin)
  - [Declare dependencies](references/chapter.md#declare-dependencies)
  - [Related Docs](references/chapter.md#related-docs)
