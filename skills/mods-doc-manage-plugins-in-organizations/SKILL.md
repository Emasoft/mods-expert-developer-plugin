---
name: mods-doc-manage-plugins-in-organizations
description: "Use when working on manage plugins in organizations. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# MANAGE PLUGINS IN ORGANIZATIONS

## Overview

Routes reads about manage plugins in organizations to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the MANAGE PLUGINS IN ORGANIZATIONS chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs manage plugins in organizations; otherwise stop without opening the chapter.
2. Pick the MANAGE PLUGINS IN ORGANIZATIONS section from the Table of Contents under Resources and follow its link.
3. Read only that manage plugins in organizations section; do not preload this or any other chapter.
4. Stop when the MANAGE PLUGINS IN ORGANIZATIONS section is read: this wrapper routes reads only and authorizes no writes.

## Output

The MANAGE PLUGINS IN ORGANIZATIONS section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the MANAGE PLUGINS IN ORGANIZATIONS headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Pre-install and require plugins". Output: open [Pre-install and require plugins](references/chapter.md#pre-install-and-require-plugins) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete MANAGE PLUGINS IN ORGANIZATIONS table of contents:

- [Manage Claude Code plugins for your organization](references/chapter.md#manage-claude-code-plugins-for-your-organization)
  - [Pre-install and require plugins](references/chapter.md#pre-install-and-require-plugins)
    - [Choose a delivery mechanism](references/chapter.md#choose-a-delivery-mechanism)
      - [Which managed source applies on a machine](references/chapter.md#which-managed-source-applies-on-a-machine)
    - [Require a marketplace and its plugins](references/chapter.md#require-a-marketplace-and-its-plugins)
    - [Require plugins per repository](references/chapter.md#require-plugins-per-repository)
    - [When each surface applies the plugin keys](references/chapter.md#when-each-surface-applies-the-plugin-keys)
    - [Confirm the rollout](references/chapter.md#confirm-the-rollout)
  - [Seed containers and CI](references/chapter.md#seed-containers-and-ci)
  - [Restrict what users can install](references/chapter.md#restrict-what-users-can-install)
    - [Control matrix](references/chapter.md#control-matrix)
      - [Aliases for the marketplace keys](references/chapter.md#aliases-for-the-marketplace-keys)
    - [Allowlist with `strictKnownMarketplaces`](references/chapter.md#allowlist-with-strictknownmarketplaces)
      - [How entries match](references/chapter.md#how-entries-match)
      - [Keep skills-directory plugins loading](references/chapter.md#keep-skills-directory-plugins-loading)
      - [Marketplaces hosted on claude.ai](references/chapter.md#marketplaces-hosted-on-claudeai)
      - [Lock every source out](references/chapter.md#lock-every-source-out)
    - [Blocklist with `blockedMarketplaces`](references/chapter.md#blocklist-with-blockedmarketplaces)
    - [Allow the official marketplace and your own](references/chapter.md#allow-the-official-marketplace-and-your-own)
  - [Set update policy](references/chapter.md#set-update-policy)
    - [Turn auto-update on or off per marketplace](references/chapter.md#turn-auto-update-on-or-off-per-marketplace)
    - [Turn updates off for the whole fleet](references/chapter.md#turn-updates-off-for-the-whole-fleet)
    - [Assign release channels to user groups](references/chapter.md#assign-release-channels-to-user-groups)
  - [Recommend plugins](references/chapter.md#recommend-plugins)
  - [Audit and review](references/chapter.md#audit-and-review)
    - [OpenTelemetry events](references/chapter.md#opentelemetry-events)
    - [Analytics API](references/chapter.md#analytics-api)
  - [Plan for what managed settings can't enforce](references/chapter.md#plan-for-what-managed-settings-cant-enforce)
  - [Troubleshoot policy](references/chapter.md#troubleshoot-policy)
  - [Related Docs](references/chapter.md#related-docs)
