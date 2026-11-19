---
trdd-id: 1QNAUEAS
title: comments and test titles cite commits the 1.0.0 squash removed from public history
column: backburner
status: tasked
created: 2026-11-19T07:14:32+0100
updated: 2026-11-19T07:14:32+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-19T07:14:32+0100
---

# comments and test titles cite commits the 1.0.0 squash removed from public history

## Problem

The 1.0.0 release was squashed to one commit on top of v0.6.2, so the short hashes of the detailed history resolve for nobody who clones the public repository. 26 of them are still cited in shipped files. They cause no failure: 71 hits are comment lines and 3 are test titles ending "(review of <sha>)"; none is a git lookup (checked 2026-11-19 with `git merge-base --is-ancestor <sha> origin/main` on each).

- tests/test_install_mod_skill.py:248 (0aca0e2, aeb46f4) and :276 (d95df76); scripts/excerpt_lock.py:4 (7bf754a).
- hooks/: 01cc4d8, 067ec02, 181daee, 1e29e89, 262b0ed, 3354881, 34f5c20, 37c09d6, 40417bb, 42d988d, 5f3fb42, 72d3969, 896a888, 8cacd31, 9d4ca09, af28048, d419729, d623b53, d783048, e2c256f, edcdb75, fe18acb; the test titles are hooks/tests/self-command.test.ts:483 and hooks/tests/mod-manager.test.ts:5673 and :5788.

## Fix

Reword each citation to the TRDD id of the change it names, read from the commit subject on the local backup branch. Never push that history: it carries private paths. Kept apart from TRDD-ELJXAKU6 by the coordinator's ruling of 2026-11-19, because these cause no failure.

## Acceptance

- [ ] For every 7-to-40-hex token in hooks/, tests/, scripts/ and .github/ that resolves to a commit, `git merge-base --is-ancestor <sha> origin/main` succeeds.

## Approval log

- 2026-11-19T07:14:32+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
