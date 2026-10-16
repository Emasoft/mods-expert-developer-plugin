---
name: mods-doc-manage-mods-for-organizations
description: "Use when working on manage mods for organizations. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MANAGE MODS FOR ORGANIZATIONS

## Overview

Routes reads about manage mods for organizations to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MANAGE MODS FOR ORGANIZATIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs manage mods for organizations; otherwise stop without opening the chapter.
2. Pick the MANAGE MODS FOR ORGANIZATIONS section from the Table of Contents under Resources and follow its link.
3. Read only that manage mods for organizations section; do not preload this or any other chapter.
4. Stop when the MANAGE MODS FOR ORGANIZATIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MANAGE MODS FOR ORGANIZATIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MANAGE MODS FOR ORGANIZATIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Stop user-installed mods from loading". Output: open [Stop user-installed mods from loading](references/chapter.md#stop-user-installed-mods-from-loading) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MANAGE MODS FOR ORGANIZATIONS table of contents:

- [Manage mods for your organization](references/chapter.md#manage-mods-for-your-organization)
  - [Stop user-installed mods from loading](references/chapter.md#stop-user-installed-mods-from-loading)
  - [Know what happens by default](references/chapter.md#know-what-happens-by-default)
    - [Know which controls still apply](references/chapter.md#know-which-controls-still-apply)
  - [Decide whether to leave mods on](references/chapter.md#decide-whether-to-leave-mods-on)
    - [Review what a mod can do](references/chapter.md#review-what-a-mod-can-do)
  - [Choose how much to allow](references/chapter.md#choose-how-much-to-allow)
    - [Allow only your organization's mods](references/chapter.md#allow-only-your-organizations-mods)
    - [Apply your plugin controls to mods](references/chapter.md#apply-your-plugin-controls-to-mods)
    - [Set options on the built-in guard](references/chapter.md#set-options-on-the-built-in-guard)
  - [Run your organization's own mods](references/chapter.md#run-your-organizations-own-mods)
    - [Enforce a policy with a mod of your own](references/chapter.md#enforce-a-policy-with-a-mod-of-your-own)
      - [Refuse mods when your check fails](references/chapter.md#refuse-mods-when-your-check-fails)
  - [Related Docs](references/chapter.md#related-docs)
