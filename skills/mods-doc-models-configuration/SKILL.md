---
name: mods-doc-models-configuration
description: "Use when working on models configuration. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MODELS CONFIGURATION

## Overview

Routes reads about models configuration to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MODELS CONFIGURATION chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs models configuration; otherwise stop without opening the chapter.
2. Pick the MODELS CONFIGURATION section from the Table of Contents under Resources and follow its link.
3. Read only that models configuration section; do not preload this or any other chapter.
4. Stop when the MODELS CONFIGURATION section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MODELS CONFIGURATION section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MODELS CONFIGURATION headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Available models". Output: open [Available models](references/chapter.md#available-models) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level MODELS CONFIGURATION table of contents:

- [Model configuration](references/chapter.md#model-configuration)
  - [Available models](references/chapter.md#available-models)
  - [Restrict model selection](references/chapter.md#restrict-model-selection)
  - [Organization default model](references/chapter.md#organization-default-model)
  - [Organization effort limits](references/chapter.md#organization-effort-limits)
  - [Special model behavior](references/chapter.md#special-model-behavior)
  - [Context window and auto-compaction](references/chapter.md#context-window-and-auto-compaction)
  - [Checking your current model](references/chapter.md#checking-your-current-model)
  - [Add a custom model option](references/chapter.md#add-a-custom-model-option)
  - [Environment variables](references/chapter.md#environment-variables)
  - [Version history](references/chapter.md#version-history)
