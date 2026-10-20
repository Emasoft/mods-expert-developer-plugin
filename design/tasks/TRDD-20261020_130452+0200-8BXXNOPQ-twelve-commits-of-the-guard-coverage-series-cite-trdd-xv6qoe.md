---
trdd-id: 8BXXNOPQ
title: Twelve commits of the guard-coverage series cite TRDD-XV6QOEK1, which is a different card
column: todo
status: tasked
created: 2026-10-20T13:04:52+0200
updated: 2026-10-20T13:55:13+0200
current-owner: user
created-by: user
task-type: docs
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-10-20T13:04:52+0200
---

# Eleven commits of the guard-coverage series cite TRDD-XV6QOEK1, which is a different card

A MIS-CITATION IN PUBLISHED COMMIT SUBJECTS, RECORDED RATHER THAN REWRITTEN.

WHAT. The twelve commits of the guard-coverage series carry (TRDD-XV6QOEK1) in their subjects. XV6QOEK1 is the card about the publish pipeline replacing the hand-authored CHANGELOG.md. It is NOT this work. The citation was carried into the series from the commit that minted that card and was never corrected - twenty-four rounds of review, and the citation was wrong in every one of them, because no round re-read the commit subjects against the card they named.

WHY IT MATTERS. The commit-discipline rule is that the governing TRDD goes in the commit subject, so that blame -> commit -> TRDD is a one-grep chain. With the wrong id, that chain breaks: a reader who lands on any of the twelve commits and looks for its card finds a card about a changelog migration.

WHAT IS ALREADY TRUE, SO NOTHING IS LOST. TRDD-PRHYQEVK, the card this work actually belongs to, carries implementation-commits listing all twelve SHAs, so the chain works in the other direction: a reader who arrives at the card finds the commits. A reader who arrives at a commit finds the card only by this note.

WHY THE SUBJECTS WERE NOT REWRITTEN. Rewriting published history changes every SHA, and the twelve SHAs are recorded in PRHYQEVK's implementation-commits - a rewrite would invalidate that list and require rewriting it too. History rewrite is also the owner's call, not this card's. The rule that forbids it says: never rewrite history irrecoverably without explicit approval, and never push to a shared repository unless told.

THE OWNER'S DECISION. (a) Leave the subjects as they are, with this note and PRHYQEVK's implementation-commits making both directions resolvable - the position this card takes. (b) Rewrite the twelve subjects to cite PRHYQEVK, which changes every SHA and means re-recording the implementation-commits list. (c) Something else.

THE LESSON, WHICH IS THE PART WORTH KEEPING. Twenty-four adversarial review rounds checked the prose, the regex, the comments and the figures, and every round was right about them. Not one round checked that the card id in the subject was the card the work belonged to, because the review prompt never asked. A review that only checks what it is pointed at does not cover the work as a whole - and the cheap check that would have caught it (read the subject, look the id up) was never in the brief.

## Approval log

- 2026-10-20T13:04:52+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20 — OWNER RULED (a): leave the commit subjects as they are. The note and PRHYQEVK's implementation-commits make both directions resolvable; no history rewrite.

## Acceptance

- [x] The count is DERIVED, not remembered: the series window d1c4cd0..040ea53 holds 22 commits, and exactly 12 of them carry the wrong citation - the other 10 predate the mis-citation's introduction and carry no TRDD id at all.
- [x] The card's title and its body state the same number, and that number is the derived one: twelve.
- [x] The owner ruled option (a) on 2026-10-20: the commit subjects are left as they are, and this note plus PRHYQEVK's implementation-commits make both directions resolvable. No history rewrite.

## The complete series, derived - because PRHYQEVK's list is short by ten

THE SERIES IS 22 COMMITS, NOT 12, AND THE COUNT IS DERIVED FROM THE ARTIFACTS THE SERIES TOUCHED - not remembered. The window d1c4cd0..040ea53 holds 22 commits; each one touches tests/test_spec_selfcheck_coverage.py, scripts/measure_guard_coverage.py, or line 87 of DELEGATION.md (the guard-coverage passage). Of the 22, exactly 12 carry the wrong (TRDD-XV6QOEK1) citation; the other 10 predate its introduction and carry no TRDD id at all - so 12 is the count of the MIS-CITATION, and 22 is the count of the SERIES.
THE FULL LIST, in series order: d1c4cd0, 6705842, 0f4f707, 12446de, 5362f6c, eae55ed, 0e88651, 5f1f8e5, ec3f3d4, 41e833f, 0464a58, d731e2e, 36a441e, a3c71df, 073c46d, 705c26f, 089ae10, 01ef8e4, 168175f, d9a2075, 6c76e6a, 040ea53. PRHYQEVK's implementation-commits names the last TWELVE of these and omits the first TEN, which include d1c4cd0 (the commit that derived the figure and created the series) and 12446de (the commit that removed the covered count - the series' origin and its central figure). A future bug in the covered-count logic would be traced to a commit the card does not name, which is the SAME broken chain this card exists to record, one level up.
