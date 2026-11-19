---
trdd-id: 9Q52M2TA
title: Find the claude binary from a cliPath option, the versions folder and on Windows
column: human_review
status: tasked
created: 2026-10-27T16:47:15+0100
updated: 2026-10-27T17:26:41+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T16:47:15+0100
implementation-commits: [9a4be14, 9140e6c, d798032]
---

# Find the claude binary from a cliPath option, the versions folder and on Windows

Split from TRDD-GF5UDFWI and TRDD-J4HRAQF0 (audit docs_dev/20261027-port-cards-remaining.md). hooks/resolve-bin.ts tries only macOS and Linux candidates (resolve-bin.ts:4 says so). Both cards' designs asked for a cliPath userConfig option, the ~/.local/share/claude/versions folder, and Windows candidates. self-command, probe-runner and mod-manager all use resolve-bin, so all three gain from it. Done when: the three candidate sources exist, each is covered by a kit test, and a missing binary still reports its error by name.

## Approval log

- 2026-10-27T16:47:15+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-27T17:25:13+0100 — column → human_review. built; owner live checks of the setting left

## STATE

CURRENT STATE 2026-10-27: column human_review. Built and committed: the versions-folder candidate (~/.local/share/claude/versions/<newest>, used when the ~/.local/bin link is missing, ignores a deliberate pin), the Windows candidate ${USERPROFILE}/.local/bin/claude.exe (string-only check, never run on Windows; mixed separators when USERPROFILE holds backslashes), and the claudePath setting (plugin userConfig, type file): when set it is the only candidate, trimmed, refused if not absolute, and a miss is reported naming the setting (9a4be14, 9140e6c, d798032). Each source has a kit test; mutations turn them red. tmux, python3 and git stay unconfigurable with macOS and Linux folders only. Not covered by tests: configureBins emptying the cache (the kit loads a fresh module per test). Assumption, unverified: the runtime loads the hooks module per session, so the module-level setting cannot leak between two sessions with different plugin settings. Clean-clone CPV v5.22.3 and v5.23.0 on 9140e6c: no new finding. NEXT ACTION: the owner checks live, in the terminal and on Desktop: the settings dialog shows claudePath and what it stores (absolute or ~); the value reaches the probe runner and the mod-manager; whether a change needs a reload or a new session; two projects with different values. Then the card moves to complete, which frees TRDD-GF5UDFWI and TRDD-J4HRAQF0 (their EHT).
Correction 2026-10-27 (review of f8ea514): this card's only parent is TRDD-GF5UDFWI (lint GRAPH-TWO-PARENTS); completing it frees GF5UDFWI, and TRDD-J4HRAQF0 checks it by a line in its own owner checks. Known gaps: this STATE section sits at the end of the card (trddgrep append --create); the Windows absolute-path check /^[A-Za-z]:[\\/]/ refuses a UNC path such as \\\\server\\share\\claude.exe, untested like the rest of the Windows branch; the mod-manager pane test of the claudePath rejection was not mutation-checked on its own.
