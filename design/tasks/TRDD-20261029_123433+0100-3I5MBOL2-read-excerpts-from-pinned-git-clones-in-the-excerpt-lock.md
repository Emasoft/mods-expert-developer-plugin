---
trdd-id: 3I5MBOL2
title: Read excerpts from pinned git clones in the excerpt lock
column: todo
status: tasked
created: 2026-10-29T12:34:33+0100
updated: 2026-11-04T03:56:58+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-29T12:34:33+0100
parent-trdd: 2XFV601A
derived: true
---

# Read excerpts from pinned git clones in the excerpt lock

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-29

CURRENT STATE 2026-10-29: todo. NEXT ACTION: tests first. NPT of TRDD-2XFV601A.

### Design

scripts/excerpt_lock.py gains a per-mod source kind (installed cache, or git clone at a pinned full hash read with git -C <clone> show <hash>:<file>); clones laid out as downloads_dev/mod-corpus-2026-10-29/<owner>__<repo>/ with the hash in the heading version slot, and test_example_excerpts.py:147 relative_to(CACHE) must handle the clone kind (measured); entries for the 18 repos in MOD_DIRS, LICENCES, FORBIDDEN (IlyaPryzhykau, raoofaltaher, qodfathr in FORBIDDEN); an upstream_commit lock field with the full hash; a loud skip when a clone is absent. The developer-tree pytest is the gate of record: its skip count for clone-sourced excerpts must be 0 there. Re-clone recipe for a pinned hash: git fetch --depth 1 origin <hash>.
2026-10-31: developer-tree run of tests/test_example_excerpts.py and tests/test_no_copy_unlicensed.py: 32 passed, 0 skipped; close after the TRDD-2XFV601A round-4 merge (it edits scripts/excerpt_lock.py) with a merged-main re-run. CI does NOT fetch the clones: no .github/workflows file mentions the clones or downloads_dev, and both test files skip when excerpt_lock.CLONES is absent, so the proof runs only in a developer tree with the pinned clones.
2026-10-31: condition met. After the TRDD-2XFV601A round-4 merge (da3fc93), the merged tree in the main checkout ran tests/test_example_excerpts.py and tests/test_no_copy_unlicensed.py with -rs: 32 passed, no skips. Limit, disclosed: CI does not fetch the clones, so CI skips these tests; the proof holds only in a developer tree with the pinned clones. Closed by the main agent; the owner may reopen if a CI-run proof is required.
CORRECTION 2026-10-31 (supersedes the line above): the card is OPEN in todo. The move to complete was refused because the card has no acceptance checklist, so the line's 'Closed by the main agent' is false. The premise was also wrong: the round-4 merge (da3fc93) did not edit scripts/excerpt_lock.py, so the merged-main run repeats the earlier developer-tree evidence and proves nothing new. The excerpt_lock edit still to come is TRDD-R2GILGKU's (pins for tokensaver 0.4.0 and cache-meter); the re-run belongs after that. Closing needs an acceptance checklist the owner writes or approves.
Owner question 5 (dev-tree proof), 2026-11-04, verbatim choice: "Yes, dev-tree proof ok" (option text: A proof that runs only in a developer tree closes them.) (owner answers relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_035250+0100-owner-answers-q3-q4-q5-q7-q8-q11.md; the choice in quotes is the owner's, the option text in parentheses is the orchestrator's)

## Approval log

- 2026-10-29T12:34:33+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
