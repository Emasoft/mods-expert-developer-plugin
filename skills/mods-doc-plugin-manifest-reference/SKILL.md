---
name: mods-doc-plugin-manifest-reference
description: "Use when working on plugin manifest reference. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# PLUGIN MANIFEST REFERENCE

## Overview

Routes reads about plugin manifest reference to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

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

Input: a task about "Manifest file". Output: open [Manifest file](references/chapter.md#manifest-file) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete PLUGIN MANIFEST REFERENCE table of contents:

- [Plugin manifest reference](references/chapter.md#plugin-manifest-reference-1)
  - [Manifest file](references/chapter.md#manifest-file)
    - [Unrecognized fields](references/chapter.md#unrecognized-fields)
    - [Validate the manifest](references/chapter.md#validate-the-manifest)
  - [Fields](references/chapter.md#fields)
    - [`name`](references/chapter.md#name)
    - [`displayName`](references/chapter.md#displayname)
    - [`version`](references/chapter.md#version)
    - [`metadata`](references/chapter.md#metadata)
    - [Directory listing fields](references/chapter.md#directory-listing-fields)
    - [`defaultEnabled`](references/chapter.md#defaultenabled)
    - [`dependencies`](references/chapter.md#dependencies)
    - [`settings`](references/chapter.md#settings)
  - [Component path forms](references/chapter.md#component-path-forms)
    - [Path-only fields](references/chapter.md#path-only-fields)
    - [`commands`](references/chapter.md#commands)
    - [`hooks`](references/chapter.md#hooks)
    - [`mcpServers`](references/chapter.md#mcpservers)
    - [`lspServers`](references/chapter.md#lspservers)
    - [`monitors`](references/chapter.md#monitors)
  - [Path rules](references/chapter.md#path-rules)
    - [Containment and existence](references/chapter.md#containment-and-existence)
    - [How each key combines with its default location](references/chapter.md#how-each-key-combines-with-its-default-location)
  - [User configuration](references/chapter.md#user-configuration)
    - [Limit a field to fixed options](references/chapter.md#limit-a-field-to-fixed-options)
    - [Where values are stored](references/chapter.md#where-values-are-stored)
    - [Reference a saved value](references/chapter.md#reference-a-saved-value)
    - [Fields that run through a shell](references/chapter.md#fields-that-run-through-a-shell)
  - [Channels](references/chapter.md#channels)
  - [Environment variables](references/chapter.md#environment-variables)
    - [Where each variable resolves](references/chapter.md#where-each-variable-resolves)
    - [Quoting and path separators](references/chapter.md#quoting-and-path-separators)
  - [Standard layout](references/chapter.md#standard-layout)
  - [Marketplace entries and the manifest](references/chapter.md#marketplace-entries-and-the-manifest)
    - [How entry fields combine with `plugin.json`](references/chapter.md#how-entry-fields-combine-with-pluginjson)
    - [Metadata precedence](references/chapter.md#metadata-precedence)
  - [Related Docs](references/chapter.md#related-docs)
