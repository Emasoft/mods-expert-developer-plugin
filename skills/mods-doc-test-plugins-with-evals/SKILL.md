---
name: mods-doc-test-plugins-with-evals
description: "Use when working on test plugins with evals. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TEST PLUGINS WITH EVALS

## Overview

Routes reads about test plugins with evals to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TEST PLUGINS WITH EVALS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs test plugins with evals; otherwise stop without opening the chapter.
2. Pick the TEST PLUGINS WITH EVALS section from the Table of Contents under Resources and follow its link.
3. Read only that test plugins with evals section; do not preload this or any other chapter.
4. Stop when the TEST PLUGINS WITH EVALS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TEST PLUGINS WITH EVALS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TEST PLUGINS WITH EVALS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Requirements". Output: open [Requirements](references/chapter.md#requirements) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level TEST PLUGINS WITH EVALS table of contents:

- [Test plugins with evals](references/chapter.md#test-plugins-with-evals-1)
  - [Requirements](references/chapter.md#requirements)
  - [How an eval run works](references/chapter.md#how-an-eval-run-works)
  - [Create your first eval suite](references/chapter.md#create-your-first-eval-suite)
  - [Set up fixtures and mocks](references/chapter.md#set-up-fixtures-and-mocks)
  - [Run evals](references/chapter.md#run-evals)
  - [Read results and trust the plugin directory](references/chapter.md#read-results-and-trust-the-plugin-directory)
  - [Eval suite reference](references/chapter.md#eval-suite-reference)
  - [Troubleshooting](references/chapter.md#troubleshooting)
  - [See also](references/chapter.md#see-also)
