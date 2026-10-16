---
name: mods-doc-how-to-host-a-marketplace
description: "Use when working on how to host a marketplace. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# HOW TO HOST A MARKETPLACE

## Overview

Routes reads about how to host a marketplace to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "Host your marketplace". Output: open [Host your marketplace](references/chapter.md#host-your-marketplace) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete HOW TO HOST A MARKETPLACE table of contents:

- [Host and maintain a marketplace](references/chapter.md#host-and-maintain-a-marketplace)
  - [Host your marketplace](references/chapter.md#host-your-marketplace)
    - [Register the marketplace for everyone in a repository](references/chapter.md#register-the-marketplace-for-everyone-in-a-repository)
    - [Avoid relative-path entries in a URL-hosted marketplace](references/chapter.md#avoid-relative-path-entries-in-a-url-hosted-marketplace)
    - [Stay within the download limits for hosted files](references/chapter.md#stay-within-the-download-limits-for-hosted-files)
    - [Edit plugins in place on a shared directory](references/chapter.md#edit-plugins-in-place-on-a-shared-directory)
    - [Keep plugin files out of Git LFS](references/chapter.md#keep-plugin-files-out-of-git-lfs)
    - [Share files within a marketplace with symlinks](references/chapter.md#share-files-within-a-marketplace-with-symlinks)
  - [Distribute through organization settings](references/chapter.md#distribute-through-organization-settings)
  - [Grant access to a private marketplace](references/chapter.md#grant-access-to-a-private-marketplace)
    - [Serve users who have no git-host account](references/chapter.md#serve-users-who-have-no-git-host-account)
    - [What background auto-update does with credentials](references/chapter.md#what-background-auto-update-does-with-credentials)
  - [Roll out to a whole company](references/chapter.md#roll-out-to-a-whole-company)
  - [Keep users up to date](references/chapter.md#keep-users-up-to-date)
    - [Turn on auto-update](references/chapter.md#turn-on-auto-update)
    - [Release a new version](references/chapter.md#release-a-new-version)
    - [Hold users on one version](references/chapter.md#hold-users-on-one-version)
    - [Change the command of a command source](references/chapter.md#change-the-command-of-a-command-source)
  - [Run release channels](references/chapter.md#run-release-channels)
  - [Rename or remove a plugin](references/chapter.md#rename-or-remove-a-plugin)
    - [Migrate users with a renames map](references/chapter.md#migrate-users-with-a-renames-map)
    - [Uninstall removed plugins from users' machines](references/chapter.md#uninstall-removed-plugins-from-users-machines)
  - [Authenticate archive downloads](references/chapter.md#authenticate-archive-downloads)
    - [Add a headersHelper to a plugin entry](references/chapter.md#add-a-headershelper-to-a-plugin-entry)
    - [Write the headersHelper command](references/chapter.md#write-the-headershelper-command)
    - [When Claude Code skips a headersHelper command or drops its output](references/chapter.md#when-claude-code-skips-a-headershelper-command-or-drops-its-output)
    - [How users accept a headersHelper command](references/chapter.md#how-users-accept-a-headershelper-command)
  - [Depend on and recommend other plugins](references/chapter.md#depend-on-and-recommend-other-plugins)
  - [Work around what a marketplace can't do](references/chapter.md#work-around-what-a-marketplace-cant-do)
  - [Related Docs](references/chapter.md#related-docs)
