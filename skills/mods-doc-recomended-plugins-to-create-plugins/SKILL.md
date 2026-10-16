---
name: mods-doc-recomended-plugins-to-create-plugins
description: "Use when working on recomended plugins to create plugins. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# RECOMENDED PLUGINS TO CREATE PLUGINS

## Overview

Routes reads about recomended plugins to create plugins to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the RECOMENDED PLUGINS TO CREATE PLUGINS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs recomended plugins to create plugins; otherwise stop without opening the chapter.
2. Pick the RECOMENDED PLUGINS TO CREATE PLUGINS section from the Table of Contents under Resources and follow its link.
3. Read only that recomended plugins to create plugins section; do not preload this or any other chapter.
4. Stop when the RECOMENDED PLUGINS TO CREATE PLUGINS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The RECOMENDED PLUGINS TO CREATE PLUGINS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the RECOMENDED PLUGINS TO CREATE PLUGINS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Plugin Development Toolkit". Output: open [Plugin Development Toolkit](references/chapter.md#plugin-development-toolkit) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level RECOMENDED PLUGINS TO CREATE PLUGINS table of contents:

- [skill-creator](references/chapter.md#skill-creator)
- [Plugin Development Toolkit](references/chapter.md#plugin-development-toolkit)
- [Overview](references/chapter.md#overview)
- [Guided Workflow Command](references/chapter.md#guided-workflow-command)
  - [/plugin-dev:create-plugin](references/chapter.md#plugin-devcreate-plugin)
- [Plugin development skills](references/chapter.md#plugin-development-skills)
  - [1. hook-development](references/chapter.md#1-hook-development)
  - [2. mcp-integration](references/chapter.md#2-mcp-integration)
  - [3. plugin-structure](references/chapter.md#3-plugin-structure)
  - [4. plugin-settings](references/chapter.md#4-plugin-settings)
  - [5. command-development](references/chapter.md#5-command-development)
  - [6. agent-development](references/chapter.md#6-agent-development)
  - [7. skill-development](references/chapter.md#7-skill-development)
- [Installation](references/chapter.md#installation)
- [Quick Start](references/chapter.md#quick-start)
  - [Creating Your First Plugin](references/chapter.md#creating-your-first-plugin)
- [Development Workflow](references/chapter.md#development-workflow)
- [Toolkit features and bundled resources](references/chapter.md#toolkit-features-and-bundled-resources)
  - [Progressive Disclosure](references/chapter.md#progressive-disclosure)
  - [Utility Scripts](references/chapter.md#utility-scripts)
  - [Working Examples](references/chapter.md#working-examples)
- [Documentation Standards](references/chapter.md#documentation-standards)
- [Total Content](references/chapter.md#total-content)
- [Example plugin use cases](references/chapter.md#example-plugin-use-cases)
  - [Building a Database Plugin](references/chapter.md#building-a-database-plugin)
  - [Creating a Validation Plugin](references/chapter.md#creating-a-validation-plugin)
  - [Integrating External Services](references/chapter.md#integrating-external-services)
- [Best Practices](references/chapter.md#best-practices)
