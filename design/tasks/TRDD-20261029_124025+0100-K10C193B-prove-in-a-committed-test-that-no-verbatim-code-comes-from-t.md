---
trdd-id: K10C193B
title: Prove in a committed test that no verbatim code comes from the three unlicensed mod repos
column: todo
status: tasked
created: 2026-10-29T12:40:25+0100
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
approval-datetime: 2026-10-29T12:40:25+0100
derived: true
parent-trdd: 2XFV601A
---

# Prove in a committed test that no verbatim code comes from the three unlicensed mod repos

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-29

CURRENT STATE 2026-10-29: todo. NEXT ACTION: tests first. NPT of TRDD-2XFV601A.

### Design

IlyaPryzhykau/claude-keep-sessions, raoofaltaher/claude-code-mods and qodfathr/ccwhoami have no licence. A committed pytest compares every skills/mods-example-*/references/*.md against those repos at their pinned commits (clone under downloads_dev/mod-corpus-2026-10-29) and fails on any shared run of 8 or more words or of 3 or more identical non-blank code lines; it skips loudly when the clones are absent (CI); the developer-tree run is the gate of record with 0 skips. It replaces the gitignored scripts_dev/nocopy_diff.py for these repos. NPT of TRDD-2XFV601A.
2026-10-31: developer-tree run of tests/test_example_excerpts.py and tests/test_no_copy_unlicensed.py: 32 passed, 0 skipped; close after the TRDD-2XFV601A round-4 merge (it edits scripts/excerpt_lock.py) with a merged-main re-run. CI does NOT fetch the clones: no .github/workflows file mentions the clones or downloads_dev, and both test files skip when excerpt_lock.CLONES is absent, so the proof runs only in a developer tree with the pinned clones.
2026-10-31: condition met. After the TRDD-2XFV601A round-4 merge (da3fc93), the merged tree in the main checkout ran tests/test_example_excerpts.py and tests/test_no_copy_unlicensed.py with -rs: 32 passed, no skips. Limit, disclosed: CI does not fetch the clones, so CI skips these tests; the proof holds only in a developer tree with the pinned clones. Closed by the main agent; the owner may reopen if a CI-run proof is required.
CORRECTION 2026-10-31 (supersedes the line above): the card is OPEN in todo. The move to complete was refused because the card has no acceptance checklist, so the line's 'Closed by the main agent' is false. The premise was also wrong: the round-4 merge (da3fc93) did not edit scripts/excerpt_lock.py, so the merged-main run repeats the earlier developer-tree evidence and proves nothing new. The excerpt_lock edit still to come is TRDD-R2GILGKU's (pins for tokensaver 0.4.0 and cache-meter); the re-run belongs after that. Closing needs an acceptance checklist the owner writes or approves.
Owner question 5 (dev-tree proof), 2026-11-04, verbatim choice: "Yes, dev-tree proof ok" (option text: A proof that runs only in a developer tree closes them.) (owner answers relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_035250+0100-owner-answers-q3-q4-q5-q7-q8-q11.md; the choice in quotes is the owner's, the option text in parentheses is the orchestrator's)

## Approval log

- 2026-10-29T12:40:25+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Exemption

2026-10-29: a 3-line run with no word character (stacked closing brackets) is not reported by find_hits. Why: such a run holds no expression, and it matched hooks/register.ts and marketplace.json, so reporting it flagged nothing copyable.

## Prior-art check 2026-10-29

1 run removed by the prior-art subtraction (qodfathr__ccwhoami, skills/mods-doc-mods-testing/references/chapter.md:300 vs hooks/register.test.tsx:28, 8 words 'for const surface of terminal desktop as const'): matched by .claude-plugin/types/claude-code/index.d.ts; git log -S earliest commit b2643d3 2026-10-15, before 2026-10-29 (OK). 47 verified chapters + 3 .d.ts files; 9 hits in 3 repos remain, all in unverified mods-*/create-a-marketplace chapters.
- Rerun after the NOTICE-based prior-art set (every mods-doc chapter at e7b7df2 except run-background-sessions; 60 chapters): prior art removes 10 runs across 4 shipped files; for each, the earliest commit containing its first line in that chapter is b2643d3 on 2026-10-15, before 2026-10-29 (0 late). test_no_copy_unlicensed.py: 10 passed; ruff clean.
