---
trdd-id: FXTWS3AV
title: Depend on mod-finder from the aidojo marketplace
column: todo
status: tasked
created: 2026-10-24T05:26:10+0200
updated: 2026-10-24T06:19:46+0200
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

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-24

CURRENT STATE 2026-10-24: STOPPED, no owner until the user decides the route. The user first approved the aidojo allowlist, then a pinned git-subdir listing in emasoft-plugins, then reversed the listing (Approval log, 06:2x entry): the user prefers no pinned listing and expects the dependency alone to be enough, but the measured facts below say a cross-marketplace dependency makes the plugin fail to load unless the aidojo marketplace was already added, and an update from 0.5.0 did not install it. The Plan below predates the reversal; do not follow it. Unanswered: the user asked for the answer from this plugin's own docs through the mods expert agent ("check the documentstion in this very plugin skills"; "this is why i told you to always use the mods expert agent of the plugin"); that doc-quoted answer was never produced. Stopped work, unpushed: a scratch clone of emasoft-plugins in the drafts session scratch folder, path in the handoff section 4 (commits 80a9082, 025dbb4 on base 904fd4c; a reboot clears it) and a thin bundle needing 904fd4c in the Claude side-session-notes folder; both can be rebuilt from reports/drafts-mod-review/20261024_061643+0200-drafts-session-handoff.md section 4. Open whatever the route: plugin.json dependencies; the README updater line (the docs say /reload-plugins after an update installs missing dependencies, untested); a NOTICE credit (CC0-1.0, Karan Bansal); a duplicate MCP server named mods when mod-finder@aidojo is installed beside ours; the release order in plan step 5. NEXT ACTION: answer the route question from the plugin docs through the mods expert agent as a subagent, then put the route to the user.
<!-- cspell:ignore documentstion -->

User request 2026-10-24 (verbatim): "another thing the plugin should do is to install a dependency plugin called mod-finder from marketplace karanb192/awesome-claude-code-mods". Then: "as you know claude code automatically installs the plugins that in the plugin manifest are indicated as dependencies".

Facts checked 2026-10-24 (gh api):
- The marketplace repo karanb192/awesome-claude-code-mods is public, default branch main, head b89e7db (2026-10-22). Its marketplace.json is named aidojo and lists mod-finder at ./finder.
- mod-finder 0.1.1 is licensed CC0-1.0. It is an MCP server (node server.mjs) with two read-only tools, search_mods and get_mod. It fetches a catalogue snapshot from raw.githubusercontent.com and api.github.com and caches it under ~/.cache/claude-mods. A read of the plugin files at b89e7db (search.mjs lines 110-431, the README and the tests checked by pattern search only) found no exec, spawn, eval or dynamic import; one new RegExp is built from catalogue data (a low ReDoS risk).
- The repo has no git tags, so a version constraint cannot resolve; the dependency is left unconstrained.
- Our plugin is listed in Emasoft/emasoft-plugins (marketplace name emasoft-plugins), which has no allowCrossMarketplaceDependenciesOn.
- The vendored dependencies chapter (skills/mods-doc-plugins-depending-on-other-plugins/references/chapter.md, lines 98-123) says auto-install covers same-marketplace dependencies. A dependency from another marketplace installs only when the root marketplace lists it in allowCrossMarketplaceDependenciesOn. Declared in plugin.json without that, the install completes without the dependency and our plugin then FAILS TO LOAD.
- Measured 2026-10-24 on claude 2.1.310, local-path marketplace sources, throwaway HOMEs (reports/requirements-drafts/20261024_053049+0200-mod-finder-dependency-live-test.md): a cross-marketplace dependency in plugin.json installs only when the user has already added aidojo; otherwise the install or a plugin update from 0.5.0 succeeds and our plugin fails to load. Listing mod-finder in emasoft-plugins as a git-subdir entry pinned to b89e7db, with a bare dependency, auto-installs it on a fresh install with nothing added (reports/requirements-drafts/20261024_053219+0200-mod-finder-same-marketplace-live-test.md), but claude plugin update 0.5.0 to 0.6.0 does not install it, and our plugin fails to load until the user runs claude plugin install mod-finder@emasoft-plugins. A user with mod-finder@aidojo already installed gets two copies, each declaring an MCP server named mods (effect unmeasured). The emasoft-plugins update-submodules workflow handles only github and url sources, so it leaves a git-subdir pin alone, and its json rewrite keeps unknown top-level keys.

Plan:
1. (Pending the user's choice of design.) Add the dependency to .claude-plugin/plugin.json.
2. Change Emasoft/emasoft-plugins for the chosen design: the aidojo allowlist (authorized) or a pinned mod-finder entry (needs the user's go-ahead).
3. Done: live tests in throwaway HOMEs, see Facts.
4. Document it in the README and NOTICE (credit Karan Bansal; tell updaters the one install command).
5. Release, only after the live test passes, in this order: push the emasoft-plugins change, confirm it is on its main, then push the plugin repo and its tag; tell the TRDD-H26OG8AP session first.

Never publish step 1 before step 2 is live.

## Approval log

- 2026-10-24T05:26:10+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-24 user authorization (verbatim): "Yes: add aidojo to allowCrossMarketplaceDependenciesOn in Emasoft/emasoft-plugins and push it together with the release."
- Release order (follows from the facts above): (1) push the emasoft-plugins allowlist commit; (2) confirm it is on emasoft-plugins main; (3) only then push the plugin repo and its tag. Our emasoft-plugins entry is a github source, so a plugin push that lands first could reach installs before the allowlist exists. The pushed plugin repo also carries other sessions' unpushed commits; tell the TRDD-H26OG8AP session before pushing.
- 2026-10-24T06:18+0200 User rulings of 2026-10-24 recorded from the drafts session handoff (reports/drafts-mod-review/20261024_061643+0200-drafts-session-handoff.md, section 2), not written here earlier because of the freeze. First: "Yes: add mod-finder to Emasoft/emasoft-plugins as a git-subdir entry pinned to b89e7db, make it a dependency of the plugin, and tell updaters in the README to run claude plugin install mod-finder@emasoft-plugins." Then, reversing it: "i don't really see the need to pin the mod-finder plugin into the marketplace. being part of the mods expert developer plugin is enough to ensure it is installed along with the plugin." Then: "are you sure? check the documentstion in this very plugin skills". So how mod-finder reaches users is OPEN. Measured facts behind it (reports/requirements-drafts/20261024_053049+0200-mod-finder-dependency-live-test.md and 20261024_053219+0200-mod-finder-same-marketplace-live-test.md, claude 2.1.310): a cross-marketplace dependency installs only when the aidojo marketplace was already added, else the plugin fails to load; a same-marketplace pinned git-subdir entry auto-installed on a fresh install; claude plugin update from 0.5.0 to 0.6.0 did not install it. The emasoft-plugins work (scratch clone commits 80a9082 and 025dbb4, unpushed, plus a thin bundle in the session notes folder) is stopped. Owner since the user's takeover ruling of 2026-10-24: the main session.
- 2026-10-24T06:19+0200 Correction to the previous line: the user transferred the requirements-drafts fixes and STOPPED the mod-finder work; that does not make the main session the owner of this card. It has no owner until the user decides the route. The preceding quotes are as given in the drafts session handoff, section 2.
