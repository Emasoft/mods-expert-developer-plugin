---
name: mods-doc-manage-plugins-in-organizations
description: "Use when working on manage plugins in organizations. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MANAGE PLUGINS IN ORGANIZATIONS

## Overview

Routes reads about manage plugins in organizations to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MANAGE PLUGINS IN ORGANIZATIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs manage plugins in organizations; otherwise stop without opening the chapter.
2. Pick the MANAGE PLUGINS IN ORGANIZATIONS section from the Table of Contents under Resources and follow its link.
3. Read only that manage plugins in organizations section; do not preload this or any other chapter.
4. Stop when the MANAGE PLUGINS IN ORGANIZATIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MANAGE PLUGINS IN ORGANIZATIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MANAGE PLUGINS IN ORGANIZATIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Pre-install and require plugins". Output: open [Pre-install and require plugins](references/chapter.md#pre-install-and-require-plugins) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MANAGE PLUGINS IN ORGANIZATIONS table of contents:

- [Manage Claude Code plugins for your organization](references/chapter.md#manage-claude-code-plugins-for-your-organization)
  - [Pre-install and require plugins](references/chapter.md#pre-install-and-require-plugins)
  - [Seed containers and CI](references/chapter.md#seed-containers-and-ci)
  - [Restrict what users can install](references/chapter.md#restrict-what-users-can-install)
  - [Set update policy](references/chapter.md#set-update-policy)
  - [Recommend plugins](references/chapter.md#recommend-plugins)
  - [Audit and review](references/chapter.md#audit-and-review)
  - [Plan for what managed settings can't enforce](references/chapter.md#plan-for-what-managed-settings-cant-enforce)
  - [Troubleshoot policy](references/chapter.md#troubleshoot-policy)
  - [Related Docs](references/chapter.md#related-docs)
