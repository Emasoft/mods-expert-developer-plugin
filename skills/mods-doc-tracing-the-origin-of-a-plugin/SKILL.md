---
name: mods-doc-tracing-the-origin-of-a-plugin
description: "Use when working on tracing the origin of a plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TRACING THE ORIGIN OF A PLUGIN

## Overview

Routes reads about tracing the origin of a plugin to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TRACING THE ORIGIN OF A PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs tracing the origin of a plugin; otherwise stop without opening the chapter.
2. Pick the TRACING THE ORIGIN OF A PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that tracing the origin of a plugin section; do not preload this or any other chapter.
4. Stop when the TRACING THE ORIGIN OF A PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TRACING THE ORIGIN OF A PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TRACING THE ORIGIN OF A PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Check which stage a plugin reached". Output: open [Check which stage a plugin reached](references/chapter.md#check-which-stage-a-plugin-reached) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete TRACING THE ORIGIN OF A PLUGIN table of contents:

- [Plugin loading reference](references/chapter.md#plugin-loading-reference)
  - [Check which stage a plugin reached](references/chapter.md#check-which-stage-a-plugin-reached)
    - [Plugins and marketplaces that aren't on disk at session start](references/chapter.md#plugins-and-marketplaces-that-arent-on-disk-at-session-start)
  - [Find where a plugin came from](references/chapter.md#find-where-a-plugin-came-from)
    - [Entry name and manifest name](references/chapter.md#entry-name-and-manifest-name)
    - [Plugins shared through a repository](references/chapter.md#plugins-shared-through-a-repository)
      - [Sync timing in terminal sessions](references/chapter.md#sync-timing-in-terminal-sessions)
      - [Sign-in requirements for terminal sync](references/chapter.md#sign-in-requirements-for-terminal-sync)
      - [Control which synced plugins load](references/chapter.md#control-which-synced-plugins-load)
  - [Find where a plugin is enabled](references/chapter.md#find-where-a-plugin-is-enabled)
    - [Disabled in user settings but still loads](references/chapter.md#disabled-in-user-settings-but-still-loads)
    - [Enabled in project settings but not installed](references/chapter.md#enabled-in-project-settings-but-not-installed)
  - [Find plugins on disk](references/chapter.md#find-plugins-on-disk)
    - [In-place and copied plugins](references/chapter.md#in-place-and-copied-plugins)
    - [Paths that escape the plugin directory](references/chapter.md#paths-that-escape-the-plugin-directory)
    - [Cleanup of previous versions](references/chapter.md#cleanup-of-previous-versions)
    - [Node.js package dependencies](references/chapter.md#nodejs-package-dependencies)
      - [When the dependency install runs](references/chapter.md#when-the-dependency-install-runs)
      - [Limits on the dependency install](references/chapter.md#limits-on-the-dependency-install)
      - [When the dependency install fails or is skipped](references/chapter.md#when-the-dependency-install-fails-or-is-skipped)
  - [Versions and updates](references/chapter.md#versions-and-updates)
    - [How Claude Code computes the version](references/chapter.md#how-claude-code-computes-the-version)
    - [When Claude Code refreshes a marketplace before an install](references/chapter.md#when-claude-code-refreshes-a-marketplace-before-an-install)
    - [When auto-update runs](references/chapter.md#when-auto-update-runs)
      - [Which marketplaces and plugins auto-update](references/chapter.md#which-marketplaces-and-plugins-auto-update)
    - [When a command source re-runs](references/chapter.md#when-a-command-source-re-runs)
  - [Name conflicts](references/chapter.md#name-conflicts)
    - [Keep a session-only plugin from loading](references/chapter.md#keep-a-session-only-plugin-from-loading)
  - [Related Docs](references/chapter.md#related-docs)
