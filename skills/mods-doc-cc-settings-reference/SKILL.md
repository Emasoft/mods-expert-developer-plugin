---
name: mods-doc-cc-settings-reference
description: "Use when working on claude code settings reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE CODE SETTINGS REFERENCE

## Overview

Routes reads about claude code settings reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE CODE SETTINGS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude code settings reference; otherwise stop without opening the chapter.
2. Pick the CLAUDE CODE SETTINGS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that claude code settings reference section; do not preload this or any other chapter.
4. Stop when the CLAUDE CODE SETTINGS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE CODE SETTINGS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE CODE SETTINGS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Settings files and who they affect". Output: open [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE CODE SETTINGS REFERENCE table of contents:

- [Settings files and precedence](references/chapter.md#settings-files-and-precedence)
  - [Settings files and who they affect](references/chapter.md#settings-files-and-who-they-affect)
    - [Compare the scope of each settings file](references/chapter.md#compare-the-scope-of-each-settings-file)
    - [Find or create your settings files](references/chapter.md#find-or-create-your-settings-files)
    - [Share settings with your team](references/chapter.md#share-settings-with-your-team)
    - [Keep personal settings out of a repository](references/chapter.md#keep-personal-settings-out-of-a-repository)
      - [Where Claude Code keeps the local file in a git repository](references/chapter.md#where-claude-code-keeps-the-local-file-in-a-git-repository)
    - [Check what your organization enforces](references/chapter.md#check-what-your-organization-enforces)
  - [Change a setting](references/chapter.md#change-a-setting)
    - [Use the /config menu](references/chapter.md#use-the-config-menu)
    - [Edit a settings file](references/chapter.md#edit-a-settings-file)
    - [Change a setting for one session](references/chapter.md#change-a-setting-for-one-session)
    - [When edits take effect](references/chapter.md#when-edits-take-effect)
    - [Confirm what loaded](references/chapter.md#confirm-what-loaded)
    - [Fix a broken settings file](references/chapter.md#fix-a-broken-settings-file)
  - [Settings precedence](references/chapter.md#settings-precedence)
    - [Lists merge instead of overriding](references/chapter.md#lists-merge-instead-of-overriding)
    - [Precedence examples](references/chapter.md#precedence-examples)
      - [Team settings override personal settings](references/chapter.md#team-settings-override-personal-settings)
      - [Organization settings override everything](references/chapter.md#organization-settings-override-everything)
      - [The command line overrides your files for one session](references/chapter.md#the-command-line-overrides-your-files-for-one-session)
      - [A flag or environment variable sets the same thing](references/chapter.md#a-flag-or-environment-variable-sets-the-same-thing)
    - [Troubleshoot a setting that doesn't apply](references/chapter.md#troubleshoot-a-setting-that-doesnt-apply)
      - [A value you set is ignored](references/chapter.md#a-value-you-set-is-ignored)
      - [A change you made in Claude Code is lost in new sessions](references/chapter.md#a-change-you-made-in-claude-code-is-lost-in-new-sessions)
      - [A managed change hasn't reached you](references/chapter.md#a-managed-change-hasnt-reached-you)
      - [A committed key doesn't reach teammates](references/chapter.md#a-committed-key-doesnt-reach-teammates)
      - [Permission rules combine differently than you expected](references/chapter.md#permission-rules-combine-differently-than-you-expected)
    - [Exceptions to managed settings precedence](references/chapter.md#exceptions-to-managed-settings-precedence)
  - [Settings in cloud sessions](references/chapter.md#settings-in-cloud-sessions)
  - [What's next](references/chapter.md#whats-next)
