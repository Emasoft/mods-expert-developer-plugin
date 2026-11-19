---
trdd-id: ZQ0S5X07
title: Rename the mod-manager command of this plugin to mods-manager
column: todo
status: tasked
created: 2026-11-03T22:31:59+0100
updated: 2026-11-04T06:48:35+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T22:31:59+0100
relevant-rules: [12, 13]
eht: [67O9MI1D]
implementation-commits: [8665b32]
---

# Rename the mod-manager command of this plugin to mods-manager

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

CURRENT STATE 2026-11-03: designed, not built. NEXT ACTION: rename in the release clone after mod-manager increments 2i to 2l and 2f are committed, as one commit by one writer; ships in 0.6.4. (was 0.6.3; superseded 2026-11-03 by the owner's ruling)
2026-11-03 owner ruling, verbatim: "and we only ship 0.6.4". No 0.6.3 is published: one release, 0.6.4, carries everything this card and the other release-hold cards list. Every earlier 0.6.3 on this card now reads 0.6.4.
2026-11-04, mods expert, M2: this rename runs before increment 2k, not after 2i to 2l as the scope says, because 2k (auto-update) waits on an owner question; 2k is then built on /mods-manager. The scope precondition "after the validator fixes" is still open: what happens to 05113e2 depends on owner question 1. The orchestrator cleared the rename for M2 provided the lines 05113e2 changed stay separable: before the rename, its hunks are checked against the lines 05113e2 changed, and any overlap is either a path move by git mv only, with no edit inside those hunks, or held.
2026-11-04, mods expert, separability pre-check on the release clone at d95df76: no line that 05113e2 added or removed holds mod-manager (git show 05113e2 -U0, grep), and the card keeps the hooks/mod-manager folder name, so the rename moves no path and edits no 05113e2 hunk. 05113e2 touches hooks/mod-manager/logic.ts only at the version check (old lines 725-738) and hooks/tests/mod-manager.test.ts only in the latest-version rules (old line 2209), far from the COMMAND line (logic.ts line 6). Those logic.ts lines are no longer 05113e2's: fe121d6 replaced isNumericVersion with numericParts, the same per-part check returning the parts as text. The check is repeated on the tree the rename worker starts from, and any overlap is held.
Owner question 1 (validator false positives), 2026-11-04, verbatim choice: "(C) Accept rewording" (option text: Rewording is the release policy, and dev main's two MAJOR findings are cleared the same way. 0.7.0 can publish.) (owner answers, relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_034449+0100-owner-answers-q1-q2-q9-q10.md; the choice in quotes is the owner's, the option text is the orchestrator's) Effect: 05113e2 is no longer held, so the scope precondition after the validator fixes is met; the overlap check before the rename is still run, as planned.
2026-11-04, mods expert, recorded: owner rulings relayed by the orchestrator in reports_dev/goal/20261104_000251+0100-owner-rulings-070.md: release version, verbatim choice "Ship 0.7.0 (Recommended)" (option text: Use --minor. The release adds new features (the launcher skill and /mods-validate-mod), so semantic versioning calls for a minor bump. No change to the pipeline is needed.), superseding the earlier ruling "and we only ship 0.6.4"; release contents, verbatim choice "Everything" (option text: Merge dev main in first: 219 more commits, including the PRRD-extraction work. Its blockers must be fixed before publishing.). The choices in quotes are the owner's, the option texts the orchestrator's. Effect (the mods expert's reading): every 0.6.4 on this card now reads 0.7.0, published with publish.py --minor.
2026-11-04, mods expert, decision (not an owner ruling): the TRDD-ZQ0S5X07 rename and 2k come after the dev main merge, because dev main changes hooks/mod-manager logic.ts, pane.ts and state.ts (a dry git merge-tree of acba45d and dev main 9dfa817 conflicts in those, the mod-manager test and 4 other files) and adds files.ts, installed.ts and profiles.ts, which the rename's sweep must cover too (whether they hold user-visible mod-manager text is not yet grepped). This supersedes the order 2k after ZQ0S5X07 before the merge.
2026-11-04, mods expert, correction of the 0.7.0 Effect line above, from its review fork: every 0.6.4 that names the planned release now means 0.7.0; lines recording what happened (the 0.6.4 publish attempt, commit subjects) stay as history.
2026-11-04, mods expert (M3b), order change, superseding this card's STATE that the rename comes after the dev main merge (decision of 1427774): the rename runs on the release clone (main, on a58864b) before the dev main merge, by the orchestrator's M3b scope ("Do not start the dev-main merge"). Derived task before 0.7.0: after the merge, dev main's mod-manager files (files.ts, installed.ts, profiles.ts and its other mod-manager edits) arrive with the old /mod-manager and "mod-manager: " texts, so this rename sweep runs again on the merged tree with the same keep rules, and the merge conflicts on renamed lines resolve toward /mods-manager.
2026-11-04, mods expert (M3b), overlap check with 05113e2 (git show 05113e2 -U0, read whole): none of its added lines names mod-manager. Its added lines are the isNumericVersion helper (now numericParts after fe121d6), the compareVersions call, and the test lines expect(compareVersions('1.2.3.4', '1.2.3')).toBe(1), the Long inputs comment, const long = [...] and the for (const odd of [...]) line; the rename leaves them untouched.
2026-11-04, mods expert (M3b): the derived second sweep after the dev main merge is TRDD-67O9MI1D, now this card's EHT, so this card cannot reach complete before it runs; in the order line above, dev main's files.ts, installed.ts and profiles.ts come from the M3 plan, not an M3b read, and the merge conflicts on renamed lines are expected, not observed.
2026-11-04, mods expert (M3b): the rename is committed in the release clone (main) as 8665b32 (feat(mod-manager)!, with a BREAKING CHANGE footer, since cliff.toml has no breaking group and only subjects render), built by one cheap worker from the brief and read by the mods expert, who mapped each changed file back to a58864b. Checks rerun by the mods expert: tsc 0; pytest 426; kit 307 pass, 0 fail, on a fresh stage with an empty HOME; ruff 0; cspell 264 files, 0 issues (logs reports_dev/mods-expert/20261104_063445+0100-M2-M3b-ZQ-verify-*). Mutants red: Z1 to Z4 (the worker's), Z5, an alias registered beside the command (the mods expert's). Not checked live, for a human: /mods-manager with mod-hub or the claude-mod-manager plugin in the same session; the marketplace hub's entry and users' presets or pins that name /mod-manager.
2026-11-04, mods expert (M3b), RELEASE NO-GO for 0.7.0 until handled: git-cliff --bumped-version on the release clone gives v1.0.0 from the v0.6.2 tag to 8665b32, and v0.7.0 to a58864b (measured). The cause is the ! of 8665b32 (feat(mod-manager)!) under git-cliff's default breaking_always_bump_major, since cliff.toml has no [bump] section; scripts/publish.py auto-detects the bump with git-cliff --bumped-version. Run publish.py with --minor, or add [bump] breaking_always_bump_major = false to cliff.toml as its own reviewed change. 8665b32 is not reworded (that would rewrite history).
2026-11-04, mods expert (M3b), correction of the NO-GO line above, from its review: the two measured ranges differ by the one commit 8665b32, so the cause is its breaking markers, the ! of its subject and its BREAKING CHANGE footer (either alone is likely enough, not separated); both were the mods expert's own choice in M3b, made before measuring the bump. That git-cliff's default breaking_always_bump_major is the mechanism is inferred, not read from its docs. The 2 commits git-cliff skips for parse errors appear in both ranges and are not the cause. Before the release, check with publish.py --dry-run --minor that the changelog heading also says 0.7.0 (stage 13 runs git-cliff).

## Owner ruling (verbatim, 2026-11-03)

Question Q1: "Rename our `/mod-manager` to `/mods-manager`, so it no longer clashes with mod-hub's `/mod-manager`?"

Answer to all 3 questions: "yes to all 3" (yes = Q1 renamed; Q3 = ships in 0.6.3).

## Why

Three mods register /mod-manager today: ours (hooks/mod-manager/logic.ts:6, COMMAND = 'mod-manager'), netgfx mod-manager@claude-mod-manager 0.2.2 (hooks/register.js:733, which also registers /mods), and mod-hub@owen-mods 0.2.1 (hooks/register.tsx:89, which ignores a taken name). A command name has one owner: the first registration wins and the others fail quietly, so the user may see any of the three. mod-hub's presets view lives only in its own /mod-manager pane. /mods-manager follows the plugin's rule that every command and skill starts with mods-.

## Scope

- Change COMMAND and every reference, swept by kind: code with tldr references and tldr impact; tests; docs, README, CHANGELOG, skills, agents and cards with grep.
- The kit tests and pytest.
- A live check that /mods-manager opens our pane while mod-hub is installed.
- Not renamed: the hooks/mod-manager folder and the card titles (history).

## Release

Ships in 0.6.4 (owner ruling, verbatim: "and we only ship 0.6.4"). 0.6.4 also waits on this card, recorded on TRDD-YNWBA70L and TRDD-R2QYIN8O. (was 0.6.3; superseded 2026-11-03 by the owner's ruling)

## Approval log

- 2026-11-03T22:31:59+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Scope additions (review of fc04644)

Keep every $.store key and pane identifier unchanged (a renamed key silently resets the user's saved filter and update state).
Every user-facing string that names /mod-manager must change: toasts, the status badge from 2h, argumentHint, descriptions, the run tool's allowed and blocked lists, OWN_COMMANDS, list_commands.
Kit tests that dispatch command.run with command 'mod-manager', pytest checks on README and command lists, and a test that mods-manager registers and that nothing of ours registers mod-manager.
CHANGELOG note: a mod-hub pin naming mod-manager will open mod-hub's own pane (no alias, by the owner's no-backward-compatibility rule).
Sequencing: after the validator fixes and after increments 2i to 2l; one writer, one commit.
Live check with mod-hub installed, before and after netgfx's mod-manager is uninstalled: /mods-manager opens ours, /mod-manager opens mod-hub's.
