---
name: mods-doc-troubleshooting-cc-setup
description: "Use when working on troubleshooting claude setup. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TROUBLESHOOTING CLAUDE SETUP

## Overview

Routes reads about troubleshooting claude setup to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TROUBLESHOOTING CLAUDE SETUP chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs troubleshooting claude setup; otherwise stop without opening the chapter.
2. Pick the TROUBLESHOOTING CLAUDE SETUP section from the Table of Contents under Resources and follow its link.
3. Read only that troubleshooting claude setup section; do not preload this or any other chapter.
4. Stop when the TROUBLESHOOTING CLAUDE SETUP section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TROUBLESHOOTING CLAUDE SETUP section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TROUBLESHOOTING CLAUDE SETUP headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find your error". Output: open [Find your error](references/chapter.md#find-your-error) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level TROUBLESHOOTING CLAUDE SETUP table of contents:

- [Troubleshoot installation and login](references/chapter.md#troubleshoot-installation-and-login)
  - [Find your error](references/chapter.md#find-your-error)
  - [Run network PATH permission and binary diagnostic checks](references/chapter.md#run-network-path-permission-and-binary-diagnostic-checks)
  - [Fix common installation platform and binary errors](references/chapter.md#fix-common-installation-platform-and-binary-errors)
  - [Login authentication and credential errors](references/chapter.md#login-authentication-and-credential-errors)
  - [Still stuck](references/chapter.md#still-stuck)
