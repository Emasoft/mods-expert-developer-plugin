---
name: mods-doc-cc-github-actions
description: "Use when working on claude github actions. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE GITHUB ACTIONS

## Overview

Routes reads about claude github actions to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE GITHUB ACTIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude github actions; otherwise stop without opening the chapter.
2. Pick the CLAUDE GITHUB ACTIONS section from the Table of Contents under Resources and follow its link.
3. Read only that claude github actions section; do not preload this or any other chapter.
4. Stop when the CLAUDE GITHUB ACTIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE GITHUB ACTIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE GITHUB ACTIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Setup". Output: open [Setup](references/chapter.md#setup) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE GITHUB ACTIONS table of contents:

- [Claude Code GitHub Actions](references/chapter.md#claude-code-github-actions)
  - [Setup](references/chapter.md#setup)
    - [Quick setup](references/chapter.md#quick-setup)
    - [Manual setup](references/chapter.md#manual-setup)
    - [Set up for an organization](references/chapter.md#set-up-for-an-organization)
    - [Uninstall](references/chapter.md#uninstall)
    - [GitHub App permissions](references/chapter.md#github-app-permissions)
  - [Interactive and automation modes](references/chapter.md#interactive-and-automation-modes)
    - [Who can trigger runs](references/chapter.md#who-can-trigger-runs)
  - [Example use cases](references/chapter.md#example-use-cases)
    - [Respond to @claude mentions](references/chapter.md#respond-to-claude-mentions)
    - [Run a skill](references/chapter.md#run-a-skill)
    - [Run on a schedule](references/chapter.md#run-on-a-schedule)
  - [Best practices](references/chapter.md#best-practices)
    - [Define project standards in CLAUDE.md](references/chapter.md#define-project-standards-in-claudemd)
    - [Protect your credentials](references/chapter.md#protect-your-credentials)
    - [Manage costs](references/chapter.md#manage-costs)
  - [Use a cloud provider](references/chapter.md#use-a-cloud-provider)
  - [Troubleshooting](references/chapter.md#troubleshooting)
    - [Claude not responding to @claude commands](references/chapter.md#claude-not-responding-to-claude-commands)
    - [CI not running on Claude's commits](references/chapter.md#ci-not-running-on-claudes-commits)
    - [Authentication errors](references/chapter.md#authentication-errors)
  - [Advanced configuration](references/chapter.md#advanced-configuration)
    - [Action parameters](references/chapter.md#action-parameters)
    - [Pass CLI arguments](references/chapter.md#pass-cli-arguments)
  - [Upgrade from beta](references/chapter.md#upgrade-from-beta)
  - [Also See:](references/chapter.md#also-see)
