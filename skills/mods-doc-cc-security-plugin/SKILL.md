---
name: mods-doc-cc-security-plugin
description: "Use when working on claude security plugin. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# CLAUDE SECURITY PLUGIN

## Overview

Routes reads about claude security plugin to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the CLAUDE SECURITY PLUGIN chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs claude security plugin; otherwise stop without opening the chapter.
2. Pick the CLAUDE SECURITY PLUGIN section from the Table of Contents under Resources and follow its link.
3. Read only that claude security plugin section; do not preload this or any other chapter.
4. Stop when the CLAUDE SECURITY PLUGIN section is read: this wrapper routes reads only and authorizes no writes.

## Output

The CLAUDE SECURITY PLUGIN section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the CLAUDE SECURITY PLUGIN headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Prerequisites". Output: open [Prerequisites](references/chapter.md#prerequisites) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete CLAUDE SECURITY PLUGIN table of contents:

- [Scan your codebase for vulnerabilities](references/chapter.md#scan-your-codebase-for-vulnerabilities)
  - [Prerequisites](references/chapter.md#prerequisites)
  - [Models and providers](references/chapter.md#models-and-providers)
  - [Install the plugin](references/chapter.md#install-the-plugin)
    - [Uninstall the plugin](references/chapter.md#uninstall-the-plugin)
  - [Scan and fix your codebase](references/chapter.md#scan-and-fix-your-codebase)
    - [Scan only your changes](references/chapter.md#scan-only-your-changes)
    - [Scope large repositories](references/chapter.md#scope-large-repositories)
    - [Read the scan results](references/chapter.md#read-the-scan-results)
  - [Fix findings](references/chapter.md#fix-findings)
    - [Patches are never applied automatically](references/chapter.md#patches-are-never-applied-automatically)
  - [How the plugin fits with other security tools](references/chapter.md#how-the-plugin-fits-with-other-security-tools)
  - [Troubleshooting](references/chapter.md#troubleshooting)
  - [Related resources](references/chapter.md#related-resources)
