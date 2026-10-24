---
trdd-id: FXTWS3AV
title: Depend on mod-finder from the aidojo marketplace
column: todo
status: tasked
created: 2026-10-24T05:26:10+0200
updated: 2026-10-24T05:26:10+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-24T05:26:10+0200
---

# Depend on mod-finder from the aidojo marketplace

User request 2026-10-24 (verbatim): "another thing the plugin should do is to install a dependency plugin called mod-finder from marketplace karanb192/awesome-claude-code-mods". Then: "as you know claude code automatically installs the plugins that in the plugin manifest are indicated as dependencies".

Facts checked 2026-10-24 (gh api):
- The marketplace repo karanb192/awesome-claude-code-mods is public, default branch main, head b89e7db (2026-10-22). Its marketplace.json is named aidojo and lists mod-finder at ./finder.
- mod-finder 0.1.1 is licensed CC0-1.0. It is an MCP server (node server.mjs) with two read-only tools, search_mods and get_mod. It fetches a catalogue snapshot from raw.githubusercontent.com and api.github.com and caches it under ~/.cache/claude-mods. No exec or spawn was found.
- The repo has no git tags, so a version constraint cannot resolve; the dependency is left unconstrained.
- Our plugin is listed in Emasoft/emasoft-plugins (marketplace name emasoft-plugins), which has no allowCrossMarketplaceDependenciesOn.
- The vendored dependencies chapter (skills/mods-doc-plugins-depending-on-other-plugins/references/chapter.md, lines 98-123) says auto-install covers same-marketplace dependencies. A dependency from another marketplace installs only when the root marketplace lists it in allowCrossMarketplaceDependenciesOn. Declared in plugin.json without that, the install completes without the dependency and our plugin then FAILS TO LOAD.
- Unverified: whether the aidojo marketplace must already be added on the user's machine.

Plan:
1. Add dependencies [{name: mod-finder, marketplace: aidojo}] to .claude-plugin/plugin.json.
2. Add aidojo to allowCrossMarketplaceDependenciesOn in Emasoft/emasoft-plugins (another repo; first check whether its tooling regenerates marketplace.json).
3. Test the install live in a throwaway HOME before release.
4. Document it in the README.
5. Release.

Never publish step 1 before step 2 is live.

## Approval log

- 2026-10-24T05:26:10+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
