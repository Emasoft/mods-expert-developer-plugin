---
name: mods-doc-deep-links-reference
description: "Use when working on deep links reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# DEEP LINKS REFERENCE

## Overview

Routes reads about deep links reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the DEEP LINKS REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs deep links reference; otherwise stop without opening the chapter.
2. Pick the DEEP LINKS REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that deep links reference section; do not preload this or any other chapter.
4. Stop when the DEEP LINKS REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The DEEP LINKS REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the DEEP LINKS REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "How deep links work". Output: open [How deep links work](references/chapter.md#how-deep-links-work) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete DEEP LINKS REFERENCE table of contents:

- [Launch sessions from links](references/chapter.md#launch-sessions-from-links)
  - [How deep links work](references/chapter.md#how-deep-links-work)
    - [What a launched session shows](references/chapter.md#what-a-launched-session-shows)
  - [Build a link](references/chapter.md#build-a-link)
    - [Choose between `cwd` and `repo`](references/chapter.md#choose-between-cwd-and-repo)
  - [Examples](references/chapter.md#examples)
    - [Embed a link in a runbook](references/chapter.md#embed-a-link-in-a-runbook)
    - [Open a link from the shell](references/chapter.md#open-a-link-from-the-shell)
  - [Registration and supported platforms](references/chapter.md#registration-and-supported-platforms)
  - [Open a VS Code tab instead of a terminal](references/chapter.md#open-a-vs-code-tab-instead-of-a-terminal)
  - [Open a Claude Desktop session on an SSH connection](references/chapter.md#open-a-claude-desktop-session-on-an-ssh-connection)
  - [Troubleshooting](references/chapter.md#troubleshooting)
    - [Clicking the link does nothing](references/chapter.md#clicking-the-link-does-nothing)
    - [xdg-open is not found on Linux](references/chapter.md#xdg-open-is-not-found-on-linux)
    - [The link renders as plain text instead of being clickable](references/chapter.md#the-link-renders-as-plain-text-instead-of-being-clickable)
    - [The session opens in my home directory instead of the repo](references/chapter.md#the-session-opens-in-my-home-directory-instead-of-the-repo)
    - [The link opens the wrong terminal](references/chapter.md#the-link-opens-the-wrong-terminal)
  - [Learn more](references/chapter.md#learn-more)
