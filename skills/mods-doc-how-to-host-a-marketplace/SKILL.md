---
name: mods-doc-how-to-host-a-marketplace
description: "Use when working on how to host a marketplace. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOW TO HOST A MARKETPLACE

## Overview

Routes reads about how to host a marketplace to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the HOW TO HOST A MARKETPLACE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs how to host a marketplace; otherwise stop without opening the chapter.
2. Pick the HOW TO HOST A MARKETPLACE section from the Table of Contents under Resources and follow its link.
3. Read only that how to host a marketplace section; do not preload this or any other chapter.
4. Stop when the HOW TO HOST A MARKETPLACE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The HOW TO HOST A MARKETPLACE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the HOW TO HOST A MARKETPLACE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Host your marketplace and handle its plugin files". Output: open [Host your marketplace and handle its plugin files](references/chapter.md#host-your-marketplace-and-handle-its-plugin-files) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level HOW TO HOST A MARKETPLACE table of contents:

- [Host and maintain a marketplace](references/chapter.md#host-and-maintain-a-marketplace)
  - [Host your marketplace and handle its plugin files](references/chapter.md#host-your-marketplace-and-handle-its-plugin-files)
  - [Distribute through organization settings](references/chapter.md#distribute-through-organization-settings)
  - [Grant access and credentials for a private marketplace](references/chapter.md#grant-access-and-credentials-for-a-private-marketplace)
  - [Roll out to a whole company](references/chapter.md#roll-out-to-a-whole-company)
  - [Keep users up to date and control versions](references/chapter.md#keep-users-up-to-date-and-control-versions)
  - [Run release channels](references/chapter.md#run-release-channels)
  - [Rename or remove a plugin](references/chapter.md#rename-or-remove-a-plugin)
  - [Authenticate archive downloads with a headersHelper](references/chapter.md#authenticate-archive-downloads-with-a-headershelper)
  - [Depend on and recommend other plugins](references/chapter.md#depend-on-and-recommend-other-plugins)
  - [Work around what a marketplace can't do](references/chapter.md#work-around-what-a-marketplace-cant-do)
  - [Related Docs](references/chapter.md#related-docs)
