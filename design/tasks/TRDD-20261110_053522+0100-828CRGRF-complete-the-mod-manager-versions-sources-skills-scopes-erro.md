---
trdd-id: 828CRGRF
title: Complete the mod-manager - versions, sources, skills, scopes, errors, updates, data backup and profiles
column: dev
status: tasked
created: 2026-11-10T05:35:22+0100
updated: 2026-11-10T07:33:31+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-10T05:35:22+0100
parent-trdd: J4HRAQF0
---

# Complete the mod-manager - versions, sources, skills, scopes, errors, updates, data backup and profiles

Owner directive 2026-11-10, verbatim list (11 items plus profiles), and the gap measured in reports_dev/recon/20261110-043240-mod-manager-gap.md (EXISTS=3 PARTIAL=5 MISSING=3).

WHAT EXISTS, so this card does not rebuild it: installed and latest version with an update arrow (logic.ts:894/933/833/868, state.ts:370); scope per row (logic.ts:23/70/935); per-row update and Update all (logic.ts:414/444/573/609, state.ts:689/735); marketplace read errors (state.ts:396, pane.ts:239); the whole profiles library, pure and tested (profiles.ts:143-276) with a guarded write (files.ts:207) at ~/.claude/.mod-manager/mods-profiles.json.

WHAT THIS CARD ADDS:
1. Marketplace version and last-checked time. MISSING. Preferred: read ~/.claude/plugins/known_marketplaces.json (documented: source, installLocation, lastUpdated, autoUpdate) through the already-built engineIo. Fallback if the live check fails: stamp the read time in ModState per marketplace. The mod must never claim a check it did not do.
2. Sources in the details view: the marketplace's source (folder path, github repo or git url) from Marketplace.source via logic.ts:1459 sourceText, and the plugin's own recorded origin. Today sourceText is used only in add-marketplace flows.
3. Skills of a plugin: list <plugin folder>/skills with $.fs.list and show 'skill X is in plugin P at marketplace M' in the details view; the row already carries P and M.
4. User vs project/local enablement. files.ts:110 readEnabledSources exists and is called by nothing: call it once per read and show both states on one row ('on for you, off here'), plus a precedence line.
5. Load and execution errors per plugin, from the list's errors[] (parsed at logic.ts:80 but rendered nowhere) and, if reachable, /plugin's Errors tab. One dim line per row plus one line in details.
6. 'Applies in other folders only' count for filtered-out rows (state.ts:655), so 'all instances' is visible.
7. Refresh-marketplace action (claude plugin marketplace update <name>) behind a confirmation, terminal only (Desktop must say so), because is-an-update-available is measured only against the last local catalog copy.
8. Data folder backup and restore. MISSING and platform-constrained: $.fs has no remove and no rename, is text-only and caps at 4 MiB, and $.process is CLI only. So: data_backup/<plugin-slug>/<timestamp>.zip built by zip -r, restore by unzip into the data folder after an explicit confirmation, and on Desktop the action states plainly that it is terminal-only instead of pretending. The backup is taken BEFORE the mutation and the restore path actually consumes it; an operation that cannot back up must refuse, never proceed.
9. Profiles UI: new / duplicate / rename / delete / edit, a selected profile, and APPLY, which maps applyPlan's PlanItem list to actionArgv calls. Owner wording is 'all enabled/disabled plugins, regardless of whether they are installed', so profileInstalls' user-scope + marketplace filter must be widened and a not-installed entry must survive into the profile.

CONSTRAINTS: every operation atomic and reversible from a backup taken first; CLI and Desktop both, with Desktop saying what it cannot do rather than half-doing it; TRDD-GSR975M8 owns the profiles design (design/specs/mod-manager-profiles.md) and this card extends it rather than restating it; TRDD-R2QYIN8O increment 2 owns the section/filter/available work, so this card does not touch it.

## Approval log

- 2026-11-10T05:35:22+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## STATE

CURRENT STATE 2026-11-10: NOT STARTED — the card records the owner's 9 additions and the measured gap report (reports_dev/recon/20261110-043240-mod-manager-gap.md: EXISTS=3 PARTIAL=5 MISSING=3). Nothing written for it in the release worktree. NEXT ACTION: write the design increment (the 9 additions mapped to file:line, the data-backup design data_backup/<slug>/<timestamp>.zip, and the profiles UI) into this body, then implement in the release worktree <code-root>/mods-expert-developer-wt-merge, CLI and Desktop, one commit per addition.
WORKED BY mods-expert-developer-agent (session e7bc3f40-36b7-420f-b6dc-d673f6ec5deb): the mods expert implements this card. The owner fields stay main-agent@emasoft-mods-expert-developer because trddgrep set refuses any identity outside user | main-agent@<project-id> | <agent-name>#<agent-uuid> (ai-maestro#168) and this agent is not in the agent registry.
