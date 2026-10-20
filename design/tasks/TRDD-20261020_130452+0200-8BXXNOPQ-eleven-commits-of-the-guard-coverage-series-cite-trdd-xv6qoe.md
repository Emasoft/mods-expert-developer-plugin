---
trdd-id: 8BXXNOPQ
title: Eleven commits of the guard-coverage series cite TRDD-XV6QOEK1, which is a different card
column: todo
status: tasked
created: 2026-10-20T13:04:52+0200
updated: 2026-10-20T13:04:52+0200
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
