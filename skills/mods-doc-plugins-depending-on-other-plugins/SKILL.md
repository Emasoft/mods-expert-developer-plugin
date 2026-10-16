---
name: mods-doc-plugins-depending-on-other-plugins
description: "Use when working on plugins depending on other plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGINS DEPENDING ON OTHER PLUGINS

## Overview

Routes reads about plugins depending on other plugins to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGINS DEPENDING ON OTHER PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugins depending on other plugins; otherwise stop without opening the chapter.
2. Pick the PLUGINS DEPENDING ON OTHER PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that plugins depending on other plugins section; do not preload this or any other chapter.
4. Stop when the PLUGINS DEPENDING ON OTHER PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGINS DEPENDING ON OTHER PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGINS DEPENDING ON OTHER PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Declare dependencies". Output: open [Declare dependencies](references/chapter.md#declare-dependencies) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PLUGINS DEPENDING ON OTHER PLUGINS table of contents:

- [Plugin dependencies](references/chapter.md#plugin-dependencies)
  - [Declare dependencies](references/chapter.md#declare-dependencies)
    - [Declare a dependency with a version constraint](references/chapter.md#declare-a-dependency-with-a-version-constraint)
    - [Bundle plugins for a team](references/chapter.md#bundle-plugins-for-a-team)
    - [Depend on a plugin from another marketplace](references/chapter.md#depend-on-a-plugin-from-another-marketplace)
    - [Test a plugin and its dependency locally](references/chapter.md#test-a-plugin-and-its-dependency-locally)
    - [Create a release tag](references/chapter.md#create-a-release-tag)
    - [Constrain a dependency that has a non-git source](references/chapter.md#constrain-a-dependency-that-has-a-non-git-source)
  - [How dependencies behave for your users](references/chapter.md#how-dependencies-behave-for-your-users)
    - [How a constraint resolves against tags](references/chapter.md#how-a-constraint-resolves-against-tags)
    - [Confirm the resolved version](references/chapter.md#confirm-the-resolved-version)
    - [Combine constraints from several plugins](references/chapter.md#combine-constraints-from-several-plugins)
  - [See also](references/chapter.md#see-also)
