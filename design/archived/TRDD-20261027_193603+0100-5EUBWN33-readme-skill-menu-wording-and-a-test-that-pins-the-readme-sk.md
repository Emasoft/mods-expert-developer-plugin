---
trdd-id: 5EUBWN33
title: README skill-menu wording and a test that pins the README skill counts
column: complete
status: archived
created: 2026-10-27T19:36:03+0100
updated: 2026-10-27T19:50:34+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T19:36:03+0100
---

# README skill-menu wording and a test that pins the README skill counts

Goal: README.md:17 says the menu SKILL.md names every other skill once incl. the 9 example skills, but those rows live in skills/mods-the-skills-menu/references/example-skills-menu.md behind a router paragraph, and the line ends 'a catalogue of the chapters'; README.md:8 calls 61 skills 'documentation chapters' while saying one is a how-to. This card supersedes TRDD-N9M0FOKO box 2 wording ('exactly one table row in SKILL.md': the test at tests/test_skills_menu.py:981 pools SKILL.md tables with the example-skills reference table) and box 9's README.md:17 citation; that card is archived and frozen.

- [x] README.md:8 and :17 accurate
- [x] a test pins README.md:8 per-group counts to the skills/ directory counts and fails when one count is changed
- [x] pytest passes

## Approval log

- 2026-10-27T19:36:03+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-27T19:50:34+0100 — COMPLETE by main-agent@emasoft-mods-expert-developer. README wording and the count test landed in 953f70d and b81c967, both reviewed.

## STATE

2026-10-27: README.md:8 and :17 rewritten; new test pinned counts; mutation (9 to 8 example skills) failed it; pytest 471 passed, ruff and cspell clean. Card left in dev.
CURRENT STATE 2026-10-27 (supersedes the lines above): the review of 953f70d was applied in b81c967. README.md:17 no longer calls the menu 'not a skill of its own'; it is 'a catalogue of the other skills, not a documentation chapter', and the table below lists only the mods-doc skills. The count test now also pins the Skills-menu paragraph's counts, fails on any skills/ directory outside the known groups, and checks that the install and uninstall skills exist. SKILL_DIRS is read from the file system (tests/test_plugin_structure.py:29). Both mutation checks fail as expected; 472 tests pass. All boxes hold; reviewed.
