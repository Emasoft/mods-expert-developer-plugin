---
name: mods-doc-marketplace-manifest-reference
description: "Use when working on marketplace manifest reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MARKETPLACE MANIFEST REFERENCE

## Overview

Routes reads about marketplace manifest reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MARKETPLACE MANIFEST REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs marketplace manifest reference; otherwise stop without opening the chapter.
2. Pick the MARKETPLACE MANIFEST REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that marketplace manifest reference section; do not preload this or any other chapter.
4. Stop when the MARKETPLACE MANIFEST REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MARKETPLACE MANIFEST REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MARKETPLACE MANIFEST REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Marketplace file". Output: open [Marketplace file](references/chapter.md#marketplace-file) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MARKETPLACE MANIFEST REFERENCE table of contents:

- [Marketplace reference](references/chapter.md#marketplace-reference)
  - [Marketplace file](references/chapter.md#marketplace-file)
    - [Reserved names](references/chapter.md#reserved-names)
  - [Top-level fields](references/chapter.md#top-level-fields)
  - [Plugin entries](references/chapter.md#plugin-entries)
    - [Hooks in an entry](references/chapter.md#hooks-in-an-entry)
      - [Display fields](references/chapter.md#display-fields)
    - [Strict mode](references/chapter.md#strict-mode)
  - [Plugin sources](references/chapter.md#plugin-sources)
    - [Relative path plugin source](references/chapter.md#relative-path-plugin-source)
      - [Bare names under pluginRoot](references/chapter.md#bare-names-under-pluginroot)
    - [github plugin source](references/chapter.md#github-plugin-source)
    - [url plugin source](references/chapter.md#url-plugin-source)
    - [git-subdir plugin source](references/chapter.md#git-subdir-plugin-source)
    - [npm plugin source](references/chapter.md#npm-plugin-source)
    - [archive plugin source](references/chapter.md#archive-plugin-source)
    - [command plugin source](references/chapter.md#command-plugin-source)
      - [What the command must do](references/chapter.md#what-the-command-must-do)
      - [Output that fails the install or update](references/chapter.md#output-that-fails-the-install-or-update)
      - [Copy mode and link mode](references/chapter.md#copy-mode-and-link-mode)
  - [Marketplace sources](references/chapter.md#marketplace-sources)
    - [Fields by type](references/chapter.md#fields-by-type)
    - [Source values valid only in policy lists](references/chapter.md#source-values-valid-only-in-policy-lists)
    - [Source objects in settings](references/chapter.md#source-objects-in-settings)
  - [Validation messages](references/chapter.md#validation-messages)
    - [Invalid input on a source](references/chapter.md#invalid-input-on-a-source)
    - [Failures that validation doesn't catch](references/chapter.md#failures-that-validation-doesnt-catch)
  - [See Also:](references/chapter.md#see-also)
