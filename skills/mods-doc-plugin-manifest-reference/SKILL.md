---
name: mods-doc-plugin-manifest-reference
description: "Use when working on plugin manifest reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGIN MANIFEST REFERENCE

## Overview

Routes reads about plugin manifest reference to its Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the PLUGIN MANIFEST REFERENCE chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs plugin manifest reference; otherwise stop without opening the chapter.
2. Pick the PLUGIN MANIFEST REFERENCE section from the Table of Contents under Resources and follow its link.
3. Read only that plugin manifest reference section; do not preload this or any other chapter.
4. Stop when the PLUGIN MANIFEST REFERENCE section is read: this wrapper routes reads only and authorizes no writes.

## Output

The PLUGIN MANIFEST REFERENCE section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the PLUGIN MANIFEST REFERENCE headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Manifest file structure and validation". Output: open [Manifest file structure and validation](references/chapter.md#manifest-file-structure-and-validation) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the section-level PLUGIN MANIFEST REFERENCE table of contents:

- [Plugin manifest reference](references/chapter.md#plugin-manifest-reference-1)
  - [Manifest file structure and validation](references/chapter.md#manifest-file-structure-and-validation)
  - [Manifest fields for identity metadata and defaults](references/chapter.md#manifest-fields-for-identity-metadata-and-defaults)
  - [Component path forms and per-component configuration](references/chapter.md#component-path-forms-and-per-component-configuration)
  - [Path rules covering containment and default locations](references/chapter.md#path-rules-covering-containment-and-default-locations)
  - [User configuration options and saved value handling](references/chapter.md#user-configuration-options-and-saved-value-handling)
  - [Channels](references/chapter.md#channels)
  - [Environment variable resolution and quoting](references/chapter.md#environment-variable-resolution-and-quoting)
  - [Standard layout](references/chapter.md#standard-layout)
  - [Marketplace entries and how they combine with the manifest](references/chapter.md#marketplace-entries-and-how-they-combine-with-the-manifest)
  - [Related Docs](references/chapter.md#related-docs)
