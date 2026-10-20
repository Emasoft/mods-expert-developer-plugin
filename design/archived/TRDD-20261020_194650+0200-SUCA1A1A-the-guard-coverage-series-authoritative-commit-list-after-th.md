---
trdd-id: SUCA1A1A
title: The guard-coverage series' authoritative commit list, after the 2026-10-20 rewrite
column: complete
status: archived
created: 2026-10-20T19:46:50+0200
updated: 2026-10-20T20:06:04+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-20T19:46:50+0200
supersedes: PRHYQEVK
---

# The guard-coverage series' authoritative commit list, after the 2026-10-20 rewrite

THE AUTHORITATIVE IMPLEMENTATION-COMMITS LIST FOR THE GUARD-COVERAGE SERIES, AFTER THE 2026-10-20 REWRITE.

WHY THIS CARD EXISTS. PRHYQEVK carried the authoritative implementation-commits list, and PRHYQEVK IS ARCHIVED: no verb can amend it, so a rewritten history leaves that list wrong. This card supersedes PRHYQEVK and carries the corrected list. The gap is filed upstream as Emasoft/ai-maestro#181.

THE TWENTY-TWO SERIES COMMITS, IN ORDER, WITH THEIR POST-REWRITE SHAs. The first ten are UNCHANGED - they predate the rewrite and kept their SHAs. The last twelve were rewritten, so every SHA below the tenth is new.

- `d1c4cd0 fix: derive the guard-coverage figure instead of restating it`
- `6705842 fix: put the guard-coverage measurement in a tracked path`
- `0f4f707 fix: protect the covered half too, and keep the scan at MAJOR=0`
- `12446de fix: drop the figure no check can enforce`
- `5362f6c fix: make the ledger's guard-coverage passage true of the tree`
- `eae55ed fix: remove the last two figures no check owned`
- `0e88651 fix: the docstring, the identity claim, and an unreachable branch`
- `5f1f8e5 fix: the passage ends where it says, and the scope reads all of it`
- `ec3f3d4 fix: a figure removed by arithmetic returns in another form`
- `41e833f fix: point at the gap figures instead of restating them, and enforce it`
- `af9b4fd fix: point at the gap rules instead of naming them, and enforce the absence (TRDD-PRHYQEVK)`
- `200abfd fix: the passage points at the spec's table, and stops claiming what no check reads (TRDD-PRHYQEVK)`
- `132eeac fix: the covered-count check is bound to the code's own guard total (TRDD-PRHYQEVK)`
- `3007a76 fix: the passage stops claiming what it does not check, and stops guessing the spec's sets (TRDD-PRHYQEVK)`
- `6628f4c fix: the covered-count ban is bound to a clause, and a guard count past twenty says so (TRDD-PRHYQEVK)`
- `94f0f12 fix: the sentence that disclaims a set claim stops making one (TRDD-PRHYQEVK)`
- `988bd4e fix: the comment says what the pattern does, and a guard count past twenty degrades (TRDD-PRHYQEVK)`
- `9643916 fix: the ban's properties are asserted, and the comment stops counting them (TRDD-PRHYQEVK)`
- `feb9ba7 fix: the property test derives the guard total, and pins the two shapes it missed (TRDD-PRHYQEVK)`
- `51e02f1 fix: the property test writes no total of its own, and the separator loop is no longer vacuous (TRDD-PRHYQEVK)`
- `6e8073e fix: the degrade rule has one owner, and the test writes no total of its own (TRDD-PRHYQEVK)`
- `0c5cb79 fix: the denominator alternation does not repeat itself, and the helper states the rule (TRDD-PRHYQEVK)`

THE TWELVE THAT WERE REWRITTEN are the last twelve of the twenty-two, and their SUBJECTS now cite PRHYQEVK instead of XV6QOEK1. 1050ffe, which is NOT one of the twenty-two, still cites XV6QOEK1: it is the commit that CREATED that card, so the citation is correct there. VERIFIED on the rewritten tree: `git log --format='%h %s' | grep -c XV6QOEK1` returns 1, and that one hit is 1050ffe.

THE SCOPE IS DERIVED, NOT REMEMBERED. The window is d1c4cd0^..0c5cb79 and holds 22 commits, of which exactly twelve carried the wrong citation. The window's END boundary was 040ea53 before the rewrite and is 0c5cb79 after it; the START boundary d1c4cd0 is unchanged, because it predates the rewrite and so kept its SHA.

WHAT THE REWRITE CHANGED. A rewritten commit changes the SHA of every commit after it, so the 38 commits from af9b4fd onward took new SHAs, and the 140 before them kept theirs. THE CONTENT IS UNCHANGED: the diff between the two tips is empty, and every changed pair was compared commit by commit with zero content differences. The only thing that changed is the SUBJECT TEXT of the twelve, and the SHAs that follow from that.

THE COMMIT THAT APPLIED THE REWRITE is the one that moved main to the rewritten history. The tree it produced passes the suite (194 tests) and the strict scan (SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=72, exit 0).

## Approval log

- 2026-10-20T19:46:50+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20T20:06:04+0200 — COMPLETE by main-agent@emasoft-mods-expert-developer. The successor card carries the twenty-two series commits with their post-rewrite SHAs, supersedes the archived PRHYQEVK, and records that the two archived cards' SHA references describe the pre-rewrite state..

## THE ARCHIVED CARDS' SHA REFERENCES ARE STALE, AND THIS IS THE RECORD THAT SAYS SO

THE TWO ARCHIVED CARDS' SHA REFERENCES ARE STALE, AND THIS IS THE RECORD THAT SAYS SO. TRDD-8BXXNOPQ and TRDD-PRHYQEVK are ARCHIVED, so no verb can amend them, and their SHA references describe the PRE-REWRITE state as of 2026-10-20. Specifically, 8BXXNOPQ's 'THE FULL LIST, in series order' names the twelve by their PRE-REWRITE SHAs (0464a58, d731e2e, 36a441e, a3c71df, 073c46d, 705c26f, 089ae10, 01ef8e4, 168175f, d9a2075, 6c76e6a, 040ea53), and PRHYQEVK's implementation-commits field names the same twelve. EVERY ONE OF THOSE TWELVE SHAs IS NOW DIFFERENT. THE OLD-TO-NEW MAPPING IS IN THIS CARD: the twenty-two series commits are listed above with their post-rewrite SHAs, and the first ten are unchanged. So a reader who needs the pre-rewrite list finds it here, not in the archived cards, where it is right about the past and wrong about the present. THE ARCHIVED CARDS ARE NOT WRITTEN AS IF THEY WERE WRONG - they are records of what was true when they were written, which is exactly what an archive should hold.

## Acceptance

WHAT THIS CARD PROMISED, AND WHETHER IT DELIVERED.
- [x] The card supersedes PRHYQEVK, which is archived and therefore unamendable.
- [x] It carries all TWENTY-TWO series commits, in order, with their post-rewrite SHAs.
- [x] The first ten are the unchanged ones and the last twelve are the rewritten ones, in that order.
- [x] It records that the two ARCHIVED cards' SHA references describe the pre-rewrite state, and where the old-to-new mapping lives.
- [x] Every SHA it names in the LIST OF TWENTY-TWO is a SHA that exists in the current history. THE PRE-REWRITE SHAs IT ALSO NAMES, in the section recording that the archived cards are stale, DO NOT - and that is the point of that section: they are named as what the archived cards say, and they are labelled as pre-rewrite. A SHA on this card is 'current' if it appears in the list of twenty-two, and 'historical' if it appears in the stale-record section; the two are never confused, and the section says which is which.
